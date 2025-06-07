
import { db } from '../db';
import { cycleEntriesTable, userPreferencesTable } from '../db/schema';
import { type GetCurrentPhaseInput, type CyclePhaseInfo, type CyclePhase } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getCurrentPhase = async (input: GetCurrentPhaseInput): Promise<CyclePhaseInfo> => {
  try {
    // Get user preferences for cycle calculations
    const userPrefs = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, input.user_id))
      .execute();

    // Get the most recent cycle entry for the user
    const recentCycles = await db.select()
      .from(cycleEntriesTable)
      .where(eq(cycleEntriesTable.user_id, input.user_id))
      .orderBy(desc(cycleEntriesTable.start_date))
      .limit(1)
      .execute();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Use default preferences if none exist
    const avgCycleLength = userPrefs[0]?.average_cycle_length ?? 28;
    const avgPeriodLength = userPrefs[0]?.average_period_length ?? 5;

    let dayInCycle: number;
    let phase: CyclePhase;
    let daysUntilNextPeriod: number | null;
    let isFertileWindow: boolean;

    if (recentCycles.length === 0) {
      // No cycle data - assume mid-cycle based on averages
      dayInCycle = Math.floor(avgCycleLength / 2);
      phase = 'follicular';
      daysUntilNextPeriod = Math.floor(avgCycleLength / 2);
      isFertileWindow = false;
    } else {
      const lastCycle = recentCycles[0];
      const startDate = new Date(lastCycle.start_date);
      startDate.setHours(0, 0, 0, 0);

      // Calculate days since last period started
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Use actual cycle length if available, otherwise use average
      const cycleLength = lastCycle.cycle_length ?? avgCycleLength;
      
      // Calculate current day in cycle (1-based)
      dayInCycle = (daysSinceStart % cycleLength) + 1;
      
      // Calculate days until next period
      daysUntilNextPeriod = cycleLength - (daysSinceStart % cycleLength);
      if (daysUntilNextPeriod === cycleLength) {
        daysUntilNextPeriod = 0; // Today is period start day
      }

      // Determine phase based on day in cycle
      if (dayInCycle <= avgPeriodLength) {
        phase = 'menstrual';
      } else if (dayInCycle <= 13) {
        phase = 'follicular';
      } else if (dayInCycle <= 16) {
        phase = 'ovulation';
      } else {
        phase = 'luteal';
      }

      // Determine fertile window (typically days 12-16 of cycle)
      isFertileWindow = dayInCycle >= 12 && dayInCycle <= 16;
    }

    return {
      phase,
      day_in_cycle: dayInCycle,
      days_until_next_period: daysUntilNextPeriod,
      is_fertile_window: isFertileWindow
    };
  } catch (error) {
    console.error('Get current phase failed:', error);
    throw error;
  }
};
