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
  created_at: string | null
}

type Partner = { id: string; name: string; type: string | null }

export default function Order() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status')
  const [loads, setLoads] = useState<Load[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [status, setStatus] = useState<string | null>(statusFromUrl)
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)

  useEffect(() => {
    setStatus(statusFromUrl)
  }, [statusFromUrl])

  useEffect(() => {
    apiJson<Partner[]>('/partners').then((list) => setPartners(Array.isArray(list) ? list : [])).catch(() => {})
  }, [])

  useEffect(() => {
    let url = '/loads?limit=200'
    if (status) url += `&status=${encodeURIComponent(status)}`
    if (q.trim()) url += `&q=${encodeURIComponent(q.trim())}`
    if (customerId) url += `&customer_id=${encodeURIComponent(customerId)}`
    if (dateFrom) url += `&date_from=${dateFrom}`
    if (dateTo) url += `&date_to=${dateTo}`
    apiJson<{ items: Load[] }>(url)
      .then((data) => {
        setLoads(data.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status, q, customerId, dateFrom, dateTo])

  const statusTabs = [
    'pending', 'unassigned', 'on_hold', 'need_to_cover', 'assigned', 'in_transit', 'delivered', 'cancel',
  ]

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === loads.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(loads.map((l) => l.id)))
  }
  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return
    setBulkUpdating(true)
    try {
      await apiFetch('/loads/bulk-status', {
        method: 'PATCH',
        body: JSON.stringify({ load_ids: Array.from(selectedIds), status: bulkStatus }),
        headers: { 'Content-Type': 'application/json' },
      })
      setSelectedIds(new Set())
      setBulkStatus('')
      setLoading(true)
      let url = '/loads?limit=200'
      if (status) url += `&status=${encodeURIComponent(status)}`
      if (q.trim()) url += `&q=${encodeURIComponent(q.trim())}`
      if (customerId) url += `&customer_id=${encodeURIComponent(customerId)}`
      if (dateFrom) url += `&date_from=${dateFrom}`
      if (dateTo) url += `&date_to=${dateTo}`
      const data = await apiJson<{ items: Load[] }>(url)
      setLoads(data.items ?? [])
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bulk update failed')
    }
    setBulkUpdating(false)
    setLoading(false)
  }

  return (
    <div>
      <h1 className="page-title">Order</h1>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Link
          to="/order/new"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          New Load
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Search Load#</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Load number"
            className="border rounded px-2 py-1.5 w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="border rounded px-2 py-1.5 w-48"
          >
            <option value="">All</option>
            {partners.filter((p) => p.type === 'customer' || !p.type).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-2 py-1.5"
          />
        </div>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setStatus(null); setSearchParams({}); }}
          className={`px-3 py-1.5 rounded ${status === null ? 'bg-red-600 text-white' : 'bg-white border'}`}
        >
          All
        </button>
        {statusTabs.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setSearchParams({ status: s }); }}
            className={`px-3 py-1.5 rounded capitalize ${status === s ? 'bg-red-600 text-white' : 'bg-white border'}`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      {selectedIds.size > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-3 bg-slate-50 border-slate-200">
          <span className="font-medium text-gray-700">{selectedIds.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="border rounded px-2 py-1.5">
            <option value="">Change status to...</option>
            {statusTabs.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button type="button" onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating} className="btn-primary">
            {bulkUpdating ? 'Updating...' : 'Apply'}
          </button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="btn-secondary">Clear</button>
        </div>
      )}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-2 w-10">
                  <input type="checkbox" checked={loads.length > 0 && selectedIds.size === loads.length} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-2 text-left">Load#</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Rate</th>
                <th className="px-4 py-2 text-left">Revenue</th>
                <th className="px-4 py-2 text-left">Cost</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {loads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No loads. Create one via API or add seed data.
                  </td>
                </tr>
              ) : (
                loads.map((load) => (
                  <tr key={load.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selectedIds.has(load.id)} onChange={() => toggleSelect(load.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-2">
                      <Link to={`/order/${load.id}`} className="text-blue-600 hover:underline">
                        {load.load_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{load.status}</td>
                    <td className="px-4 py-2">{load.rate ?? '-'}</td>
                    <td className="px-4 py-2">{load.revenue ?? '-'}</td>
                    <td className="px-4 py-2">{load.cost ?? '-'}</td>
                    <td className="px-4 py-2">{load.created_at ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
