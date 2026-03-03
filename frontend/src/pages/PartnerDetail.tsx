import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type Partner = {
  id: string; name: string; type: string | null
  contact_email: string | null; contact_phone: string | null
  address: string | null; city: string | null; province: string | null
  country: string | null; postal_code: string | null
  mc_number: string | null; dot_number: string | null
  insurance_expiry: string | null; payment_terms: string | null; notes: string | null
  code: string | null; legal_name: string | null; operating_status: string | null
  carrier_type: string | null; service_hours: string | null; mc_status: string | null
  hazmat_carrier: boolean; w9_received: boolean; default_tax_code: string | null
  payment_days: number | null; payment_type: string | null
  ach_eft_banking: string | null; factor_company_name: string | null
  personal_message: string | null; bill_to: string | null
  credit_limit: number | null; truck_calls: number | null
  account_type: string | null; discount_pct: number | null
  currency: string | null; expense_terms: string | null
  is_active: boolean
}

type Location = { id: string; name?: string; address?: string; tel?: string; city?: string; state?: string; zip_code?: string; entry_date?: string; notes?: string; bill?: string; description?: string; billing_ship_to?: string; comments?: string; is_active: boolean }
type Staff = { id: string; full_name: string; department?: string; email?: string; phone?: string; title?: string; is_active: boolean }
type Contact = { id: string; name: string; department?: string; email?: string; phone?: string; is_primary: boolean }
type Vehicle = { id: string; vehicle_type?: string; vehicle_number?: string; model?: string; price?: number }

type DetailTab = 'general' | 'load_setup' | 'quick_view' | 'locations' | 'staff' | 'contacts' | 'vehicles' | 'teams' | 'services' | 'email_templates' | 'operation_info'

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

