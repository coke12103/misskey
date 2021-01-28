<template>
<ui-container :body-togglable="true" class="user-reactions"
	:expanded="$store.state.device.expandUsersReactions"
	@toggle="expanded => $store.commit('device/set', { key: 'expandUsersReactions', value: expanded })">
	<template #header><fa :icon="faHeart"/> {{ $t('@.favoriteReactions') }}</template>
	<div class="items" :class="{ deck }" v-if="reactionStats">
		<div class="item" v-for="reaction in reactionStats.reactions" :key="reaction.reaction" :title="reaction.count">
			<mk-reaction-icon :reaction="reaction.reaction" :customEmojis="reactionStats.emojis"/>
		</div>
	</div>
</ui-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n(''),
	props: {
		user: {
			type: Object,
			required: true,
		},
		deck: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	data() {
		return {
			reactionStats: null,
			faHeart,
		};
	},
	created() {
		this.$root.api('users/reaction-stats', {
			userId: this.user.id,
			limit: 10,
		}).then((reactionStats: any) => {
			this.reactionStats = reactionStats;
		});
	},
});
</script>

<style lang="stylus" scoped>
.user-reactions
	color var(--text)

	>>> .items
		display flex
		justify-content center

		> .item
			padding 0.7em
	
		&.deck
			> .item
				padding 0.3em
</style>
