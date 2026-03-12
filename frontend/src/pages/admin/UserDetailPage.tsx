import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, ShieldOff, ExternalLink, User, Scissors } from 'lucide-react';
import { getAdminUser, updateUserProfile, setUserActive, updateUserRole } from '@/api/auth';
import { getMaster } from '@/api/masters';
import { getSalons } from '@/api/salons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from 'sonner';

type Tab = 'account' | 'master';

const ROLES = ['Client', 'Master', 'SalonAdmin', 'SuperAdmin'];
const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  SalonAdmin: 'Salon Admin',
  Master: 'Master',
  Client: 'Client',
};

const extractError = (err: unknown) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  ?? 'Something went wrong';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getAdminUser(userId!),
    enabled: !!userId,
  });

  const { data: master } = useQuery({
    queryKey: ['master', user?.masterId],
    queryFn: () => getMaster(user!.masterId!),
    enabled: !!user?.masterId,
  });

  const { data: salons = [] } = useQuery({
    queryKey: ['salons-public'],
    queryFn: getSalons,
  });

  const hasMaster = !!user?.masterId && master && !master.isDeleted;
  const [tab, setTab] = useState<Tab>('account');

  // Account form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [salonId, setSalonId] = useState('');
  const [masterId, setMasterId] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone(user.phone ?? '');
      setEmail(user.email);
      setRole(user.role);
      setSalonId(user.salonId ?? '');
      setMasterId(user.masterId ?? '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: () => updateUserProfile(userId!, { firstName, lastName, phone, email }),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Profile updated');
    },
    onError: err => toast.error(extractError(err)),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => updateUserRole(userId!, {
      role,
      salonId: salonId || undefined,
      masterId: masterId || undefined,
    }),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    },
    onError: err => toast.error(extractError(err)),
  });

  const activateMutation = useMutation({
    mutationFn: (isActive: boolean) => setUserActive(userId!, isActive),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(updated.isActive ? 'User activated' : 'User deactivated');
    },
    onError: err => toast.error(extractError(err)),
  });

  if (isLoading) return <Loader />;
  if (!user) return <div className="p-6 text-gray-500">User not found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/users')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {user.firstName || user.lastName
              ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
              : user.email}
          </h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={user.isActive ? 'success' : 'warning'}>
            {user.isActive ? 'Active' : 'Pending'}
          </Badge>
          <button
            onClick={() => activateMutation.mutate(!user.isActive)}
            disabled={activateMutation.isPending}
            title={user.isActive ? 'Deactivate user' : 'Activate user'}
            className={`p-2 rounded-lg transition-colors ${
              user.isActive
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {user.isActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'account'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" /> Account
        </button>
        {hasMaster && (
          <button
            onClick={() => setTab('master')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'master'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Scissors className="w-4 h-4" /> Master Profile
          </button>
        )}
      </div>

      {/* ── Account tab ── */}
      {tab === 'account' && (
        <div className="space-y-6">

          {/* Profile fields */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={firstName} onChange={setFirstName} />
              <Field label="Last Name" value={lastName} onChange={setLastName} />
            </div>
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
            {user.externalProvider && (
              <p className="text-xs text-gray-400">
                Linked via <span className="font-medium">{user.externalProvider}</span> — password login not available
              </p>
            )}
            <Button
              onClick={() => updateProfileMutation.mutate()}
              loading={updateProfileMutation.isPending}
              size="sm"
            >
              Save Profile
            </Button>
          </section>

          {/* Role & links */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Role & Links</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Salon</label>
              <select
                value={salonId}
                onChange={e => setSalonId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">— None —</option>
                {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Master ID</label>
              <input
                type="text"
                value={masterId}
                onChange={e => setMasterId(e.target.value)}
                placeholder="UUID of linked master record"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <Button
              onClick={() => updateRoleMutation.mutate()}
              loading={updateRoleMutation.isPending}
              size="sm"
              variant="secondary"
            >
              Save Role & Links
            </Button>
          </section>

          {/* Meta */}
          <section className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-400 space-y-1">
            <p><span className="font-medium text-gray-500">User ID:</span> {user.id}</p>
            <p><span className="font-medium text-gray-500">Created:</span> {new Date(user.createdAt).toLocaleString()}</p>
          </section>
        </div>
      )}

      {/* ── Master tab ── */}
      {tab === 'master' && hasMaster && master && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
                <ImageWithFallback
                  src={master.photo}
                  alt={`${master.firstName} ${master.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{master.firstName} {master.lastName}</p>
                <p className="text-sm text-gray-500">{master.phone}</p>
                {master.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{master.description}</p>
                )}
              </div>
              <Badge variant={master.isDeleted ? 'error' : 'success'}>
                {master.isDeleted ? 'Deleted' : 'Active'}
              </Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">Auto-approve bookings</span>
                <p>{master.autoApproveBookings ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Rating</span>
                <p>{master.averageRating ? `${master.averageRating.toFixed(1)} (${master.ratingCount})` : 'No ratings yet'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Master ID</span>
                <p className="font-mono truncate">{master.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created</span>
                <p>{new Date(master.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Link to full editor */}
          <Link to={`/admin/masters/${master.id}`}>
            <button className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
              <ExternalLink className="w-4 h-4" />
              Edit Full Master Profile (services, photo, etc.)
            </button>
          </Link>

          <p className="text-xs text-gray-400 text-center">
            Full master editing — including services, photos and booking settings — is available on the Master Profile page.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}
