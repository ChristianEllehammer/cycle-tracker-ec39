
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type CreateCycleEntryInput, type CycleEntry } from '../schema';

export const createCycleEntry = async (input: CreateCycleEntryInput): Promise<CycleEntry> => {
  try {
    // Insert cycle entry record
    const result = await db.insert(cycleEntriesTable)
      .values({
        user_id: input.user_id,
        start_date: input.start_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        end_date: input.end_date ? input.end_date.toISOString().split('T')[0] : null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const cycleEntry = result[0];
    return {
      ...cycleEntry,
      start_date: new Date(cycleEntry.start_date + 'T00:00:00Z'), // Convert string back to Date
      end_date: cycleEntry.end_date ? new Date(cycleEntry.end_date + 'T00:00:00Z') : null,
      created_at: cycleEntry.created_at,
      updated_at: cycleEntry.updated_at
    };
  } catch (error) {
    console.error('Cycle entry creation failed:', error);
    throw error;
  }
};
