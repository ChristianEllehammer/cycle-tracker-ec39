
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userPreferencesTable } from '../db/schema';
import { type UpdateUserPreferencesInput } from '../schema';
import { updateUserPreferences } from '../handlers/update_user_preferences';
import { eq } from 'drizzle-orm';

describe('updateUserPreferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create user preferences when they do not exist', async () => {
    const input: UpdateUserPreferencesInput = {
      user_id: 'user123',
      average_cycle_length: 30,
      average_period_length: 6,
      reminder_days_before: 3,
      notification_enabled: false
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual('user123');
    expect(result.average_cycle_length).toEqual(30);
    expect(result.average_period_length).toEqual(6);
    expect(result.reminder_days_before).toEqual(3);
    expect(result.notification_enabled).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing user preferences', async () => {
    // Create initial preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: 'user123',
        average_cycle_length: 28,
        average_period_length: 5,
        reminder_days_before: 2,
        notification_enabled: true
      })
      .execute();

    const input: UpdateUserPreferencesInput = {
      user_id: 'user123',
      average_cycle_length: 32,
      notification_enabled: false
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual('user123');
    expect(result.average_cycle_length).toEqual(32);
    expect(result.average_period_length).toEqual(5); // Should remain unchanged
    expect(result.reminder_days_before).toEqual(2); // Should remain unchanged
    expect(result.notification_enabled).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated preferences to database', async () => {
    // Create initial preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: 'user456',
        average_cycle_length: 28,
        average_period_length: 5,
        reminder_days_before: 2,
        notification_enabled: true
      })
      .execute();

    const input: UpdateUserPreferencesInput = {
      user_id: 'user456',
      average_period_length: 7,
      reminder_days_before: 4
    };

    await updateUserPreferences(input);

    // Verify in database
    const preferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, 'user456'))
      .execute();

    expect(preferences).toHaveLength(1);
    expect(preferences[0].average_cycle_length).toEqual(28); // Unchanged
    expect(preferences[0].average_period_length).toEqual(7); // Updated
    expect(preferences[0].reminder_days_before).toEqual(4); // Updated
    expect(preferences[0].notification_enabled).toEqual(true); // Unchanged
    expect(preferences[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle partial updates correctly', async () => {
    // Create initial preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: 'user789',
        average_cycle_length: 30,
        average_period_length: 6,
        reminder_days_before: 3,
        notification_enabled: false
      })
      .execute();

    const input: UpdateUserPreferencesInput = {
      user_id: 'user789',
      notification_enabled: true
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual('user789');
    expect(result.average_cycle_length).toEqual(30); // Unchanged
    expect(result.average_period_length).toEqual(6); // Unchanged
    expect(result.reminder_days_before).toEqual(3); // Unchanged
    expect(result.notification_enabled).toEqual(true); // Updated
  });

  it('should handle creating preferences with partial input', async () => {
    const input: UpdateUserPreferencesInput = {
      user_id: 'new_user',
      average_cycle_length: 26
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual('new_user');
    expect(result.average_cycle_length).toEqual(26);
    // Should use defaults for other fields
    expect(result.average_period_length).toEqual(5);
    expect(result.reminder_days_before).toEqual(2);
    expect(result.notification_enabled).toEqual(true);
  });
});
