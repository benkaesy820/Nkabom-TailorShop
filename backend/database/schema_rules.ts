import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  columns: {
    languages: { tsType: 'string[]', decorators: [{ name: '@column' }] },
    specialities: { tsType: 'string[]', decorators: [{ name: '@column' }] },
  },
} satisfies SchemaRules
