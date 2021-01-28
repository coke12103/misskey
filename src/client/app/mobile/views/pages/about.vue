<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa :icon="faInfoCircle"/></span>{{ $t('@.aboutInstance') }}</template>

	<main>
		<x-about v-bind="$attrs"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import XAbout from '../../../common/views/pages/about.vue';

export default Vue.extend({
	i18n: i18n(''),
	components: {
		XAbout
	},
	data() {
		return {
			faInfoCircle
		};
	},
});
</script>
