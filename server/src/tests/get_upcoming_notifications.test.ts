
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { getUpcomingNotifications } from '../handlers/get_upcoming_notifications';

const testUserId = 'user123';
const testInput: GetUserDataInput = {
  user_id: testUserId
};

describe('getUpcomingNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return upcoming notifications for user', async () => {
    // Create future notification
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db.insert(notificationsTable)
      .values({
        user_id: testUserId,
        type: 'period_start',
        title: 'Period Starting Soon',
        message: 'Your period is expected to start tomorrow',
        scheduled_date: tomorrow,
        is_sent: false
      })
      .execute();

    const result = await getUpcomingNotifications(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].type).toEqual('period_start');
    expect(result[0].title).toEqual('Period Starting Soon');
    expect(result[0].is_sent).toBe(false);
    expect(result[0].scheduled_date).toBeInstanceOf(Date);
  });

  it('should not return past notifications', async () => {
    // Create past notification
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await db.insert(notificationsTable)
      .values({
        user_id: testUserId,
        type: 'ovulation',
        title: 'Ovulation Window',
        message: 'You are in your fertile window',
        scheduled_date: yesterday,
        is_sent: false
      })
      .execute();

    const result = await getUpcomingNotifications(testInput);

    expect(result).toHaveLength(0);
  });

  it('should not return already sent notifications', async () => {
    // Create future notification that's already sent
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await db.insert(notificationsTable)
      .values({
        user_id: testUserId,
        type: 'pms',
        title: 'PMS Symptoms',
        message: 'PMS symptoms may begin soon',
        scheduled_date: tomorrow,
        is_sent: true
      })
      .execute();

    const result = await getUpcomingNotifications(testInput);

    expect(result).toHaveLength(0);
  });

  it('should return notifications for correct user only', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Create notification for different user
    await db.insert(notificationsTable)
      .values({
        user_id: 'different_user',
        type: 'fertile_window',
        title: 'Fertile Window',
        message: 'You are entering your fertile window',
        scheduled_date: tomorrow,
        is_sent: false
      })
      .execute();

    // Create notification for test user
    await db.insert(notificationsTable)
      .values({
        user_id: testUserId,
        type: 'period_start',
        title: 'Period Starting',
        message: 'Your period starts today',
        scheduled_date: tomorrow,
        is_sent: false
      })
      .execute();

    const result = await getUpcomingNotifications(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].type).toEqual('period_start');
  });

  it('should return notifications ordered by scheduled date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Insert in reverse chronological order
    await db.insert(notificationsTable)
      .values([
        {
          user_id: testUserId,
          type: 'ovulation',
          title: 'Later Notification',
          message: 'This comes later',
          scheduled_date: nextWeek,
          is_sent: false
        },
        {
          user_id: testUserId,
          type: 'period_start',
          title: 'Earlier Notification',
          message: 'This comes first',
          scheduled_date: tomorrow,
          is_sent: false
        }
      ])
      .execute();

    const result = await getUpcomingNotifications(testInput);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Earlier Notification');
    expect(result[1].title).toEqual('Later Notification');
    expect(result[0].scheduled_date < result[1].scheduled_date).toBe(true);
  });

  it('should return empty array when no upcoming notifications exist', async () => {
    const result = await getUpcomingNotifications(testInput);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
