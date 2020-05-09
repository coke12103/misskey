import User, { IRemoteUser } from '../../../../models/user';
import config from '../../../../config';
import { IFlag, getApIds } from '../../type';
//import { apLogger } from '../../logger';
import AbuseUserReport from '../../../../models/abuse-user-report';

//const logger = apLogger;

export default async (actor: IRemoteUser, activity: IFlag): Promise<string> => {
	// objectは `(User|Note) | (User|Note)[]` だけど、全パターンDBスキーマと対応させられないので
	// 対象ユーザーは一番最初のユーザー として あとはコメントとして格納する
	const uris = getApIds(activity.object);

	const userIds = uris.filter(uri => uri.startsWith(config.url + '/users/')).map(uri => uri.split('/').pop());
	const users = await User.find({
		_id: { $in: userIds }
	});
	if (users.length < 1) return `skip`;

	await AbuseUserReport.insert({
		createdAt: new Date(),
		userId: users[0]._id,
		reporterId: actor._id,
		comment: `${activity.content}\n${JSON.stringify(uris, null, 2)}`
	});

	return `ok`;
};
