// src/shared/schema/reports.ts
import { 
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    boolean,
    integer,
    jsonb,
    array
  } from 'drizzle-orm/pg-core';
  import { relations } from 'drizzle-orm';
  import { users } from './users';
  
  // Report Templates
  export const reportTemplates = pgTable('report_templates', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    reportType: varchar('report_type', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull().default('youth'),
    filters: jsonb('filters').notNull().default({}),
    columns: array(text('columns')).notNull().default([]),
    sortBy: varchar('sort_by', { length: 50 }),
    sortDirection: varchar('sort_direction', { length: 4 }).default('asc'),
    createdBy: integer('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    isDefault: boolean('is_default').default(false)
  });
  
  // Report Executions
  export const reportExecutions = pgTable('report_executions', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    templateId: integer('template_id').references(() => reportTemplates.id),
    entityType: varchar('entity_type', { length: 50 }).notNull().default('youth'),
    filters: jsonb('filters').notNull().default({}),
    parameters: jsonb('parameters').notNull().default({}),
    exportFormat: varchar('export_format', { length: 10 }).notNull().default('json'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    resultCount: integer('result_count'),
    filePath: varchar('file_path', { length: 255 }),
    errorMessage: text('error_message'),
    executedBy: integer('executed_by').notNull().references(() => users.id),
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: timestamp('completed_at'),
    downloadCount: integer('download_count').default(0),
    lastDownloadedAt: timestamp('last_downloaded_at')
  });
  
  // Optional data cache for large datasets
  export const reportDataCache = pgTable('report_data_cache', {
    id: serial('id').primaryKey(),
    executionId: integer('execution_id').notNull().references(() => reportExecutions.id),
    dataChunk: jsonb('data_chunk').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  });
  
  // Relations
  export const reportTemplatesRelations = relations(reportTemplates, ({ one, many }) => ({
    creator: one(users, {
      fields: [reportTemplates.createdBy],
      references: [users.id]
    }),
    executions: many(reportExecutions)
  }));
  
  export const reportExecutionsRelations = relations(reportExecutions, ({ one, many }) => ({
    template: one(reportTemplates, {
      fields: [reportExecutions.templateId],
      references: [reportTemplates.id]
    }),
    executor: one(users, {
      fields: [reportExecutions.executedBy],
      references: [users.id]
    }),
    dataCache: many(reportDataCache)
  }));
  
  export const reportDataCacheRelations = relations(reportDataCache, ({ one }) => ({
    execution: one(reportExecutions, {
      fields: [reportDataCache.executionId],
      references: [reportExecutions.id]
    })
  }));
  
  // Type definitions for TypeScript
  export type ReportTemplate = typeof reportTemplates.$inferSelect;
  export type NewReportTemplate = typeof reportTemplates.$inferInsert;
  
  export type ReportExecution = typeof reportExecutions.$inferSelect;
  export type NewReportExecution = typeof reportExecutions.$inferInsert;
  
  export type ReportDataCache = typeof reportDataCache.$inferSelect;
  export type NewReportDataCache = typeof reportDataCache.$inferInsert;