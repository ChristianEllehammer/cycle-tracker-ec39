
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyTrackingTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { getDailyTracking } from '../handlers/get_daily_tracking';
import { eq } from 'drizzle-orm';

const testInput: GetUserDataInput = {
  user_id: 'test-user-123'
};

describe('getDailyTracking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tracking data exists', async () => {
    const result = await getDailyTracking(testInput);
    expect(result).toEqual([]);
  });

  it('should return daily tracking data for user', async () => {
    // Create test tracking entries
    await db.insert(dailyTrackingTable)
      .values([
        {
          user_id: 'test-user-123',
          date: '2024-01-15',
          flow_intensity: 'medium',
          symptoms: ['cramps', 'bloating'], // Pass array directly for JSONB
          mood: 'okay',
          notes: 'Day 2 of period'
        },
        {
          user_id: 'test-user-123',
          date: '2024-01-14',
          flow_intensity: 'heavy',
          symptoms: ['cramps'], // Pass array directly for JSONB
          mood: 'bad',
          notes: 'Period started'
        }
      ])
      .execute();

    const result = await getDailyTracking(testInput);

    expect(result).toHaveLength(2);
    
    // Results should be ordered by date descending (most recent first)
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result[1].date.toISOString().split('T')[0]).toEqual('2024-01-14');
    
    // Check first entry details
    expect(result[0].user_id).toEqual('test-user-123');
    expect(result[0].flow_intensity).toEqual('medium');
    expect(result[0].symptoms).toEqual(['cramps', 'bloating']);
    expect(result[0].mood).toEqual('okay');
    expect(result[0].notes).toEqual('Day 2 of period');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Check second entry
    expect(result[1].flow_intensity).toEqual('heavy');
    expect(result[1].symptoms).toEqual(['cramps']);
    expect(result[1].mood).toEqual('bad');
    expect(result[1].notes).toEqual('Period started');
  });

  it('should return only data for specified user', async () => {
    // Create tracking data for multiple users
    await db.insert(dailyTrackingTable)
      .values([
        {
          user_id: 'test-user-123',
          date: '2024-01-15',
          flow_intensity: 'medium',
          mood: 'okay'
        },
        {
          user_id: 'other-user-456',
          date: '2024-01-15',
          flow_intensity: 'light',
          mood: 'good'
        }
      ])
      .execute();

    const result = await getDailyTracking(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('test-user-123');
    expect(result[0].flow_intensity).toEqual('medium');
  });

  it('should handle null values correctly', async () => {
    await db.insert(dailyTrackingTable)
      .values({
        user_id: 'test-user-123',
        date: '2024-01-15',
        flow_intensity: null,
        symptoms: null,
        mood: null,
        notes: null
      })
      .execute();

    const result = await getDailyTracking(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].flow_intensity).toBeNull();
    expect(result[0].symptoms).toBeNull();
    expect(result[0].mood).toBeNull();
    expect(result[0].notes).toBeNull();
  });

  it('should save tracking data to database correctly', async () => {
    await db.insert(dailyTrackingTable)
      .values({
        user_id: 'test-user-123',
        date: '2024-01-15',
        flow_intensity: 'light',
        symptoms: ['headache', 'fatigue'], // Pass array directly for JSONB
        mood: 'good',
        notes: 'Feeling better today'
      })
      .execute();

    const dbResults = await db.select()
      .from(dailyTrackingTable)
      .where(eq(dailyTrackingTable.user_id, 'test-user-123'))
      .execute();

    expect(dbResults).toHaveLength(1);
    expect(dbResults[0].user_id).toEqual('test-user-123');
    expect(dbResults[0].date).toEqual('2024-01-15');
    expect(dbResults[0].flow_intensity).toEqual('light');
    expect(dbResults[0].symptoms).toEqual(['headache', 'fatigue']); // JSONB is returned as the actual array
    expect(dbResults[0].mood).toEqual('good');
    expect(dbResults[0].notes).toEqual('Feeling better today');
  });
});
