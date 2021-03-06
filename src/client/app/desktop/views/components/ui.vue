<template>
<div class="mk-ui" v-hotkey.global="keymap">
	<div class="bg" v-if="$store.getters.isSignedIn && $store.state.i.wallpaperUrl" :style="style"></div>
	<x-header class="header" v-if="navbar == 'top'" v-show="!zenMode" ref="header"/>
	<x-sidebar class="sidebar" v-if="navbar == 'left'" v-show="!zenMode" ref="sidebar"/>
	<x-sidebar class="sidebar" v-if="navbar == 'right'" v-show="!zenMode" ref="sidebar"/>
	<div class="content" :class="[{ sidebar: (navbar != 'top' && navbar != 'bottom'), zen: zenMode }, navbar]">
		<slot></slot>
	</div>
	<x-header class="header" v-if="navbar == 'bottom'" v-show="!zenMode" ref="header"/>
	<mk-stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XHeader from './ui.header.vue';
import XSidebar from './ui.sidebar.vue';

export default Vue.extend({
	components: {
		XHeader,
		XSidebar
	},

	data() {
		return {
			zenMode: false
		};
	},

	computed: {
		navbar(): string {
			return this.$store.state.device.navbar;
		},

		style(): any {
			if (!this.$store.getters.isSignedIn || this.$store.state.i.wallpaperUrl == null) return {};
			return {
				backgroundColor: this.$store.state.i.wallpaperColor && this.$store.state.i.wallpaperColor.length == 3 ? `rgb(${ this.$store.state.i.wallpaperColor.join(',') })` : null,
				backgroundImage: `url(${ this.$store.state.i.wallpaperUrl })`
			};
		},

		keymap(): any {
			return {
				'p': this.post,
				'n': this.post,
			};
		}
	},

	watch: {
		'$store.state.uiHeaderHeight'() {
			if (this.navbar == 'bottom') {
				this.$el.style.paddingTop = '0px';
				this.$el.style.paddingBottom = this.$store.state.uiHeaderHeight + 'px';
			}else if(this.navbar == 'top'){
				this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
				this.$el.style.paddingBottom = '0px';
			}else{
				this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
				this.$el.style.paddingBottom = this.$store.state.uiHeaderHeight + 'px';
			}
		},

		navbar() {
			if (this.navbar != 'top' && this.navbar != 'bottom') {
				this.$store.commit('setUiHeaderHeight', 0);
			}
		}
	},

	mounted() {
		if (this.navbar == 'bottom') {
			this.$el.style.paddingTop = '0px';
			this.$el.style.paddingBottom = this.$store.state.uiHeaderHeight + 'px';
		}else if(this.navbar == 'top'){
			this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
			this.$el.style.paddingBottom = '0px';
		}else{
			this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
			this.$el.style.paddingBottom = this.$store.state.uiHeaderHeight + 'px';
		}
	},

	methods: {
		post() {
			this.$post();
		},
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui
	min-height 100vh
	padding-top 48px

	> .bg
		position fixed
		top 0
		left 0
		width 100%
		height 100vh
		background-size cover
		background-position center
		background-attachment fixed
		opacity 0.3

	> .content.sidebar.left
		padding-left 68px

	> .content.sidebar.right
		padding-right 68px

	> .content.zen
		padding 0 !important

</style>
