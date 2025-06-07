
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type GetUserDataInput, type Notification } from '../schema';
import { eq, and, gte } from 'drizzle-orm';

export const getUpcomingNotifications = async (input: GetUserDataInput): Promise<Notification[]> => {
  try {
    // Get current date for filtering upcoming notifications
    const now = new Date();
    
    // Query for upcoming notifications that haven't been sent yet
    const results = await db.select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.user_id, input.user_id),
          eq(notificationsTable.is_sent, false),
          gte(notificationsTable.scheduled_date, now)
        )
      )
      .orderBy(notificationsTable.scheduled_date)
      .execute();

    return results;
  } catch (error) {
    console.error('Get upcoming notifications failed:', error);
    throw error;
  }
};
