
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type CreateCycleEntryInput } from '../schema';
import { createCycleEntry } from '../handlers/create_cycle_entry';
import { eq } from 'drizzle-orm';

const testInput: CreateCycleEntryInput = {
  user_id: 'user123',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-05'),
  notes: 'Test cycle entry'
};

describe('createCycleEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cycle entry', async () => {
    const result = await createCycleEntry(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user123');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-01-05'));
    expect(result.notes).toEqual('Test cycle entry');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.cycle_length).toBeNull();
    expect(result.period_length).toBeNull();
  });

  it('should save cycle entry to database', async () => {
    const result = await createCycleEntry(testInput);

    // Query using proper drizzle syntax
    const cycleEntries = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.id, result.id))
      .execute();

    expect(cycleEntries).toHaveLength(1);
    expect(cycleEntries[0].user_id).toEqual('user123');
    expect(cycleEntries[0].start_date).toEqual('2024-01-01');
    expect(cycleEntries[0].end_date).toEqual('2024-01-05');
    expect(cycleEntries[0].notes).toEqual('Test cycle entry');
    expect(cycleEntries[0].created_at).toBeInstanceOf(Date);
    expect(cycleEntries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create cycle entry without optional fields', async () => {
    const minimalInput: CreateCycleEntryInput = {
      user_id: 'user456',
      start_date: new Date('2024-02-01')
    };

    const result = await createCycleEntry(minimalInput);

    expect(result.user_id).toEqual('user456');
    expect(result.start_date).toEqual(new Date('2024-02-01'));
    expect(result.end_date).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null notes correctly', async () => {
    const inputWithNullNotes: CreateCycleEntryInput = {
      user_id: 'user789',
      start_date: new Date('2024-03-01'),
      notes: null
    };

    const result = await createCycleEntry(inputWithNullNotes);

    expect(result.notes).toBeNull();

    // Verify in database
    const cycleEntries = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.id, result.id))
      .execute();

    expect(cycleEntries[0].notes).toBeNull();
  });

  it('should handle date conversion correctly', async () => {
    const dateInput: CreateCycleEntryInput = {
      user_id: 'user_date_test',
      start_date: new Date('2024-12-25'),
      end_date: new Date('2024-12-30')
    };

    const result = await createCycleEntry(dateInput);

    // Verify dates are returned as Date objects
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.start_date.getFullYear()).toEqual(2024);
    expect(result.start_date.getMonth()).toEqual(11); // December is month 11
    expect(result.start_date.getDate()).toEqual(25);
    expect(result.end_date?.getFullYear()).toEqual(2024);
    expect(result.end_date?.getMonth()).toEqual(11);
    expect(result.end_date?.getDate()).toEqual(30);
  });
});
