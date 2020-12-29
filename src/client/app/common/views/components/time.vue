<template>
<time class="mk-time" :title="absolute">
	<span v-if=" mode == 'relative' ">{{ relative }}</span>
	<span v-if=" mode == 'absolute_smart'">{{ absolute_smart }}</span>
	<span v-if=" mode == 'default_mode'">{{ default_mode }}</span>
	<span v-if=" mode == 'absolute' ">{{ absolute }}</span>
	<span v-if=" mode == 'detail' ">{{ absolute }} ({{ relative }})</span>
</time>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n(),
	props: {
		time: {
			type: [Date, String],
			required: true
		},
		mode: {
			type: String,
			default: 'default_mode'
		}
	},
	data() {
		return {
			tickId: null,
			now: new Date()
		};
	},
	computed: {
		_time(): Date {
			return typeof this.time == 'string' ? new Date(this.time) : this.time;
		},
		useAbsoluteTime(): bool {
			return this.$store.state.device.useAbsoluteTime;
		},
		default_mode(): string {
			return this.useAbsoluteTime ? this.absolute_smart : this.relative;
		},
		absolute(): string {
			return this._time.toLocaleString();
		},
		absolute_smart(): string{
			const time = this._time;

			const time_zero = new Date(this._time.toDateString()).getTime();
			const today_zero = new Date(this.now.toDateString()).getTime();

			const abs_date = `${time.getFullYear()}/${('0' + (time.getMonth() + 1)).slice(-2)}/${('0' + time.getDate()).slice(-2)}`;
			const abs_time = `${('0' + time.getHours()).slice(-2)}:${('0' + time.getMinutes()).slice(-2)}:${('0' + time.getSeconds()).slice(-2)}`;

			return time_zero == today_zero ? abs_time : `${abs_date} ${abs_time}`;
		},
		relative(): string {
			const time = this._time;
			if (time == null) return this.$t('@.time.unknown');
			const ago = (this.now.getTime() - time.getTime()) / 1000/*ms*/;
			return (
				ago >= 31536000 ? this.$t('@.time.years_ago')  .replace('{}', (~~(ago / 31536000)).toString()) :
				ago >= 2592000  ? this.$t('@.time.months_ago') .replace('{}', (~~(ago / 2592000)).toString()) :
				ago >= 604800   ? this.$t('@.time.weeks_ago')  .replace('{}', (~~(ago / 604800)).toString()) :
				ago >= 86400    ? this.$t('@.time.days_ago')   .replace('{}', (~~(ago / 86400)).toString()) :
				ago >= 3600     ? this.$t('@.time.hours_ago')  .replace('{}', (~~(ago / 3600)).toString()) :
				ago >= 60       ? this.$t('@.time.minutes_ago').replace('{}', (~~(ago / 60)).toString()) :
				ago >= 10       ? this.$t('@.time.seconds_ago').replace('{}', (~~(ago % 60)).toString()) :
				ago >= -10      ? this.$t('@.time.just_now') :
				this.$t('@.time.future'));
		}
	},
	created() {
		if (this.mode == 'relative' || this.mode == 'detail' || this.mode == 'absolute_smart' || this.mode == 'default_mode') {
			this.tickId = window.requestAnimationFrame(this.tick);
		}
	},
	destroyed() {
		if (this.mode === 'relative' || this.mode === 'detail' || this.mode == 'absolute_smart' || this.mode == 'default_mode') {
			window.clearTimeout(this.tickId);
		}
	},
	methods: {
		tick() {
			this.now = new Date();

			this.tickId = setTimeout(() => {
				window.requestAnimationFrame(this.tick);
			}, 10000);
		}
	}
});
</script>
