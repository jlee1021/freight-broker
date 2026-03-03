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
}

type Location = { id: string; name?: string; address?: string; tel?: string; city?: string; state?: string; zip_code?: string; entry_date?: string; notes?: string; bill?: string; description?: string; billing_ship_to?: string; comments?: string; is_active: boolean }
type Staff = { id: string; full_name: string; department?: string; email?: string; phone?: string; title?: string; is_active: boolean }
type Contact = { id: string; name: string; department?: string; email?: string; phone?: string; is_primary: boolean }
type Vehicle = { id: string; vehicle_type?: string; vehicle_number?: string; model?: string; price?: number }

type DetailTab = 'detail' | 'locations' | 'staff' | 'contacts' | 'vehicles'

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

// ── Detail 탭 (기본 정보 + 캐리어 확장) ─────────────────────────────
function DetailTab({ form, setForm, isCarrier, save, saving }: {
  form: any; setForm: any; isCarrier: boolean; save: () => void; saving: boolean
}) {
  const field = (label: string, key: string, type = 'text') => (
    <div key={key}>
      <label className="block text-xs text-gray-600 mb-0.5">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
    </div>
  )
  const checkbox = (label: string, key: string) => (
    <div key={key} className="flex items-center gap-2">
      <input type="checkbox" checked={!!form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.checked }))} />
      <label className="text-sm">{label}</label>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <div className="grid grid-cols-2 gap-3">
        {field('Name *', 'name')}
        {field('Code', 'code')}
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Type</label>
          <select value={form.type || ''} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="">--</option>
            <option value="customer">Customer</option>
            <option value="carrier">Carrier</option>
          </select>
        </div>
        {field('Contact Email', 'contact_email', 'email')}
        {field('Contact Phone', 'contact_phone')}
        {field('Address', 'address')}
        {field('City', 'city')}
        {field('Province', 'province')}
        {field('Country', 'country')}
        {field('Postal Code', 'postal_code')}
        {field('MC#', 'mc_number')}
        {field('DOT#', 'dot_number')}
        {field('Insurance Expiry', 'insurance_expiry', 'date')}
        {field('Payment Terms', 'payment_terms')}
        {field('Bill To', 'bill_to')}
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-0.5">Notes</label>
        <textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
      </div>

      {isCarrier && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Carrier Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {field('Legal Name', 'legal_name')}
            {field('Operating Status', 'operating_status')}
            {field('Carrier Type', 'carrier_type')}
            {field('MC Status', 'mc_status')}
            {field('Service Hours', 'service_hours')}
            {field('Default Tax Code', 'default_tax_code')}
            {field('Payment Days', 'payment_days', 'number')}
            {field('Payment Type', 'payment_type')}
            {field('ACH/EFT Banking', 'ach_eft_banking')}
            {field('Factor Company', 'factor_company_name')}
          </div>
          <div className="flex gap-6 mt-3">
            {checkbox('Hazmat Carrier', 'hazmat_carrier')}
            {checkbox('W9 Received', 'w9_received')}
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-0.5">Personal Message</label>
            <textarea value={form.personal_message || ''} onChange={e => setForm((f: any) => ({ ...f, personal_message: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
      )}

      <div className="pt-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
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
  const [tab, setTab] = useState<DetailTab>('detail')
  const [form, setForm] = useState<any>({
    name: '', type: '', contact_email: '', contact_phone: '',
    address: '', city: '', province: '', country: 'CANADA', postal_code: '',
    mc_number: '', dot_number: '', insurance_expiry: '', payment_terms: '',
    notes: '', code: '', legal_name: '', operating_status: '', carrier_type: '',
    service_hours: '', mc_status: '', hazmat_carrier: false, w9_received: false,
    default_tax_code: '', payment_days: '', payment_type: '', ach_eft_banking: '',
    factor_company_name: '', personal_message: '', bill_to: '',
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
  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'detail', label: 'Detail' },
    { key: 'locations', label: 'Locations' },
    { key: 'staff', label: 'Staff' },
    ...(isCarrier ? [
      { key: 'contacts' as DetailTab, label: 'Contacts' },
      { key: 'vehicles' as DetailTab, label: 'Vehicles' },
    ] : []),
  ]

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/partner" className="text-gray-600 hover:text-gray-800">← Partner</Link>
        <h1 className="text-2xl font-bold text-gray-800">{isNew ? 'New Partner' : partner?.name}</h1>
      </div>
      <div className="flex gap-0 border-b mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        {tab === 'detail' && <DetailTab form={form} setForm={setForm} isCarrier={isCarrier} save={save} saving={saving} />}
        {tab === 'locations' && !isNew && <LocationsTab partnerId={partnerId!} partnerType={form.type} />}
        {tab === 'staff' && !isNew && <StaffTab partnerId={partnerId!} />}
        {tab === 'contacts' && !isNew && <ContactsTab partnerId={partnerId!} />}
        {tab === 'vehicles' && !isNew && <VehiclesTab partnerId={partnerId!} />}
      </div>
    </div>
  )
}
