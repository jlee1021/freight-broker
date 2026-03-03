import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type Load = {
  id: string
  load_number: string
  status: string
  rate: number | null
  revenue: number | null
  cost: number | null
  profit: number | null
  created_at: string | null
  customer_name?: string | null
  dispatcher_name?: string | null
  equipment_type?: string | null
  weight?: number | null
  pickup_city?: string | null
  pickup_date?: string | null
  delivery_city?: string | null
  delivery_date?: string | null
}

type Partner = { id: string; name: string; type: string | null }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  unassigned: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  need_to_cover: 'bg-purple-100 text-purple-800',
  good_to_go: 'bg-emerald-100 text-emerald-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  exception: 'bg-red-100 text-red-800',
  cancel: 'bg-gray-200 text-gray-500',
}

export default function Order() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status')
  const customerFromUrl = searchParams.get('customer_id')
  const [loads, setLoads] = useState<Load[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [status, setStatus] = useState<string | null>(statusFromUrl)
  const [q, setQ] = useState('')
  const [poNo, setPoNo] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customerId, setCustomerId] = useState(customerFromUrl || '')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)

  useEffect(() => { setStatus(statusFromUrl) }, [statusFromUrl])
  useEffect(() => { if (customerFromUrl) setCustomerId(customerFromUrl) }, [customerFromUrl])

  useEffect(() => {
    apiJson<Partner[]>('/partners').then((list) => setPartners(Array.isArray(list) ? list : [])).catch(() => {})
  }, [])

  const fetchLoads = () => {
    setLoading(true)
    let url = '/loads?limit=500'
    if (status) url += `&status=${encodeURIComponent(status)}`
    if (q.trim()) url += `&q=${encodeURIComponent(q.trim())}`
    if (customerId) url += `&customer_id=${encodeURIComponent(customerId)}`
    if (dateFrom) url += `&date_from=${dateFrom}`
    if (dateTo) url += `&date_to=${dateTo}`
    apiJson<{ items: Load[] }>(url)
      .then((data) => setLoads(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLoads() }, [status, q, customerId, dateFrom, dateTo])

  const statusTabs = [
    'pending', 'unassigned', 'on_hold', 'need_to_cover', 'good_to_go', 'assigned', 'in_transit', 'delivered', 'exception', 'cancel',
  ]

  const toggleSelect = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next
  })
  const toggleSelectAll = () => setSelectedIds(loads.length > 0 && selectedIds.size === loads.length ? new Set() : new Set(loads.map((l) => l.id)))

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return
    setBulkUpdating(true)
    try {
      await apiFetch('/loads/bulk-status', { method: 'PATCH', body: JSON.stringify({ load_ids: Array.from(selectedIds), status: bulkStatus }) })
      setSelectedIds(new Set()); setBulkStatus(''); fetchLoads()
    } catch (e) { alert(e instanceof Error ? e.message : 'Bulk update failed') }
    setBulkUpdating(false)
  }

  const handleClear = () => {
    setQ(''); setPoNo(''); setDateFrom(''); setDateTo(''); setCustomerId(''); setStatus(null); setSearchParams({})
  }

  const filteredLoads = poNo.trim()
    ? loads.filter((l) => l.load_number.toLowerCase().includes(poNo.toLowerCase()))
    : loads

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="page-title">Order</h1>
        <Link to="/order/new" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">+ New Load</Link>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Load #</label>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search load#" className="border rounded px-2 py-1.5 w-36" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">P.O / Ref</label>
          <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="PO No." className="border rounded px-2 py-1.5 w-32" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="border rounded px-2 py-1.5 w-44">
            <option value="">All</option>
            {partners.filter((p) => p.type === 'customer' || !p.type).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Created From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Created To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
        <button onClick={fetchLoads} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Apply</button>
        <button onClick={handleClear} className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">Clear</button>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => { setStatus(null); setSearchParams({}); }} className={`px-3 py-1.5 rounded text-sm ${status === null ? 'bg-red-600 text-white' : 'bg-white border'}`}>All</button>
        {statusTabs.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setSearchParams({ status: s }); }}
            className={`px-3 py-1.5 rounded capitalize text-sm ${status === s ? 'bg-red-600 text-white' : 'bg-white border'}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* 벌크 상태 변경 */}
      {selectedIds.size > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-3 bg-slate-50 border-slate-200">
          <span className="font-medium text-gray-700">{selectedIds.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">Change status to...</option>
            {statusTabs.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button type="button" onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating} className="btn-primary text-sm">{bulkUpdating ? 'Updating...' : 'Apply'}</button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="btn-secondary text-sm">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="table-wrap overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-2 w-10"><input type="checkbox" checked={filteredLoads.length > 0 && selectedIds.size === filteredLoads.length} onChange={toggleSelectAll} className="rounded" /></th>
                <th className="px-3 py-2 text-left">Load #</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Dispatcher</th>
                <th className="px-3 py-2 text-left">Equipment</th>
                <th className="px-3 py-2 text-right">Weight</th>
                <th className="px-3 py-2 text-left">Pickup City</th>
                <th className="px-3 py-2 text-left">Pickup Date</th>
                <th className="px-3 py-2 text-left">Delivery City</th>
                <th className="px-3 py-2 text-left">Delivery Date</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Revenue</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Profit</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoads.length === 0 ? (
                <tr><td colSpan={16} className="px-4 py-6 text-center text-gray-500">No loads found.</td></tr>
              ) : (
                filteredLoads.map((load) => (
                  <tr key={load.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.has(load.id)} onChange={() => toggleSelect(load.id)} className="rounded" /></td>
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/order/${load.id}`} className="text-blue-600 hover:underline">{load.load_number}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[load.status] || 'bg-gray-100 text-gray-700'}`}>
                        {load.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{load.customer_name ?? '–'}</td>
                    <td className="px-3 py-2 text-gray-600">{load.dispatcher_name ?? '–'}</td>
                    <td className="px-3 py-2 text-gray-600">{load.equipment_type ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{load.weight != null ? load.weight.toLocaleString() : '–'}</td>
                    <td className="px-3 py-2 text-gray-600">{load.pickup_city ?? '–'}</td>
                    <td className="px-3 py-2 text-gray-600">{load.pickup_date ?? '–'}</td>
                    <td className="px-3 py-2 text-gray-600">{load.delivery_city ?? '–'}</td>
                    <td className="px-3 py-2 text-gray-600">{load.delivery_date ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{load.rate != null ? Number(load.rate).toLocaleString() : '–'}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{load.revenue != null ? Number(load.revenue).toLocaleString() : '–'}</td>
                    <td className="px-3 py-2 text-right text-rose-700">{load.cost != null ? Number(load.cost).toLocaleString() : '–'}</td>
                    <td className="px-3 py-2 text-right text-blue-700">{load.profit != null ? Number(load.profit).toLocaleString() : '–'}</td>
                    <td className="px-3 py-2 text-gray-500">{load.created_at ?? '–'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-400">{filteredLoads.length} loads</div>
    </div>
  )
}
