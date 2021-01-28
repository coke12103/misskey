import define from '../define';

export const meta = {
	requireCredential: false as const,

	tags: ['meta'],

	allowGet: true,

	params: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			pong: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
		}
	}
};

export default define(meta, async () => {
	return {
		// なんとなく意図的に誤差を入れる
		pong: Date.now() + Math.floor(Math.random() * 20 - 10)
	};
});
