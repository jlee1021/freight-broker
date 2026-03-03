import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type OsOrder = {
  id: string
  order_code: string | null
  status: string
  contract_type: string | null
  customer_id: string | null
  customer_name: string | null
  buyer: string | null
  sales_rep: string | null
  customer_po: string | null
  load_date: string | null
  deliver_date: string | null
  product_name: string | null
  qty: number | null
  unit_price: number | null
  currency: string | null
  tax: number | null
  subtotal: number | null
  total: number | null
  invoice_number: string | null
  billing_type: string | null
  memo: string | null
  created_by: string | null
  created_at: string | null
}

type Partner = { id: string; name: string; type: string | null }

const STATUS_TABS = ['all', 'pending', 'out_order', 'on_going', 'receiving', 'complete']
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  out_order: 'bg-blue-100 text-blue-800',
  on_going: 'bg-yellow-100 text-yellow-800',
  receiving: 'bg-purple-100 text-purple-800',
  complete: 'bg-green-100 text-green-800',
}

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

const emptyForm = { order_code: '', status: 'pending', contract_type: '', customer_id: '', buyer: '', sales_rep: '', customer_po: '', load_date: '', deliver_date: '', product_name: '', qty: '', unit_price: '', currency: 'CAD', tax: '', subtotal: '', total: '', invoice_number: '', billing_type: '', memo: '', created_by: '' }

export default function OsOrderPage() {
  const [items, setItems] = useState<OsOrder[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<OsOrder | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiJson<Partner[]>('/partners').then(l => setPartners(Array.isArray(l) ? l : [])).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    let url = '/os-orders?'
    if (statusFilter && statusFilter !== 'all') url += `status=${statusFilter}&`
    if (dateFrom) url += `date_from=${dateFrom}&`
    if (dateTo) url += `date_to=${dateTo}&`
    if (q) url += `q=${encodeURIComponent(q)}&`
    apiJson<OsOrder[]>(url).then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, dateFrom, dateTo])

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true) }
  const openEdit = (o: OsOrder) => {
    setEditing(o)
    setForm({ order_code: o.order_code || '', status: o.status, contract_type: o.contract_type || '', customer_id: o.customer_id || '', buyer: o.buyer || '', sales_rep: o.sales_rep || '', customer_po: o.customer_po || '', load_date: o.load_date || '', deliver_date: o.deliver_date || '', product_name: o.product_name || '', qty: o.qty?.toString() || '', unit_price: o.unit_price?.toString() || '', currency: o.currency || 'CAD', tax: o.tax?.toString() || '', subtotal: o.subtotal?.toString() || '', total: o.total?.toString() || '', invoice_number: o.invoice_number || '', billing_type: o.billing_type || '', memo: o.memo || '', created_by: o.created_by || '' })
    setShowModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...form, qty: form.qty ? parseFloat(form.qty) : null, unit_price: form.unit_price ? parseFloat(form.unit_price) : null, tax: form.tax ? parseFloat(form.tax) : null, subtotal: form.subtotal ? parseFloat(form.subtotal) : null, total: form.total ? parseFloat(form.total) : null }
      if (editing) { await apiFetch(`/os-orders/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) }) }
      else { await apiFetch('/os-orders', { method: 'POST', body: JSON.stringify(body) }) }
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this order?')) return
    await apiFetch(`/os-orders/${id}`, { method: 'DELETE' }); load()
  }

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">OS List (Order Sheet)</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">+ Add New</button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Order Code</label>
          <input type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search..." className="border rounded px-2 py-1.5 w-36" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Load Date From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Load Date To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
        <button onClick={load} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm">Apply</button>
        <button onClick={() => { setQ(''); setDateFrom(''); setDateTo(''); setStatusFilter('all') }} className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded text-sm">Clear</button>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded text-sm capitalize ${statusFilter === s ? 'bg-red-600 text-white' : 'bg-white border'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>

      {/* 테이블 */}
      {loading ? <div className="text-gray-500 p-4">Loading...</div> : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-2 text-left">Order Code</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Buyer</th>
                <th className="px-3 py-2 text-left">Sales Rep</th>
                <th className="px-3 py-2 text-left">Customer PO</th>
                <th className="px-3 py-2 text-left">Load Date</th>
                <th className="px-3 py-2 text-left">Deliver Date</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-left">Invoice #</th>
                <th className="px-3 py-2 text-left">Memo</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={18} className="px-4 py-6 text-center text-gray-500">No orders.</td></tr> : (
                items.map(o => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{o.order_code ?? '–'}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status.replace(/_/g, ' ')}</span></td>
                    <td className="px-3 py-2">{o.customer_id ? <Link to={`/partner/${o.customer_id}`} className="text-blue-600 hover:underline">{o.customer_name ?? '–'}</Link> : (o.customer_name ?? '–')}</td>
                    <td className="px-3 py-2">{o.buyer ?? '–'}</td>
                    <td className="px-3 py-2">{o.sales_rep ?? '–'}</td>
                    <td className="px-3 py-2">{o.customer_po ?? '–'}</td>
                    <td className="px-3 py-2">{o.load_date ?? '–'}</td>
                    <td className="px-3 py-2">{o.deliver_date ?? '–'}</td>
                    <td className="px-3 py-2">{o.product_name ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{o.qty ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{o.unit_price != null ? o.unit_price.toLocaleString() : '–'}</td>
                    <td className="px-3 py-2">{o.currency ?? 'CAD'}</td>
                    <td className="px-3 py-2 text-right">{o.tax ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{o.subtotal != null ? o.subtotal.toLocaleString() : '–'}</td>
                    <td className="px-3 py-2 text-right font-semibold">{o.total != null ? o.total.toLocaleString() : '–'}</td>
                    <td className="px-3 py-2">{o.invoice_number ?? '–'}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{o.memo ?? '–'}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button onClick={() => openEdit(o)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => del(o.id)} className="text-red-500 hover:underline text-xs">Del</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit OS Order' : 'Add OS Order'} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            {[['order_code', 'Order Code'], ['contract_type', 'Contract Type'], ['buyer', 'Buyer'], ['sales_rep', 'Sales Rep'], ['customer_po', 'Customer PO'], ['product_name', 'Product Name'], ['invoice_number', 'Invoice #'], ['billing_type', 'Billing Type'], ['created_by', 'Created By']].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
                <input value={(form as any)[k]} onChange={f(k as keyof typeof emptyForm)} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Customer</label>
              <select value={form.customer_id} onChange={f('customer_id')} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="">– None –</option>
                {partners.filter(p => p.type === 'customer' || !p.type).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Status</label>
              <select value={form.status} onChange={f('status')} className="w-full border rounded px-2 py-1.5 text-sm">
                {STATUS_TABS.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Load Date</label>
              <input type="date" value={form.load_date} onChange={f('load_date')} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Deliver Date</label>
              <input type="date" value={form.deliver_date} onChange={f('deliver_date')} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            {[['qty', 'Qty'], ['unit_price', 'Unit Price'], ['tax', 'Tax'], ['subtotal', 'Subtotal'], ['total', 'Total']].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-600 block mb-0.5">{l}</label>
                <input type="number" value={(form as any)[k]} onChange={f(k as keyof typeof emptyForm)} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Currency</label>
              <select value={form.currency} onChange={f('currency')} className="w-full border rounded px-2 py-1.5 text-sm">
                {['CAD', 'USD', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 block mb-0.5">Memo</label>
              <textarea value={form.memo} onChange={f('memo')} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
