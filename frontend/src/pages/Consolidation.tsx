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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function Consolidation() {
  const [list, setList] = useState<Consolidation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Consolidation | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ consolidation_number: '', status: 'pending', description: '', equipment_type: '', total_weight: '', weight_unit: 'lbs' })
  const [saving, setSaving] = useState(false)

  // Shipper/Consignee 추가
  const [showAddShipper, setShowAddShipper] = useState(false)
  const [showAddConsignee, setShowAddConsignee] = useState(false)
  const [shipperForm, setShipperForm] = useState<Partial<Shipper>>({ sequence: 1 })
  const [consigneeForm, setConsigneeForm] = useState<Partial<Consignee>>({ sequence: 1 })

  const load = () => {
    const q = filterStatus ? `?status=${filterStatus}` : ''
    apiJson<Consolidation[]>(`/consolidations${q}`).then(setList).catch(() => setList([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterStatus])

  const refreshSelected = (id: string) => {
    apiJson<Consolidation>(`/consolidations/${id}`).then(c => { setSelected(c); setList(prev => prev.map(x => x.id === id ? c : x)) })
  }

  const save = async () => {
    if (!form.consolidation_number.trim()) { alert('Consolidation # required'); return }
    setSaving(true)
    try {
      const body = { ...form, total_weight: form.total_weight ? Number(form.total_weight) : null }
      const c = await apiJson<Consolidation>('/consolidations', { method: 'POST', body: JSON.stringify(body) })
      setShowAdd(false); setList(prev => [c, ...prev]); setSelected(c)
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this consolidation?')) return
    await apiFetch(`/consolidations/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const addShipper = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await apiFetch(`/consolidations/${selected.id}/shippers`, { method: 'POST', body: JSON.stringify(shipperForm) })
      setShowAddShipper(false); refreshSelected(selected.id)
    } catch { alert('Save failed') }
    setSaving(false)
  }

  const addConsignee = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await apiFetch(`/consolidations/${selected.id}/consignees`, { method: 'POST', body: JSON.stringify(consigneeForm) })
      setShowAddConsignee(false); refreshSelected(selected.id)
    } catch { alert('Save failed') }
    setSaving(false)
  }

  const delShipper = async (cId: string, sId: string) => {
    if (!confirm('Remove?')) return
    await apiFetch(`/consolidations/${cId}/shippers/${sId}`, { method: 'DELETE' })
    refreshSelected(cId)
  }

  const delConsignee = async (cId: string, consId: string) => {
    if (!confirm('Remove?')) return
    await apiFetch(`/consolidations/${cId}/consignees/${consId}`, { method: 'DELETE' })
    refreshSelected(cId)
  }

  return (
    <div>
      <h1 className="page-title">Consolidation</h1>

      <div className="flex gap-2 mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex-1" />
        <button onClick={() => { setForm({ consolidation_number: '', status: 'pending', description: '', equipment_type: '', total_weight: '', weight_unit: 'lbs' }); setShowAdd(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ New Consolidation</button>
      </div>

      <div className="flex gap-4">
        {/* 목록 */}
        <div className="w-80 shrink-0">
          {loading ? <div className="text-gray-500 p-4">Loading...</div> : (
            <div className="space-y-2">
              {list.length === 0 && <div className="text-gray-500 text-sm p-4">No consolidations found.</div>}
              {list.map(c => (
                <div key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${selected?.id === c.id ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{c.consolidation_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status || ''] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">{c.equipment_type} {c.total_weight ? `· ${c.total_weight}${c.weight_unit}` : ''}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.customer_shippers.length} Shippers · {c.carrier_consignees.length} Consignees</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상세 */}
        {selected && (
          <div className="flex-1 bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selected.consolidation_number}</h2>
              <div className="flex gap-2">
                <button onClick={() => del(selected.id)} className="px-3 py-1.5 text-red-600 border border-red-300 rounded text-sm hover:bg-red-50">Delete</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
              <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded text-xs ${statusColors[selected.status || ''] || 'bg-gray-100'}`}>{selected.status}</span></div>
              <div><span className="text-gray-500">Equipment:</span> <span className="font-medium">{selected.equipment_type || '—'}</span></div>
              <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{selected.total_weight ? `${selected.total_weight} ${selected.weight_unit}` : '—'}</span></div>
              {selected.description && <div className="col-span-3 text-gray-600">{selected.description}</div>}
            </div>

            {/* Customer Shippers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-700">Customer / Shippers</h3>
                <button onClick={() => { setShipperForm({ sequence: (selected.customer_shippers.length + 1) }); setShowAddShipper(true) }} className="px-2 py-1 bg-red-600 text-white rounded text-xs">+ Add</button>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-50"><th className="border px-2 py-1">Name</th><th className="border px-2 py-1">City</th><th className="border px-2 py-1">P/U Date</th><th className="border px-2 py-1">Pallets</th><th className="border px-2 py-1">Weight</th><th className="border px-2 py-1">Del</th></tr></thead>
                <tbody>
                  {selected.customer_shippers.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-2">No shippers yet</td></tr>}
                  {selected.customer_shippers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="border px-2 py-1 font-medium">{s.name}</td>
                      <td className="border px-2 py-1">{s.city}</td>
                      <td className="border px-2 py-1">{s.pickup_date}</td>
                      <td className="border px-2 py-1">{s.pallet_count}</td>
                      <td className="border px-2 py-1">{s.weight}</td>
                      <td className="border px-2 py-1"><button onClick={() => delShipper(selected.id, s.id)} className="text-red-500 hover:text-red-700">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 요약 합계 */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Pallets (Shipper)</div>
                <div className="font-semibold">{selected.customer_shippers.reduce((a, s) => a + (s.pallet_count ?? 0), 0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Weight (Shipper)</div>
                <div className="font-semibold">{selected.customer_shippers.reduce((a, s) => a + (s.weight ?? 0), 0).toLocaleString()} {selected.weight_unit || 'LB'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Pallets (Consignee)</div>
                <div className="font-semibold">{selected.carrier_consignees.reduce((a, c) => a + (c.pallet_count ?? 0), 0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Weight (Consignee)</div>
                <div className="font-semibold">{selected.carrier_consignees.reduce((a, c) => a + (c.weight ?? 0), 0).toLocaleString()} {selected.weight_unit || 'LB'}</div>
              </div>
            </div>

            {/* Carrier Consignees */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-700">Carrier / Consignees</h3>
                <button onClick={() => { setConsigneeForm({ sequence: (selected.carrier_consignees.length + 1) }); setShowAddConsignee(true) }} className="px-2 py-1 bg-red-600 text-white rounded text-xs">+ Add</button>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-50"><th className="border px-2 py-1">Name</th><th className="border px-2 py-1">City</th><th className="border px-2 py-1">Delivery</th><th className="border px-2 py-1">Pallets</th><th className="border px-2 py-1">Weight</th><th className="border px-2 py-1">Del</th></tr></thead>
                <tbody>
                  {selected.carrier_consignees.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-2">No consignees yet</td></tr>}
                  {selected.carrier_consignees.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="border px-2 py-1 font-medium">{c.name}</td>
                      <td className="border px-2 py-1">{c.city}</td>
                      <td className="border px-2 py-1">{c.delivery_date}</td>
                      <td className="border px-2 py-1">{c.pallet_count}</td>
                      <td className="border px-2 py-1">{c.weight}</td>
                      <td className="border px-2 py-1"><button onClick={() => delConsignee(selected.id, c.id)} className="text-red-500 hover:text-red-700">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 신규 생성 모달 */}
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
                  <option value="pending">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
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
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Shipper 모달 */}
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
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Pickup Date</label>
                <input type="date" value={shipperForm.pickup_date || ''} onChange={e => setShipperForm(f => ({ ...f, pickup_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Pallets</label>
                <input type="number" value={shipperForm.pallet_count || ''} onChange={e => setShipperForm(f => ({ ...f, pallet_count: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Weight</label>
                <input type="number" step="0.01" value={shipperForm.weight || ''} onChange={e => setShipperForm(f => ({ ...f, weight: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAddShipper(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addShipper} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Consignee 모달 */}
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
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Delivery Date</label>
                <input type="date" value={consigneeForm.delivery_date || ''} onChange={e => setConsigneeForm(f => ({ ...f, delivery_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Pallets</label>
                <input type="number" value={consigneeForm.pallet_count || ''} onChange={e => setConsigneeForm(f => ({ ...f, pallet_count: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Weight</label>
                <input type="number" step="0.01" value={consigneeForm.weight || ''} onChange={e => setConsigneeForm(f => ({ ...f, weight: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAddConsignee(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addConsignee} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
