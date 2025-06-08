import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cycleEntriesTable, userPreferencesTable } from '../db/schema';
import { type GetUserDataInput, type CreateCycleEntryInput, type UpdateUserPreferencesInput } from '../schema';
import { generateIcsCalendar } from '../handlers/generate_ics_calendar';
import { createCycleEntry } from '../handlers/create_cycle_entry';
import { updateUserPreferences } from '../handlers/update_user_preferences';

const testUserId = 'test_user_ics';

describe('generateIcsCalendar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate valid iCalendar string with default values', async () => {
    const input: GetUserDataInput = {
      user_id: testUserId
    };

    const icsContent = await generateIcsCalendar(input);

    // Verify basic iCalendar structure
    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('END:VCALENDAR');
    expect(icsContent).toContain('VERSION:2.0');
    expect(icsContent).toContain('PRODID:-//Menstrual Cycle Tracker//NONSGML v1.0//EN');

    // Verify events are included
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain('END:VEVENT');
    expect(icsContent).toContain('Menstruationsstart');
    expect(icsContent).toContain('Ægløsning');
    expect(icsContent).toContain('Frugtbar periode');

    // Verify date format (YYYYMMDD)
    const datePattern = /DTSTART;VALUE=DATE:\d{8}/;
    expect(icsContent).toMatch(datePattern);
  });

  it('should use user preferences for cycle predictions', async () => {
    // Create user preferences
    const preferencesInput: UpdateUserPreferencesInput = {
      user_id: testUserId,
      average_cycle_length: 30,
      average_period_length: 6
    };

    await updateUserPreferences(preferencesInput);

    // Create a cycle entry
    const cycleInput: CreateCycleEntryInput = {
      user_id: testUserId,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-06')
    };

    await createCycleEntry(cycleInput);

    const input: GetUserDataInput = {
      user_id: testUserId
    };

    const icsContent = await generateIcsCalendar(input);

    // Verify the content contains expected events
    expect(icsContent).toContain('Menstruationsstart');
    expect(icsContent).toContain('Ægløsning');
    expect(icsContent).toContain('Frugtbar periode');

    // Verify UIDs are properly formatted
    expect(icsContent).toContain(`UID:${testUserId}-period-`);
    expect(icsContent).toContain(`UID:${testUserId}-ovulation-`);
    expect(icsContent).toContain(`UID:${testUserId}-fertile-start-`);
  });

  it('should include proper event categories', async () => {
    const input: GetUserDataInput = {
      user_id: testUserId
    };

    const icsContent = await generateIcsCalendar(input);

    // Verify categories are included
    expect(icsContent).toContain('CATEGORIES:MENSTRUATION');
    expect(icsContent).toContain('CATEGORIES:OVULATION');
    expect(icsContent).toContain('CATEGORIES:FERTILE');
  });

  it('should include proper DTSTAMP for all events', async () => {
    const input: GetUserDataInput = {
      user_id: testUserId
    };

    const icsContent = await generateIcsCalendar(input);

    // Verify DTSTAMP format (YYYYMMDDTHHMMSSZ)
    const timestampPattern = /DTSTAMP:\d{8}T\d{6}Z/;
    const timestamps = icsContent.match(new RegExp(timestampPattern, 'g'));
    
    // Should have 3 events, so 3 timestamps
    expect(timestamps).toBeTruthy();
    expect(timestamps!.length).toBe(3);
  });
});