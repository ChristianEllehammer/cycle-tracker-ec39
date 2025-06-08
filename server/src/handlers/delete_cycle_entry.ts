import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type DeleteCycleEntryInput, type CycleEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCycleEntry = async (input: DeleteCycleEntryInput): Promise<CycleEntry> => {
  try {
    // Delete the cycle entry
    const result = await db.delete(cycleEntriesTable)
      .where(eq(cycleEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Cycle entry not found');
    }

    const deletedEntry = result[0];
    return {
      ...deletedEntry,
      start_date: new Date(deletedEntry.start_date),
      end_date: deletedEntry.end_date ? new Date(deletedEntry.end_date) : null,
      created_at: new Date(deletedEntry.created_at),
      updated_at: new Date(deletedEntry.updated_at)
    };
  } catch (error) {
    console.error('Delete cycle entry failed:', error);
    throw error;
  }
};