
import { db } from '../db';
import { dailyTrackingTable } from '../db/schema';
import { type GetUserDataInput, type DailyTracking } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getDailyTracking = async (input: GetUserDataInput): Promise<DailyTracking[]> => {
  try {
    const results = await db.select()
      .from(dailyTrackingTable)
      .where(eq(dailyTrackingTable.user_id, input.user_id))
      .orderBy(desc(dailyTrackingTable.date))
      .execute();

    // Convert date strings and JSONB to proper types
    return results.map(tracking => ({
      ...tracking,
      date: new Date(tracking.date),
      symptoms: tracking.symptoms as string[] | null,
      created_at: tracking.created_at,
      updated_at: tracking.updated_at
    }));
  } catch (error) {
    console.error('Get daily tracking failed:', error);
    throw error;
  }
};
