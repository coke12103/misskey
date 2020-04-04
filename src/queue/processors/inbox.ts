import { Job } from 'bullmq';
import * as httpSignature from 'http-signature';
import parseAcct from '../../misc/acct/parse';
import User, { IRemoteUser } from '../../models/user';
import perform from '../../remote/activitypub/perform';
import { resolvePerson } from '../../remote/activitypub/models/person';
import { toUnicode } from 'punycode';
import { URL } from 'url';
import { publishApLogStream } from '../../services/stream';
import Logger from '../../services/logger';
import { registerOrFetchInstanceDoc } from '../../services/register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import instanceChart from '../../services/chart/instance';
import { getApId } from '../../remote/activitypub/type';
import { UpdateInstanceinfo } from '../../services/update-instanceinfo';
import { isBlockedHost } from '../../misc/instance-info';
import { InboxJobData } from '..';

const logger = new Logger('inbox');

// ユーザーのinboxにアクティビティが届いた時の処理
export default async (job: Job<InboxJobData>): Promise<string> => {
	const signature = job.data.signature;
	const activity = job.data.activity;

	//#region Log
	const info = Object.assign({}, activity);
	delete info['@context'];
	delete info['signature'];
	logger.debug(JSON.stringify(info, null, 2));
	//#endregion

	const keyIdLower = signature.keyId.toLowerCase();
	let user: IRemoteUser;

	if (keyIdLower.startsWith('acct:')) {
		const { username, host } = parseAcct(keyIdLower.slice('acct:'.length));
		if (host === null) {
			return `skip: request was made by local user: @${username}`;
		}

		// アクティビティ内のホストの検証
		try {
			ValidateActivity(activity, host);
		} catch (e) {
			return `skip: host validation failed ${e.message}`;
		}

		// ブロックしてたら中断
		if (await isBlockedHost(host)) {
			return `skip: Blocked instance: ${host}`;
		}

		user = await User.findOne({ usernameLower: username, host: host.toLowerCase() }) as IRemoteUser;
	} else {
		// アクティビティ内のホストの検証
		const host = toUnicode(new URL(signature.keyId).hostname.toLowerCase());
		try {
			ValidateActivity(activity, host);
		} catch (e) {
			return `skip: host validation failed ${e.message}`;
		}

		// ブロックしてたら中断
		if (await isBlockedHost(host)) {
			return `skip: Blocked instance: ${host}`;
		}

		user = await User.findOne({
			host: { $ne: null },
			'publicKey.id': signature.keyId
		}) as IRemoteUser;
	}

	// アクティビティを送信してきたユーザーがまだMisskeyサーバーに登録されていなかったら登録する
	if (user === null) {
		try {
			user = await resolvePerson(getApId(activity.actor)) as IRemoteUser;
		} catch (e) {
			// 対象が4xxならスキップ
			if (e.statusCode >= 400 && e.statusCode < 500) {
				return `skip: Ignored actor ${activity.actor} - ${e.statusCode}`;
			}
			logger.error(`Error in actor ${activity.actor} - ${e.statusCode || e}`);
			throw e;
		}
	}

	if (user === null) {
		throw new Error('failed to resolve user');
	}

	if (!httpSignature.verifySignature(signature, user.publicKey.publicKeyPem)) {
		return `skip: signature verification failed`;
	}

	//#region Log
	publishApLogStream({
		direction: 'in',
		activity: activity.type,
		host: user.host,
		actor: user.username
	});
	//#endregion

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

	// アクティビティを処理
	return (await perform(user, activity)) || 'ok';
};

/**
 * Validate host in activity
 * @param activity Activity
 * @param host Expect host
 */
function ValidateActivity(activity: any, host: string) {
	// id (if exists)
	if (typeof activity.id === 'string') {
		const uriHost = toUnicode(new URL(activity.id).hostname.toLowerCase());
		if (host !== uriHost) {
			const diag = activity.signature ? '. Has LD-Signature. Forwarded?' : '';
			throw new Error(`activity.id(${activity.id}) has different host(${host})${diag}`);
		}
	}

	// actor (if exists)
	if (typeof activity.actor === 'string') {
		const uriHost = toUnicode(new URL(activity.actor).hostname.toLowerCase());
		if (host !== uriHost) throw new Error('activity.actor has different host');
	}

	// For Create activity
	if (activity.type === 'Create' && activity.object) {
		// object.id (if exists)
		if (typeof activity.object.id === 'string') {
			const uriHost = toUnicode(new URL(activity.object.id).hostname.toLowerCase());
			if (host !== uriHost) throw new Error('activity.object.id has different host');
		}

		// object.attributedTo (if exists)
		if (typeof activity.object.attributedTo === 'string') {
			const uriHost = toUnicode(new URL(activity.object.attributedTo).hostname.toLowerCase());
			if (host !== uriHost) throw new Error('activity.object.attributedTo has different host');
		}
	}
}
