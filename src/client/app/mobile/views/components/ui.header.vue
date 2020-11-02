<template>
<div class="header" :class="mobileNavbar"  ref="root">
	<div class="main" ref="main">
		<div class="backdrop"></div>
		<div class="content" ref="mainContainer">
			<button class="nav" @click="$parent.isDrawerOpening = true"><fa icon="bars"/></button>
			<i v-if="$parent.indicate" class="circle"><fa icon="circle"/></i>
			<h1>
				<slot>{{ $root.instanceName }}</slot>
			</h1>
			<slot name="func"></slot>
		</div>
	</div>
	<div class="indicator" v-show="$store.state.indicate"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { env } from '../../../config';

export default Vue.extend({
	i18n: i18n(),
	props: ['func'],

	data() {
		return {
			env: env
		};
	},

	computed: {
		mobileNavbar(): string {
			return this.$store.state.device.mobileNavbar;
		},
	},

	mounted() {
		this.$store.commit('setUiHeaderHeight', 48);
	},
});
</script>

<style lang="stylus" scoped>
.header
	$height = 48px
	position fixed
	left -8px
	z-index 1024
	width calc(100% + 16px)
	padding 0 8px
	box-shadow 0 0px 8px rgba(0, 0, 0, 0.25)

	&.top
		top 0

	&.top > .main
		> .backdrop
			top 0

		> .content
			> .nav
				top 0

			> i.circle
				top 8px

			> button:last-child
				top 0

	&.bottom
		bottom 0

	&.bottom > .main
		> .backdrop
			bottom 0

		> .content
			> .nav
				bottom 0

			> i.circle
				bottom 8px

			> button:last-child
				bottom 0

	&, *
		user-select none

	> .indicator
		height 3px
		background var(--primary)

	> .warn
		display block
		margin 0
		padding 4px
		text-align center
		font-size 12px
		background #f00
		color #fff

	> .main
		color var(--mobileHeaderFg)

		> .backdrop
			position absolute
			z-index 1000
			width 100%
			height $height
			-webkit-backdrop-filter blur(12px)
			backdrop-filter blur(12px)
			background-color var(--mobileHeaderBg)

		> .content
			z-index 1001

			> h1
				display block
				margin 0 auto
				padding 0
				width 100%
				max-width calc(100% - 112px)
				text-align center
				font-size 1.1em
				font-weight normal
				line-height $height
				white-space nowrap
				overflow hidden
				text-overflow ellipsis

				> img
					display inline-block
					vertical-align bottom
					width ($height - 16px)
					height ($height - 16px)
					margin 8px
					border-radius 6px

			> .nav
				display block
				position absolute
				left 0
				padding 0
				width $height
				font-size 1.4em
				line-height $height
				border-right solid 1px rgba(#000, 0.1)

				> [data-icon]
					transition all 0.2s ease

			> i.circle
				position absolute
				left 8px
				pointer-events none
				font-size 10px
				color var(--notificationIndicator)

			> button:last-child
				display block
				position absolute
				right 0
				padding 0
				width $height
				text-align center
				font-size 1.4em
				color inherit
				line-height $height
				border-left solid 1px rgba(#000, 0.1)

</style>
