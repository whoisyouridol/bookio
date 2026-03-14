import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, CalendarOff, Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMasterSalons } from '@/api/masters';
import {
  getWeeklySchedule, setWeeklySchedule,
  getDateOverrides, upsertDateOverride, deleteDateOverride,
  getTimeOffs, createTimeOff, deleteTimeOff,
} from '@/api/availability';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import type {
  WeeklySlotDto, WeeklySlotItemRequest,
  DateOverrideSlotItemRequest,
} from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const { masterId } = useAuth();
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ['master-salons', masterId],
    queryFn: () => getMasterSalons(masterId!),
    enabled: !!masterId,
  });

  // Auto-select first salon
  const salonId = selectedSalonId ?? salons[0]?.salonId;

  if (!masterId) return <div className="p-6 text-gray-500">No master profile linked.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your working schedule, day overrides, and time off.</p>
      </div>

      {salonsLoading ? <Loader /> : salons.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">You are not linked to any salon yet.</p>
        </div>
      ) : (
        <>
          {/* Salon switcher */}
          {salons.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {salons.map(s => (
                <button
                  key={s.salonId}
                  onClick={() => setSelectedSalonId(s.salonId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    salonId === s.salonId
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s.salonName}
                </button>
              ))}
            </div>
          )}

          {salonId && (
            <>
              <WeeklyScheduleSection salonId={salonId} masterId={masterId} />
              <DateOverridesSection salonId={salonId} masterId={masterId} />
              <TimeOffSection salonId={salonId} masterId={masterId} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Weekly Schedule Section ──────────────────────────────────────────────────

function WeeklyScheduleSection({ salonId, masterId }: { salonId: string; masterId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WeeklySlotItemRequest[]>([]);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['weekly-schedule', salonId, masterId],
    queryFn: () => getWeeklySchedule(salonId, masterId),
  });

  const saveMutation = useMutation({
    mutationFn: () => setWeeklySchedule(salonId, masterId, { slots: draft }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule', salonId, masterId] });
      toast.success('Weekly schedule saved');
      setEditing(false);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to save schedule')),
  });

  const startEdit = () => {
    setDraft(slots.map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })));
    setEditing(true);
  };

  const addSlot = () => {
    setDraft(prev => [...prev, { dayOfWeek: 'Monday', startTime: '09:00', endTime: '18:00' }]);
  };

  const removeSlot = (idx: number) => {
    setDraft(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, field: keyof WeeklySlotItemRequest, value: string) => {
    setDraft(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <Section title="Weekly Schedule" icon={Clock} description="Set your regular working hours for each day of the week.">
      {isLoading ? <Loader /> : editing ? (
        <div className="space-y-3">
          {draft.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-3 flex-wrap">
              <select
                value={slot.dayOfWeek}
                onChange={e => updateSlot(idx, 'dayOfWeek', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                type="time"
                value={slot.startTime}
                onChange={e => updateSlot(idx, 'startTime', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-gray-400">—</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={e => updateSlot(idx, 'endTime', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button onClick={() => removeSlot(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addSlot} className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium">
            <Plus className="w-4 h-4" /> Add time window
          </button>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1.5" /> Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div>
          {slots.length === 0 ? (
            <p className="text-sm text-gray-400 mb-3">No weekly schedule configured.</p>
          ) : (
            <div className="space-y-1.5 mb-3">
              {groupByDay(slots).map(([day, daySlots]) => (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 font-medium text-gray-700">{day}</span>
                  <div className="flex gap-2 flex-wrap">
                    {daySlots.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                        {s.startTime} — {s.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="secondary" onClick={startEdit}>
            {slots.length === 0 ? 'Set up schedule' : 'Edit schedule'}
          </Button>
        </div>
      )}
    </Section>
  );
}

function groupByDay(slots: WeeklySlotDto[]): [string, WeeklySlotDto[]][] {
  const map = new Map<string, WeeklySlotDto[]>();
  for (const s of slots) {
    if (!map.has(s.dayOfWeek)) map.set(s.dayOfWeek, []);
    map.get(s.dayOfWeek)!.push(s);
  }
  return DAYS.filter(d => map.has(d)).map(d => [d, map.get(d)!]);
}

// ── Date Overrides Section ───────────────────────────────────────────────────

function DateOverridesSection({ salonId, masterId }: { salonId: string; masterId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [isDayOff, setIsDayOff] = useState(false);
  const [formSlots, setFormSlots] = useState<DateOverrideSlotItemRequest[]>([{ startTime: '09:00', endTime: '18:00' }]);

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['date-overrides', salonId, masterId],
    queryFn: () => getDateOverrides(salonId, masterId),
  });

  const upsertMutation = useMutation({
    mutationFn: () => upsertDateOverride(salonId, masterId, {
      date: formDate,
      isDayOff,
      slots: isDayOff ? undefined : formSlots,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-overrides', salonId, masterId] });
      toast.success('Date override saved');
      resetForm();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to save override')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDateOverride(salonId, masterId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-overrides', salonId, masterId] });
      toast.success('Override removed');
    },
    onError: () => toast.error('Failed to remove override'),
  });

  const resetForm = () => {
    setShowForm(false);
    setFormDate('');
    setIsDayOff(false);
    setFormSlots([{ startTime: '09:00', endTime: '18:00' }]);
  };

  return (
    <Section title="Date Overrides" icon={Calendar} description="Override your schedule for specific dates (e.g. shorter day, day off).">
      {isLoading ? <Loader /> : (
        <>
          {overrides.length > 0 && (
            <div className="space-y-2 mb-3">
              {overrides.map(ov => (
                <div key={ov.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{ov.date}</span>
                    {ov.isDayOff ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">Day off</span>
                    ) : (
                      <div className="flex gap-1.5">
                        {ov.slots.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {s.startTime} — {s.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(ov.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={isDayOff}
                    onChange={e => setIsDayOff(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600"
                  />
                  <span className="text-sm text-gray-700">Day off</span>
                </label>
              </div>

              {!isDayOff && (
                <div className="space-y-2">
                  {formSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => {
                          const next = [...formSlots];
                          next[idx] = { ...next[idx], startTime: e.target.value };
                          setFormSlots(next);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => {
                          const next = [...formSlots];
                          next[idx] = { ...next[idx], endTime: e.target.value };
                          setFormSlots(next);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      {formSlots.length > 1 && (
                        <button onClick={() => setFormSlots(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setFormSlots(prev => [...prev, { startTime: '09:00', endTime: '18:00' }])}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add window
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => upsertMutation.mutate()} loading={upsertMutation.isPending} disabled={!formDate}>
                  <Save className="w-4 h-4 mr-1.5" /> Save
                </Button>
                <Button size="sm" variant="secondary" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add override
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

// ── Time Off Section ─────────────────────────────────────────────────────────

function TimeOffSection({ salonId, masterId }: { salonId: string; masterId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const { data: timeOffs = [], isLoading } = useQuery({
    queryKey: ['time-offs', salonId, masterId],
    queryFn: () => getTimeOffs(salonId, masterId),
  });

  const addMutation = useMutation({
    mutationFn: () => createTimeOff(salonId, masterId, { startDate, endDate, reason: reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-offs', salonId, masterId] });
      toast.success('Time off added');
      resetForm();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to add time off')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteTimeOff(salonId, masterId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-offs', salonId, masterId] });
      toast.success('Time off removed');
    },
    onError: () => toast.error('Failed to remove time off'),
  });

  const resetForm = () => {
    setShowForm(false);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <Section title="Time Off" icon={CalendarOff} description="Block date ranges when you're unavailable (vacations, sick leave, etc.).">
      {isLoading ? <Loader /> : (
        <>
          {timeOffs.length > 0 && (
            <div className="space-y-2 mb-3">
              {timeOffs.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t.startDate} — {t.endDate}
                    </span>
                    {t.reason && <span className="ml-3 text-xs text-gray-400">{t.reason}</span>}
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(t.id)}
                    disabled={removeMutation.isPending}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Vacation, Sick leave..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending} disabled={!startDate || !endDate}>
                  <Save className="w-4 h-4 mr-1.5" /> Save
                </Button>
                <Button size="sm" variant="secondary" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add time off
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, description, children }: {
  title: string; icon: React.ElementType; description: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">{description}</p>
      {children}
    </div>
  );
}

