import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { registerSalonAdmin, registerSalonAdminWithNewSalon } from '@/api/auth';
import { getSalons } from '@/api/salons';
import { getErrorMessage } from '@/lib/error';
import { isOnSubdomain, getMainDomainUrl } from '@/lib/subdomain';
import { Building2, CheckCircle, Plus } from 'lucide-react';
import { GlobalToolbar } from '@/components/GlobalToolbar';

type AccountRole = 'Client' | 'SalonAdmin' | 'MasterAdmin';
type SalonMode = 'existing' | 'new';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const ROLE_OPTIONS: { value: AccountRole; label: string; description: string }[] = [
    { value: 'Client', label: t('register.client'), description: t('register.bookAppointments') },
    { value: 'SalonAdmin', label: t('register.salonOwner'), description: t('register.manageSalon') },
    { value: 'MasterAdmin', label: t('register.masterSpecialist'), description: t('register.manageServices') },
  ];

  const [role, setRole] = useState<AccountRole>('Client');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const [salonMode, setSalonMode] = useState<SalonMode>('existing');
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [salonSearch, setSalonSearch] = useState('');

  const [salonForm, setSalonForm] = useState({
    salonName: '',
    salonAddress: '',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
  });
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const { data: salons } = useQuery({
    queryKey: ['salons'],
    queryFn: getSalons,
    enabled: role === 'SalonAdmin' && salonMode === 'existing',
  });

  const filteredSalons = salons?.filter(s =>
    s.name.toLowerCase().includes(salonSearch.toLowerCase()) ||
    s.address.toLowerCase().includes(salonSearch.toLowerCase())
  ) ?? [];

  useEffect(() => {
    if (redirectTo && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, redirectTo, navigate]);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setSalon = (key: keyof typeof salonForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSalonForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast.error(t('auth.emailOrPhoneRequired'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (role === 'SalonAdmin' && salonMode === 'existing') {
      if (!selectedSalonId) {
        toast.error(t('register.selectSalon'));
        return;
      }
      setLoading(true);
      try {
        const res = await registerSalonAdmin({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          salonId: selectedSalonId,
        });
        setPendingMessage(res.message);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, t('auth.registrationFailed')));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'SalonAdmin' && salonMode === 'new') {
      if (!salonForm.salonName || !salonForm.salonAddress) {
        toast.error(t('register.fillSalonDetails'));
        return;
      }
      if (workingDays.length === 0) {
        toast.error(t('register.selectAtLeastOneDay'));
        return;
      }
      setLoading(true);
      try {
        const res = await registerSalonAdminWithNewSalon({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          salonName: salonForm.salonName,
          salonAddress: salonForm.salonAddress,
          workingHoursStart: salonForm.workingHoursStart,
          workingHoursEnd: salonForm.workingHoursEnd,
          workingDays,
        });
        setPendingMessage(res.message);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, t('auth.registrationFailed')));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'MasterAdmin') {
      if (isOnSubdomain()) {
        window.location.href = `${getMainDomainUrl()}/register/professional`;
      } else {
        navigate('/register/professional');
      }
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        role,
      });
      toast.success(t('auth.accountCreated'));
      setRedirectTo(isOnSubdomain() ? '/' : (user.role === 'Client' ? '/' : '/admin'));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.registrationFailed')));
    } finally {
      setLoading(false);
    }
  };

  if (pendingMessage) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-8 relative">
        <div className="absolute top-4 right-4">
          <GlobalToolbar />
        </div>
        <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8 text-center">
          <div className="w-16 h-16 bg-[var(--color-success-subtle)] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">{t('auth.registrationSubmitted')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">{pendingMessage}</p>
          <Link to="/login"
            className="inline-block bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors">
            {t('auth.goToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <GlobalToolbar />
      </div>
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t('auth.createAccount')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t('auth.joinBookVisit')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('register.iAmA')}</label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-[var(--radius-lg)] border-2 transition-colors ${
                    role === opt.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${role === opt.value ? 'text-[var(--color-primary)]' : 'text-gray-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {role === 'SalonAdmin' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('register.yourSalon')}</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button type="button" onClick={() => setSalonMode('existing')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    salonMode === 'existing'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
                  }`}>
                  <Building2 className="w-4 h-4 inline mr-1" />
                  {t('register.joinExisting')}
                </button>
                <button type="button" onClick={() => setSalonMode('new')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    salonMode === 'new'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
                  }`}>
                  <Plus className="w-4 h-4 inline mr-1" />
                  {t('register.createNew')}
                </button>
              </div>

              {salonMode === 'existing' && (
                <>
                  <input
                    type="text"
                    placeholder={t('register.searchByNameOrAddress')}
                    value={salonSearch}
                    onChange={e => setSalonSearch(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-lg">
                    {filteredSalons.length === 0 ? (
                      <p className="p-3 text-xs text-[var(--color-text-tertiary)] text-center">{t('register.noSalonsFound')}</p>
                    ) : (
                      filteredSalons.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => setSelectedSalonId(s.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-50 last:border-0 transition-colors ${
                            selectedSalonId === s.id ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' : 'hover:bg-[var(--color-bg)]'
                          }`}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{s.name}</p>
                              <p className="text-xs text-[var(--color-text-tertiary)] truncate">{s.address}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {salonMode === 'new' && (
                <div className="space-y-3 bg-[var(--color-bg)] rounded-lg p-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.salonName')}</label>
                    <input type="text" required value={salonForm.salonName} onChange={setSalon('salonName')}
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.address')}</label>
                    <input type="text" required value={salonForm.salonAddress} onChange={setSalon('salonAddress')}
                      className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.opensAt')}</label>
                      <input type="time" value={salonForm.workingHoursStart} onChange={setSalon('workingHoursStart')}
                        className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.closesAt')}</label>
                      <input type="time" value={salonForm.workingHoursEnd} onChange={setSalon('workingHoursEnd')}
                        className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.workingDays')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_DAYS.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            workingDays.includes(day)
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
                          }`}>
                          {t(`common.days.${day.toLowerCase()}` as any).slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.firstName')}</label>
              <input
                data-testid="register-first-name"
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                required={role === 'SalonAdmin'}
                autoComplete="given-name"
                className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.lastName')}</label>
              <input
                data-testid="register-last-name"
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                required={role === 'SalonAdmin'}
                autoComplete="family-name"
                className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.email')}</label>
            <input
              data-testid="register-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.phone')}</label>
            <input
              data-testid="register-phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {t('auth.atLeastOneContactRequired')}
            </p>
          </div>

          {role !== 'MasterAdmin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.password')}</label>
                <input
                  data-testid="register-password"
                  type="password"
                  required
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.confirmPassword')}</label>
                <input
                  data-testid="register-confirm-password"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  autoComplete="new-password"
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            </>
          )}

          <button
            data-testid="register-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.creatingAccount') : role === 'MasterAdmin' ? t('auth.continueToMasterRegistration') : t('auth.createAccount')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
