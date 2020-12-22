import autobind from 'autobind-decorator';
import { pack } from '../../../../models/note';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'hashtag';
	public static shouldShare = false;
	public static requireCredential = false;
	private q: string[][] | null = null;

	@autobind
	public async init(params: any) {
		this.q = params.q;

		if (this.q == null) return;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	@autobind
	private async onNote(note: any) {
		const noteTags = note.tags ? note.tags.map((t: string) => t.toLowerCase()) : [];
		const matched = this.q!.some(tags => tags.every(tag => noteTags.includes(tag.toLowerCase())));
		if (!matched) return;

		// Renoteなら再pack
		if (note.renoteId != null) {	// 来るのか？
			note.renote = await pack(note.renoteId, this.user, {
				detail: true
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, this.mutedUserIds)) return;

		this.send('note', note);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
