import { useState } from 'react';
import { useAuth, type Role } from '@/contexts/AuthContext';

interface RoleMeta {
  value: Role;
  label: string;
  description: string;
  entityLabel: string | null;   // null = no entity ID needed
  entityPlaceholder: string;
  color: string;
  badgeLabel: string;
}

const ROLE_META: RoleMeta[] = [
  {
    value: 'superadmin',
    label: 'Super Admin',
    description: 'Full access — all salons, masters, bookings',
    entityLabel: null,
    entityPlaceholder: '',
    color: 'bg-purple-600',
    badgeLabel: 'Super Admin',
  },
  {
    value: 'salon_admin',
    label: 'Salon Admin',
    description: 'Manages one salon, its masters & bookings',
    entityLabel: 'Salon ID',
    entityPlaceholder: 'Paste a Salon ID (UUID)…',
    color: 'bg-blue-600',
    badgeLabel: 'Salon Admin',
  },
  {
    value: 'master_admin',
    label: 'Master',
    description: 'Manages own profile, services & bookings',
    entityLabel: 'Master ID',
    entityPlaceholder: 'Paste a Master ID (UUID)…',
    color: 'bg-emerald-600',
    badgeLabel: 'Master',
  },
  {
    value: 'client',
    label: 'Client',
    description: 'Public booking flow only — no admin access',
    entityLabel: null,
    entityPlaceholder: '',
    color: 'bg-gray-500',
    badgeLabel: 'Client',
  },
];

function metaFor(role: Role) {
  return ROLE_META.find(m => m.value === role)!;
}

export function DevRoleSwitcher() {
  if (!import.meta.env.DEV) return null;

  const { role, salonId, masterId } = useAuth();
  // setRole is a no-op since role comes from JWT — kept for UI demonstration only
  const setRole = (_role: Role, _entityId?: string) => {};
  const [open, setOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role>(role);
  const [entityId, setEntityId] = useState('');

  const currentMeta = metaFor(role);
  const pendingMeta = metaFor(pendingRole);
  const needsId = pendingMeta.entityLabel !== null;

  const handleSelect = (r: Role) => {
    setPendingRole(r);
    // Restore the already-saved ID for that role so users don't have to re-type it
    if (r === 'salon_admin') setEntityId(salonId ?? '');
    else if (r === 'master_admin') setEntityId(masterId ?? '');
    else setEntityId('');
  };

  const handleApply = () => {
    setRole(pendingRole, needsId ? entityId || undefined : undefined);
    setOpen(false);
  };

  const entityIdValue = role === 'salon_admin' ? salonId : role === 'master_admin' ? masterId : null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs select-none">
      {/* Floating badge */}
      <button
        onClick={() => {
          setPendingRole(role);
          if (role === 'salon_admin') setEntityId(salonId ?? '');
          else if (role === 'master_admin') setEntityId(masterId ?? '');
          else setEntityId('');
          setOpen(o => !o);
        }}
        className={`${currentMeta.color} text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse shrink-0" />
        <span>{currentMeta.badgeLabel}</span>
        {entityIdValue && (
          <span className="opacity-60 text-[10px]">{entityIdValue.slice(0, 8)}…</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-10 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl w-72 overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dev · Role Switcher</p>
            <p className="text-xs text-gray-500 mt-0.5">Changes are saved in localStorage</p>
          </div>

          <div className="p-3 space-y-1.5">
            {/* Role list */}
            {ROLE_META.map(({ value, label, description, color }) => {
              const isSelected = pendingRole === value;
              const isActive = role === value;
              return (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-start gap-3 ${
                    isSelected
                      ? `${color} text-white`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs">{label}</span>
                      {isActive && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                          active
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-white/75' : 'text-gray-400'}`}>
                      {description}
                    </p>
                  </div>
                  {isSelected && <span className="text-white mt-0.5">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Entity ID input — shown only when selected role needs one */}
          {needsId && (
            <div className="px-3 pb-3 space-y-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {pendingMeta.entityLabel} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={entityId}
                onChange={e => setEntityId(e.target.value)}
                placeholder={pendingMeta.entityPlaceholder}
                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-mono"
                autoFocus
              />
              <p className="text-[10px] text-gray-400">
                Copy the ID from the {pendingMeta.entityLabel?.toLowerCase()} URL or admin list.
              </p>
            </div>
          )}

          {/* Current session info */}
          <div className="mx-3 mb-3 bg-gray-50 rounded-xl p-2.5 text-[10px] text-gray-500 space-y-0.5">
            <p className="font-semibold text-gray-400 uppercase tracking-wide mb-1">Current session</p>
            <p><span className="text-gray-600 font-medium">Role:</span> {currentMeta.label}</p>
            {salonId && <p><span className="text-gray-600 font-medium">Salon ID:</span> {salonId}</p>}
            {masterId && <p><span className="text-gray-600 font-medium">Master ID:</span> {masterId}</p>}
            {!salonId && !masterId && role !== 'client' && role !== 'superadmin' && (
              <p className="text-amber-500">⚠ No entity ID set</p>
            )}
          </div>

          {/* Apply button */}
          <div className="px-3 pb-3">
            <button
              onClick={handleApply}
              disabled={needsId && !entityId}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                needsId && !entityId
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : `${pendingMeta.color} text-white hover:opacity-90`
              }`}
            >
              Apply — Switch to {pendingMeta.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
