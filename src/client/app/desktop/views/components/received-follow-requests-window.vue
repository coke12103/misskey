<template>
<mk-window ref="window" is-modal width="450px" height="500px" @closed="destroyDom">
	<template #header><fa :icon="['far', 'envelope']"/> {{ $t('title') }}</template>

	<div class="slpqaxdoxhvglersgjukmvizkqbmbokc">
		<div class="user" v-for="req in requests" :key="req.id">
			<mk-avatar class="avatar" :user="req.follower"/>
			<div class="body">
				<div class="name">
					<router-link class="name" :to="req.follower | userPage" v-user-preview="req.follower.id"><mk-user-name :user="req.follower"/></router-link>
					<p class="username">@{{ req.follower | acct }}</p>
				</div>
			</div>
			<div class="action">
				<a @click="accept(req.follower)">{{ $t('accept') }}</a> | <a @click="reject(req.follower)">{{ $t('reject') }}</a>
			</div>
		</div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/received-follow-requests-window.vue'),
	data() {
		return {
			fetching: true,
			requests: []
		};
	},
	mounted() {
		this.$root.api('following/requests/list').then(requests => {
			this.fetching = false;
			this.requests = requests;
		});
	},
	methods: {
		accept(user) {
			this.$root.api('following/requests/accept', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		},
		reject(user) {
			this.$root.api('following/requests/reject', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		},
		close() {
			(this as any).$refs.window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.slpqaxdoxhvglersgjukmvizkqbmbokc
	padding 16px
	color var(--text)

	> .user
		display flex
		padding 16px
		border-bottom solid 1px var(--faceDivider)
		align-items center

		&:last-child
			border-bottom none

		> .avatar
			display block
			flex-shrink 0
			margin 0 12px 0 0
			width 42px
			height 42px
			border-radius 8px

		> .body
			> .name
				> .name
					margin 0
					font-size 16px
					line-height 24px
					color var(--text)

				> .username
					display block
					margin 0
					font-size 13px
					line-height 13px
					color var(--text)
					opacity 0.7

		> .action
			margin 0 0 0 auto
			> a
				padding 0 0.3em

</style>
