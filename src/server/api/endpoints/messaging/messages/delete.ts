import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import define from '../../../define';
import * as ms from 'ms';
import { ApiError } from '../../../error';
import { deleteMessage } from '../../../../../services/messages/delete';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したメッセージを削除します。',
		'en-US': 'Delete a message.'
	},

	tags: ['messaging'],

	requireCredential: true,

	kind: ['write:messaging', 'messaging-write'],

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec')
	},

	params: {
		messageId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のメッセージのID',
				'en-US': 'Target message ID.'
			}
		}
	},

	errors: {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '54b5b326-7925-42cf-8019-130fda8b56af'
		},
	}
};

export default define(meta, async (ps, user) => {
	const message = await Message.findOne({
		_id: ps.messageId,
		userId: user._id
	});

	if (message == null) {
		throw new ApiError(meta.errors.noSuchMessage);
	}

	await deleteMessage(message);

	return;
});
