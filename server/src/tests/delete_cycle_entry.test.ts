import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type DeleteCycleEntryInput, type CreateCycleEntryInput } from '../schema';
import { deleteCycleEntry } from '../handlers/delete_cycle_entry';
import { createCycleEntry } from '../handlers/create_cycle_entry';
import { eq } from 'drizzle-orm';

describe('deleteCycleEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a cycle entry', async () => {
    // Create a cycle entry to delete
    const createInput: CreateCycleEntryInput = {
      user_id: 'test_user',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-06'),
      notes: 'Test cycle entry'
    };

    const createdEntry = await createCycleEntry(createInput);

    // Delete the entry
    const deleteInput: DeleteCycleEntryInput = {
      id: createdEntry.id
    };

    const deletedEntry = await deleteCycleEntry(deleteInput);

    // Verify the returned entry matches the created one
    expect(deletedEntry.id).toEqual(createdEntry.id);
    expect(deletedEntry.user_id).toEqual(createInput.user_id);
    expect(deletedEntry.start_date).toEqual(createInput.start_date);
    expect(deletedEntry.end_date).toEqual(createInput.end_date || null);
    expect(deletedEntry.notes).toEqual(createInput.notes || null);
  });

  it('should remove cycle entry from database', async () => {
    // Create a cycle entry
    const createInput: CreateCycleEntryInput = {
      user_id: 'test_user',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-06'),
      notes: 'Test cycle entry'
    };

    const createdEntry = await createCycleEntry(createInput);

    // Verify entry exists
    const beforeDelete = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.id, createdEntry.id))
      .execute();

    expect(beforeDelete).toHaveLength(1);

    // Delete the entry
    const deleteInput: DeleteCycleEntryInput = {
      id: createdEntry.id
    };

    await deleteCycleEntry(deleteInput);

    // Verify entry is removed
    const afterDelete = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.id, createdEntry.id))
      .execute();

    expect(afterDelete).toHaveLength(0);
  });

  it('should throw error when cycle entry does not exist', async () => {
    const deleteInput: DeleteCycleEntryInput = {
      id: 99999 // Non-existent ID
    };

    expect(deleteCycleEntry(deleteInput)).rejects.toThrow(/not found/i);
  });
});