import { createHash } from 'node:crypto'

import { withConcurrentTransaction, type DatabaseExecutor } from '#database/client'
import { asRecord, requiredString } from '#database/row'
import { DomainError } from '#exceptions/domain_error'
import { publishRealtime, type CommittedRealtimeEvent } from '#services/realtime_service'

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Mutation payload cannot contain non-finite numbers')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object') {
    const entries = Object.keys(value)
      .map((key): [string, unknown] => [key, Reflect.get(value, key)])
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  }
  throw new Error('Mutation payload contains an unsupported value')
}

function mutationHash(operation: string, payload: unknown): string {
  return createHash('sha256').update(operation).update('\n').update(canonicalJson(payload)).digest('hex')
}

export type IdempotentMutationContext = {
  tx: DatabaseExecutor
  events: CommittedRealtimeEvent[]
}

export async function runIdempotentMutation(input: {
  actorUserId: number
  idempotencyKey: string
  operation: string
  requestPayload: unknown
  mutate: (context: IdempotentMutationContext) => Promise<unknown>
}): Promise<unknown> {
  const requestHash = mutationHash(input.operation, input.requestPayload)
  const committed = await withConcurrentTransaction(async (tx) => {
    const existing: unknown = await tx.get(
      `SELECT operation, request_hash, response_json
       FROM idempotency_records
       WHERE actor_user_id = ? AND idempotency_key = ?`,
      [input.actorUserId, input.idempotencyKey]
    )
    if (existing) {
      const row = asRecord(existing)
      if (
        requiredString(row, 'operation') !== input.operation ||
        requiredString(row, 'request_hash') !== requestHash
      ) {
        throw new DomainError(
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'This idempotency key was already used for a different request.'
        )
      }
      return { response: JSON.parse(requiredString(row, 'response_json')), events: [] }
    }

    const events: CommittedRealtimeEvent[] = []
    const response = await input.mutate({ tx, events })
    await tx.run(
      `INSERT INTO idempotency_records (
         actor_user_id, idempotency_key, operation, request_hash, status_code, response_json, created_at
       ) VALUES (?, ?, ?, ?, 200, ?, ?)`,
      [
        input.actorUserId,
        input.idempotencyKey,
        input.operation,
        requestHash,
        JSON.stringify(response),
        new Date().toISOString(),
      ]
    )
    return { response, events }
  })

  if (committed.events.length > 0) publishRealtime(committed.events)
  return committed.response
}
