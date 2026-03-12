import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSalon, createSalon, updateSalon } from '@/api/salons';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SalonFormPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const isNew = !salonId || salonId === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, salonId: ownSalonId } = useAuth();

  // salon_admin can only edit their own salon, not create new ones
  if (role === 'salon_admin') {
    if (isNew) return <Navigate to="/admin" replace />;
    if (ownSalonId && salonId !== ownSalonId) return <Navigate to={`/admin/salons/${ownSalonId}`} replace />;
  }
  // master_admin has no access to salon editing
  if (role === 'master_admin') return <Navigate to="/admin" replace />;

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
  const [photos, setPhotos] = useState<string[]>([]);
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
      setPhotos(existing.photos);
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
        <FormField label="Name *" value={name} onChange={setName} required />
        <FormField label="Address *" value={address} onChange={setAddress} required />
        <FormField label="Google Maps URL" value={googleMapsUrl} onChange={setGoogleMapsUrl} />
        <FormField label="Yandex Maps URL" value={yandexMapsUrl} onChange={setYandexMapsUrl} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Opens at" value={hoursStart} onChange={setHoursStart} type="time" />
          <FormField label="Closes at" value={hoursEnd} onChange={setHoursEnd} type="time" />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photos</label>
          <DragDropUpload folder="salons" accept="image" maxFiles={10} values={photos} onChange={setPhotos} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Videos</label>
          <DragDropUpload folder="salons" accept="video" maxFiles={5} values={videos} onChange={setVideos} />
        </div>

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


