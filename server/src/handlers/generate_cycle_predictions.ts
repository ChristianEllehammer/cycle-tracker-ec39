
import { db } from '../db';
import { cycleEntriesTable, userPreferencesTable } from '../db/schema';
import { type GetUserDataInput } from '../schema';
import { eq, desc } from 'drizzle-orm';

export interface CyclePrediction {
  next_period_date: Date;
  next_ovulation_date: Date;
  fertile_window_start: Date;
  fertile_window_end: Date;
}

export const generateCyclePredictions = async (input: GetUserDataInput): Promise<CyclePrediction> => {
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

    return {
      next_period_date: nextPeriodDate,
      next_ovulation_date: nextOvulationDate,
      fertile_window_start: fertileWindowStart,
      fertile_window_end: fertileWindowEnd
    };
  } catch (error) {
    console.error('Cycle prediction generation failed:', error);
    throw error;
  }
};
