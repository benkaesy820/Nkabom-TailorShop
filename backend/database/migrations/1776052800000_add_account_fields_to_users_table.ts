import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('account_type', 20).notNullable().defaultTo('buyer').index()
      table.string('account_status', 20).notNullable().defaultTo('active').index()
      table.timestamp('email_verified_at').nullable()
      table.boolean('is_administrator').notNullable().defaultTo(false).index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('account_type', 'account_status', 'email_verified_at', 'is_administrator')
    })
  }
}
