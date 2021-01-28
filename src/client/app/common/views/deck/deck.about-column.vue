<template>
<x-column>
	<template #header>
		<fa :icon="faInfoCircle"/>{{ $t('@.aboutInstance') }}
	</template>

	<div>
		<x-about v-bind="$attrs"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XAbout from '../../../common/views/pages/about.vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n(),

	components: {
		XColumn,
		XAbout,
	},

	data() {
		return {
			faInfoCircle
		};
	}
});
</script>
