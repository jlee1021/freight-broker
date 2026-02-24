import { useState, useEffect } from 'react'
import { apiJson, apiFetch, buildUrl } from '../api'

type ReportItem = { id: string; name: string; revenue?: number; cost: number; profit?: number; load_count: number }
type CarrierPerf = { carrier_id: string; name: string; average_rating: number | null; on_time_count: number; total_loads: number; on_time_pct: number | null }
type LaneItem = { origin: string; destination: string; load_count: number; revenue: number; cost: number; profit: number }

export default function Reports() {
  const [groupBy, setGroupBy] = useState<'customer' | 'carrier'>('customer')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [items, setItems] = useState<ReportItem[]>([])
  const [carrierPerf, setCarrierPerf] = useState<CarrierPerf[]>([])
  const [laneItems, setLaneItems] = useState<LaneItem[]>([])
  const [loading, setLoading] = useState(false)
  const [revenueError, setRevenueError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setRevenueError(null)
    let url = `/stats/reports/revenue?group_by=${groupBy}`
    if (dateFrom) url += `&date_from=${dateFrom}`
    if (dateTo) url += `&date_to=${dateTo}`
    apiJson<{ items: ReportItem[] }>(url)
      .then((d) => {
        setItems(d.items ?? [])
        setRevenueError(null)
      })
      .catch((e) => {
        setItems([])
        setRevenueError(e instanceof Error ? e.message : 'Failed to load report')
      })
      .finally(() => setLoading(false))
  }, [groupBy, dateFrom, dateTo])

  useEffect(() => {
    apiJson<{ items: CarrierPerf[] }>('/stats/carrier-performance')
      .then((d) => setCarrierPerf(d.items ?? []))
      .catch(() => setCarrierPerf([]))
  }, [])

  useEffect(() => {
    apiJson<{ items: LaneItem[] }>('/stats/reports/by-lane')
      .then((d) => setLaneItems(d?.items ?? []))
      .catch(() => setLaneItems([]))
  }, [])

  const downloadCsv = async (path: string, filename: string) => {
    const r = await apiFetch(path)
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const headers = groupBy === 'customer' ? 'Name,Revenue,Cost,Profit,Load Count\n' : 'Name,Cost,Load Count\n'
    const rows = items.map((i) =>
      groupBy === 'customer'
        ? `${escapeCsv(i.name)},${i.revenue ?? 0},${i.cost},${i.profit ?? 0},${i.load_count}`
        : `${escapeCsv(i.name)},${i.cost},${i.load_count}`
    )
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `revenue-report-${groupBy}-${dateFrom || 'all'}-${dateTo || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="page-title mb-0">Reports</h1>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={exportCsv} disabled={items.length === 0} className="btn-secondary">
            Export report CSV
          </button>
          <button type="button" onClick={() => downloadCsv('/loads/export/csv', 'loads_export.csv')} className="btn-secondary">
            Export loads CSV
          </button>
          <button type="button" onClick={() => downloadCsv('/invoices/customer/export/csv', 'ar_invoices.csv')} className="btn-secondary">
            Export AR CSV
          </button>
          <button type="button" onClick={() => downloadCsv('/invoices/carrier/export/csv', 'ap_payables.csv')} className="btn-secondary">
            Export AP CSV
          </button>
        </div>
      </div>
      <div className="card mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Group by</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'customer' | 'carrier')} className="border rounded px-2 py-1.5">
            <option value="customer">Customer</option>
            <option value="carrier">Carrier</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
      </div>
      {revenueError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">{revenueError}</div>
      )}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 && !revenueError ? (
        <p className="text-gray-500 py-4">No data for the selected filters. Try different dates or group.</p>
      ) : (
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                {groupBy === 'customer' && <th className="px-4 py-2 text-right">Revenue</th>}
                <th className="px-4 py-2 text-right">Cost</th>
                {groupBy === 'customer' && <th className="px-4 py-2 text-right">Profit</th>}
                <th className="px-4 py-2 text-right">Loads</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No data.</td></tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-2">{i.name}</td>
                    {groupBy === 'customer' && <td className="px-4 py-2 text-right">{(i.revenue ?? 0).toLocaleString()}</td>}
                    <td className="px-4 py-2 text-right">{i.cost.toLocaleString()}</td>
                    {groupBy === 'customer' && <td className="px-4 py-2 text-right">{(i.profit ?? 0).toLocaleString()}</td>}
                    <td className="px-4 py-2 text-right">{i.load_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {laneItems.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-3">By Lane (Origin → Destination)</h2>
          <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-2 text-left">Origin</th>
                <th className="px-4 py-2 text-left">Destination</th>
                <th className="px-4 py-2 text-right">Loads</th>
                <th className="px-4 py-2 text-right">Revenue</th>
                <th className="px-4 py-2 text-right">Cost</th>
                <th className="px-4 py-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {laneItems.map((row, idx) => (
                <tr key={`${row.origin}-${row.destination}-${idx}`} className="border-t">
                  <td className="px-4 py-2">{row.origin}</td>
                  <td className="px-4 py-2">{row.destination}</td>
                  <td className="px-4 py-2 text-right">{row.load_count}</td>
                  <td className="px-4 py-2 text-right">{row.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{row.cost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{row.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {carrierPerf.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-3">Carrier performance</h2>
          <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-2 text-left">Carrier</th>
                <th className="px-4 py-2 text-right">Avg rating</th>
                <th className="px-4 py-2 text-right">On time</th>
                <th className="px-4 py-2 text-right">Total loads</th>
              </tr>
            </thead>
            <tbody>
              {carrierPerf.map((c) => (
                <tr key={c.carrier_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2 text-right">{c.average_rating ?? '-'}</td>
                  <td className="px-4 py-2 text-right">{c.on_time_pct != null ? `${c.on_time_pct}%` : '-'}</td>
                  <td className="px-4 py-2 text-right">{c.total_loads}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

function escapeCsv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}
