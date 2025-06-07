
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { UpdateUserPreferencesInput, UserPreferences } from '../../../server/src/schema';

interface UserSettingsProps {
  userId: string;
  userPreferences: UserPreferences | null;
  onUpdate: () => void;
}

export function UserSettings({ userId, userPreferences, onUpdate }: UserSettingsProps) {
  const [formData, setFormData] = useState<UpdateUserPreferencesInput>({
    user_id: userId,
    average_cycle_length: 28,
    average_period_length: 5,
    reminder_days_before: 2,
    notification_enabled: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userPreferences) {
      setFormData({
        user_id: userId,
        average_cycle_length: userPreferences.average_cycle_length,
        average_period_length: userPreferences.average_period_length,
        reminder_days_before: userPreferences.reminder_days_before,
        notification_enabled: userPreferences.notification_enabled
      });
    }
  }, [userPreferences, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateUserPreferences.mutate(formData);
      onUpdate();
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Cycle Preferences
        </CardTitle>
        <CardDescription>
          Customize your cycle tracking and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-length">Average Cycle Length (days)</Label>
              <Input
                id="cycle-length"
                type="number"
                min="21"
                max="35"
                value={formData.average_cycle_length || 28}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateUserPreferencesInput) => ({
                    ...prev,
                    average_cycle_length: parseInt(e.target.value) || 28
                  }))
                }
                className="bg-white"
              />
              <p className="text-xs text-gray-500">Typical range: 21-35 days</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-length">Average Period Length (days)</Label>
              <Input
                id="period-length"
                type="number"
                min="3"
                max="10"
                value={formData.average_period_length || 5}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateUserPreferencesInput) => ({
                    ...prev,
                    average_period_length: parseInt(e.target.value) || 5
                  }))
                }
                className="bg-white"
              />
              <p className="text-xs text-gray-500">Typical range: 3-10 days</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-days">Reminder Days Before Period</Label>
            <Input
              id="reminder-days"
              type="number"
              min="0"
              max="7"
              value={formData.reminder_days_before || 2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdateUserPreferencesInput) => ({
                  ...prev,
                  reminder_days_before: parseInt(e.target.value) || 2
                }))
              }
              className="bg-white"
            />
            <p className="text-xs text-gray-500">How many days before your period would you like to be reminded?</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive reminders for period start, ovulation, and fertile windows
              </p>
            </div>
            <Switch
              id="notifications"
              checked={formData.notification_enabled || false}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev: UpdateUserPreferencesInput) => ({
                  ...prev,
                  notification_enabled: checked
                }))
              }
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📊 Prediction Accuracy</h4>
            <p className="text-sm text-blue-800">
              The more cycles you track, the more accurate your predictions will become. 
              We use your historical data to provide personalized insights and notifications.
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
