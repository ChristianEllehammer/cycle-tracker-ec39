
import { db } from '../db';
import { userPreferencesTable } from '../db/schema';
import { type UpdateUserPreferencesInput, type UserPreferences } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserPreferences = async (input: UpdateUserPreferencesInput): Promise<UserPreferences> => {
  try {
    // Check if user preferences exist
    const existingPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, input.user_id))
      .execute();

    if (existingPreferences.length === 0) {
      // Create new preferences if they don't exist
      const result = await db.insert(userPreferencesTable)
        .values({
          user_id: input.user_id,
          average_cycle_length: input.average_cycle_length,
          average_period_length: input.average_period_length,
          reminder_days_before: input.reminder_days_before,
          notification_enabled: input.notification_enabled
        })
        .returning()
        .execute();

      return result[0];
    } else {
      // Update existing preferences
      const updateData: any = {
        updated_at: new Date()
      };

      if (input.average_cycle_length !== undefined) {
        updateData.average_cycle_length = input.average_cycle_length;
      }
      if (input.average_period_length !== undefined) {
        updateData.average_period_length = input.average_period_length;
      }
      if (input.reminder_days_before !== undefined) {
        updateData.reminder_days_before = input.reminder_days_before;
      }
      if (input.notification_enabled !== undefined) {
        updateData.notification_enabled = input.notification_enabled;
      }

      const result = await db.update(userPreferencesTable)
        .set(updateData)
        .where(eq(userPreferencesTable.user_id, input.user_id))
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('User preferences update failed:', error);
    throw error;
  }
};
