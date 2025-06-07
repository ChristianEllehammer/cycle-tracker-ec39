
import { db } from '../db';
import { dailyTrackingTable } from '../db/schema';
import { type CreateDailyTrackingInput, type DailyTracking } from '../schema';

export const createDailyTracking = async (input: CreateDailyTrackingInput): Promise<DailyTracking> => {
  try {
    // Insert daily tracking record
    const result = await db.insert(dailyTrackingTable)
      .values({
        user_id: input.user_id,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        flow_intensity: input.flow_intensity || null,
        symptoms: input.symptoms || null,
        mood: input.mood || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert date string back to Date object before returning
    const tracking = result[0];
    return {
      ...tracking,
      date: new Date(tracking.date + 'T00:00:00.000Z'), // Convert date string back to Date
      symptoms: tracking.symptoms as string[] | null // Type assertion for JSONB field
    };
  } catch (error) {
    console.error('Daily tracking creation failed:', error);
    throw error;
  }
};
