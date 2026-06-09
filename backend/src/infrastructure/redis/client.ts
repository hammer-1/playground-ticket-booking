import { createClient, RedisClientType } from 'redis';
import { logger } from '../../config/logger';

export type RedisClient = RedisClientType;

/** Create and connect a Redis client. */
export async function createRedisClient(url: string): Promise<RedisClient> {
  const client: RedisClientType = createClient({ url });
  client.on('error', (err) => logger.error(err, 'Redis client error'));
  await client.connect();
  return client;
}
