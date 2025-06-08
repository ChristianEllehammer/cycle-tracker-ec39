
import { db } from '../db';
import { userPreferencesTable } from '../db/schema';
import { type UpdateUserPreferencesInput, type UserPreferences } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserPreferences = async (input: UpdateUserPreferencesInput): Promise<UserPreferences> => {
  try {
    // Update existing preferences or create with defaults
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

    // Try to update existing record first
    const result = await db.update(userPreferencesTable)
      .set(updateData)
      .where(eq(userPreferencesTable.user_id, input.user_id))
      .returning()
      .execute();

    if (result.length > 0) {
      return result[0];
    }

    // If no existing record was updated, create new preferences
    try {
      const newPreferences = await db.insert(userPreferencesTable)
        .values({
          user_id: input.user_id,
          average_cycle_length: input.average_cycle_length ?? 28,
          average_period_length: input.average_period_length ?? 5,
          reminder_days_before: input.reminder_days_before ?? 2,
          notification_enabled: input.notification_enabled ?? true
        })
        .returning()
        .execute();

      return newPreferences[0];
    } catch (insertError: any) {
      // If insertion fails due to unique constraint, try update again
      if (insertError.code === '23505') { // PostgreSQL unique_violation error code
        const retryResult = await db.update(userPreferencesTable)
          .set(updateData)
          .where(eq(userPreferencesTable.user_id, input.user_id))
          .returning()
          .execute();
        
        if (retryResult.length > 0) {
          return retryResult[0];
        }
      }
      throw insertError;
    }
  } catch (error) {
    console.error('User preferences update failed:', error);
    throw error;
  }
};
