
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Heart, Settings, TrendingUp } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CycleTracker } from '@/components/CycleTracker';
import { DailyLogger } from '@/components/DailyLogger';
import { UserSettings } from '@/components/UserSettings';
import { NotificationCenter } from '@/components/NotificationCenter';
import type { CyclePhaseInfo, CycleEntry, UserPreferences, Notification } from '../../server/src/schema';

function App() {
  const userId = 'user123';
  
  const [currentPhase, setCurrentPhase] = useState<CyclePhaseInfo | null>(null);
  const [cycleEntries, setCycleEntries] = useState<CycleEntry[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [phaseData, cycleData, preferencesData, notificationData] = await Promise.all([
        trpc.getCurrentPhase.query({ user_id: userId }),
        trpc.getCycleEntries.query({ user_id: userId }),
        trpc.getUserPreferences.query({ user_id: userId }),
        trpc.getUpcomingNotifications.query({ user_id: userId })
      ]);

      setCurrentPhase(phaseData);
      setCycleEntries(cycleData);
      setUserPreferences(preferencesData);
      setNotifications(notificationData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'bg-red-100 text-red-800 border-red-200';
      case 'follicular': return 'bg-green-100 text-green-800 border-green-200';
      case 'ovulation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'luteal': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseEmoji = (phase: string) => {
    switch (phase) {
      case 'menstrual': return '🩸';
      case 'follicular': return '🌱';
      case 'ovulation': return '🥚';
      case 'luteal': return '🌙';
      default: return '💫';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-300 border-t-pink-600 mx-auto"></div>
          <p className="text-gray-600">Loading your cycle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🌸 Cycle Harmony</h1>
          <p className="text-gray-600">Your personal menstrual cycle companion</p>
        </div>

        {/* Current Phase Overview */}
        {currentPhase && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl">{getPhaseEmoji(currentPhase.phase)}</div>
                <div>
                  <Badge className={`text-lg px-4 py-2 font-semibold capitalize ${getPhaseColor(currentPhase.phase)}`}>
                    {currentPhase.phase} Phase
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{currentPhase.day_in_cycle}</p>
                    <p className="text-sm text-gray-600">Day of Cycle</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {currentPhase.days_until_next_period || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Days Until Period</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {currentPhase.is_fertile_window ? '🌟' : '💤'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentPhase.is_fertile_window ? 'Fertile Window' : 'Not Fertile'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Daily Log
            </TabsTrigger>
            <TabsTrigger value="cycle" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cycle Tracker
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {notifications.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <DailyLogger userId={userId} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="cycle">
            <CycleTracker userId={userId} cycleEntries={cycleEntries} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Cycle Insights
                  </CardTitle>
                  <CardDescription>
                    Track patterns and trends in your menstrual cycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cycleEntries.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-pink-50 rounded-lg">
                          <p className="text-2xl font-bold text-pink-600">
                            {Math.round(cycleEntries
                              .filter((entry: CycleEntry) => entry.cycle_length)
                              .reduce((sum: number, entry: CycleEntry) => sum + (entry.cycle_length || 0), 0) / 
                              cycleEntries.filter((entry: CycleEntry) => entry.cycle_length).length) || 0}
                          </p>
                          <p className="text-sm text-gray-600">Avg Cycle Length</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {Math.round(cycleEntries
                              .filter((entry: CycleEntry) => entry.period_length)
                              .reduce((sum: number, entry: CycleEntry) => sum + (entry.period_length || 0), 0) / 
                              cycleEntries.filter((entry: CycleEntry) => entry.period_length).length) || 0}
                          </p>
                          <p className="text-sm text-gray-600">Avg Period Length</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{cycleEntries.length}</p>
                          <p className="text-sm text-gray-600">Cycles Tracked</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800">Recent Cycles</h4>
                        {cycleEntries.slice(0, 5).map((entry: CycleEntry) => (
                          <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">
                                {entry.start_date.toLocaleDateString()} - {entry.end_date?.toLocaleDateString() || 'Ongoing'}
                              </p>
                              {entry.notes && (
                                <p className="text-sm text-gray-600">{entry.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              {entry.cycle_length && <p>Cycle: {entry.cycle_length} days</p>}
                              {entry.period_length && <p>Period: {entry.period_length} days</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Start tracking your cycles to see insights here! 📊
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter notifications={notifications} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="settings">
            <UserSettings 
              userId={userId} 
              userPreferences={userPreferences} 
              onUpdate={loadData} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
