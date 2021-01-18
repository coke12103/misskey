<template>
<div style="position:initial">
	<mk-menu :source="source" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faPlaneArrival, faPlaneDeparture, faUserFriends, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/note-menu.vue'),
	props: ['note', 'source'],
	data() {
		return {
			isFavorited: false,
		};
	},
	computed: {
		items(): any[] {
			const it = [
				// 空リプ
				{
					icon: faPaperPlane,
					text: this.$t('air-reply'),
					action: this.airReply
				},
				// メンション
				{
					icon: 'at',
					text: this.$t('mention'),
					action: this.mention
				},
				null,
				// 詳細
				{
					icon: 'info-circle',
					text: this.$t('detail'),
					action: this.detail
				},
				// タイムラインへ
				{
					icon: faPlaneArrival,
					text: this.$t('go-timeline'),
					action: this.goTimeline
				},
				{
					icon: faPlaneDeparture,
					text: this.$t('up-timeline'),
					action: this.upTimeline
				},
				{
					icon: faUserFriends,
					text: this.$t('go-follow-tl'),
					action: this.goFollowTL
				},
				// コピー
				{
					icon: faCopy,
					text: this.$t('copy-content'),
					action: this.copyContent
				},
				{
					icon: 'link',
					text: this.$t('copy-link'),
					action: this.copyLink
				}
			];

			// リモートで見る
			if (this.note.url || this.note.uri) it.push({
				icon: 'external-link-square-alt',
				text: this.$t('remote'),
				action: () => {
					window.open(this.note.url || this.note.uri, '_blank');
				}
			});

			// お気に入り
			if (this.isFavorited) {
				it.push({
					icon: 'star',
					text: this.$t('unfavorite'),
					action: () => this.toggleFavorite(false)
				});
			} else {
				it.push({
					icon: 'star',
					text: this.$t('favorite'),
					action: () => this.toggleFavorite(true)
				});
			}

			// ピン留め
			if (this.isSelf && (this.$store.state.i.pinnedNoteIds || []).includes(this.note.id)) it.push({
				icon: 'thumbtack',
				text: this.$t('unpin'),
				action: () => this.togglePin(false)
			});

			if (this.pinnable) it.push({
				icon: 'thumbtack',
				text: this.$t('pin'),
				action: () => this.togglePin(true)
			});

			if (this.isSelf || this.isAdminOrModerator) it.push(null);

			// 編集
			if (this.isSelf) {
				it.push({
					icon: ['fa', 'undo-alt'],
					text: this.$t('@.edit'),
					action: this.edit
				});
			}

			// 削除
			if (this.isSelf || this.isAdminOrModerator) it.push({
				icon: ['far', 'trash-alt'],
				text: this.isSelf ? this.$t('delete') : this.$t('deleteAsAdmin'),
				action: this.del
			});

			return it;
		},

		isSelf(): boolean {
			return this.note.userId == this.$store.state.i.id;
		},

		isAdminOrModerator(): boolean {
			return this.$store.state.i.isAdmin || this.$store.state.i.isModerator;
		},

		pinnable(): boolean {
			return this.isSelf
				&& !(this.$store.state.i.pinnedNoteIds || []).includes(this.note.id)
				&& (this.note.visibility == 'public' || this.note.visibility == 'home')
				&& !this.note.localOnly;
		},
	},

	created() {
		this.$root.api('notes/state', {
			noteId: this.note.id
		}).then(state => {
			this.isFavorited = state.isFavorited;
		});
	},

	methods: {
		airReply() {
			this.$post({ airReply: this.note });
		},

		mention() {
			this.$post({ mention: this.note.user });
		},

		detail() {
			this.$router.push(`/notes/${this.note.id}`);
		},

		copyContent() {
			copyToClipboard(this.note.text);
			this.$root.dialog({
				type: 'success',
				splash: true
			});
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${this.note.id}`);
			this.$root.dialog({
				type: 'success',
				splash: true
			});
		},

		togglePin(pin: boolean) {
			this.$root.api(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.$emit('closed');
				this.destroyDom();
			}).catch(e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('pin-limit-exceeded')
					});
				}
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.isSelf ? this.$t('delete-confirm') : this.$t('deleteAsAdmin-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notes/delete', {
					noteId: this.note.id
				}).then(() => {
					this.$emit('closed');
					this.destroyDom();
				});
			});
		},

		edit() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('edit-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.$post({
					initialNote: Object.assign({ _edit: true }, this.note),
					reply: this.note.reply,
				});
			});
		},

		toggleFavorite(favorite: boolean) {
			this.$root.api(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.$emit('closed');
				this.destroyDom();
			});
		},

		goTimeline() {
			const date = new Date(new Date(this.note.createdAt).getTime() + 5000).toISOString();
			const host = this.note.user.host || '.';
			const q = `host:${host} until:${date}`;

			this.$router.push(`/search?q=${encodeURIComponent(q)}`);
		},

		upTimeline() {
			const date = new Date(new Date(this.note.createdAt).getTime() - 5000).toISOString();
			const host = this.note.user.host || '.';
			const q = `host:${host} since:${date}`;

			this.$router.push(`/search?q=${encodeURIComponent(q)}`);
		},

		goFollowTL() {
			const date = new Date(new Date(this.note.createdAt).getTime() + 5000).toISOString();
			const user = this.note.user.host ? `@${this.note.user.username}@${this.note.user.host}` : `@${this.note.user.username}`;
			const q = `follow:${user} until:${date}`;

			this.$router.push(`/search?q=${encodeURIComponent(q)}`);
		},

		closed() {
			this.$emit('closed');
			this.$nextTick(() => {
				this.destroyDom();
			});
		}
	}
});
</script>
