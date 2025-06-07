
import { serial, text, pgTable, timestamp, integer, boolean, jsonb, date, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const flowIntensityEnum = pgEnum('flow_intensity', ['none', 'light', 'medium', 'heavy']);
export const moodEnum = pgEnum('mood', ['great', 'good', 'okay', 'bad', 'terrible']);
export const notificationTypeEnum = pgEnum('notification_type', ['period_start', 'ovulation', 'pms', 'fertile_window']);

// Cycle entries table
export const cycleEntriesTable = pgTable('cycle_entries', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),
  cycle_length: integer('cycle_length'),
  period_length: integer('period_length'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Daily tracking table
export const dailyTrackingTable = pgTable('daily_tracking', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  date: date('date').notNull(),
  flow_intensity: flowIntensityEnum('flow_intensity'),
  symptoms: jsonb('symptoms'), // Array of strings stored as JSONB
  mood: moodEnum('mood'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Notifications table
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  scheduled_date: timestamp('scheduled_date').notNull(),
  is_sent: boolean('is_sent').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// User preferences table
export const userPreferencesTable = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull().unique(),
  average_cycle_length: integer('average_cycle_length').default(28).notNull(),
  average_period_length: integer('average_period_length').default(5).notNull(),
  reminder_days_before: integer('reminder_days_before').default(2).notNull(),
  notification_enabled: boolean('notification_enabled').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the tables
export type CycleEntry = typeof cycleEntriesTable.$inferSelect;
export type NewCycleEntry = typeof cycleEntriesTable.$inferInsert;
export type DailyTracking = typeof dailyTrackingTable.$inferSelect;
export type NewDailyTracking = typeof dailyTrackingTable.$inferInsert;
export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;
export type UserPreferences = typeof userPreferencesTable.$inferSelect;
export type NewUserPreferences = typeof userPreferencesTable.$inferInsert;

// Export all tables
export const tables = {
  cycleEntries: cycleEntriesTable,
  dailyTracking: dailyTrackingTable,
  notifications: notificationsTable,
  userPreferences: userPreferencesTable
};
