import { useState, useEffect } from 'react'
import { apiJson, apiFetch } from '../api'

type Shipper = { id: string; consolidation_id: string; partner_id?: string; name?: string; address?: string; city?: string; contact?: string; pickup_date?: string; pallet_count?: number; weight?: number; notes?: string; sequence: number }
type Consignee = { id: string; consolidation_id: string; partner_id?: string; name?: string; address?: string; city?: string; contact?: string; delivery_date?: string; pallet_count?: number; weight?: number; notes?: string; sequence: number }
type Consolidation = { id: string; consolidation_number: string; status?: string; description?: string; equipment_type?: string; total_weight?: number; weight_unit?: string; created_at?: string; customer_shippers: Shipper[]; carrier_consignees: Consignee[] }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

type StatusTab = 'all' | 'pending' | 'unassigned' | 'on_hold' | 'ready_to_load' | 'dispatched' | 'in_transit' | 'delivered' | 'invoiced' | 'cancelled'

const STATUS_TABS: { key: StatusTab; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'bg-gray-200 text-gray-700' },
  { key: 'pending', label: 'Pending', color: 'bg-yellow-400 text-white' },
  { key: 'unassigned', label: 'Unassigned', color: 'bg-orange-400 text-white' },
  { key: 'on_hold', label: 'On Hold', color: 'bg-purple-500 text-white' },
  { key: 'ready_to_load', label: 'Ready to Load', color: 'bg-green-500 text-white' },
  { key: 'dispatched', label: 'Dispatch', color: 'bg-blue-500 text-white' },
  { key: 'in_transit', label: 'In-transit', color: 'bg-blue-700 text-white' },
  { key: 'delivered', label: 'Delivered', color: 'bg-teal-500 text-white' },
  { key: 'invoiced', label: 'Invoiced', color: 'bg-violet-600 text-white' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-400 text-white' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  unassigned: 'bg-orange-100 text-orange-800',
  on_hold: 'bg-purple-100 text-purple-800',
  ready_to_load: 'bg-green-100 text-green-800',
  dispatched: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-blue-200 text-blue-900',
  delivered: 'bg-teal-100 text-teal-800',
  invoiced: 'bg-violet-100 text-violet-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

function fmtDate(d: string | null | undefined) { return d ? new Date(d).toLocaleDateString('en-CA', { year: '2-digit', month: '2-digit', day: '2-digit' }) : '-' }

export default function Consolidation() {
  const [list, setList] = useState<Consolidation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ consolidation_number: '', status: 'pending', description: '', equipment_type: '', total_weight: '', weight_unit: 'lbs' })
  const [saving, setSaving] = useState(false)
  const [showAddShipper, setShowAddShipper] = useState(false)
  const [showAddConsignee, setShowAddConsignee] = useState(false)
  const [shipperForm, setShipperForm] = useState<Partial<Shipper>>({ sequence: 1 })
  const [consigneeForm, setConsigneeForm] = useState<Partial<Consignee>>({ sequence: 1 })
  const [activeDetail, setActiveDetail] = useState<Consolidation | null>(null)

  const load = () => {
    setLoading(true)
    apiJson<Consolidation[]>('/consolidations').then(setList).catch(() => setList([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const refreshDetail = (id: string) => {
    apiJson<Consolidation>(`/consolidations/${id}`).then(c => {
      setActiveDetail(c)
      setList(prev => prev.map(x => x.id === id ? c : x))
    })
  }

  const save = async () => {
    if (!form.consolidation_number.trim()) { alert('Consolidation # required'); return }
    setSaving(true)
    try {
      const body = { ...form, total_weight: form.total_weight ? Number(form.total_weight) : null }
      await apiJson<Consolidation>('/consolidations', { method: 'POST', body: JSON.stringify(body) })
      setShowAdd(false); load()
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this consolidation?')) return
    await apiFetch(`/consolidations/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(x => x.id !== id))
    if (activeDetail?.id === id) setActiveDetail(null)
  }

  const addShipper = async () => {
    if (!activeDetail) return
    setSaving(true)
    try {
      await apiFetch(`/consolidations/${activeDetail.id}/shippers`, { method: 'POST', body: JSON.stringify(shipperForm) })
      setShowAddShipper(false); refreshDetail(activeDetail.id)
    } catch { alert('Save failed') }
    setSaving(false)
  }
  const addConsignee = async () => {
    if (!activeDetail) return
    setSaving(true)
    try {
      await apiFetch(`/consolidations/${activeDetail.id}/consignees`, { method: 'POST', body: JSON.stringify(consigneeForm) })
      setShowAddConsignee(false); refreshDetail(activeDetail.id)
    } catch { alert('Save failed') }
    setSaving(false)
  }
  const delShipper = async (cId: string, sId: string) => {
    if (!confirm('Remove?')) return
    await apiFetch(`/consolidations/${cId}/shippers/${sId}`, { method: 'DELETE' })
    refreshDetail(cId)
  }
  const delConsignee = async (cId: string, consId: string) => {
    if (!confirm('Remove?')) return
    await apiFetch(`/consolidations/${cId}/consignees/${consId}`, { method: 'DELETE' })
    refreshDetail(cId)
  }

  // 필터링
  const filtered = list.filter(c => {
    if (statusTab !== 'all' && (c.status || '') !== statusTab) return false
    if (q && !c.consolidation_number.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  // 요약 합계
  const totals = {
    count: filtered.length,
    totalWeight: filtered.reduce((a, c) => a + (c.total_weight || 0), 0),
    totalPallets: filtered.reduce((a, c) => a + c.customer_shippers.reduce((b, s) => b + (s.pallet_count || 0), 0), 0),
    totalItems: filtered.reduce((a, c) => a + c.customer_shippers.length + c.carrier_consignees.length, 0),
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Consolidation</h1>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setStatusTab(t.key)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${statusTab === t.key ? t.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border rounded px-3 py-1.5 text-sm w-48" />
        <button onClick={() => setQ('')} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">Clear</button>
        <div className="flex-1" />
        <button onClick={() => { setForm({ consolidation_number: '', status: 'pending', description: '', equipment_type: '', total_weight: '', weight_unit: 'lbs' }); setShowAdd(true) }}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">+ New</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-8 px-2 py-2"></th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Load #</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Created</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Customer</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Pickup (Date)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Delivery (Date)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Load Type</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Weight</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Pallets</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Items</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={12} className="px-3 py-8 text-center text-gray-400">No consolidations found.</td></tr>
            ) : filtered.map(c => (
              <>
                <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setExpanded(e => e === c.id ? null : c.id)
                  setActiveDetail(c)
                  if (c.id !== activeDetail?.id) refreshDetail(c.id)
                }}>
                  <td className="px-2 py-2 text-center text-gray-400">{expanded === c.id ? '▾' : '▸'}</td>
                  <td className="px-3 py-2 font-medium text-blue-600">{c.consolidation_number}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[c.status || ''] || 'bg-gray-100 text-gray-600'}`}>{c.status || '-'}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{fmtDate(c.created_at)}</td>
                  <td className="px-3 py-2">{c.customer_shippers[0]?.name || '-'}</td>
                  <td className="px-3 py-2">{fmtDate(c.customer_shippers[0]?.pickup_date)}</td>
                  <td className="px-3 py-2">{fmtDate(c.carrier_consignees[0]?.delivery_date)}</td>
                  <td className="px-3 py-2">{c.equipment_type || '-'}</td>
                  <td className="px-3 py-2 text-right">{c.total_weight ? `${c.total_weight} ${c.weight_unit || 'lbs'}` : '-'}</td>
                  <td className="px-3 py-2 text-right">{c.customer_shippers.reduce((a, s) => a + (s.pallet_count || 0), 0)}</td>
                  <td className="px-3 py-2 text-right">{c.customer_shippers.length + c.carrier_consignees.length}</td>
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => del(c.id)} className="text-red-400 hover:text-red-600">Del</button>
                  </td>
                </tr>
                {expanded === c.id && activeDetail?.id === c.id && (
                  <tr key={c.id + '-detail'}>
                    <td colSpan={12} className="border-t bg-gray-50 px-4 py-4">
                      <div className="flex gap-6">
                        {/* Shippers */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-gray-700">Customer / Shippers</h4>
                            <button onClick={() => { setShipperForm({ sequence: (activeDetail.customer_shippers.length + 1) }); setShowAddShipper(true) }} className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs">+ Add</button>
                          </div>
                          <table className="w-full text-xs border-collapse">
                            <thead><tr className="bg-white"><th className="border px-2 py-1">Name</th><th className="border px-2 py-1">City</th><th className="border px-2 py-1">P/U Date</th><th className="border px-2 py-1">Pallets</th><th className="border px-2 py-1">Weight</th><th className="border px-2 py-1">Del</th></tr></thead>
                            <tbody>
                              {activeDetail.customer_shippers.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-2">No shippers</td></tr>}
                              {activeDetail.customer_shippers.map(s => (
                                <tr key={s.id} className="hover:bg-white">
                                  <td className="border px-2 py-1">{s.name}</td><td className="border px-2 py-1">{s.city}</td>
                                  <td className="border px-2 py-1">{s.pickup_date}</td><td className="border px-2 py-1">{s.pallet_count}</td>
                                  <td className="border px-2 py-1">{s.weight}</td>
                                  <td className="border px-2 py-1"><button onClick={() => delShipper(c.id, s.id)} className="text-red-400">×</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {/* Shipper totals */}
                          <div className="mt-2 flex gap-4 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            <span>Total Pallets: <strong>{activeDetail.customer_shippers.reduce((a, s) => a + (s.pallet_count || 0), 0)}</strong></span>
                            <span>Total Weight: <strong>{activeDetail.customer_shippers.reduce((a, s) => a + (s.weight || 0), 0).toLocaleString()} {c.weight_unit || 'lbs'}</strong></span>
                          </div>
                        </div>
                        {/* Consignees */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-gray-700">Carrier / Consignees</h4>
                            <button onClick={() => { setConsigneeForm({ sequence: (activeDetail.carrier_consignees.length + 1) }); setShowAddConsignee(true) }} className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs">+ Add</button>
                          </div>
                          <table className="w-full text-xs border-collapse">
                            <thead><tr className="bg-white"><th className="border px-2 py-1">Name</th><th className="border px-2 py-1">City</th><th className="border px-2 py-1">Delivery</th><th className="border px-2 py-1">Pallets</th><th className="border px-2 py-1">Weight</th><th className="border px-2 py-1">Del</th></tr></thead>
                            <tbody>
                              {activeDetail.carrier_consignees.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-2">No consignees</td></tr>}
                              {activeDetail.carrier_consignees.map(con => (
                                <tr key={con.id} className="hover:bg-white">
                                  <td className="border px-2 py-1">{con.name}</td><td className="border px-2 py-1">{con.city}</td>
                                  <td className="border px-2 py-1">{con.delivery_date}</td><td className="border px-2 py-1">{con.pallet_count}</td>
                                  <td className="border px-2 py-1">{con.weight}</td>
                                  <td className="border px-2 py-1"><button onClick={() => delConsignee(c.id, con.id)} className="text-red-400">×</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-2 flex gap-4 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            <span>Total Pallets: <strong>{activeDetail.carrier_consignees.reduce((a, s) => a + (s.pallet_count || 0), 0)}</strong></span>
                            <span>Total Weight: <strong>{activeDetail.carrier_consignees.reduce((a, s) => a + (s.weight || 0), 0).toLocaleString()} {c.weight_unit || 'lbs'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {/* Summary row */}
        {!loading && filtered.length > 0 && (
          <div className="border-t bg-gray-50 px-4 py-2 flex flex-wrap gap-6 text-xs text-gray-600">
            <span>Total of <strong>{totals.count}</strong></span>
            <span>Total Weight: <strong>{totals.totalWeight.toLocaleString()} lbs</strong></span>
            <span>Total Pallets: <strong>{totals.totalPallets}</strong></span>
            <span>Total Items: <strong>{totals.totalItems}</strong></span>
          </div>
        )}
      </div>

      {/* New Consolidation modal */}
      {showAdd && (
        <Modal title="New Consolidation" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Consolidation # *</label>
              <input value={form.consolidation_number} onChange={e => setForm(f => ({ ...f, consolidation_number: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="CON-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded px-2 py-2 text-sm">
                  {STATUS_TABS.filter(t => t.key !== 'all').map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Equipment Type</label>
                <input value={form.equipment_type} onChange={e => setForm(f => ({ ...f, equipment_type: e.target.value }))} className="w-full border rounded px-2 py-2 text-sm" placeholder="Dry Van" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Total Weight</label>
                <input type="number" value={form.total_weight} onChange={e => setForm(f => ({ ...f, total_weight: e.target.value }))} className="w-full border rounded px-2 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Weight Unit</label>
                <select value={form.weight_unit} onChange={e => setForm(f => ({ ...f, weight_unit: e.target.value }))} className="w-full border rounded px-2 py-2 text-sm">
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border rounded px-2 py-2 text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </Modal>
      )}

      {showAddShipper && (
        <Modal title="Add Shipper" onClose={() => setShowAddShipper(false)}>
          <div className="space-y-2">
            {[{ label: 'Name', key: 'name' }, { label: 'Address', key: 'address' }, { label: 'City', key: 'city' }, { label: 'Contact', key: 'contact' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(shipperForm as any)[key] || ''} onChange={e => setShipperForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600 block mb-0.5">Pickup Date</label><input type="date" value={shipperForm.pickup_date || ''} onChange={e => setShipperForm(f => ({ ...f, pickup_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
              <div><label className="text-xs text-gray-600 block mb-0.5">Pallets</label><input type="number" value={shipperForm.pallet_count || ''} onChange={e => setShipperForm(f => ({ ...f, pallet_count: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
              <div><label className="text-xs text-gray-600 block mb-0.5">Weight</label><input type="number" step="0.01" value={shipperForm.weight || ''} onChange={e => setShipperForm(f => ({ ...f, weight: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAddShipper(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button onClick={addShipper} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </Modal>
      )}

      {showAddConsignee && (
        <Modal title="Add Consignee" onClose={() => setShowAddConsignee(false)}>
          <div className="space-y-2">
            {[{ label: 'Name', key: 'name' }, { label: 'Address', key: 'address' }, { label: 'City', key: 'city' }, { label: 'Contact', key: 'contact' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(consigneeForm as any)[key] || ''} onChange={e => setConsigneeForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600 block mb-0.5">Delivery Date</label><input type="date" value={consigneeForm.delivery_date || ''} onChange={e => setConsigneeForm(f => ({ ...f, delivery_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
              <div><label className="text-xs text-gray-600 block mb-0.5">Pallets</label><input type="number" value={consigneeForm.pallet_count || ''} onChange={e => setConsigneeForm(f => ({ ...f, pallet_count: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
              <div><label className="text-xs text-gray-600 block mb-0.5">Weight</label><input type="number" step="0.01" value={consigneeForm.weight || ''} onChange={e => setConsigneeForm(f => ({ ...f, weight: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAddConsignee(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button onClick={addConsignee} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
