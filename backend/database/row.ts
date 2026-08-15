export type DatabaseRecord = Record<string, unknown>

export function asRecord(value: unknown): DatabaseRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Database returned an invalid row')
  }
  return value as DatabaseRecord
}

export function nullableString(row: DatabaseRecord, key: string): string | null {
  const value = row[key]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`Database column ${key} must be text`)
  return value
}

export function requiredString(row: DatabaseRecord, key: string): string {
  const value = nullableString(row, key)
  if (value === null) throw new Error(`Database column ${key} must not be null`)
  return value
}

export function requiredInteger(row: DatabaseRecord, key: string): number {
  const value = row[key]
  const numberValue = typeof value === 'bigint' ? Number(value) : value
  if (typeof numberValue !== 'number' || !Number.isSafeInteger(numberValue)) {
    throw new Error(`Database column ${key} must be a safe integer`)
  }
  return numberValue
}

export function nullableInteger(row: DatabaseRecord, key: string): number | null {
  const value = row[key]
  if (value === null || value === undefined) return null
  return requiredInteger(row, key)
}

export function requiredBoolean(row: DatabaseRecord, key: string): boolean {
  const value = requiredInteger(row, key)
  if (value !== 0 && value !== 1) throw new Error(`Database column ${key} must be 0 or 1`)
  return value === 1
}

export function stringArray(row: DatabaseRecord, key: string): string[] {
  const value = requiredString(row, key)
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error(`Database column ${key} must contain a JSON string array`)
  }
  return parsed
}
