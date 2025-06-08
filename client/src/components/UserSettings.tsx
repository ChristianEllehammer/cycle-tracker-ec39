
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
          Cyklus præferencer
        </CardTitle>
        <CardDescription>
          Tilpas dine cyklussporing og påmindelsesindstillinger
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-length">Gennemsnitlig cykluslængde (dage)</Label>
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
              <p className="text-xs text-gray-500">Typisk interval: 21-35 dage</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-length">Gennemsnitlig menstruationslængde (dage)</Label>
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
              <p className="text-xs text-gray-500">Typisk interval: 3-10 dage</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-days">Påmindelsesdage før menstruation</Label>
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
            <p className="text-xs text-gray-500">Hvor mange dage før din menstruation vil du gerne påmindes?</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="notifications">Aktiver påmindelser</Label>
              <p className="text-sm text-gray-600">
                Modtag påmindelser om menstruationsstart, ægløsning og frugtbare perioder
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
            <h4 className="font-medium text-blue-900 mb-2">📊 Forudsigelsesnøjagtighed</h4>
            <p className="text-sm text-blue-800">
              Jo flere cyklusser du sporer, jo mere nøjagtige bliver dine forudsigelser. 
              Vi bruger dine historiske data til at give personaliserede indsigter og påmindelser.
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Gemmer...' : 'Gem præferencer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
