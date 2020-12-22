import autobind from 'autobind-decorator';
import Chart, { Partial } from './';

type QueueLog = {
	deliverCounts: number;
	inboxCounts: number;
};

class QueueChart extends Chart<QueueLog> {
	constructor() {
		super('queue');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: QueueLog): Promise<QueueLog> {
		return {
			deliverCounts: 0,
			inboxCounts: 0,
		};
	}

	@autobind
	public async update(deliverCounts: number, inboxCounts: number) {
		const inc: Partial<QueueLog> = {
			deliverCounts,
			inboxCounts,
		};

		await this.inc(inc);
	}
}

export default new QueueChart();
