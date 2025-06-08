
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { format } from 'date-fns';
import type { CreateCycleEntryInput, UpdateCycleEntryInput, CycleEntry } from '../../../server/src/schema';

interface CycleTrackerProps {
  userId: string;
  cycleEntries: CycleEntry[];
  onUpdate: () => void;
}

export function CycleTracker({ userId, cycleEntries, onUpdate }: CycleTrackerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateCycleEntryInput>({
    user_id: userId,
    start_date: new Date(),
    end_date: undefined,
    notes: null
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateCycleEntryInput>({
    id: 0,
    end_date: undefined,
    notes: null
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createCycleEntry.mutate(createFormData);
      setCreateFormData({
        user_id: userId,
        start_date: new Date(),
        end_date: undefined,
        notes: null
      });
      setIsCreating(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to create cycle entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateCycleEntry.mutate(updateFormData);
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update cycle entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (entry: CycleEntry) => {
    setEditingId(entry.id);
    setUpdateFormData({
      id: entry.id,
      end_date: entry.end_date || undefined,
      notes: entry.notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Cycle */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Spor ny cyklus
          </CardTitle>
          <CardDescription>
            Registrer starten på din menstruationscyklus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Start ny cyklus
            </Button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Startdato</Label>
                <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(createFormData.start_date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={createFormData.start_date}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setCreateFormData((prev: CreateCycleEntryInput) => ({ ...prev, start_date: date }));
                          setIsStartCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Slutdato (valgfri)</Label>
                <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createFormData.end_date ? format(createFormData.end_date, 'PPP') : 'Vælg slutdato'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={createFormData.end_date}
                      onSelect={(date: Date | undefined) => {
                        setCreateFormData((prev: CreateCycleEntryInput) => ({ ...prev, end_date: date }));
                        setIsEndCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-notes">Noter (valgfri)</Label>
                <Textarea
                  id="create-notes"
                  placeholder="Noter om denne cyklus..."
                  value={createFormData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateCycleEntryInput) => ({
                      ...prev,
                      notes: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Opretter...' : 'Opret cyklus'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  className="flex-1"
                >
                  Annuller
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Cycle History */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Cyklushistorik</CardTitle>
          <CardDescription>
            Se og rediger dine sporede cyklusser
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycleEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Ingen cyklusser sporet endnu. Start med at tilføje din første cyklus ovenfor! 🌸
            </p>
          ) : (
            <div className="space-y-4">
              {cycleEntries.map((entry: CycleEntry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-pink-50/50">
                  {editingId === entry.id ? (
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Slutdato</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {updateFormData.end_date ? format(updateFormData.end_date, 'PPP') : 'Vælg slutdato'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={updateFormData.end_date}
                              onSelect={(date: Date | undefined) =>
                                setUpdateFormData((prev: UpdateCycleEntryInput) => ({ ...prev, end_date: date }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="update-notes">Noter</Label>
                        <Textarea
                          id="update-notes"
                          value={updateFormData.notes || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setUpdateFormData((prev: UpdateCycleEntryInput) => ({
                              ...prev,
                              notes: e.target.value || null
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading} size="sm">
                          {isLoading ? 'Gemmer...' : 'Gem'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Annuller
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <p className="font-medium">
                            {entry.start_date.toLocaleDateString()} - {entry.end_date?.toLocaleDateString() || 'Igangværende'}
                          </p>
                          {entry.cycle_length && (
                            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {entry.cycle_length} dages cyklus
                            </span>
                          )}
                          {entry.period_length && (
                            <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded">
                              {entry.period_length} dages menstruation
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-600">{entry.notes}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Oprettet: {entry.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(entry)}
                        className="shrink-0"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
