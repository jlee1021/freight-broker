import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type OsdRecord = {
  id: string
  load_id: string | null
  load_number: string | null
  ref_number: string | null
  status: string
  osd_type: string | null
  amount: number | null
  ar_amount: number | null
  ap_amount: number | null
  customer_id: string | null
  customer_name: string | null
  shipper_id: string | null
  shipper_name: string | null
  carrier_id: string | null
  carrier_name: string | null
  ship_date: string | null
  delivery_date: string | null
  due_date: string | null
  expired_cargo: boolean
  company_name: string | null
  notes: string | null
  created_at: string | null
}

type Partner = { id: string; name: string; type: string | null }

const STATUS_TABS = ['all', 'open', 'pending', 'closed']
const OSD_TYPES = ['overage', 'shortage', 'damage']
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-green-100 text-green-800',
}

const emptyForm = { ref_number: '', status: 'open', osd_type: '', load_id: '', customer_id: '', shipper_id: '', carrier_id: '', ship_date: '', delivery_date: '', due_date: '', company_name: '', amount: '', ar_amount: '', ap_amount: '', notes: '', expired_cargo: false }

export default function OsdPage() {
  const [items, setItems] = useState<OsdRecord[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<OsdRecord | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiJson<Partner[]>('/partners').then(l => setPartners(Array.isArray(l) ? l : [])).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    let url = '/osd?'
    if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`
    if (typeFilter) url += `osd_type=${typeFilter}&`
    if (dateFrom) url += `date_from=${dateFrom}&`
    if (dateTo) url += `date_to=${dateTo}&`
    apiJson<OsdRecord[]>(url).then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, typeFilter, dateFrom, dateTo])

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true) }
  const openEdit = (o: OsdRecord) => {
    setEditing(o)
    setForm({ ref_number: o.ref_number || '', status: o.status, osd_type: o.osd_type || '', load_id: o.load_id || '', customer_id: o.customer_id || '', shipper_id: o.shipper_id || '', carrier_id: o.carrier_id || '', ship_date: o.ship_date || '', delivery_date: o.delivery_date || '', due_date: o.due_date || '', company_name: o.company_name || '', amount: o.amount?.toString() || '', ar_amount: o.ar_amount?.toString() || '', ap_amount: o.ap_amount?.toString() || '', notes: o.notes || '', expired_cargo: o.expired_cargo || false })
    setShowModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...form, amount: form.amount ? parseFloat(form.amount as string) : null, ar_amount: form.ar_amount ? parseFloat(form.ar_amount as string) : null, ap_amount: form.ap_amount ? parseFloat(form.ap_amount as string) : null }
      if (editing) { await apiFetch(`/osd/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) }) }
      else { await apiFetch('/osd', { method: 'POST', body: JSON.stringify(body) }) }
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this OSD record?')) return
    await apiFetch(`/osd/${id}`, { method: 'DELETE' }); load()
  }

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">OSD</h1>
        <button onClick={openAdd} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">+ New</button>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input placeholder="Search Load..." className="border rounded px-3 py-1.5 text-sm w-40" onChange={() => {}} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">All Types</option>
          {OSD_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          {STATUS_TABS.map(s => <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        <span className="text-gray-400 text-sm">~</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        <button onClick={load} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm">Apply</button>
        <button onClick={() => { setTypeFilter(''); setDateFrom(''); setDateTo(''); setStatusFilter('all') }} className="px-4 py-1.5 border rounded text-sm hover:bg-gray-50">Clear</button>
      </div>

      {loading ? <div className="text-gray-500 p-4">Loading...</div> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-xs whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-8">#</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Load</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Ref. #</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">Amount</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Customer</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Shipper</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Carrier</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Expired Cargo</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Company Name</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">AR</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">AP</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Due Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={15} className="px-4 py-6 text-center text-gray-500">No OSD records.</td></tr> : (
                items.map((o, idx) => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2">{o.load_id ? <Link to={`/order/${o.load_id}`} className="text-blue-600 hover:underline">{o.load_number ?? o.load_id.slice(0, 8)}</Link> : '–'}</td>
                    <td className="px-3 py-2">{o.ship_date ?? '–'}</td>
                    <td className="px-3 py-2">{o.ref_number ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{o.amount != null ? `$${o.amount.toLocaleString()}` : '–'}</td>
                    <td className="px-3 py-2">{o.customer_id ? <Link to={`/partner/${o.customer_id}`} className="text-blue-600 hover:underline">{o.customer_name ?? '–'}</Link> : (o.customer_name ?? '–')}</td>
                    <td className="px-3 py-2">{o.shipper_name ?? '–'}</td>
                    <td className="px-3 py-2">{o.carrier_id ? <Link to={`/partner/${o.carrier_id}`} className="text-blue-600 hover:underline">{o.carrier_name ?? '–'}</Link> : (o.carrier_name ?? '–')}</td>
                    <td className="px-3 py-2">{o.expired_cargo ? <span className="text-red-600 font-medium">Yes</span> : 'No'}</td>
                    <td className="px-3 py-2">{o.company_name ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{o.ar_amount != null ? `$${o.ar_amount.toLocaleString()}` : '–'}</td>
                    <td className="px-3 py-2 text-right">{o.ap_amount != null ? `$${o.ap_amount.toLocaleString()}` : '–'}</td>
                    <td className="px-3 py-2">{o.due_date ?? '–'}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(o)} className="text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => del(o.id)} className="text-red-400 hover:underline">Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">{editing ? 'Edit OSD' : 'Add OSD'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Ref Number</label>
                <input value={form.ref_number} onChange={f('ref_number')} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Status</label>
                <select value={form.status} onChange={f('status')} className="w-full border rounded px-2 py-1.5 text-sm">
                  {['open', 'pending', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">OSD Type</label>
                <select value={form.osd_type} onChange={f('osd_type')} className="w-full border rounded px-2 py-1.5 text-sm">
                  <option value="">– None –</option>
                  {OSD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Company Name</label>
                <input value={form.company_name} onChange={f('company_name')} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Customer</label>
                <select value={form.customer_id} onChange={f('customer_id')} className="w-full border rounded px-2 py-1.5 text-sm">
                  <option value="">– None –</option>
                  {partners.filter(p => p.type === 'customer' || !p.type).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Carrier</label>
                <select value={form.carrier_id} onChange={f('carrier_id')} className="w-full border rounded px-2 py-1.5 text-sm">
                  <option value="">– None –</option>
                  {partners.filter(p => p.type === 'carrier').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {[['amount', 'Amount'], ['ar_amount', 'AR Amount'], ['ap_amount', 'AP Amount']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
                  <input type="number" value={(form as any)[k]} onChange={f(k as any)} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
              ))}
              {[['ship_date', 'Ship Date'], ['delivery_date', 'Delivery Date'], ['due_date', 'Due Date']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
                  <input type="date" value={(form as any)[k]} onChange={f(k as any)} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-0.5">Notes</label>
                <textarea value={form.notes} onChange={f('notes')} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
