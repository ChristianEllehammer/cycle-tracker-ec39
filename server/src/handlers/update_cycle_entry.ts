
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type UpdateCycleEntryInput, type CycleEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCycleEntry = async (input: UpdateCycleEntryInput): Promise<CycleEntry> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.end_date !== undefined) {
      updateData.end_date = input.end_date;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Calculate cycle and period lengths if end_date is provided
    if (input.end_date) {
      // We need to get the start_date to calculate lengths
      const existingEntry = await db.select()
        .from(cycleEntriesTable)
        .where(eq(cycleEntriesTable.id, input.id))
        .execute();

      if (existingEntry.length === 0) {
        throw new Error('Cycle entry not found');
      }

      const startDate = new Date(existingEntry[0].start_date);
      const endDate = new Date(input.end_date);
      
      // Calculate period length (days between start and end of period)
      const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      updateData.period_length = periodLength;
    }

    // Update the cycle entry
    const result = await db.update(cycleEntriesTable)
      .set(updateData)
      .where(eq(cycleEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Cycle entry not found');
    }

    // Convert date fields to Date objects for consistency
    const cycleEntry = result[0];
    return {
      ...cycleEntry,
      start_date: new Date(cycleEntry.start_date),
      end_date: cycleEntry.end_date ? new Date(cycleEntry.end_date) : null,
      created_at: new Date(cycleEntry.created_at),
      updated_at: new Date(cycleEntry.updated_at)
    };
  } catch (error) {
    console.error('Cycle entry update failed:', error);
    throw error;
  }
};
