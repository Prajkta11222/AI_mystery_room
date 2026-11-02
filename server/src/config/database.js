import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

export async function connectDatabase() {
  if (env.mongoDnsServers.length) dns.setServers(env.mongoDnsServers);
  const options = { serverSelectionTimeoutMS: 8000 };
  try {
    await mongoose.connect(env.mongoUri, options);
    console.info(JSON.stringify({
      event: 'mongodb_connected',
      dnsServersConfigured: env.mongoDnsServers.length > 0,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      event: 'mongodb_connection_failed',
      errorName: error?.name || 'Error',
      errorCode: typeof error?.code === 'string' ? error.code : undefined,
      dnsServersConfigured: env.mongoDnsServers.length > 0,
      serverSelectionTimeoutMs: options.serverSelectionTimeoutMS,
    }));
    throw error;
  }
}
