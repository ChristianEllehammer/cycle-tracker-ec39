
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
  const [isLoading, setIsLoading] = useState(false); // Start with false to show UI immediately
  const [hasError, setHasError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // Load data one by one to better handle errors
      let phaseData = null;
      let cycleData: CycleEntry[] = [];
      let preferencesData = null;
      let notificationData: Notification[] = [];

      try {
        phaseData = await trpc.getCurrentPhase.query({ user_id: userId });
      } catch (error) {
        console.error('Failed to load current phase:', error);
      }

      try {
        cycleData = await trpc.getCycleEntries.query({ user_id: userId });
      } catch (error) {
        console.error('Failed to load cycle entries:', error);
      }

      try {
        preferencesData = await trpc.getUserPreferences.query({ user_id: userId });
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }

      try {
        notificationData = await trpc.getUpcomingNotifications.query({ user_id: userId });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }

      setCurrentPhase(phaseData);
      setCycleEntries(cycleData);
      setUserPreferences(preferencesData);
      setNotifications(notificationData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Load data in the background but don't block UI
    const loadTimeout = setTimeout(() => {
      loadData();
    }, 100); // Small delay to ensure UI renders first
    
    return () => clearTimeout(loadTimeout);
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

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'Menstruations';
      case 'follicular': return 'Follikel';
      case 'ovulation': return 'Ægløsning';
      case 'luteal': return 'Luteal';
      default: return phase;
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Loading Banner */}
        {isLoading && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-blue-800">Indlæser data...</span>
          </div>
        )}

        {/* Error Banner */}
        {hasError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-800">Kunne ikke indlæse alle data</span>
            <button 
              onClick={() => {
                setHasError(false);
                loadData();
              }}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Prøv igen
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🌸 Cyklus Harmoni</h1>
          <p className="text-gray-600">Din personlige menstruationscyklus-følgesvend</p>
        </div>

        {/* Current Phase Overview */}
        {currentPhase && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl">{getPhaseEmoji(currentPhase.phase)}</div>
                <div>
                  <Badge className={`text-lg px-4 py-2 font-semibold capitalize ${getPhaseColor(currentPhase.phase)}`}>
                    {getPhaseName(currentPhase.phase)} fase
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{currentPhase.day_in_cycle}</p>
                    <p className="text-sm text-gray-600">Dag i cyklus</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {currentPhase.days_until_next_period || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Dage til menstruation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {currentPhase.is_fertile_window ? '🌟' : '💤'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentPhase.is_fertile_window ? 'Frugtbar periode' : 'Ikke frugtbar'}
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
              Daglig log
            </TabsTrigger>
            <TabsTrigger value="cycle" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cyklussporing
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Indsigter
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Påmindelser
              {notifications.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Indstillinger
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
                    Cyklus indsigter
                  </CardTitle>
                  <CardDescription>
                    Spor mønstre og tendenser i din menstruationscyklus
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
                          <p className="text-sm text-gray-600">Gns. cykluslængde</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {Math.round(cycleEntries
                              .filter((entry: CycleEntry) => entry.period_length)
                              .reduce((sum: number, entry: CycleEntry) => sum + (entry.period_length || 0), 0) / 
                              cycleEntries.filter((entry: CycleEntry) => entry.period_length).length) || 0}
                          </p>
                          <p className="text-sm text-gray-600">Gns. menstruationslængde</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{cycleEntries.length}</p>
                          <p className="text-sm text-gray-600">Cyklusser sporet</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800">Seneste cyklusser</h4>
                        {cycleEntries.slice(0, 5).map((entry: CycleEntry) => (
                          <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">
                                {entry.start_date.toLocaleDateString()} - {entry.end_date?.toLocaleDateString() || 'Igangværende'}
                              </p>
                              {entry.notes && (
                                <p className="text-sm text-gray-600">{entry.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              {entry.cycle_length && <p>Cyklus: {entry.cycle_length} dage</p>}
                              {entry.period_length && <p>Menstruation: {entry.period_length} dage</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Begynd at spore dine cyklusser for at se indsigter her! 📊
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
