
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable, userPreferencesTable } from '../db/schema';
import { type GetCurrentPhaseInput } from '../schema';
import { getCurrentPhase } from '../handlers/get_current_phase';

const testUserId = 'test-user-123';

const testInput: GetCurrentPhaseInput = {
  user_id: testUserId
};

describe('getCurrentPhase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default phase info when no cycle data exists', async () => {
    const result = await getCurrentPhase(testInput);

    expect(result.phase).toBeDefined();
    expect(['menstrual', 'follicular', 'ovulation', 'luteal']).toContain(result.phase);
    expect(result.day_in_cycle).toBeGreaterThan(0);
    expect(result.days_until_next_period).toBeGreaterThanOrEqual(0);
    expect(typeof result.is_fertile_window).toBe('boolean');
  });

  it('should calculate phase based on recent cycle entry', async () => {
    // Create user preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testUserId,
        average_cycle_length: 28,
        average_period_length: 5,
        reminder_days_before: 2,
        notification_enabled: true
      })
      .execute();

    // Create a cycle entry starting 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    await db.insert(cycleEntriesTable)
      .values({
        user_id: testUserId,
        start_date: tenDaysAgo.toISOString().split('T')[0],
        cycle_length: 28,
        period_length: 5
      })
      .execute();

    const result = await getCurrentPhase(testInput);

    expect(result.phase).toBe('follicular'); // Day 11 should be follicular
    expect(result.day_in_cycle).toBe(11);
    expect(result.days_until_next_period).toBe(18);
    expect(result.is_fertile_window).toBe(false);
  });

  it('should identify menstrual phase correctly', async () => {
    // Create a cycle entry starting 2 days ago (should be in menstrual phase)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    await db.insert(cycleEntriesTable)
      .values({
        user_id: testUserId,
        start_date: twoDaysAgo.toISOString().split('T')[0],
        cycle_length: 28,
        period_length: 5
      })
      .execute();

    const result = await getCurrentPhase(testInput);

    expect(result.phase).toBe('menstrual');
    expect(result.day_in_cycle).toBe(3);
    expect(result.is_fertile_window).toBe(false);
  });

  it('should identify fertile window correctly', async () => {
    // Create a cycle entry starting 14 days ago (should be ovulation/fertile)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    await db.insert(cycleEntriesTable)
      .values({
        user_id: testUserId,
        start_date: fourteenDaysAgo.toISOString().split('T')[0],
        cycle_length: 28,
        period_length: 5
      })
      .execute();

    const result = await getCurrentPhase(testInput);

    expect(result.phase).toBe('ovulation');
    expect(result.day_in_cycle).toBe(15);
    expect(result.is_fertile_window).toBe(true);
    expect(result.days_until_next_period).toBe(14);
  });

  it('should use user preferences for calculations', async () => {
    // Create custom user preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testUserId,
        average_cycle_length: 30,
        average_period_length: 7,
        reminder_days_before: 3,
        notification_enabled: true
      })
      .execute();

    // Create a cycle entry starting 6 days ago
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    
    await db.insert(cycleEntriesTable)
      .values({
        user_id: testUserId,
        start_date: sixDaysAgo.toISOString().split('T')[0],
        cycle_length: 30
      })
      .execute();

    const result = await getCurrentPhase(testInput);

    expect(result.phase).toBe('menstrual'); // Day 7 should still be menstrual with 7-day period
    expect(result.day_in_cycle).toBe(7);
    expect(result.days_until_next_period).toBe(24);
  });

  it('should handle luteal phase correctly', async () => {
    // Create a cycle entry starting 20 days ago (should be luteal phase)
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    
    await db.insert(cycleEntriesTable)
      .values({
        user_id: testUserId,
        start_date: twentyDaysAgo.toISOString().split('T')[0],
        cycle_length: 28,
        period_length: 5
      })
      .execute();

    const result = await getCurrentPhase(testInput);

    expect(result.phase).toBe('luteal');
    expect(result.day_in_cycle).toBe(21);
    expect(result.is_fertile_window).toBe(false);
    expect(result.days_until_next_period).toBe(8);
  });
});
