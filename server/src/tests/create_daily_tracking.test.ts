
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyTrackingTable } from '../db/schema';
import { type CreateDailyTrackingInput } from '../schema';
import { createDailyTracking } from '../handlers/create_daily_tracking';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateDailyTrackingInput = {
  user_id: 'test-user-123',
  date: new Date('2024-01-15'),
  flow_intensity: 'medium',
  symptoms: ['cramps', 'bloating', 'headache'],
  mood: 'okay',
  notes: 'Feeling tired today'
};

// Minimal test input
const minimalInput: CreateDailyTrackingInput = {
  user_id: 'test-user-456',
  date: new Date('2024-01-16')
};

describe('createDailyTracking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create daily tracking with all fields', async () => {
    const result = await createDailyTracking(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-123');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.flow_intensity).toEqual('medium');
    expect(result.symptoms).toEqual(['cramps', 'bloating', 'headache']);
    expect(result.mood).toEqual('okay');
    expect(result.notes).toEqual('Feeling tired today');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create daily tracking with minimal fields', async () => {
    const result = await createDailyTracking(minimalInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-456');
    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.flow_intensity).toBeNull();
    expect(result.symptoms).toBeNull();
    expect(result.mood).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save daily tracking to database', async () => {
    const result = await createDailyTracking(testInput);

    // Query using proper drizzle syntax
    const trackingRecords = await db.select()
      .from(dailyTrackingTable)
      .where(eq(dailyTrackingTable.id, result.id))
      .execute();

    expect(trackingRecords).toHaveLength(1);
    const saved = trackingRecords[0];
    
    expect(saved.user_id).toEqual('test-user-123');
    expect(saved.date).toEqual('2024-01-15'); // Date column stores as string
    expect(saved.flow_intensity).toEqual('medium');
    expect(saved.symptoms).toEqual(['cramps', 'bloating', 'headache']); // JSONB field
    expect(saved.mood).toEqual('okay');
    expect(saved.notes).toEqual('Feeling tired today');
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should handle date conversion correctly', async () => {
    const testDate = new Date('2024-02-29'); // Leap year date
    const input: CreateDailyTrackingInput = {
      user_id: 'test-user-date',
      date: testDate,
      flow_intensity: 'light'
    };

    const result = await createDailyTracking(input);

    // Verify date is properly converted and returned
    expect(result.date).toEqual(testDate);
    expect(result.date).toBeInstanceOf(Date);

    // Verify date is stored correctly in database
    const saved = await db.select()
      .from(dailyTrackingTable)
      .where(eq(dailyTrackingTable.id, result.id))
      .execute();

    expect(saved[0].date).toEqual('2024-02-29');
  });

  it('should handle different flow intensities', async () => {
    const flowIntensities = ['none', 'light', 'medium', 'heavy'] as const;

    for (const intensity of flowIntensities) {
      const input: CreateDailyTrackingInput = {
        user_id: `test-user-${intensity}`,
        date: new Date('2024-01-20'),
        flow_intensity: intensity
      };

      const result = await createDailyTracking(input);
      expect(result.flow_intensity).toEqual(intensity);
    }
  });

  it('should handle different moods', async () => {
    const moods = ['great', 'good', 'okay', 'bad', 'terrible'] as const;

    for (const mood of moods) {
      const input: CreateDailyTrackingInput = {
        user_id: `test-user-${mood}`,
        date: new Date('2024-01-21'),
        mood: mood
      };

      const result = await createDailyTracking(input);
      expect(result.mood).toEqual(mood);
    }
  });
});
