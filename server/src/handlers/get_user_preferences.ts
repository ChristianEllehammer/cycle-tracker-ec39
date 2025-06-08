
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
      // Create default preferences if they don't exist, handle conflict gracefully
      try {
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
      } catch (insertError: any) {
        // If insertion fails due to unique constraint, fetch the existing record
        if (insertError.code === '23505') { // PostgreSQL unique_violation error code
          const existingResult = await db.select()
            .from(userPreferencesTable)
            .where(eq(userPreferencesTable.user_id, input.user_id))
            .execute();
          
          if (existingResult.length > 0) {
            return existingResult[0];
          }
        }
        throw insertError;
      }
    }

    return result[0];
  } catch (error) {
    console.error('Get user preferences failed:', error);
    throw error;
  }
};
