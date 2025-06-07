
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userPreferencesTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { getUserPreferences } from '../handlers/get_user_preferences';
import { eq } from 'drizzle-orm';

const testInput: GetUserDataInput = {
  user_id: 'test-user-123'
};

describe('getUserPreferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return existing user preferences', async () => {
    // Create existing preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testInput.user_id,
        average_cycle_length: 30,
        average_period_length: 6,
        reminder_days_before: 3,
        notification_enabled: false
      })
      .execute();

    const result = await getUserPreferences(testInput);

    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.average_cycle_length).toEqual(30);
    expect(result.average_period_length).toEqual(6);
    expect(result.reminder_days_before).toEqual(3);
    expect(result.notification_enabled).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create default preferences if none exist', async () => {
    const result = await getUserPreferences(testInput);

    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.average_cycle_length).toEqual(28);
    expect(result.average_period_length).toEqual(5);
    expect(result.reminder_days_before).toEqual(2);
    expect(result.notification_enabled).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save default preferences to database', async () => {
    const result = await getUserPreferences(testInput);

    const savedPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, testInput.user_id))
      .execute();

    expect(savedPreferences).toHaveLength(1);
    expect(savedPreferences[0].user_id).toEqual(testInput.user_id);
    expect(savedPreferences[0].average_cycle_length).toEqual(28);
    expect(savedPreferences[0].average_period_length).toEqual(5);
    expect(savedPreferences[0].reminder_days_before).toEqual(2);
    expect(savedPreferences[0].notification_enabled).toEqual(true);
    expect(savedPreferences[0].id).toEqual(result.id);
  });

  it('should not create duplicate preferences', async () => {
    // Call twice for the same user
    await getUserPreferences(testInput);
    await getUserPreferences(testInput);

    const allPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, testInput.user_id))
      .execute();

    expect(allPreferences).toHaveLength(1);
  });
});
