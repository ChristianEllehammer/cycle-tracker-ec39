
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { getCycleEntries } from '../handlers/get_cycle_entries';

const testInput: GetUserDataInput = {
  user_id: 'test-user-123'
};

describe('getCycleEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const result = await getCycleEntries(testInput);
    expect(result).toEqual([]);
  });

  it('should return cycle entries for user', async () => {
    // Create test cycle entries
    await db.insert(cycleEntriesTable)
      .values([
        {
          user_id: 'test-user-123',
          start_date: '2024-01-01',
          end_date: '2024-01-05',
          cycle_length: 28,
          period_length: 5,
          notes: 'First cycle'
        },
        {
          user_id: 'test-user-123',
          start_date: '2024-01-29',
          end_date: null,
          cycle_length: null,
          period_length: null,
          notes: 'Current cycle'
        }
      ])
      .execute();

    const result = await getCycleEntries(testInput);

    expect(result).toHaveLength(2);
    
    // Should be ordered by start_date descending (most recent first)
    expect(result[0].start_date).toEqual(new Date('2024-01-29'));
    expect(result[0].end_date).toBeNull();
    expect(result[0].notes).toEqual('Current cycle');
    
    expect(result[1].start_date).toEqual(new Date('2024-01-01'));
    expect(result[1].end_date).toEqual(new Date('2024-01-05'));
    expect(result[1].cycle_length).toEqual(28);
    expect(result[1].period_length).toEqual(5);
    expect(result[1].notes).toEqual('First cycle');
  });

  it('should only return entries for specified user', async () => {
    // Create entries for different users
    await db.insert(cycleEntriesTable)
      .values([
        {
          user_id: 'test-user-123',
          start_date: '2024-01-01',
          notes: 'User 123 cycle'
        },
        {
          user_id: 'other-user-456',
          start_date: '2024-01-01',
          notes: 'Other user cycle'
        }
      ])
      .execute();

    const result = await getCycleEntries(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('test-user-123');
    expect(result[0].notes).toEqual('User 123 cycle');
  });

  it('should handle date conversion correctly', async () => {
    await db.insert(cycleEntriesTable)
      .values({
        user_id: 'test-user-123',
        start_date: '2024-03-15',
        end_date: '2024-03-20'
      })
      .execute();

    const result = await getCycleEntries(testInput);

    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].start_date.getFullYear()).toEqual(2024);
    expect(result[0].start_date.getMonth()).toEqual(2); // March is month 2 (0-indexed)
    expect(result[0].start_date.getDate()).toEqual(15);
  });

  it('should order entries by start_date descending', async () => {
    await db.insert(cycleEntriesTable)
      .values([
        {
          user_id: 'test-user-123',
          start_date: '2024-01-01',
          notes: 'Oldest'
        },
        {
          user_id: 'test-user-123',
          start_date: '2024-03-01',
          notes: 'Newest'
        },
        {
          user_id: 'test-user-123',
          start_date: '2024-02-01',
          notes: 'Middle'
        }
      ])
      .execute();

    const result = await getCycleEntries(testInput);

    expect(result).toHaveLength(3);
    expect(result[0].notes).toEqual('Newest');
    expect(result[1].notes).toEqual('Middle');
    expect(result[2].notes).toEqual('Oldest');
  });
});