// ── Location 탭 ──────────────────────────────────────────────────────
function LocationsTab({ partnerId, partnerType }: { partnerId: string; partnerType: string | null }) {
  const [items, setItems] = useState<Location[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState<Partial<Location>>({})
  const [saving, setSaving] = useState(false)
  const isCustomer = partnerType === 'customer'

  const load = () => apiJson<Location[]>(`/partners/${partnerId}/locations`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])

  const openAdd = () => { setEditing(null); setForm({ is_active: true }); setShowModal(true) }
  const openEdit = (l: Location) => { setEditing(l); setForm(l); setShowModal(true) }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/partners/${partnerId}/locations/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch(`/partners/${partnerId}/locations`, { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await apiFetch(`/partners/${partnerId}/locations/${id}`, { method: 'DELETE' }); load()
  }

  const f = (key: keyof Location) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={openAdd} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Location</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Name</th><th className="border px-3 py-2">Address</th>
          <th className="border px-3 py-2">City</th><th className="border px-3 py-2">Tel</th>
          <th className="border px-3 py-2">Active</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{items.map(l => (
          <tr key={l.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5 font-medium">{l.name}</td>
            <td className="border px-3 py-1.5">{l.address}</td>
            <td className="border px-3 py-1.5">{l.city}{l.state ? `, ${l.state}` : ''}</td>
            <td className="border px-3 py-1.5">{l.tel}</td>
            <td className="border px-3 py-1.5">{l.is_active ? '✓' : '—'}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => openEdit(l)} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={() => del(l.id)} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit Location' : 'Add Location'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[
              { label: 'Location Name', key: 'name' }, { label: 'Address', key: 'address' },
              { label: 'Tel', key: 'tel' }, { label: 'City', key: 'city' },
              { label: 'State/Province', key: 'state' }, { label: 'Zip Code', key: 'zip_code' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={f(key as keyof Location)} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Entry Date</label>
              <input type="date" value={(form.entry_date || '')} onChange={e => setForm(p => ({ ...p, entry_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            {isCustomer && <>
              {[{ label: 'Bill', key: 'bill' }, { label: 'Billing/Ship To', key: 'billing_ship_to' }].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                  <input value={(form as any)[key] || ''} onChange={f(key as keyof Location)} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Comments</label>
                <textarea value={form.comments || ''} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </>}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              <label className="text-sm">Active</label>
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

// ── Staff 탭 ─────────────────────────────────────────────────────────
function StaffTab({ partnerId }: { partnerId: string }) {
  const [items, setItems] = useState<Staff[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState<Partial<Staff>>({})
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<Staff[]>(`/partners/${partnerId}/staff`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])

  const save = async () => {
    if (!form.full_name?.trim()) { alert('Name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/partners/${partnerId}/staff/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch(`/partners/${partnerId}/staff`, { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(null); setForm({ is_active: true }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Staff</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Name</th><th className="border px-3 py-2">Title</th>
          <th className="border px-3 py-2">Department</th><th className="border px-3 py-2">Email</th>
          <th className="border px-3 py-2">Phone</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{items.map(s => (
          <tr key={s.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5 font-medium">{s.full_name}</td>
            <td className="border px-3 py-1.5">{s.title}</td>
            <td className="border px-3 py-1.5">{s.department}</td>
            <td className="border px-3 py-1.5">{s.email}</td>
            <td className="border px-3 py-1.5">{s.phone}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => { setEditing(s); setForm(s); setShowModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/partners/${partnerId}/staff/${s.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit Staff' : 'Add Staff'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[{ label: 'Full Name *', key: 'full_name' }, { label: 'Title', key: 'title' }, { label: 'Department', key: 'department' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
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

// ── Contacts 탭 ─────────────────────────────────────────────────────
function ContactsTab({ partnerId }: { partnerId: string }) {
  const [items, setItems] = useState<Contact[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Partial<Contact>>({})
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<Contact[]>(`/partners/${partnerId}/contacts`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])

  const save = async () => {
    if (!form.name?.trim()) { alert('Name required'); return }
    setSaving(true)
    try { await apiFetch(`/partners/${partnerId}/contacts`, { method: 'POST', body: JSON.stringify(form) }); setShowModal(false); load() }
    catch { alert('Save failed') }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setForm({ is_primary: false }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Contact</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Name</th><th className="border px-3 py-2">Department</th>
          <th className="border px-3 py-2">Email</th><th className="border px-3 py-2">Phone</th>
          <th className="border px-3 py-2">Primary</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{items.map(c => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5 font-medium">{c.name}</td>
            <td className="border px-3 py-1.5">{c.department}</td>
            <td className="border px-3 py-1.5">{c.email}</td>
            <td className="border px-3 py-1.5">{c.phone}</td>
            <td className="border px-3 py-1.5">{c.is_primary ? '★' : ''}</td>
            <td className="border px-3 py-1.5">
              <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/partners/${partnerId}/contacts/${c.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title="Add Contact" onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[{ label: 'Name *', key: 'name' }, { label: 'Department', key: 'department' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_primary || false} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} />
              <label className="text-sm">Primary Contact</label>
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

// ── Vehicles 탭 ──────────────────────────────────────────────────────
function VehiclesTab({ partnerId }: { partnerId: string }) {
  const [items, setItems] = useState<Vehicle[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<Partial<Vehicle>>({})
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<Vehicle[]>(`/partners/${partnerId}/vehicles`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/partners/${partnerId}/vehicles/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch(`/partners/${partnerId}/vehicles`, { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(null); setForm({}); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Vehicle</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Type</th><th className="border px-3 py-2">Number</th>
          <th className="border px-3 py-2">Model</th><th className="border px-3 py-2">Price</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{items.map(v => (
          <tr key={v.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5">{v.vehicle_type}</td>
            <td className="border px-3 py-1.5">{v.vehicle_number}</td>
            <td className="border px-3 py-1.5">{v.model}</td>
            <td className="border px-3 py-1.5">{v.price != null ? `$${Number(v.price).toLocaleString()}` : ''}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => { setEditing(v); setForm(v); setShowModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/partners/${partnerId}/vehicles/${v.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[{ label: 'Vehicle Type', key: 'vehicle_type' }, { label: 'Vehicle Number', key: 'vehicle_number' }, { label: 'Model', key: 'model' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Price</label>
              <input type="number" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) || undefined }))} className="w-full border rounded px-2 py-1.5 text-sm" />
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

// ── Teams 탭 ─────────────────────────────────────────────────────────
function TeamsTab({ partnerId }: { partnerId: string }) {
  type Team = { id: string; name: string; role?: string; email?: string; is_active: boolean }
  const [items, setItems] = useState<Team[]>([])
  const [form, setForm] = useState({ name: '', role: '', email: '' })
  const [saving, setSaving] = useState(false)
  const load = () => apiJson<Team[]>(`/partners/${partnerId}/teams`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])
  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await apiFetch(`/partners/${partnerId}/teams`, { method: 'POST', body: JSON.stringify(form) }); setForm({ name: '', role: '', email: '' }); load() } catch { alert('Save failed') }
    setSaving(false)
  }
  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap items-end">
        {[['Name *', 'name'], ['Role', 'role'], ['Email', 'email']].map(([l, k]) => (
          <div key={k}>
            <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
            <input value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-36" />
          </div>
        ))}
        <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">Add</button>
      </div>
      <table className="w-full text-sm border-collapse"><thead><tr className="bg-gray-50 text-left"><th className="border px-3 py-2">Name</th><th className="border px-3 py-2">Role</th><th className="border px-3 py-2">Email</th><th className="border px-3 py-2">Action</th></tr></thead>
        <tbody>{items.map(t => (<tr key={t.id} className="hover:bg-gray-50">
          <td className="border px-3 py-1.5 font-medium">{t.name}</td>
          <td className="border px-3 py-1.5">{t.role ?? '–'}</td>
          <td className="border px-3 py-1.5">{t.email ?? '–'}</td>
          <td className="border px-3 py-1.5"><button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/partners/${partnerId}/teams/${t.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button></td>
        </tr>))}</tbody>
      </table>
    </div>
  )
}

// ── Services 탭 ──────────────────────────────────────────────────────
function ServicesTab({ partnerId }: { partnerId: string }) {
  type Service = { id: string; item: string; service_type?: string; quantity?: number; unit?: string; notes?: string; is_active: boolean }
  const [items, setItems] = useState<Service[]>([])
  const [form, setForm] = useState({ item: '', service_type: '', quantity: '', unit: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const ITEMS = ['Air freight', 'FCL', 'LCL', 'LTL', 'Ocean freight', 'Rail', 'Road', 'Other']
  const load = () => apiJson<Service[]>(`/partners/${partnerId}/services`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])
  const save = async () => {
    if (!form.item.trim()) return
    setSaving(true)
    try { await apiFetch(`/partners/${partnerId}/services`, { method: 'POST', body: JSON.stringify({ ...form, quantity: form.quantity ? parseFloat(form.quantity) : null }) }); setForm({ item: '', service_type: '', quantity: '', unit: '', notes: '' }); load() } catch { alert('Save failed') }
    setSaving(false)
  }
  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap items-end">
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Item *</label>
          <select value={form.item} onChange={e => setForm(p => ({ ...p, item: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-36">
            <option value="">Select...</option>{ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        {[['Type', 'service_type'], ['Qty', 'quantity'], ['Unit', 'unit']].map(([l, k]) => (
          <div key={k}>
            <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
            <input value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-24" />
          </div>
        ))}
        <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">Add</button>
      </div>
      <table className="w-full text-sm border-collapse"><thead><tr className="bg-gray-50 text-left"><th className="border px-3 py-2">Item</th><th className="border px-3 py-2">Type</th><th className="border px-3 py-2">Qty</th><th className="border px-3 py-2">Unit</th><th className="border px-3 py-2">Action</th></tr></thead>
        <tbody>{items.map(s => (<tr key={s.id} className="hover:bg-gray-50">
          <td className="border px-3 py-1.5 font-medium">{s.item}</td>
          <td className="border px-3 py-1.5">{s.service_type ?? '–'}</td>
          <td className="border px-3 py-1.5">{s.quantity ?? '–'}</td>
          <td className="border px-3 py-1.5">{s.unit ?? '–'}</td>
          <td className="border px-3 py-1.5"><button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/partners/${partnerId}/services/${s.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button></td>
        </tr>))}</tbody>
      </table>
    </div>
  )
}

// ── Email Templates 탭 ───────────────────────────────────────────────
function EmailTemplatesTab({ partnerId }: { partnerId: string }) {
  type Tmpl = { id: string; template_type: string; send_reply: boolean; subject?: string; body?: string; leading_team?: string }
  const [items, setItems] = useState<Tmpl[]>([])
  const [form, setForm] = useState({ template_type: 'load_confirmation', send_reply: false, subject: '', body: '', leading_team: '' })
  const [saving, setSaving] = useState(false)
  const TYPES = ['load_confirmation', 'driver_display', 'rate_confirmation', 'pickup_notice', 'delivery_notice', 'invoice']
  const load = () => apiJson<Tmpl[]>(`/partners/${partnerId}/email-templates`).then(setItems).catch(() => {})
  useEffect(() => { load() }, [partnerId])
  const save = async () => {
    setSaving(true)
    try { await apiFetch(`/partners/${partnerId}/email-templates`, { method: 'POST', body: JSON.stringify(form) }); load() } catch { alert('Save failed') }
    setSaving(false)
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Template Type</label>
          <select value={form.template_type} onChange={e => setForm(p => ({ ...p, template_type: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Leading Team</label>
          <input value={form.leading_team} onChange={e => setForm(p => ({ ...p, leading_team: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-600 block mb-0.5">Subject</label>
          <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-600 block mb-0.5">Body</label>
          <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.send_reply} onChange={e => setForm(p => ({ ...p, send_reply: e.target.checked }))} />
          <label className="text-sm">Send Reply</label>
        </div>
        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">{saving ? 'Saving...' : 'Add Template'}</button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map(t => (
          <div key={t.id} className="border rounded p-3 flex justify-between items-start">
            <div>
              <span className="font-medium text-sm capitalize">{t.template_type.replace(/_/g, ' ')}</span>
              {t.subject && <p className="text-xs text-gray-600 mt-1">{t.subject}</p>}
            </div>
            <button onClick={async () => { await apiFetch(`/partners/${partnerId}/email-templates/${t.id}`, { method: 'DELETE' }); load() }} className="text-red-500 hover:underline text-xs">Del</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Operation Info 탭 (캐리어 전용) ──────────────────────────────────
function OperationInfoTab({ partnerId }: { partnerId: string }) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const load = () => apiJson<Record<string, string>>(`/partners/${partnerId}/operation-info`).then(d => setForm(d || {})).catch(() => {})
  useEffect(() => { load() }, [partnerId])
  const save = async () => {
    setSaving(true)
    try { await apiFetch(`/partners/${partnerId}/operation-info`, { method: 'PUT', body: JSON.stringify(form) }) } catch { alert('Save failed') }
    setSaving(false)
  }
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const OPS_TIMES = ['MON-FRI', 'MON-SAT', '24/7', 'BY APPT', 'CLOSED']
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Operation Times</label>
          <select value={form.operation_times || ''} onChange={f('operation_times')} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="">– Select –</option>{OPS_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Timezone</label>
          <input value={form.timezone || ''} onChange={f('timezone')} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="e.g. EST" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Default Trip Type</label>
          <input value={form.default_trip_type || ''} onChange={f('default_trip_type')} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Default Rate Type</label>
          <input value={form.default_rate_type || ''} onChange={f('default_rate_type')} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Load Hours</label>
          <input value={form.load_hours || ''} onChange={f('load_hours')} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Pickup Hours</label>
          <input value={form.pickup_hours || ''} onChange={f('pickup_hours')} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Info</h4>
        <div className="grid grid-cols-2 gap-3">
          {[['Pay/Day', 'pay_per_day'], ['Invoice TT', 'invoice_tt'], ['Invoice ET', 'invoice_et'], ['E-Transfer', 'invoice_etransfer']].map(([l, k]) => (
            <div key={k}>
              <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
              <input value={form[k] || ''} onChange={f(k)} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs text-gray-600 block mb-0.5">Payment Notes</label>
            <textarea value={form.payment_notes || ''} onChange={f('payment_notes')} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">API Works</h4>
        <div className="grid grid-cols-2 gap-3">
          {[['API Key', 'api_key'], ['API Secret', 'api_secret'], ['API Endpoint', 'api_endpoint']].map(([l, k]) => (
            <div key={k}>
              <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
              <input value={form[k] || ''} onChange={f(k)} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs text-gray-600 block mb-0.5">API Notes</label>
            <textarea value={form.api_notes || ''} onChange={f('api_notes')} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
      </div>
      <div><button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{saving ? 'Saving...' : 'Save Operation Info'}</button></div>
    </div>
  )
}

// ── Customer General 탭 (2-column: Info | Billing) ────────────────
function CustomerGeneralTab({ form, setForm }: {
  form: any; setForm: any; partnerId?: string; save?: () => void; saving?: boolean
}) {
  const fi = (label: string, key: string, type = 'text') => (
    <div key={key}>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
    </div>
  )

  return (
    <div className="flex gap-0">
      {/* LEFT: Customer Info */}
      <div className="flex-1 pr-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Info</h4>
        {fi('Name *', 'name')}
        {fi('Address', 'address')}
        <div className="grid grid-cols-2 gap-2">
          {fi('Country', 'country')}
          {fi('Province', 'province')}
          {fi('City', 'city')}
          {fi('Postal Code', 'postal_code')}
        </div>
        {fi('Account No', 'code')}
        {fi('Load Req', 'bill_to')}
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Load Information</label>
          <textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        {fi('Contact Email', 'contact_email', 'email')}
        {fi('Contact Phone', 'contact_phone')}
      </div>
      {/* RIGHT: Billing + Tax (blue bg) */}
      <div className="w-72 shrink-0 bg-blue-50 rounded-lg p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Billing</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Credit Terms</label>
              <input value={form.payment_terms || ''} onChange={e => setForm((f: any) => ({ ...f, payment_terms: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Currency</label>
              <select value={form.currency || 'CAD'} onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white">
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Credit Limit</label>
              <input type="number" value={form.credit_limit || ''} onChange={e => setForm((f: any) => ({ ...f, credit_limit: Number(e.target.value) || null }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Account Type</label>
              <input value={form.account_type || ''} onChange={e => setForm((f: any) => ({ ...f, account_type: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Truck Calls</label>
              <input type="number" value={form.truck_calls || ''} onChange={e => setForm((f: any) => ({ ...f, truck_calls: Number(e.target.value) || null }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Discount %</label>
              <input type="number" value={form.discount_pct || ''} onChange={e => setForm((f: any) => ({ ...f, discount_pct: Number(e.target.value) || null }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
          </div>
        </div>
        <div className="border-t border-blue-200 pt-3">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Tax</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Tax Code</label>
              <input value={form.default_tax_code || ''} onChange={e => setForm((f: any) => ({ ...f, default_tax_code: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Expense Terms</label>
              <input value={form.expense_terms || ''} onChange={e => setForm((f: any) => ({ ...f, expense_terms: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Carrier General 탭 (2-column: Info | Operation) ────────────────
function CarrierGeneralTab({ form, setForm }: {
  form: any; setForm: any; partnerId?: string; save?: () => void; saving?: boolean
}) {
  const fi = (label: string, key: string, type = 'text') => (
    <div key={key}>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
    </div>
  )
  const chk = (label: string, key: string) => (
    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={!!form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.checked }))} />
      {label}
    </label>
  )

  return (
    <div className="flex gap-0">
      {/* LEFT: Carrier Info */}
      <div className="flex-1 pr-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Carrier Info</h4>
        {fi('Name *', 'name')}
        {fi('Legal Name', 'legal_name')}
        {fi('Address', 'address')}
        <div className="grid grid-cols-2 gap-2">
          {fi('Country', 'country')}
          {fi('Province', 'province')}
          {fi('City', 'city')}
          {fi('Postal Code', 'postal_code')}
        </div>
        {fi('MC#', 'mc_number')}
        {fi('DOT#', 'dot_number')}
        {fi('Insurance Expiry', 'insurance_expiry', 'date')}
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Postal Message</label>
          <textarea value={form.personal_message || ''} onChange={e => setForm((f: any) => ({ ...f, personal_message: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Notes</label>
          <textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="flex gap-4">
          {chk('Hazmat Carrier', 'hazmat_carrier')}
          {chk('W9 Received', 'w9_received')}
        </div>
      </div>
      {/* RIGHT: Operation + Payment Info */}
      <div className="w-72 shrink-0 space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Operation Info</h4>
          {fi('Carrier Type', 'carrier_type')}
          {fi('Operating Status', 'operating_status')}
          {fi('MC Status', 'mc_status')}
          {fi('Service Hours', 'service_hours')}
          {fi('Contact Email', 'contact_email', 'email')}
          {fi('Contact Phone', 'contact_phone')}
        </div>
        <div className="bg-amber-50 rounded-lg p-4 space-y-2">
          <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Payment Info</h4>
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Currency</label>
            <select value={form.currency || 'CAD'} onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white">
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {fi('Payment Terms', 'payment_terms')}
          {fi('Payment Days', 'payment_days', 'number')}
          {fi('Payment Type', 'payment_type')}
          {fi('Factor Company', 'factor_company_name')}
          {fi('ACH/EFT Banking', 'ach_eft_banking')}
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Tax Code</label>
            <input value={form.default_tax_code || ''} onChange={e => setForm((f: any) => ({ ...f, default_tax_code: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Load Setup 탭 (고객 전용) ──────────────────────────────────────
function LoadSetupTab({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">Load Requirements & Setup</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Default Equipment Type</label>
          <input value={form.carrier_type || ''} onChange={e => setForm((f: any) => ({ ...f, carrier_type: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Dry Van, Reefer..." />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Billing Ref</label>
          <input value={form.bill_to || ''} onChange={e => setForm((f: any) => ({ ...f, bill_to: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">MC#</label>
          <input value={form.mc_number || ''} onChange={e => setForm((f: any) => ({ ...f, mc_number: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">DOT#</label>
          <input value={form.dot_number || ''} onChange={e => setForm((f: any) => ({ ...f, dot_number: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Truck Calls</label>
          <input type="number" value={form.truck_calls || ''} onChange={e => setForm((f: any) => ({ ...f, truck_calls: Number(e.target.value) || null }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Insurance Expiry</label>
          <input type="date" value={form.insurance_expiry ? String(form.insurance_expiry).slice(0, 10) : ''} onChange={e => setForm((f: any) => ({ ...f, insurance_expiry: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">Service Notes</label>
        <textarea value={form.service_hours || ''} onChange={e => setForm((f: any) => ({ ...f, service_hours: e.target.value }))} rows={3} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Special requirements, load conditions..." />
      </div>
    </div>
  )
}

// ── Quick View 탭 (고객의 최근 로드) ──────────────────────────────
function QuickViewTab({ partnerId }: { partnerId: string }) {
  const [loads, setLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiJson<{ items: any[] }>(`/loads?customer_id=${partnerId}&limit=20`)
      .then(d => setLoads(d.items || []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false))
  }, [partnerId])

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Recent Loads (Last 20)</h4>
        <Link to={`/order?customer_id=${partnerId}`} className="text-xs text-blue-600 hover:underline">View All →</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Load #</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Pickup</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Delivery</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Revenue</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Profit</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No loads found for this customer.</td></tr>
            ) : loads.map((l: any) => (
              <tr key={l.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link to={`/order/${l.id}`} className="text-blue-600 hover:underline font-medium">{l.load_number}</Link>
                </td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 capitalize">{(l.status || '').replace(/_/g, ' ')}</span>
                </td>
                <td className="px-3 py-2 text-gray-600">{l.pickup_date || l.created_at?.slice(0, 10) || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{l.delivery_date || '-'}</td>
                <td className="px-3 py-2 text-right text-emerald-700">{l.revenue != null ? `$${Number(l.revenue).toLocaleString()}` : '-'}</td>
                <td className="px-3 py-2 text-right text-blue-700">{l.profit != null ? `$${Number(l.profit).toLocaleString()}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────
export default function PartnerDetail() {
  const { partnerId } = useParams()
  const navigate = useNavigate()
  const isNew = !partnerId || partnerId === 'new'

  const [partner, setPartner] = useState<Partner | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<DetailTab>('general')
  const [form, setForm] = useState<any>({
    name: '', type: '', contact_email: '', contact_phone: '',
    address: '', city: '', province: '', country: 'CANADA', postal_code: '',
    mc_number: '', dot_number: '', insurance_expiry: '', payment_terms: '',
    notes: '', code: '', legal_name: '', operating_status: '', carrier_type: '',
    service_hours: '', mc_status: '', hazmat_carrier: false, w9_received: false,
    default_tax_code: '', payment_days: '', payment_type: '', ach_eft_banking: '',
    factor_company_name: '', personal_message: '', bill_to: '',
    credit_limit: '', truck_calls: '', account_type: '', discount_pct: '', currency: 'CAD', expense_terms: '',
    is_active: true,
  })

  useEffect(() => {
    if (isNew) return
    apiJson<Partner>(`/partners/${partnerId}`).then((data) => {
      setPartner(data)
      setForm({
        name: data.name || '', type: data.type || '',
        contact_email: data.contact_email || '', contact_phone: data.contact_phone || '',
        address: data.address || '', city: data.city || '', province: data.province || '',
        country: data.country || 'CANADA', postal_code: data.postal_code || '',
        mc_number: data.mc_number || '', dot_number: data.dot_number || '',
        insurance_expiry: data.insurance_expiry ? String(data.insurance_expiry).slice(0, 10) : '',
        payment_terms: data.payment_terms || '', notes: data.notes || '',
        code: data.code || '', legal_name: data.legal_name || '',
        operating_status: data.operating_status || '', carrier_type: data.carrier_type || '',
        service_hours: data.service_hours || '', mc_status: data.mc_status || '',
        hazmat_carrier: data.hazmat_carrier || false, w9_received: data.w9_received || false,
        default_tax_code: data.default_tax_code || '',
        payment_days: data.payment_days || '', payment_type: data.payment_type || '',
        ach_eft_banking: data.ach_eft_banking || '', factor_company_name: data.factor_company_name || '',
        personal_message: data.personal_message || '', bill_to: data.bill_to || '',
        credit_limit: data.credit_limit || '', truck_calls: data.truck_calls || '',
        account_type: data.account_type || '', discount_pct: data.discount_pct || '',
        currency: data.currency || 'CAD', expense_terms: data.expense_terms || '',
        is_active: data.is_active !== false,
      })
    })
  }, [partnerId, isNew])

  const save = async () => {
    if (!form.name.trim()) { alert('Name is required'); return }
    setSaving(true)
    try {
      const body = { ...form, payment_days: form.payment_days ? Number(form.payment_days) : null }
      if (isNew) {
        const created = await apiJson<Partner>('/partners', { method: 'POST', body: JSON.stringify(body) })
        if (created?.id) navigate(`/partner/${created.id}`)
      } else {
        await apiFetch(`/partners/${partnerId}`, { method: 'PATCH', body: JSON.stringify(body) })
        setPartner((p) => p ? { ...p, ...body } : p)
      }
    } catch { alert('Save failed') }
    setSaving(false)
  }

  if (!isNew && !partner) return <div className="p-4">Loading...</div>

  const isCarrier = form.type === 'carrier'
  const title = isNew ? 'New Partner' : (isCarrier ? 'Carrier Detail' : 'Customer Detail')

  const customerTabs: { key: DetailTab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'load_setup', label: 'Load Setup' },
    { key: 'quick_view', label: 'Quick View' },
    { key: 'locations', label: 'Locations' },
    { key: 'staff', label: 'Staff' },
    { key: 'teams', label: 'Teams' },
    { key: 'services', label: 'Services' },
    { key: 'email_templates', label: 'Email Templates' },
  ]
  const carrierTabs: { key: DetailTab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'vehicles', label: 'Vehicles' },
    { key: 'operation_info', label: 'Operation Info' },
    { key: 'teams', label: 'Teams' },
    { key: 'services', label: 'Services' },
    { key: 'email_templates', label: 'Email Templates' },
  ]
  const newTabs: { key: DetailTab; label: string }[] = [
    { key: 'general', label: 'General' },
  ]
  const tabs = isNew ? newTabs : (isCarrier ? carrierTabs : customerTabs)

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/partner" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          {partner?.name && <span className="text-gray-500 text-sm">— {partner.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* Active toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-xs text-gray-500">Active</span>
            <div
              onClick={() => setForm((f: any) => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
          {!isNew && (
            <button
              onClick={() => navigate('/partner/new')}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >+ New</button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-b-lg shadow p-5">
        {tab === 'general' && !isCarrier && (
          <CustomerGeneralTab form={form} setForm={setForm} partnerId={partnerId} save={save} saving={saving} />
        )}
        {tab === 'general' && (isCarrier || isNew) && (
          <CarrierGeneralTab form={form} setForm={setForm} partnerId={partnerId} save={save} saving={saving} />
        )}
        {tab === 'load_setup' && <LoadSetupTab form={form} setForm={setForm} />}
        {tab === 'quick_view' && !isNew && <QuickViewTab partnerId={partnerId!} />}
        {tab === 'locations' && !isNew && <LocationsTab partnerId={partnerId!} partnerType={form.type} />}
        {tab === 'staff' && !isNew && <StaffTab partnerId={partnerId!} />}
        {tab === 'contacts' && !isNew && <ContactsTab partnerId={partnerId!} />}
        {tab === 'vehicles' && !isNew && <VehiclesTab partnerId={partnerId!} />}
        {tab === 'teams' && !isNew && <TeamsTab partnerId={partnerId!} />}
        {tab === 'services' && !isNew && <ServicesTab partnerId={partnerId!} />}
        {tab === 'email_templates' && !isNew && <EmailTemplatesTab partnerId={partnerId!} />}
        {tab === 'operation_info' && !isNew && <OperationInfoTab partnerId={partnerId!} />}
      </div>
    </div>
  )
}
