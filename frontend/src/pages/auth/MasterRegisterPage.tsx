import { useState } from 'react';
import { Link } from 'react-router';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, Trans } from 'react-i18next';
import { Search, Building2, Plus } from 'lucide-react';
import { getSalons } from '@/api/salons';
import {
  registerMaster, registerMasterWithGoogleAccessToken, registerMasterWithFacebook,
  registerSalonAdmin, registerSalonAdminWithNewSalon,
  registerSalonAdminWithGoogleAccessToken, registerSalonAdminWithFacebook,
} from '@/api/auth';
import { getErrorMessage } from '@/lib/error';
import type { SalonDto } from '@/types';

type ProfessionalRole = 'master' | 'salon_owner';
type SalonMode = 'existing' | 'new';
type Step = 'setup' | 'register' | 'success';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MasterRegisterPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('setup');
  const [professionalRole, setProfessionalRole] = useState<ProfessionalRole>('master');
  const [selectedSalon, setSelectedSalon] = useState<SalonDto | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [salonMode, setSalonMode] = useState<SalonMode>('existing');

  const [salonForm, setSalonForm] = useState({
    salonName: '',
    salonAddress: '',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
  });
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ['salons-public'],
    queryFn: getSalons,
  });

  const filtered = salons.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  const setSalonField = (key: keyof typeof salonForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSalonForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const successMessage = professionalRole === 'master'
    ? t('registerProfessional.pendingReviewJoin', { name: selectedSalon?.name })
    : salonMode === 'new'
      ? t('registerProfessional.pendingReviewNewSalon')
      : t('registerProfessional.pendingReviewManage', { name: selectedSalon?.name });

  const handleSuccess = () => setStep('success');

  const canContinueSetup = () => {
    if (professionalRole === 'master') return !!selectedSalon;
    if (salonMode === 'existing') return !!selectedSalon;
    return salonForm.salonName && salonForm.salonAddress && workingDays.length > 0;
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      toast.error(t('auth.emailOrPhoneRequired'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    try {
      if (professionalRole === 'master') {
        await registerMaster({
          email, password, firstName, lastName,
          phone: phone || undefined,
          salonId: selectedSalon!.id,
        });
      } else if (salonMode === 'existing') {
        await registerSalonAdmin({
          email, password, firstName, lastName,
          phone: phone || undefined,
          salonId: selectedSalon!.id,
        });
      } else {
        await registerSalonAdminWithNewSalon({
          email, password, firstName, lastName,
          phone: phone || undefined,
          salonName: salonForm.salonName,
          salonAddress: salonForm.salonAddress,
          workingHoursStart: salonForm.workingHoursStart,
          workingHoursEnd: salonForm.workingHoursEnd,
          workingDays,
        });
      }
      handleSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    setLoading(true);
    try {
      if (professionalRole === 'master') {
        await registerMasterWithGoogleAccessToken(accessToken, selectedSalon!.id);
      } else if (salonMode === 'existing') {
        await registerSalonAdminWithGoogleAccessToken(accessToken, selectedSalon!.id);
      } else {
        toast.error(t('registerProfessional.useEmailForNewSalon'));
        setLoading(false);
        return;
      }
      handleSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await handleGoogleSuccess(tokenResponse.access_token);
    },
    onError: () => toast.error(t('auth.googleSignInFailed')),
  });

  const isHttps = window.location.protocol === 'https:';

  const handleFacebook = () => {
    window.FB?.login(
      res => {
        if (!res.authResponse?.accessToken) return;
        const token = res.authResponse.accessToken;
        setLoading(true);
        const promise = professionalRole === 'master'
          ? registerMasterWithFacebook(token, selectedSalon!.id)
          : salonMode === 'existing'
            ? registerSalonAdminWithFacebook(token, selectedSalon!.id)
            : Promise.reject(new Error(t('registerProfessional.useEmailForNewSalon')));
        promise
          .then(() => handleSuccess())
          .catch(err => toast.error(getErrorMessage(err)))
          .finally(() => setLoading(false));
      },
      { scope: 'email,public_profile' }
    );
  };

  const showSocialAuth = professionalRole === 'master' || salonMode === 'existing';

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8 text-center">
          <div className="w-14 h-14 bg-[var(--color-primary-subtle)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('registerProfessional.registrationSubmitted')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {successMessage}
          </p>
          <Link
            to="/login"
            className="block w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2.5 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors text-center"
          >
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('registerProfessional.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {step === 'setup'
              ? t('registerProfessional.setUpProfile')
              : professionalRole === 'master'
                ? t('registerProfessional.registeringAsSpecialist', { name: selectedSalon?.name })
                : salonMode === 'new'
                  ? t('registerProfessional.registeringAsOwnerOf', { name: salonForm.salonName || t('registerProfessional.yourNewSalon') })
                  : t('registerProfessional.registeringAsOwnerAt', { name: selectedSalon?.name })
            }
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['setup', 'register'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                  : i < (['setup', 'register'] as Step[]).indexOf(step)
                    ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)]'
              }`}>
                {i + 1}
              </div>
              {i < 1 && <div className="h-px bg-[var(--color-divider)] w-8" />}
            </div>
          ))}
          <span className="text-xs text-[var(--color-text-tertiary)] ml-1">
            {step === 'setup' ? t('registerProfessional.profileSetup') : t('registerProfessional.createAccount')}
          </span>
        </div>

        {step === 'setup' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('registerProfessional.iAmA')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setProfessionalRole('master'); setSelectedSalon(null); }}
                  className={`px-3 py-3 rounded-[var(--radius-lg)] text-left border-2 transition-colors ${
                    professionalRole === 'master'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${professionalRole === 'master' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                    {t('registerProfessional.specialist')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{t('registerProfessional.iWorkAtASalon')}</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setProfessionalRole('salon_owner'); setSelectedSalon(null); }}
                  className={`px-3 py-3 rounded-[var(--radius-lg)] text-left border-2 transition-colors ${
                    professionalRole === 'salon_owner'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${professionalRole === 'salon_owner' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                    {t('registerProfessional.salonOwner')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{t('registerProfessional.iManageASalon')}</p>
                </button>
              </div>
            </div>

            {professionalRole === 'master' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--color-text)]">{t('registerProfessional.selectYourSalon')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t('registerProfessional.searchSalons')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {salonsLoading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-14 bg-[var(--color-bg-subtle)] rounded-[var(--radius-lg)] animate-pulse" />
                    ))
                  ) : filtered.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                      {search ? t('registerProfessional.noSalonsMatch') : t('registerProfessional.noSalonsAvailable')}
                    </p>
                  ) : (
                    filtered.map(salon => (
                      <button
                        key={salon.id}
                        type="button"
                        onClick={() => setSelectedSalon(salon)}
                        className={`w-full text-left px-4 py-3 rounded-[var(--radius-lg)] border-2 transition-colors ${
                          selectedSalon?.id === salon.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${selectedSalon?.id === salon.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                          {salon.name}
                        </p>
                        {salon.address && (
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{salon.address}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {professionalRole === 'salon_owner' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--color-text)]">{t('register.yourSalon')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setSalonMode('existing'); setSelectedSalon(null); }}
                    className={`px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium border-2 transition-colors ${
                      salonMode === 'existing'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                    }`}>
                    <Building2 className="w-4 h-4 inline mr-1" />
                    {t('register.joinExisting')}
                  </button>
                  <button type="button" onClick={() => { setSalonMode('new'); setSelectedSalon(null); }}
                    className={`px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium border-2 transition-colors ${
                      salonMode === 'new'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                    }`}>
                    <Plus className="w-4 h-4 inline mr-1" />
                    {t('register.createNew')}
                  </button>
                </div>

                {salonMode === 'existing' && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] pointer-events-none" />
                      <input
                        type="text"
                        placeholder={t('registerProfessional.searchSalons')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                      />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {salonsLoading ? (
                        [1, 2, 3].map(i => (
                          <div key={i} className="h-14 bg-[var(--color-bg-subtle)] rounded-[var(--radius-lg)] animate-pulse" />
                        ))
                      ) : filtered.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                          {search ? t('registerProfessional.noSalonsMatch') : t('registerProfessional.noSalonsAvailable')}
                        </p>
                      ) : (
                        filtered.map(salon => (
                          <button
                            key={salon.id}
                            type="button"
                            onClick={() => setSelectedSalon(salon)}
                            className={`w-full text-left px-4 py-3 rounded-[var(--radius-lg)] border-2 transition-colors ${
                              selectedSalon?.id === salon.id
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                                : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                            }`}
                          >
                            <p className={`text-sm font-semibold ${selectedSalon?.id === salon.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                              {salon.name}
                            </p>
                            {salon.address && (
                              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{salon.address}</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                {salonMode === 'new' && (
                  <div className="space-y-3 bg-[var(--color-bg)] rounded-[var(--radius-lg)] p-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.salonName')}</label>
                      <input type="text" value={salonForm.salonName} onChange={setSalonField('salonName')}
                        className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.address')}</label>
                      <input type="text" value={salonForm.salonAddress} onChange={setSalonField('salonAddress')}
                        className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.opensAt')}</label>
                        <input type="time" value={salonForm.workingHoursStart} onChange={setSalonField('workingHoursStart')}
                          className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.closesAt')}</label>
                        <input type="time" value={salonForm.workingHoursEnd} onChange={setSalonField('workingHoursEnd')}
                          className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('register.workingDays')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_DAYS.map(day => (
                          <button key={day} type="button" onClick={() => toggleDay(day)}
                            className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                              workingDays.includes(day)
                                ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
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

            <button
              type="button"
              disabled={!canContinueSetup()}
              onClick={() => setStep('register')}
              className="w-full mt-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2.5 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-40 transition-colors"
            >
              {t('registerProfessional.continueButton')}
            </button>
          </div>
        )}

        {step === 'register' && (
          <div className="space-y-4">
            <div className="bg-[var(--color-primary-subtle)] border border-[var(--color-primary)] rounded-[var(--radius-md)] px-4 py-3">
              <p className="text-xs text-[var(--color-primary)]">
                <Trans
                  i18nKey={professionalRole === 'master'
                    ? 'registerProfessional.signingUpSpecialist'
                    : salonMode === 'new'
                      ? 'registerProfessional.creatingSalon'
                      : 'registerProfessional.signingUpOwner'}
                  values={{ name: professionalRole === 'master' || salonMode === 'existing' ? selectedSalon?.name : salonForm.salonName }}
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>

            <form onSubmit={handleEmailRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('auth.firstName')}</label>
                  <input
                    required type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('auth.lastName')}</label>
                  <input
                    required type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('auth.email')}</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('auth.phone')}</label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                  placeholder="+1 234 567 8900"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {t('auth.atLeastOneContactRequired')}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('auth.password')}</label>
                <input
                  required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-colors"
                  placeholder={t('registerProfessional.minCharacters')} minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('auth.confirmPassword')}</label>
                <input
                  required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-[var(--color-error)] focus:border-[var(--color-error)]'
                      : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
                  }`}
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-[var(--color-error)] mt-1">{t('auth.passwordsDoNotMatch')}</p>
                )}
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2.5 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? t('registerProfessional.submitting') : t('registerProfessional.createAccount')}
              </button>
            </form>

            {showSocialAuth && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--color-divider)]" />
                  <span className="text-xs text-[var(--color-text-tertiary)]">{t('auth.orContinueWith')}</span>
                  <div className="flex-1 h-px bg-[var(--color-divider)]" />
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => googleLogin()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 border border-[var(--color-border)] rounded-[var(--radius-md)] py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)] disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t('auth.continueWithGoogle')}
                  </button>

                  {isHttps && (
                    <button
                      onClick={handleFacebook}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 border border-[var(--color-border)] rounded-[var(--radius-md)] py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)] disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      {t('auth.continueWithFacebook')}
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setStep('setup')}
              className="w-full text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors pt-1"
            >
              {t('registerProfessional.back')}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
