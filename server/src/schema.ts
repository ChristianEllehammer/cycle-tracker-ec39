
import { z } from 'zod';

// Cycle phase enum
export const cyclePhaseSchema = z.enum(['menstrual', 'follicular', 'ovulation', 'luteal']);
export type CyclePhase = z.infer<typeof cyclePhaseSchema>;

// Cycle entry schema
export const cycleEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  cycle_length: z.number().int().nullable(),
  period_length: z.number().int().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CycleEntry = z.infer<typeof cycleEntrySchema>;

// Daily tracking schema
export const dailyTrackingSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  date: z.coerce.date(),
  flow_intensity: z.enum(['none', 'light', 'medium', 'heavy']).nullable(),
  symptoms: z.array(z.string()).nullable(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DailyTracking = z.infer<typeof dailyTrackingSchema>;

// Notification schema
export const notificationSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  type: z.enum(['period_start', 'ovulation', 'pms', 'fertile_window']),
  title: z.string(),
  message: z.string(),
  scheduled_date: z.coerce.date(),
  is_sent: z.boolean(),
  created_at: z.coerce.date()
});

export type Notification = z.infer<typeof notificationSchema>;

// User preferences schema
export const userPreferencesSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  average_cycle_length: z.number().int(),
  average_period_length: z.number().int(),
  reminder_days_before: z.number().int(),
  notification_enabled: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Input schemas
export const createCycleEntryInputSchema = z.object({
  user_id: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  notes: z.string().nullable().optional()
});

export type CreateCycleEntryInput = z.infer<typeof createCycleEntryInputSchema>;

export const updateCycleEntryInputSchema = z.object({
  id: z.number(),
  end_date: z.coerce.date().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateCycleEntryInput = z.infer<typeof updateCycleEntryInputSchema>;

export const createDailyTrackingInputSchema = z.object({
  user_id: z.string(),
  date: z.coerce.date(),
  flow_intensity: z.enum(['none', 'light', 'medium', 'heavy']).optional(),
  symptoms: z.array(z.string()).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
  notes: z.string().nullable().optional()
});

export type CreateDailyTrackingInput = z.infer<typeof createDailyTrackingInputSchema>;

export const updateUserPreferencesInputSchema = z.object({
  user_id: z.string(),
  average_cycle_length: z.number().int().min(21).max(35).optional(),
  average_period_length: z.number().int().min(3).max(10).optional(),
  reminder_days_before: z.number().int().min(0).max(7).optional(),
  notification_enabled: z.boolean().optional()
});

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesInputSchema>;

export const getUserDataInputSchema = z.object({
  user_id: z.string()
});

export type GetUserDataInput = z.infer<typeof getUserDataInputSchema>;

export const getCurrentPhaseInputSchema = z.object({
  user_id: z.string()
});

export type GetCurrentPhaseInput = z.infer<typeof getCurrentPhaseInputSchema>;

export const deleteCycleEntryInputSchema = z.object({
  id: z.number()
});

export type DeleteCycleEntryInput = z.infer<typeof deleteCycleEntryInputSchema>;

export const generateIcsCalendarInputSchema = getUserDataInputSchema;

export type GenerateIcsCalendarInput = z.infer<typeof generateIcsCalendarInputSchema>;

export const cyclePhaseInfoSchema = z.object({
  phase: cyclePhaseSchema,
  day_in_cycle: z.number().int(),
  days_until_next_period: z.number().int().nullable(),
  is_fertile_window: z.boolean()
});

export type CyclePhaseInfo = z.infer<typeof cyclePhaseInfoSchema>;
