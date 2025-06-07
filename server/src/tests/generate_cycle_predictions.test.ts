
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable, userPreferencesTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { generateCyclePredictions } from '../handlers/generate_cycle_predictions';

const testInput: GetUserDataInput = {
  user_id: 'test-user-123'
};

describe('generateCyclePredictions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate predictions with default values when no data exists', async () => {
    const result = await generateCyclePredictions(testInput);

    expect(result.next_period_date).toBeInstanceOf(Date);
    expect(result.next_ovulation_date).toBeInstanceOf(Date);
    expect(result.fertile_window_start).toBeInstanceOf(Date);
    expect(result.fertile_window_end).toBeInstanceOf(Date);

    // Verify basic date relationships
    expect(result.next_ovulation_date.getTime()).toBeLessThan(result.next_period_date.getTime());
    expect(result.fertile_window_start.getTime()).toBeLessThan(result.fertile_window_end.getTime());
    expect(result.fertile_window_start.getTime()).toBeLessThan(result.next_ovulation_date.getTime());
  });

  it('should use user preferences for cycle length', async () => {
    // Create user preferences with custom cycle length
    await db.insert(userPreferencesTable)
      .values({
        user_id: testInput.user_id,
        average_cycle_length: 30,
        average_period_length: 5,
        reminder_days_before: 2,
        notification_enabled: true
      })
      .execute();

    // Create a cycle entry from 15 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);
    
    await db.insert(cycleEntriesTable)
      .values({
        user_id: testInput.user_id,
        start_date: pastDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        notes: null
      })
      .execute();

    const result = await generateCyclePredictions(testInput);

    // Next period should be 30 days from the last period start (15 days ago)
    // So 15 days from now
    const expectedNextPeriod = new Date(pastDate);
    expectedNextPeriod.setDate(expectedNextPeriod.getDate() + 30);

    expect(result.next_period_date.toDateString()).toEqual(expectedNextPeriod.toDateString());

    // Ovulation should be 14 days before next period
    const expectedOvulation = new Date(expectedNextPeriod);
    expectedOvulation.setDate(expectedOvulation.getDate() - 14);
    expect(result.next_ovulation_date.toDateString()).toEqual(expectedOvulation.toDateString());
  });

  it('should calculate fertile window correctly', async () => {
    // Create user preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testInput.user_id,
        average_cycle_length: 28,
        average_period_length: 5,
        reminder_days_before: 2,
        notification_enabled: true
      })
      .execute();

    const result = await generateCyclePredictions(testInput);

    // Fertile window should be 5 days before ovulation to 1 day after
    const expectedStart = new Date(result.next_ovulation_date);
    expectedStart.setDate(expectedStart.getDate() - 5);

    const expectedEnd = new Date(result.next_ovulation_date);
    expectedEnd.setDate(expectedEnd.getDate() + 1);

    expect(result.fertile_window_start.toDateString()).toEqual(expectedStart.toDateString());
    expect(result.fertile_window_end.toDateString()).toEqual(expectedEnd.toDateString());

    // Verify fertile window is 6 days long (5 days before + ovulation day + 1 day after)
    const windowDays = Math.ceil((result.fertile_window_end.getTime() - result.fertile_window_start.getTime()) / (1000 * 60 * 60 * 24));
    expect(windowDays).toEqual(6);
  });

  it('should use most recent cycle entry', async () => {
    // Create multiple cycle entries
    const olderDate = new Date();
    olderDate.setDate(olderDate.getDate() - 60);

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);

    await db.insert(cycleEntriesTable)
      .values([
        {
          user_id: testInput.user_id,
          start_date: olderDate.toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: testInput.user_id,
          start_date: recentDate.toISOString().split('T')[0],
          notes: null
        }
      ])
      .execute();

    const result = await generateCyclePredictions(testInput);

    // Should use the most recent cycle (10 days ago) as base
    const expectedNextPeriod = new Date(recentDate);
    expectedNextPeriod.setDate(expectedNextPeriod.getDate() + 28); // Default cycle length

    expect(result.next_period_date.toDateString()).toEqual(expectedNextPeriod.toDateString());
  });
});
