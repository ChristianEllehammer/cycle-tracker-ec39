
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type UpdateCycleEntryInput, type CreateCycleEntryInput } from '../schema';
import { updateCycleEntry } from '../handlers/update_cycle_entry';
import { eq } from 'drizzle-orm';

// Helper function to create cycle entry for testing
const createTestCycleEntry = async (input: CreateCycleEntryInput) => {
  const insertData: any = {
    user_id: input.user_id,
    start_date: input.start_date,
    created_at: new Date(),
    updated_at: new Date()
  };

  if (input.end_date !== undefined) {
    insertData.end_date = input.end_date;
  }

  if (input.notes !== undefined) {
    insertData.notes = input.notes;
  }

  const result = await db.insert(cycleEntriesTable)
    .values(insertData)
    .returning()
    .execute();

  const cycleEntry = result[0];
  return {
    ...cycleEntry,
    start_date: new Date(cycleEntry.start_date),
    end_date: cycleEntry.end_date ? new Date(cycleEntry.end_date) : null,
    created_at: new Date(cycleEntry.created_at),
    updated_at: new Date(cycleEntry.updated_at)
  };
};

describe('updateCycleEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update cycle entry with end date', async () => {
    // Create initial cycle entry
    const createInput: CreateCycleEntryInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-01'),
      notes: 'Initial notes'
    };
    const created = await createTestCycleEntry(createInput);

    // Update with end date
    const updateInput: UpdateCycleEntryInput = {
      id: created.id,
      end_date: new Date('2024-01-05'),
      notes: 'Updated notes'
    };

    const result = await updateCycleEntry(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(created.id);
    expect(result.user_id).toEqual('user123');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-01-05'));
    expect(result.notes).toEqual('Updated notes');
    expect(result.period_length).toEqual(5); // 5 days from start to end
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should update only end date when notes not provided', async () => {
    // Create initial cycle entry
    const createInput: CreateCycleEntryInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-01'),
      notes: 'Original notes'
    };
    const created = await createTestCycleEntry(createInput);

    // Update only end date
    const updateInput: UpdateCycleEntryInput = {
      id: created.id,
      end_date: new Date('2024-01-04')
    };

    const result = await updateCycleEntry(updateInput);

    // Verify end date updated but notes unchanged
    expect(result.end_date).toEqual(new Date('2024-01-04'));
    expect(result.notes).toEqual('Original notes');
    expect(result.period_length).toEqual(4); // 4 days from start to end
  });

  it('should update only notes when end date not provided', async () => {
    // Create initial cycle entry
    const createInput: CreateCycleEntryInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-01')
    };
    const created = await createTestCycleEntry(createInput);

    // Update only notes
    const updateInput: UpdateCycleEntryInput = {
      id: created.id,
      notes: 'New notes only'
    };

    const result = await updateCycleEntry(updateInput);

    // Verify notes updated but end date unchanged
    expect(result.notes).toEqual('New notes only');
    expect(result.end_date).toBeNull();
    expect(result.period_length).toBeNull();
  });

  it('should save updated cycle entry to database', async () => {
    // Create initial cycle entry
    const createInput: CreateCycleEntryInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-01')
    };
    const created = await createTestCycleEntry(createInput);

    // Update cycle entry
    const updateInput: UpdateCycleEntryInput = {
      id: created.id,
      end_date: new Date('2024-01-06'),
      notes: 'Database test notes'
    };

    await updateCycleEntry(updateInput);

    // Query database directly to verify changes
    const entries = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.id, created.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].notes).toEqual('Database test notes');
    expect(new Date(entries[0].end_date!)).toEqual(new Date('2024-01-06'));
    expect(entries[0].period_length).toEqual(6);
  });

  it('should throw error when cycle entry not found', async () => {
    const updateInput: UpdateCycleEntryInput = {
      id: 99999, // Non-existent ID
      notes: 'This should fail'
    };

    await expect(updateCycleEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle null notes update', async () => {
    // Create initial cycle entry with notes
    const createInput: CreateCycleEntryInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-01'),
      notes: 'Original notes'
    };
    const created = await createTestCycleEntry(createInput);

    // Update notes to null
    const updateInput: UpdateCycleEntryInput = {
      id: created.id,
      notes: null
    };

    const result = await updateCycleEntry(updateInput);

    expect(result.notes).toBeNull();
  });
});
