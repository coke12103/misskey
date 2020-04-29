import config from '../../../config';
import { v4 as uuid } from 'uuid';
import { IActivity } from '../type';
import { LdSignature } from '../misc/ld-signature';
import { ILocalUser } from '../../../models/user';

/**
 * Render Activity
 * @param x Activity without @context
 * @param user if defineded attach LD-Signature
 */
export const renderActivity = async (x: any, user?: ILocalUser): Promise<IActivity | null> => {
	if (x == null) return null;

	if (x !== null && typeof x === 'object' && x.id == null) {
		x.id = `${config.url}/${uuid()}`;
	}

	const context = {
		'@context': [
			'https://www.w3.org/ns/activitystreams',
			'https://w3id.org/security/v1',
		] as (string | Object)[]
	};

	if (user) {
		const obj = {
			// as non-standards
			manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
			sensitive: 'as:sensitive',
			Hashtag: 'as:Hashtag',
			quoteUrl: 'as:quoteUrl',
			// Mastodon
			toot: 'http://joinmastodon.org/ns#',
			Emoji: 'toot:Emoji',
			featured: 'toot:featured',
			// schema
			schema: 'http://schema.org#',
			PropertyValue: 'schema:PropertyValue',
			value: 'schema:value',
			// Misskey
			misskey: `${config.url}/ns#`,
			'_misskey_content': 'misskey:_misskey_content',
			'_misskey_quote': 'misskey:_misskey_quote',
			'_misskey_reaction': 'misskey:_misskey_reaction',
			'_misskey_votes': 'misskey:_misskey_votes',
			'_misskey_talk': 'misskey:_misskey_talk',
		};

		context['@context'].push(obj);
	}

	let activity = Object.assign(context, x) as IActivity;

	if (user) {
		const ldSignature = new LdSignature();
		ldSignature.debug = true;
		activity = await ldSignature.signRsaSignature2017(activity, user.keypair, `${config.url}/users/${user._id}#main-key`);
	}

	return activity;
};
