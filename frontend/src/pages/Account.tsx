import { useState, useEffect } from 'react'
import { apiJson, apiFetch } from '../api'

type User = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  partner_id?: string | null
  partner_name?: string | null
  partner_type?: string | null
}
type Partner = { id: string; name: string; type: string | null }

const ROLES = ['admin', 'dispatcher', 'sales', 'billing']

export default function Account() {
  const [users, setUsers] = useState<User[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: true; user: User | null } | { open: false }>({ open: false })
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'dispatcher', partner_id: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    apiJson<User[]>('/users')
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
    apiJson<Partner[]>('/partners').then((p) => setPartners(Array.isArray(p) ? p : [])).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setForm({ email: '', password: '', full_name: '', role: 'dispatcher', partner_id: '' })
    setModal({ open: true, user: null })
  }

  const openEdit = (u: User) => {
    setForm({
      email: u.email,
      password: '',
      full_name: u.full_name ?? '',
      role: u.role ?? 'dispatcher',
      partner_id: u.partner_id ?? '',
    })
    setModal({ open: true, user: u })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.open && modal.user) {
        await apiFetch(`/users/${modal.user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: form.full_name.trim() || null,
            role: form.role,
            partner_id: form.partner_id.trim() || null,
            ...(form.password ? { password: form.password } : {}),
          }),
        })
      } else {
        if (!form.email.trim()) {
          alert('Email required')
          setSaving(false)
          return
        }
        if (!form.password) {
          alert('Password required for new user')
          setSaving(false)
          return
        }
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            full_name: form.full_name.trim() || null,
            role: form.role,
            partner_id: form.partner_id.trim() || null,
          }),
        })
      }
      setModal({ open: false })
      load()
    } catch (err: any) {
      alert(err?.message || 'Failed')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Account</h1>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Add user
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Portal (Partner)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No users. Default admin (admin@local) is created on first API start.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.full_name ?? '-'}</td>
                    <td className="px-4 py-2">{u.role ?? '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{u.partner_name ? `${u.partner_name} (${u.partner_type ?? ''})` : '-'}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{modal.user ? 'Edit user' : 'Add user'}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                  disabled={!!modal.user}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Portal partner (고객/캐리어 로그인 시 해당 파트너 데이터만 표시)</label>
                <select
                  value={form.partner_id}
                  onChange={(e) => setForm((f) => ({ ...f, partner_id: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {partners.filter((p) => p.type === 'customer' || p.type === 'carrier').map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type ?? '-'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Password {modal.user && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder={modal.user ? 'Optional' : 'Required'}
                  required={!modal.user}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ open: false })}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
