import * as Bull from 'bull';
import * as httpSignature from 'http-signature';
import { IRemoteUser } from '../../models/user';
import perform from '../../remote/activitypub/perform';
import { resolvePerson } from '../../remote/activitypub/models/person';
import { toUnicode } from 'punycode';
import { URL } from 'url';
import { publishApLogStream } from '../../services/stream';
import Logger from '../../services/logger';
import { registerOrFetchInstanceDoc } from '../../services/register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import instanceChart from '../../services/chart/instance';
import { getApId, IActivity } from '../../remote/activitypub/type';
import { UpdateInstanceinfo } from '../../services/update-instanceinfo';
import { isBlockedHost } from '../../misc/instance-info';
import { InboxJobData } from '..';
import ApResolver from '../../remote/activitypub/ap-resolver';
import { inspect } from 'util';
import { extractApHost } from '../../misc/convert-host';

const logger = new Logger('inbox');

// ユーザーのinboxにアクティビティが届いた時の処理
export default async (job: Bull.Job<InboxJobData>): Promise<string> => {
	const signature = job.data.signature;
	const activity = job.data.activity;

	const apResolver = new ApResolver();

	//#region Log
	const info = Object.assign({}, activity);
	delete info['@context'];
	logger.debug(inspect(info));
	//#endregion

	const host = toUnicode(new URL(signature.keyId).hostname.toLowerCase());

	// ブロックしてたら中断
	if (await isBlockedHost(host)) {
		return `skip: Blocked instance: ${host}`;
	}

	//#region resolve http-signature signer
	let user: IRemoteUser | null;

	// keyIdを元にDBから取得
	user = await apResolver.getRemoteUserFromKeyId(signature.keyId);

	// || activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
	if (user == null) {
		try {
			user = await resolvePerson(getApId(activity.actor)) as IRemoteUser;
		} catch (e) {
			// 対象が4xxならスキップ
			if (e.statusCode >= 400 && e.statusCode < 500) {
				return `skip: Ignored actor ${activity.actor} - ${e.statusCode}`;
			}
			throw `Error in actor ${activity.actor} - ${e.statusCode || e}`;
		}
	}

	// http-signature signer がわからなければ終了
	if (user == null) {
		throw new Error('failed to resolve http-signature signer');
	}
	//#endregion

	// http-signature signerのpublicKeyを元にhttp-signatureを検証
	if (!httpSignature.verifySignature(signature, user.publicKey.publicKeyPem)) {
		return `skip: http-signature verification failed`;
	}

	// http-signatureのsignerは、activity.actorと一致する必要がある
	if (user.uri !== activity.actor) {
		const diag = activity.signature ? '. Has LD-Signature. Forwarded?' : '';
		return `skip: httpSigner.uri(${user.uri}) !== activity.actor(${activity.actor}) ${diag}\n${inspect(activity)}}`;
	}

	// activity.idがあればホストが署名者のホストであることを確認する
	if (typeof activity.id === 'string') {
		const signerHost = extractApHost(user.uri);
		const activityIdHost = extractApHost(activity.id);
		if (signerHost !== activityIdHost) {
			return `skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`;
		}
	}

	//#region Log/stats
	publishApLogStream({
		direction: 'in',
		activity: activity.type,
		host: user.host,
		actor: user.username
	});

	// Update stats
	registerOrFetchInstanceDoc(user.host).then(i => {
		const set = {
			latestRequestReceivedAt: new Date(),
			lastCommunicatedAt: new Date(),
			isNotResponding: false
		} as any;

		Instance.update({ _id: i._id }, {
			$set: set
		});

		UpdateInstanceinfo(i);

		instanceChart.requestReceived(i.host);
	});
	//#endregion

	// アクティビティを処理
	return (await perform(user, activity)) || 'ok';
};
