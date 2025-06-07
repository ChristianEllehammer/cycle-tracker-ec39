
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type GetUserDataInput, type CycleEntry } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getCycleEntries = async (input: GetUserDataInput): Promise<CycleEntry[]> => {
  try {
    const results = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.user_id, input.user_id))
      .orderBy(desc(cycleEntriesTable.start_date))
      .execute();

    return results.map(entry => ({
      ...entry,
      start_date: new Date(entry.start_date),
      end_date: entry.end_date ? new Date(entry.end_date) : null,
      created_at: entry.created_at,
      updated_at: entry.updated_at
    }));
  } catch (error) {
    console.error('Failed to get cycle entries:', error);
    throw error;
  }
};
