
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { format } from 'date-fns';
import type { CreateDailyTrackingInput } from '../../../server/src/schema';

interface DailyLoggerProps {
  userId: string;
  onUpdate: () => void;
}

const MOOD_OPTIONS = [
  { value: 'great', label: 'Great 😄', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Good 😊', color: 'bg-blue-100 text-blue-800' },
  { value: 'okay', label: 'Okay 😐', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'bad', label: 'Bad 😞', color: 'bg-orange-100 text-orange-800' },
  { value: 'terrible', label: 'Terrible 😢', color: 'bg-red-100 text-red-800' },
] as const;

const FLOW_OPTIONS = [
  { value: 'none', label: 'None', color: 'bg-gray-100 text-gray-800' },
  { value: 'light', label: 'Light 💧', color: 'bg-pink-100 text-pink-800' },
  { value: 'medium', label: 'Medium 💧💧', color: 'bg-red-100 text-red-800' },
  { value: 'heavy', label: 'Heavy 💧💧💧', color: 'bg-red-200 text-red-900' },
] as const;

const SYMPTOM_OPTIONS = [
  'Cramps',
  'Headache',
  'Bloating',
  'Breast tenderness',
  'Fatigue',
  'Mood swings',
  'Acne',
  'Nausea',
  'Back pain',
  'Food cravings',
  'Insomnia',
  'Hot flashes'
];

export function DailyLogger({ userId, onUpdate }: DailyLoggerProps) {
  const [formData, setFormData] = useState<CreateDailyTrackingInput>({
    user_id: userId,
    date: new Date(),
    flow_intensity: undefined,
    symptoms: [],
    mood: undefined,
    notes: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createDailyTracking.mutate(formData);
      // Reset form
      setFormData({
        user_id: userId,
        date: new Date(),
        flow_intensity: undefined,
        symptoms: [],
        mood: undefined,
        notes: null
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to save daily tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    setFormData((prev: CreateDailyTrackingInput) => ({
      ...prev,
      symptoms: checked 
        ? [...(prev.symptoms || []), symptom]
        : (prev.symptoms || []).filter((s: string) => s !== symptom)
    }));
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Daily Log Entry
        </CardTitle>
        <CardDescription>
          Track your daily symptoms, mood, and flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      setFormData((prev: CreateDailyTrackingInput) => ({ ...prev, date }));
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Flow Intensity */}
          <div className="space-y-2">
            <Label>Flow Intensity</Label>
            <Select
              value={formData.flow_intensity || ''}
              onValueChange={(value: string) =>
                setFormData((prev: CreateDailyTrackingInput) => ({
                  ...prev,
                  flow_intensity: (value || undefined) as 'none' | 'light' | 'medium' | 'heavy' | undefined
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select flow intensity" />
              </SelectTrigger>
              <SelectContent>
                {FLOW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.flow_intensity && (
              <Badge className={FLOW_OPTIONS.find(opt => opt.value === formData.flow_intensity)?.color}>
                {FLOW_OPTIONS.find(opt => opt.value === formData.flow_intensity)?.label}
              </Badge>
            )}
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label>Mood</Label>
            <Select
              value={formData.mood || ''}
              onValueChange={(value: string) =>
                setFormData((prev: CreateDailyTrackingInput) => ({
                  ...prev,
                  mood: (value || undefined) as 'great' | 'good' | 'okay' | 'bad' | 'terrible' | undefined
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {MOOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.mood && (
              <Badge className={MOOD_OPTIONS.find(opt => opt.value === formData.mood)?.color}>
                {MOOD_OPTIONS.find(opt => opt.value === formData.mood)?.label}
              </Badge>
            )}
          </div>

          {/* Symptoms */}
          <div className="space-y-3">
            <Label>Symptoms</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={formData.symptoms?.includes(symptom) || false}
                    onCheckedChange={(checked: boolean) =>
                      handleSymptomChange(symptom, checked)
                    }
                  />
                  <Label htmlFor={symptom} className="text-sm font-normal cursor-pointer">
                    {symptom}
                  </Label>
                </div>
              ))}
            </div>
            {formData.symptoms && formData.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.symptoms.map((symptom: string) => (
                  <Badge key={symptom} variant="secondary">
                    {symptom}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about your day..."
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateDailyTrackingInput) => ({
                  ...prev,
                  notes: e.target.value || null
                }))
              }
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Daily Entry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
