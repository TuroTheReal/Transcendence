import pino from 'pino';
import net from 'net';

// 🔧 CHANGEMENT MINIMAL : Envoyer à Logstash au lieu d'Elasticsearch
const sendToLogstash = async (logData: any): Promise<void> => {
  try {
    // Logstash écoute généralement sur le port 5044 ou 5000
    const logstashHost = process.env.LOGSTASH_HOST || 'logstash';
    const logstashPort = parseInt(process.env.LOGSTASH_PORT || '5044');

    const logEntry = {
      ...logData,
      '@timestamp': new Date().toISOString(),
      service: 'transcendence',
      environment: process.env.NODE_ENV || 'development'
    };

    const client = new net.Socket();

    client.connect(logstashPort, logstashHost, () => {
      client.write(JSON.stringify(logEntry) + '\n');
      client.end();
    });

    client.on('error', (error) => {
      console.error('Failed to send log to Logstash:', error.message);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send log to Logstash:', errorMessage);
  }
};

const pinoLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export const logger = {
  info: (message: string | object) => {
    const logData = typeof message === 'string'
      ? { level: 'info', message }
      : { level: 'info', message: JSON.stringify(message), ...message };

    pinoLogger.info(logData);
    setImmediate(() => sendToLogstash(logData));
  },

  error: (message: string | object) => {
    const logData = typeof message === 'string'
      ? { level: 'error', message }
      : { level: 'error', message: JSON.stringify(message), ...message };

    pinoLogger.error(logData);
    setImmediate(() => sendToLogstash(logData));
  },

  warn: (message: string | object) => {
    const logData = typeof message === 'string'
      ? { level: 'warn', message }
      : { level: 'warn', message: JSON.stringify(message), ...message };

    pinoLogger.warn(logData);
    setImmediate(() => sendToLogstash(logData));
  },

  debug: (message: string | object) => {
    const logData = typeof message === 'string'
      ? { level: 'debug', message }
      : { level: 'debug', message: JSON.stringify(message), ...message };

    pinoLogger.debug(logData);
    setImmediate(() => sendToLogstash(logData));
  }
};

// Version encore plus simple
export const log = (message: string | object) => {
  logger.info(message);
};