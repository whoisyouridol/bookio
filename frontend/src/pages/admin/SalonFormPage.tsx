import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { getSalon, createSalon, updateSalon } from '@/api/salons';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SalonFormPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const isNew = !salonId || salonId === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => getSalon(salonId!),
    enabled: !isNew,
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [yandexMapsUrl, setYandexMapsUrl] = useState('');
  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('21:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [photos, setPhotos] = useState<string[]>(['']);
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setAddress(existing.address);
      setGoogleMapsUrl(existing.googleMapsUrl ?? '');
      setYandexMapsUrl(existing.yandexMapsUrl ?? '');
      setHoursStart(existing.workingHoursStart.slice(0, 5));
      setHoursEnd(existing.workingHoursEnd.slice(0, 5));
      setWorkingDays(existing.workingDays);
      setPhotos(existing.photos.length ? existing.photos : ['']);
      setVideos(existing.videos);
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name, address,
        googleMapsUrl: googleMapsUrl || undefined,
        yandexMapsUrl: yandexMapsUrl || undefined,
        workingHoursStart: hoursStart,
        workingHoursEnd: hoursEnd,
        workingDays,
        photos: photos.filter(Boolean),
        videos: videos.filter(Boolean),
      };
      return isNew ? createSalon(payload) : updateSalon(salonId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(isNew ? 'Salon created!' : 'Salon updated!');
      navigate('/admin/salons');
    },
    onError: () => toast.error('Failed to save salon.'),
  });

  const toggleDay = (day: string) =>
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  if (!isNew && isLoading) return <Loader />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isNew ? 'New Salon' : 'Edit Salon'}</h1>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        <Field label="Name *" value={name} onChange={setName} required />
        <Field label="Address *" value={address} onChange={setAddress} required />
        <Field label="Google Maps URL" value={googleMapsUrl} onChange={setGoogleMapsUrl} />
        <Field label="Yandex Maps URL" value={yandexMapsUrl} onChange={setYandexMapsUrl} />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Opens at" value={hoursStart} onChange={setHoursStart} type="time" />
          <Field label="Closes at" value={hoursEnd} onChange={setHoursEnd} type="time" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  workingDays.includes(day)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <UrlList label="Photos" items={photos} onChange={setPhotos} placeholder="https://..." />
        <UrlList label="Videos" items={videos} onChange={setVideos} placeholder="https://..." />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={mutation.isPending} className="flex-1">
            {isNew ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-purple-500"
      />
    </div>
  );
}

function UrlList({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="space-y-2">
        {items.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-2 text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ''])}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800">
          <Plus className="w-3.5 h-3.5" /> Add URL
        </button>
      </div>
    </div>
  );
}
