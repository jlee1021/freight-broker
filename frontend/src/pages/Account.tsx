import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

// ── 타입 ─────────────────────────────────────────────────────────────
type User = { id: string; email: string; full_name: string | null; role: string | null; partner_id?: string | null; partner_name?: string | null; partner_type?: string | null }
type Partner = { id: string; name: string; type: string | null }
type ItemType = { id: string; code?: string; type_name: string; lvl1?: string; lvl2?: string; uom?: string; account_type?: string; rc: boolean; rebate: boolean; is_active: boolean }
type Expense = { id: string; ref_no?: string; bill_to?: string; po_no?: string; memo?: string; expense_date?: string; amount?: number; tax_amount?: number; account?: string; vendor?: string; status?: string; created_at?: string }
type DebitCredit = { id: string; entry_type: string; reason?: string; debit_amount?: number; credit_amount?: number; customer_code?: string; tax_number?: string; email?: string; note?: string; status?: string; created_at?: string }

const ROLES = ['admin', 'dispatcher', 'sales', 'billing']
type Tab = 'users' | 'itemtype' | 'expense' | 'debitcredit'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ── Users 탭 (기존 로직 유지) ─────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: true; user: User | null } | { open: false }>({ open: false })
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'dispatcher', partner_id: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    apiJson<User[]>('/users').then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => setUsers([])).finally(() => setLoading(false))
    apiJson<Partner[]>('/partners').then(p => setPartners(Array.isArray(p) ? p : [])).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ email: '', password: '', full_name: '', role: 'dispatcher', partner_id: '' }); setModal({ open: true, user: null }) }
  const openEdit = (u: User) => { setForm({ email: u.email, password: '', full_name: u.full_name ?? '', role: u.role ?? 'dispatcher', partner_id: u.partner_id ?? '' }); setModal({ open: true, user: u }) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal.open && modal.user) {
        await apiFetch(`/users/${modal.user.id}`, { method: 'PATCH', body: JSON.stringify({ full_name: form.full_name.trim() || null, role: form.role, partner_id: form.partner_id.trim() || null, ...(form.password ? { password: form.password } : {}) }) })
      } else {
        if (!form.email.trim() || !form.password) { alert('Email & password required'); setSaving(false); return }
        await apiFetch('/users', { method: 'POST', body: JSON.stringify({ email: form.email.trim(), password: form.password, full_name: form.full_name.trim() || null, role: form.role, partner_id: form.partner_id.trim() || null }) })
      }
      setModal({ open: false }); load()
    } catch (e: any) { alert(e?.message || 'Failed') }
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={openAdd} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add User</button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Role</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Portal</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
          </tr></thead>
          <tbody>
            {users.length === 0
              ? <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No users.</td></tr>
              : users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.full_name ?? '-'}</td>
                  <td className="px-4 py-2">{u.role ?? '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{u.partner_name ? `${u.partner_name} (${u.partner_type ?? ''})` : '-'}</td>
                  <td className="px-4 py-2"><button onClick={() => openEdit(u)} className="text-blue-600 hover:underline">Edit</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modal.open && (
        <Modal title={modal.user ? 'Edit User' : 'Add User'} onClose={() => setModal({ open: false })}>
          <form onSubmit={submit} className="space-y-3">
            {[{ label: 'Email', key: 'email', type: 'email', disabled: !!modal.user }, { label: 'Full Name', key: 'full_name', type: 'text', disabled: false }].map(({ label, key, type, disabled }) => (
              <div key={key}>
                <label className="text-sm text-gray-600 block mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} disabled={disabled} className="w-full border rounded px-3 py-2 disabled:bg-gray-100" />
              </div>
            ))}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border rounded px-3 py-2">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Portal Partner</label>
              <select value={form.partner_id} onChange={e => setForm(f => ({ ...f, partner_id: e.target.value }))} className="w-full border rounded px-3 py-2">
                <option value="">None</option>
                {partners.filter(p => p.type === 'customer' || p.type === 'carrier').map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Password {modal.user && '(blank = keep)'}</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── ItemType 탭 ───────────────────────────────────────────────────────
function ItemTypeTab() {
  const [items, setItems] = useState<ItemType[]>([])
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ItemType | null>(null)
  const [form, setForm] = useState<Partial<ItemType>>({ rc: false, rebate: false, is_active: true })
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<ItemType[]>('/account/item-types').then(setItems).catch(() => {})
  useEffect(() => { load() }, [])

  const filtered = items.filter(i => !q || i.type_name.toLowerCase().includes(q.toLowerCase()) || (i.code || '').toLowerCase().includes(q.toLowerCase()))

  const save = async () => {
    if (!form.type_name?.trim()) { alert('Type name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/account/item-types/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/account/item-types', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border rounded px-3 py-1.5 text-sm flex-1" />
        <button onClick={() => { setEditing(null); setForm({ rc: false, rebate: false, is_active: true }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Code</th><th className="border px-3 py-2">Type Name</th><th className="border px-3 py-2">Lvl 1</th>
          <th className="border px-3 py-2">Lvl 2</th><th className="border px-3 py-2">UOM</th><th className="border px-3 py-2">RC</th>
          <th className="border px-3 py-2">Rebate</th><th className="border px-3 py-2">Account Type</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{filtered.map(it => (
          <tr key={it.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5">{it.code}</td>
            <td className="border px-3 py-1.5 font-medium">{it.type_name}</td>
            <td className="border px-3 py-1.5">{it.lvl1}</td>
            <td className="border px-3 py-1.5">{it.lvl2}</td>
            <td className="border px-3 py-1.5">{it.uom}</td>
            <td className="border px-3 py-1.5">{it.rc ? '✓' : ''}</td>
            <td className="border px-3 py-1.5">{it.rebate ? '✓' : ''}</td>
            <td className="border px-3 py-1.5 text-xs text-gray-500">{it.account_type}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => { setEditing(it); setForm(it); setShowModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/account/item-types/${it.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit Item Type' : 'Add Item Type'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[{ label: 'Type Name *', key: 'type_name' }, { label: 'Code', key: 'code' }, { label: 'Level 1', key: 'lvl1' }, { label: 'Level 2', key: 'lvl2' }, { label: 'Dividers', key: 'dividers' }, { label: 'UOM', key: 'uom' }, { label: 'Account Type', key: 'account_type' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="flex gap-4">
              {[{ label: 'RC', key: 'rc' }, { label: 'Rebate', key: 'rebate' }, { label: 'Active', key: 'is_active' }].map(({ label, key }) => (
                <div key={key} className="flex items-center gap-1">
                  <input type="checkbox" checked={!!(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  <label className="text-sm">{label}</label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Expense 탭 ────────────────────────────────────────────────────────
function ExpenseTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<Partial<Expense>>({ status: 'pending' })
  const [saving, setSaving] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null)

  type ExpDetail = { id: string; expense_id: string; entry_number?: string; general_account?: string; entry_type?: string; status?: string; accountability?: string; vendor?: string; amount?: number }
  const [details, setDetails] = useState<ExpDetail[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailForm, setDetailForm] = useState<Partial<ExpDetail>>({})
  const [detailSaving, setDetailSaving] = useState(false)

  const load = () => {
    apiJson<Expense[]>('/account/expenses').then(setExpenses).catch(() => {})
    apiJson<ItemType[]>('/account/item-types').then(setItemTypes).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const loadDetails = (id: string) => {
    setSelectedExpense(id)
    apiJson<Expense & { details: ExpDetail[] }>(`/account/expenses/${id}`).then(e => setDetails((e as any).details || [])).catch(() => {})
  }

  const saveExpense = async () => {
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/account/expenses/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/account/expenses', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  const saveDetail = async () => {
    if (!selectedExpense) return
    setDetailSaving(true)
    try {
      await apiFetch(`/account/expenses/${selectedExpense}/details`, { method: 'POST', body: JSON.stringify(detailForm) })
      setShowDetailModal(false); loadDetails(selectedExpense)
    } catch { alert('Save failed') }
    setDetailSaving(false)
  }

  const statusBadge = (s?: string) => {
    const colors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800' }
    return <span className={`px-2 py-0.5 rounded text-xs ${colors[s || ''] || 'bg-gray-100 text-gray-600'}`}>{s || '—'}</span>
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(null); setForm({ status: 'pending' }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Expense</button>
      </div>
      <div className="flex gap-4">
        {/* Expense 목록 */}
        <div className="flex-1">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-gray-50 text-left">
              <th className="border px-3 py-2">Ref#</th><th className="border px-3 py-2">Vendor</th>
              <th className="border px-3 py-2">Date</th><th className="border px-3 py-2">Amount</th>
              <th className="border px-3 py-2">Status</th><th className="border px-3 py-2">Action</th>
            </tr></thead>
            <tbody>{expenses.map(e => (
              <tr key={e.id} className={`hover:bg-gray-50 cursor-pointer ${selectedExpense === e.id ? 'bg-blue-50' : ''}`} onClick={() => loadDetails(e.id)}>
                <td className="border px-3 py-1.5">{e.ref_no || '—'}</td>
                <td className="border px-3 py-1.5">{e.vendor}</td>
                <td className="border px-3 py-1.5">{e.expense_date}</td>
                <td className="border px-3 py-1.5">${Number(e.amount || 0).toFixed(2)}</td>
                <td className="border px-3 py-1.5">{statusBadge(e.status)}</td>
                <td className="border px-3 py-1.5">
                  <button onClick={ev => { ev.stopPropagation(); setEditing(e); setForm(e); setShowModal(true) }} className="text-blue-600 hover:underline text-xs mr-1">Edit</button>
                  <button onClick={async ev => { ev.stopPropagation(); if (confirm('Delete?')) { await apiFetch(`/account/expenses/${e.id}`, { method: 'DELETE' }); load(); if (selectedExpense === e.id) setSelectedExpense(null) } }} className="text-red-500 hover:underline text-xs">Del</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        {/* 선택된 Expense Details */}
        {selectedExpense && (
          <div className="w-80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm text-gray-700">Expense Details</h3>
              <button onClick={() => { setDetailForm({}); setShowDetailModal(true) }} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">+ Add</button>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-gray-50"><th className="border px-2 py-1">Entry#</th><th className="border px-2 py-1">Vendor</th><th className="border px-2 py-1">Amount</th><th className="border px-2 py-1">Del</th></tr></thead>
              <tbody>{details.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{d.entry_number}</td>
                  <td className="border px-2 py-1">{d.vendor}</td>
                  <td className="border px-2 py-1">${Number(d.amount || 0).toFixed(2)}</td>
                  <td className="border px-2 py-1"><button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/account/expenses/details/${d.id}`, { method: 'DELETE' }); loadDetails(selectedExpense) } }} className="text-red-500">×</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense 추가/수정 모달 */}
      {showModal && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Item Type</label>
              <select value={form.id || ''} onChange={e => setForm(f => ({ ...f, item_type_id: e.target.value } as any))} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="">-- Select --</option>
                {itemTypes.map(it => <option key={it.id} value={it.id}>{it.type_name}</option>)}
              </select>
            </div>
            {[{ label: 'Ref No', key: 'ref_no' }, { label: 'Bill To', key: 'bill_to' }, { label: 'PO No', key: 'po_no' }, { label: 'Account', key: 'account' }, { label: 'Vendor', key: 'vendor' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Date</label>
                <input type="date" value={form.expense_date || ''} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Status</label>
                <select value={form.status || 'pending'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Amount</label>
                <input type="number" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Tax Amount</label>
                <input type="number" step="0.01" value={form.tax_amount || ''} onChange={e => setForm(f => ({ ...f, tax_amount: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Memo</label>
              <textarea value={form.memo || ''} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveExpense} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ExpenseDetail 추가 모달 */}
      {showDetailModal && (
        <Modal title="Add Expense Detail" onClose={() => setShowDetailModal(false)}>
          <div className="space-y-2">
            {[{ label: 'Entry #', key: 'entry_number' }, { label: 'General Account', key: 'general_account' }, { label: 'Entry Type', key: 'entry_type' }, { label: 'Status', key: 'status' }, { label: 'Accountability', key: 'accountability' }, { label: 'Vendor', key: 'vendor' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(detailForm as any)[key] || ''} onChange={e => setDetailForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Amount</label>
              <input type="number" step="0.01" value={detailForm.amount || ''} onChange={e => setDetailForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveDetail} disabled={detailSaving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{detailSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Debit/Credit 탭 ───────────────────────────────────────────────────
function DebitCreditTab() {
  const [items, setItems] = useState<DebitCredit[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DebitCredit | null>(null)
  const [form, setForm] = useState<Partial<DebitCredit>>({ entry_type: 'debit', status: 'pending' })
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('')

  const load = () => {
    const q = filterType ? `?entry_type=${filterType}` : ''
    apiJson<DebitCredit[]>(`/account/debit-credits${q}`).then(setItems).catch(() => {})
  }
  useEffect(() => { load() }, [filterType])

  const save = async () => {
    if (!form.entry_type) { alert('Entry type required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/account/debit-credits/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/account/debit-credits', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
        <div className="flex-1" />
        <button onClick={() => { setEditing(null); setForm({ entry_type: 'debit', status: 'pending' }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Type</th><th className="border px-3 py-2">Customer Code</th>
          <th className="border px-3 py-2">Debit</th><th className="border px-3 py-2">Credit</th>
          <th className="border px-3 py-2">Status</th><th className="border px-3 py-2">Reason</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{items.map(dc => (
          <tr key={dc.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${dc.entry_type === 'debit' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{dc.entry_type}</span>
            </td>
            <td className="border px-3 py-1.5">{dc.customer_code}</td>
            <td className="border px-3 py-1.5 text-red-600">{dc.debit_amount ? `$${Number(dc.debit_amount).toFixed(2)}` : ''}</td>
            <td className="border px-3 py-1.5 text-green-600">{dc.credit_amount ? `$${Number(dc.credit_amount).toFixed(2)}` : ''}</td>
            <td className="border px-3 py-1.5"><span className="px-2 py-0.5 rounded text-xs bg-gray-100">{dc.status}</span></td>
            <td className="border px-3 py-1.5 text-gray-500 text-xs max-w-[200px] truncate">{dc.reason}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => { setEditing(dc); setForm(dc); setShowModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/account/debit-credits/${dc.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit Debit/Credit' : 'Add Debit/Credit'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Type *</label>
              <select value={form.entry_type || 'debit'} onChange={e => setForm(f => ({ ...f, entry_type: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            {[{ label: 'Customer Code', key: 'customer_code' }, { label: 'Tax #', key: 'tax_number' }, { label: 'Email', key: 'email' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Debit Amount</label>
                <input type="number" step="0.01" value={form.debit_amount || ''} onChange={e => setForm(f => ({ ...f, debit_amount: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Credit Amount</label>
                <input type="number" step="0.01" value={form.credit_amount || ''} onChange={e => setForm(f => ({ ...f, credit_amount: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Status</label>
              <select value={form.status || 'pending'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Reason</label>
              <textarea value={form.reason || ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Note</label>
              <textarea value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const TAB_TO_PATH: Record<Tab, string> = { users: 'users', itemtype: 'item-type', expense: 'expense', debitcredit: 'debit-credit' }
const PATH_TO_TAB: Record<string, Tab> = { users: 'users', 'item-type': 'itemtype', expense: 'expense', 'debit-credit': 'debitcredit' }

// ── 메인 Account 페이지 ───────────────────────────────────────────────
export default function Account() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathSegment = location.pathname.replace(/^\/account\/?/, '') || 'users'
  const tabFromPath = PATH_TO_TAB[pathSegment] ?? 'users'
  const [tab, setTab] = useState<Tab>(tabFromPath)

  useEffect(() => { setTab(tabFromPath) }, [tabFromPath])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'itemtype', label: 'Item Type List' },
    { key: 'expense', label: 'Expense' },
    { key: 'debitcredit', label: 'Debit / Credit' },
  ]

  const onTabClick = (t: Tab) => {
    setTab(t)
    navigate(`/account/${TAB_TO_PATH[t]}`, { replace: true })
  }

  return (
    <div>
      <h1 className="page-title">Account</h1>
      <div className="flex gap-0 border-b mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => onTabClick(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'itemtype' && <div className="card"><ItemTypeTab /></div>}
      {tab === 'expense' && <div className="card"><ExpenseTab /></div>}
      {tab === 'debitcredit' && <div className="card"><DebitCreditTab /></div>}
    </div>
  )
}
