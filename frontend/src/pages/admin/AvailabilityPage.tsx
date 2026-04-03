import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { DatePicker } from '@/components/ui/DatePicker';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import type {
  WeeklySlotDto, WeeklySlotItemRequest,
  DateOverrideSlotItemRequest,
} from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const { t } = useTranslation();
  const { masterId } = useAuth();
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ['master-salons', masterId],
    queryFn: () => getMasterSalons(masterId!),
    enabled: !!masterId,
  });

  // Auto-select first salon
  const salonId = selectedSalonId ?? salons[0]?.salonId;

  if (!masterId) return <div className="p-6 text-[var(--color-text-secondary)]">{t('admin.availability.noMasterLinked')}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.availability.title')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{t('admin.availability.configureDescription')}</p>
      </div>

      {salonsLoading ? <Loader /> : salons.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-tertiary)]">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('admin.availability.noSalonLinked')}</p>
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
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
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
  const { t } = useTranslation();
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
      toast.success(t('admin.availability.scheduleSaved'));
      setEditing(false);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t('admin.availability.failedToSaveSchedule'))),
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
    <Section title={t('admin.availability.weeklySchedule')} icon={Clock} description={t('admin.availability.setWeeklyDescription')}>
      {isLoading ? <Loader /> : editing ? (
        <div className="space-y-3">
          {draft.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-3 flex-wrap">
              <select
                value={slot.dayOfWeek}
                onChange={e => updateSlot(idx, 'dayOfWeek', e.target.value)}
                className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                type="time"
                value={slot.startTime}
                onChange={e => updateSlot(idx, 'startTime', e.target.value)}
                className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
              <span className="text-[var(--color-text-tertiary)]">—</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={e => updateSlot(idx, 'endTime', e.target.value)}
                className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
              <button onClick={() => removeSlot(idx)} className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addSlot} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-medium">
            <Plus className="w-4 h-4" /> {t('admin.availability.addTimeWindow')}
          </button>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1.5" /> {t('admin.availability.save')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>{t('admin.availability.cancel')}</Button>
          </div>
        </div>
      ) : (
        <div>
          {slots.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3">{t('admin.availability.noWeeklySchedule')}</p>
          ) : (
            <div className="space-y-1.5 mb-3">
              {groupByDay(slots).map(([day, daySlots]) => (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 font-medium text-[var(--color-text)]">{day}</span>
                  <div className="flex gap-2 flex-wrap">
                    {daySlots.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] rounded-md text-xs font-medium">
                        {s.startTime} — {s.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="secondary" onClick={startEdit}>
            {slots.length === 0 ? t('admin.availability.setUpSchedule') : t('admin.availability.editSchedule')}
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
  const { t } = useTranslation();
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
      toast.success(t('admin.availability.dateOverrideSaved'));
      resetForm();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t('admin.availability.failedToSaveOverride'))),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDateOverride(salonId, masterId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-overrides', salonId, masterId] });
      toast.success(t('admin.availability.overrideRemoved'));
    },
    onError: () => toast.error(t('admin.availability.failedToRemoveOverride')),
  });

  const resetForm = () => {
    setShowForm(false);
    setFormDate('');
    setIsDayOff(false);
    setFormSlots([{ startTime: '09:00', endTime: '18:00' }]);
  };

  return (
    <Section title={t('admin.availability.dateOverrides')} icon={Calendar} description={t('admin.availability.overrideDateDescription')}>
      {isLoading ? <Loader /> : (
        <>
          {overrides.length > 0 && (
            <div className="space-y-2 mb-3">
              {overrides.map(ov => (
                <div key={ov.id} className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--color-text)]">{ov.date}</span>
                    {ov.isDayOff ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">{t('admin.availability.dayOff')}</span>
                    ) : (
                      <div className="flex gap-1.5">
                        {ov.slots.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-[var(--color-info-text)] rounded text-xs font-medium">
                            {s.startTime} — {s.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(ov.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="space-y-3 bg-[var(--color-bg)] rounded-[var(--radius-lg)] p-4">
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <DatePicker label={t('admin.availability.date')} value={formDate} onChange={setFormDate} placeholder={t('components.datePicker.selectDate')} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={isDayOff}
                    onChange={e => setIsDayOff(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">{t('admin.availability.dayOff')}</span>
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
                        className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      <span className="text-[var(--color-text-tertiary)]">—</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => {
                          const next = [...formSlots];
                          next[idx] = { ...next[idx], endTime: e.target.value };
                          setFormSlots(next);
                        }}
                        className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      {formSlots.length > 1 && (
                        <button onClick={() => setFormSlots(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-[var(--color-error)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setFormSlots(prev => [...prev, { startTime: '09:00', endTime: '18:00' }])}
                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> {t('admin.availability.addWindow')}
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => upsertMutation.mutate()} loading={upsertMutation.isPending} disabled={!formDate}>
                  <Save className="w-4 h-4 mr-1.5" /> {t('admin.availability.save')}
                </Button>
                <Button size="sm" variant="secondary" onClick={resetForm}>{t('admin.availability.cancel')}</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> {t('admin.availability.addOverride')}
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

// ── Time Off Section ─────────────────────────────────────────────────────────

function TimeOffSection({ salonId, masterId }: { salonId: string; masterId: string }) {
  const { t } = useTranslation();
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
      toast.success(t('admin.availability.timeOffAdded'));
      resetForm();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t('admin.availability.failedToAddTimeOff'))),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteTimeOff(salonId, masterId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-offs', salonId, masterId] });
      toast.success(t('admin.availability.timeOffRemoved'));
    },
    onError: () => toast.error(t('admin.availability.failedToRemoveTimeOff')),
  });

  const resetForm = () => {
    setShowForm(false);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <Section title={t('admin.availability.timeOff')} icon={CalendarOff} description={t('admin.availability.blockDatesDescription')}>
      {isLoading ? <Loader /> : (
        <>
          {timeOffs.length > 0 && (
            <div className="space-y-2 mb-3">
              {timeOffs.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {t.startDate} — {t.endDate}
                    </span>
                    {t.reason && <span className="ml-3 text-xs text-[var(--color-text-tertiary)]">{t.reason}</span>}
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(t.id)}
                    disabled={removeMutation.isPending}
                    className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="space-y-3 bg-[var(--color-bg)] rounded-[var(--radius-lg)] p-4">
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <DatePicker label={t('admin.availability.startDate')} value={startDate} onChange={setStartDate} placeholder={t('components.datePicker.selectDate')} />
                </div>
                <div>
                  <DatePicker label={t('admin.availability.endDate')} value={endDate} onChange={setEndDate} placeholder={t('components.datePicker.selectDate')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('admin.availability.reasonOptional')}</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t('admin.availability.reasonPlaceholder')}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending} disabled={!startDate || !endDate}>
                  <Save className="w-4 h-4 mr-1.5" /> {t('admin.availability.save')}
                </Button>
                <Button size="sm" variant="secondary" onClick={resetForm}>{t('admin.availability.cancel')}</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> {t('admin.availability.addTimeOff')}
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
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-4">{description}</p>
      {children}
    </div>
  );
}

