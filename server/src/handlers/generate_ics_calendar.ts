import { db } from '../db';
import { cycleEntriesTable, userPreferencesTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const generateIcsCalendar = async (input: GetUserDataInput): Promise<string> => {
  try {
    // Get user preferences for average cycle length
    const userPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, input.user_id))
      .execute();

    // Get most recent cycle entry to determine last period start
    const recentCycles = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.user_id, input.user_id))
      .orderBy(desc(cycleEntriesTable.start_date))
      .limit(1)
      .execute();

    // Use default values if no user preferences or cycle history
    const averageCycleLength = userPreferences[0]?.average_cycle_length || 28;
    const lastPeriodStart = recentCycles[0]?.start_date ? new Date(recentCycles[0].start_date) : new Date();

    // Calculate predictions based on average cycle length
    const nextPeriodDate = new Date(lastPeriodStart);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycleLength);

    // Ovulation typically occurs 14 days before next period
    const nextOvulationDate = new Date(nextPeriodDate);
    nextOvulationDate.setDate(nextOvulationDate.getDate() - 14);

    // Fertile window is typically 5 days before ovulation to 1 day after
    const fertileWindowStart = new Date(nextOvulationDate);
    fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);

    const fertileWindowEnd = new Date(nextOvulationDate);
    fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

    // Format date as YYYYMMDD for iCalendar
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    // Generate current timestamp for DTSTAMP
    const now = new Date();
    const timestamp = formatDate(now) + 'T' + 
      String(now.getHours()).padStart(2, '0') + 
      String(now.getMinutes()).padStart(2, '0') + 
      String(now.getSeconds()).padStart(2, '0') + 'Z';

    // Build iCalendar content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Menstrual Cycle Tracker//NONSGML v1.0//EN',
      'CALSCALE:GREGORIAN',
      '',
      'BEGIN:VEVENT',
      `UID:${input.user_id}-period-${formatDate(nextPeriodDate)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${formatDate(nextPeriodDate)}`,
      'SUMMARY:Menstruationsstart',
      'DESCRIPTION:Forventet start på menstruation baseret på din cyklussporing',
      'CATEGORIES:MENSTRUATION',
      'END:VEVENT',
      '',
      'BEGIN:VEVENT',
      `UID:${input.user_id}-ovulation-${formatDate(nextOvulationDate)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${formatDate(nextOvulationDate)}`,
      'SUMMARY:Ægløsning',
      'DESCRIPTION:Forventet ægløsning - mest frugtbare dag',
      'CATEGORIES:OVULATION',
      'END:VEVENT',
      '',
      'BEGIN:VEVENT',
      `UID:${input.user_id}-fertile-start-${formatDate(fertileWindowStart)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${formatDate(fertileWindowStart)}`,
      `DTEND;VALUE=DATE:${formatDate(fertileWindowEnd)}`,
      'SUMMARY:Frugtbar periode',
      'DESCRIPTION:Frugtbar periode - øget chance for graviditet',
      'CATEGORIES:FERTILE',
      'END:VEVENT',
      '',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  } catch (error) {
    console.error('ICS calendar generation failed:', error);
    throw error;
  }
};