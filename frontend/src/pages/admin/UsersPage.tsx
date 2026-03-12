import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit2, Trash2, ShieldCheck, ShieldOff, UserCircle } from 'lucide-react';
import { getAdminUsers, setUserActive, deleteAdminUser } from '@/api/auth';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { AdminUserDto } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  SalonAdmin: 'Salon Admin',
  Master: 'Master',
  Client: 'Client',
};

const ROLE_FILTER_OPTIONS = ['All', 'SuperAdmin', 'SalonAdmin', 'Master', 'Client'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const apiRole = roleFilter === 'All' ? undefined : roleFilter;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', apiRole],
    queryFn: () => getAdminUsers(apiRole),
    refetchOnMount: 'always',
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setUserActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user status'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const handleDelete = (u: AdminUserDto) => {
    if (confirm(`Delete user "${u.email}"? This cannot be undone.`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q
      || u.email.toLowerCase().includes(q)
      || `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTER_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {r === 'All' ? 'All' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Provider</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {u.firstName || u.lastName
                        ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                        : <span className="text-gray-400 italic">No name</span>}
                    </p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'warning'}>
                      {u.isActive ? 'Active' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.externalProvider ?? 'Email'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => activateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        disabled={activateMutation.isPending}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {u.isActive ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                      </button>
                      <Link to={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(u)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
