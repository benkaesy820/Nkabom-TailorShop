import { PassThrough } from 'node:stream'

import {
  latestRealtimeSequence,
  oldestRealtimeSequence,
  realtimeEventsAfter,
  subscribeRealtime,
  type RealtimeEvent,
} from '#services/realtime_service'
import type { HttpContext } from '@adonisjs/core/http'

const MAX_REPLAY_EVENTS = 500
const MAX_BUFFERED_FRAMES = 256

function parseLastEventId(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null
  const sequence = Number(value)
  return Number.isSafeInteger(sequence) && sequence >= 0 ? sequence : null
}

function frame(event: string, id: number, data: unknown): string {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

class SseWriter {
  readonly stream = new PassThrough({ highWaterMark: 64 * 1024 })
  #blocked = false
  #closed = false
  #queue: string[] = []

  constructor() {
    this.stream.on('drain', () => this.#flush())
    this.stream.on('close', () => {
      this.#closed = true
      this.#queue = []
    })
  }

  write(value: string): boolean {
    if (this.#closed) return false
    if (this.#blocked) {
      if (this.#queue.length >= MAX_BUFFERED_FRAMES) {
        this.stream.destroy(new Error('SSE client fell behind'))
        return false
      }
      this.#queue.push(value)
      return true
    }
    this.#blocked = !this.stream.write(value)
    return true
  }

  end(): void {
    if (!this.#closed) this.stream.end()
  }

  #flush(): void {
    if (this.#closed) return
    this.#blocked = false
    while (!this.#blocked && this.#queue.length > 0) {
      const next = this.#queue.shift()
      if (next === undefined) break
      this.#blocked = !this.stream.write(next)
    }
  }
}

function changeFrame(event: RealtimeEvent): string {
  return frame('change', event.sequence, {
    type: event.type,
    entityType: event.entityType,
    id: event.entityId,
    version: event.version,
  })
}

export default class RealtimeController {
  async events({ auth, request, response }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const requestedLastId = parseLastEventId(request.header('last-event-id'))
    const writer = new SseWriter()
    let replaying = true
    let lastSent = requestedLastId ?? 0
    const pending: RealtimeEvent[] = []

    const unsubscribe = subscribeRealtime(userId, (event) => {
      if (replaying) {
        pending.push(event)
        return
      }
      if (event.sequence <= lastSent) return
      if (writer.write(changeFrame(event))) lastSent = event.sequence
    })

    try {
      const latest = await latestRealtimeSequence(userId)
      if (requestedLastId === null) {
        lastSent = latest
        writer.write(frame('ready', latest, { sequence: latest }))
      } else {
        const oldest = await oldestRealtimeSequence(userId)
        const hasRetentionGap = oldest !== null && requestedLastId < oldest - 1
        const isAheadOfServer = requestedLastId > latest
        if (isAheadOfServer || hasRetentionGap || latest - requestedLastId > MAX_REPLAY_EVENTS) {
          lastSent = latest
          writer.write(frame('sync.required', latest, { sequence: latest }))
        } else {
          const replay = await realtimeEventsAfter(userId, requestedLastId, MAX_REPLAY_EVENTS + 1)
          if (replay.length > MAX_REPLAY_EVENTS) {
            lastSent = latest
            writer.write(frame('sync.required', latest, { sequence: latest }))
          } else {
            for (const event of replay) {
              if (event.sequence <= lastSent) continue
              writer.write(changeFrame(event))
              lastSent = event.sequence
            }
          }
        }
      }

      pending.sort((left, right) => left.sequence - right.sequence)
      for (const event of pending) {
        if (event.sequence <= lastSent) continue
        writer.write(changeFrame(event))
        lastSent = event.sequence
      }
      pending.length = 0
      replaying = false
    } catch (error) {
      unsubscribe()
      writer.end()
      throw error
    }

    response.header('Content-Type', 'text/event-stream; charset=utf-8')
    response.header('Cache-Control', 'no-cache, no-transform')
    response.header('X-Accel-Buffering', 'no')

    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      unsubscribe()
      writer.end()
    }
    writer.stream.once('close', cleanup)
    response.onFinish(cleanup)
    response.stream(writer.stream)
  }
}
