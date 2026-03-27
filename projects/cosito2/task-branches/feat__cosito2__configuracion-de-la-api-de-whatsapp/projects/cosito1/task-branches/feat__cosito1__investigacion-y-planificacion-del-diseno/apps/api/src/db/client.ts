import { MongoClient, Db } from 'mongodb'
import { config } from '../config'

let _client: MongoClient | null = null
let _db: Db | null = null

export async function connectDb(): Promise<void> {
  _client = new MongoClient(config.mongoUri)
  await _client.connect()
  _db = _client.db()
}

export async function closeDb(): Promise<void> {
  await _client?.close()
  _client = null
  _db = null
}

export function getDb(): Db {
  if (!_db) throw new Error('Database not connected. Call connectDb() first.')
  return _db
}
