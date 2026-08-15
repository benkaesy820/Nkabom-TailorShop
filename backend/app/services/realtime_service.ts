import { EventEmitter } from 'node:events'

import { databaseConnection, type DatabaseExecutor } from '#database/client'
import { asRecord, requiredInteger, requiredString } from '#database/row'

export type RealtimeEntityType = 'account' | 'seller_application' | 'admin_accounts' | 'admin_seller_applications'

export type RealtimeEvent = {
  sequence: number
  type: string
  entityType: RealtimeEntityType
  entityId: number
  version: number
  createdAt: string
}

export type CommittedRealtimeEvent = RealtimeEvent & { recipientUserId: number }

const hub = new EventEmitter()
hub.setMaxListeners(100)

function channel(userId: number): string {
  return `user:${userId}`
}

export function subscribeRealtime(userId: number, listener: (event: RealtimeEvent) => void): () => void {
  const eventName = channel(userId)
  hub.on(eventName, listener)
  return () => hub.off(eventName, listener)
}

export function publishRealtime(events: readonly CommittedRealtimeEvent[]): void {
  for (const event of events) {
    try {
      hub.emit(channel(event.recipientUserId), event)
    } catch {
      // The durable Turso event is already committed. A live wake-up failure must never
      // turn a successful mutation into a failed HTTP response; reconnect replay repairs it.
    }
  }
}

export async function appendRealtimeEvent(
  tx: DatabaseExecutor,
  recipientUserId: number,
  input: Omit<RealtimeEvent, 'sequence' | 'createdAt'>
): Promise<CommittedRealtimeEvent> {
  const sequenceRow: unknown = await tx.get(
    `INSERT INTO realtime_recipient_sequences (user_id, last_sequence)
     VALUES (?, 1)
     ON CONFLICT(user_id) DO UPDATE SET last_sequence = last_sequence + 1
     RETURNING last_sequence`,
    [recipientUserId]
  )
  const sequence = requiredInteger(asRecord(sequenceRow), 'last_sequence')
  const createdAt = new Date().toISOString()
  await tx.run(
    `INSERT INTO realtime_events (
       recipient_user_id, sequence, event_type, entity_type, entity_id, entity_version, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      recipientUserId,
      sequence,
      input.type,
      input.entityType,
      input.entityId,
      input.version,
      createdAt,
    ]
  )
  return { ...input, sequence, createdAt, recipientUserId }
}

export async function appendRealtimeEventToActiveAdministrators(
  tx: DatabaseExecutor,
  input: Omit<RealtimeEvent, 'sequence' | 'createdAt'>
): Promise<CommittedRealtimeEvent[]> {
  const rows: unknown[] = await tx.all(
    `SELECT id FROM users WHERE role = 'administrator' AND account_status = 'active' ORDER BY id`
  )
  const events: CommittedRealtimeEvent[] = []
  for (const row of rows) {
    const administratorId = requiredInteger(asRecord(row), 'id')
    events.push(await appendRealtimeEvent(tx, administratorId, input))
  }
  return events
}

function realtimeEventFromRow(value: unknown): RealtimeEvent {
  const row = asRecord(value)
  const entityType = requiredString(row, 'entity_type')
  if (
    entityType !== 'account' &&
    entityType !== 'seller_application' &&
    entityType !== 'admin_accounts' &&
    entityType !== 'admin_seller_applications'
  ) {
    throw new Error(`Unknown realtime entity type: ${entityType}`)
  }
  return {
    sequence: requiredInteger(row, 'sequence'),
    type: requiredString(row, 'event_type'),
    entityType,
    entityId: requiredInteger(row, 'entity_id'),
    version: requiredInteger(row, 'entity_version'),
    createdAt: requiredString(row, 'created_at'),
  }
}

export async function latestRealtimeSequence(userId: number): Promise<number> {
  const row: unknown = await databaseConnection().get(
    `SELECT last_sequence FROM realtime_recipient_sequences WHERE user_id = ?`,
    [userId]
  )
  return row ? requiredInteger(asRecord(row), 'last_sequence') : 0
}

export async function oldestRealtimeSequence(userId: number): Promise<number | null> {
  const row: unknown = await databaseConnection().get(
    `SELECT MIN(sequence) AS sequence FROM realtime_events WHERE recipient_user_id = ?`,
    [userId]
  )
  if (!row) return null
  const value = asRecord(row).sequence
  if (value === null || value === undefined) return null
  const normalized = typeof value === 'bigint' ? Number(value) : value
  if (typeof normalized !== 'number' || !Number.isSafeInteger(normalized)) {
    throw new Error('Database returned an invalid realtime sequence')
  }
  return normalized
}

export async function realtimeEventsAfter(
  userId: number,
  sequence: number,
  limit: number
): Promise<RealtimeEvent[]> {
  const rows: unknown[] = await databaseConnection().all(
    `SELECT sequence, event_type, entity_type, entity_id, entity_version, created_at
     FROM realtime_events
     WHERE recipient_user_id = ? AND sequence > ?
     ORDER BY sequence ASC
     LIMIT ?`,
    [userId, sequence, limit]
  )
  return rows.map(realtimeEventFromRow)
}
