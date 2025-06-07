
import { db } from '../db';
import { userPreferencesTable } from '../db/schema';
import { type GetUserDataInput, type UserPreferences } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserPreferences = async (input: GetUserDataInput): Promise<UserPreferences> => {
  try {
    const result = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, input.user_id))
      .execute();

    if (result.length === 0) {
      // Create default preferences if they don't exist
      const defaultPreferences = await db.insert(userPreferencesTable)
        .values({
          user_id: input.user_id,
          average_cycle_length: 28,
          average_period_length: 5,
          reminder_days_before: 2,
          notification_enabled: true
        })
        .returning()
        .execute();

      return defaultPreferences[0];
    }

    return result[0];
  } catch (error) {
    console.error('Get user preferences failed:', error);
    throw error;
  }
};
