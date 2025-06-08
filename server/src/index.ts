
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCycleEntryInputSchema,
  updateCycleEntryInputSchema,
  deleteCycleEntryInputSchema,
  createDailyTrackingInputSchema,
  updateUserPreferencesInputSchema,
  getUserDataInputSchema,
  getCurrentPhaseInputSchema,
  generateIcsCalendarInputSchema
} from './schema';

// Import handlers
import { createCycleEntry } from './handlers/create_cycle_entry';
import { updateCycleEntry } from './handlers/update_cycle_entry';
import { deleteCycleEntry } from './handlers/delete_cycle_entry';
import { getCycleEntries } from './handlers/get_cycle_entries';
import { createDailyTracking } from './handlers/create_daily_tracking';
import { getDailyTracking } from './handlers/get_daily_tracking';
import { updateUserPreferences } from './handlers/update_user_preferences';
import { getUserPreferences } from './handlers/get_user_preferences';
import { getCurrentPhase } from './handlers/get_current_phase';
import { getUpcomingNotifications } from './handlers/get_upcoming_notifications';
import { generateCyclePredictions } from './handlers/generate_cycle_predictions';
import { generateIcsCalendar } from './handlers/generate_ics_calendar';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Cycle entry operations
  createCycleEntry: publicProcedure
    .input(createCycleEntryInputSchema)
    .mutation(({ input }) => createCycleEntry(input)),

  updateCycleEntry: publicProcedure
    .input(updateCycleEntryInputSchema)
    .mutation(({ input }) => updateCycleEntry(input)),

  deleteCycleEntry: publicProcedure
    .input(deleteCycleEntryInputSchema)
    .mutation(({ input }) => deleteCycleEntry(input)),

  getCycleEntries: publicProcedure
    .input(getUserDataInputSchema)
    .query(({ input }) => getCycleEntries(input)),

  // Daily tracking operations
  createDailyTracking: publicProcedure
    .input(createDailyTrackingInputSchema)
    .mutation(({ input }) => createDailyTracking(input)),

  getDailyTracking: publicProcedure
    .input(getUserDataInputSchema)
    .query(({ input }) => getDailyTracking(input)),

  // User preferences
  updateUserPreferences: publicProcedure
    .input(updateUserPreferencesInputSchema)
    .mutation(({ input }) => updateUserPreferences(input)),

  getUserPreferences: publicProcedure
    .input(getUserDataInputSchema)
    .query(({ input }) => getUserPreferences(input)),

  // Cycle analysis and predictions
  getCurrentPhase: publicProcedure
    .input(getCurrentPhaseInputSchema)
    .query(({ input }) => getCurrentPhase(input)),

  generateCyclePredictions: publicProcedure
    .input(getUserDataInputSchema)
    .query(({ input }) => generateCyclePredictions(input)),

  // Notifications
  getUpcomingNotifications: publicProcedure
    .input(getUserDataInputSchema)
    .query(({ input }) => getUpcomingNotifications(input)),

  // Calendar export
  generateIcsCalendar: publicProcedure
    .input(generateIcsCalendarInputSchema)
    .query(({ input }) => generateIcsCalendar(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
