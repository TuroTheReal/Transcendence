import pino from 'pino'
import axios from 'axios'

export const logger = pino({
	level: 'info',
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true
		}
	}
});

const LOGSTASH_URL = process.env.LOGSTASH_URL || 'http://localhost:5044';

export const sendLogToLogstash = async (logData: any) => {
	try {
		await axios.post(LOGSTASH_URL, {
			...logData,
			timestamp: new Date().toISOString(),
			service: 'transcendence'
		});
	} catch (error){
		console.error('Failed to send log to Logstash:' , error)
	}
}