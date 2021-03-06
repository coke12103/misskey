import * as Bull from 'bull';
import * as mongo from 'mongodb';

import { queueLogger } from '../../logger';
import Note from '../../../models/note';
import deleteNote from '../../../services/note/delete';
import User from '../../../models/user';
import { DbUserJobData } from '../../type';

const logger = queueLogger.createSubLogger('delete-notes');

export async function deleteNotes(job: Bull.Job<DbUserJobData>): Promise<string> {
	logger.info(`Deleting notes of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	if (user == null) {
		return `skip: user not found`;
	}

	let deletedCount = 0;
	let cursor: any = null;

	const total = await Note.count({
		userId: user._id,
	});

	while (true) {
		const notes = await Note.find({
			userId: user._id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				_id: 1
			}
		});

		if (notes.length === 0) {
			job.progress(100);
			break;
		}

		cursor = notes[notes.length - 1]._id;

		for (const note of notes) {
			await deleteNote(user, note, true);
			deletedCount++;
		}

		job.progress(deletedCount / total);
	}

	return `ok: All notes (${deletedCount}) of ${user._id} has been deleted.`;
}
