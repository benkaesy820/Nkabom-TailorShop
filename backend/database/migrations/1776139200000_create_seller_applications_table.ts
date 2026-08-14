import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_applications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('users.id')
        .onDelete('CASCADE')
      table.string('primary_category', 80).nullable()
      table.specificType('specialities', 'text[]').notNullable().defaultTo('{}')
      table.string('years_of_experience', 40).nullable()
      table.text('professional_bio').nullable()
      table.specificType('languages', 'text[]').notNullable().defaultTo('{}')
      table.string('atelier_name', 160).nullable()
      table.string('business_type', 40).nullable()
      table.string('registration_number', 80).nullable()
      table.string('region', 80).nullable()
      table.string('city', 120).nullable()
      table.text('address').nullable()
      table.text('service_areas').nullable()
      table.string('phone', 32).nullable()
      table.string('whatsapp', 32).nullable()
      table.boolean('accepts_commissions').notNullable().defaultTo(false)
      table.boolean('offers_alterations').notNullable().defaultTo(false)
      table.boolean('offers_ready_made').notNullable().defaultTo(false)
      table.boolean('offers_in_person_fittings').notNullable().defaultTo(false)
      table.boolean('accepts_remote_orders').notNullable().defaultTo(false)
      table.integer('min_lead_time_days').unsigned().nullable()
      table.integer('max_lead_time_days').unsigned().nullable()
      table.integer('monthly_capacity').unsigned().nullable()
      table.text('additional_services').nullable()
      table.string('status', 32).notNullable().defaultTo('draft').index()
      table.timestamp('submitted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
