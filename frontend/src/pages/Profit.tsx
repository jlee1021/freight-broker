import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api'

type ProfitItem = {
  load_id: string
  load_number: string
  date: string | null
  period: string
  status: string
  customer_id: string | null
  customer_name: string
  revenue: number
  cost: number
  profit: number
  margin: number | null
}

type Partner = { id: string; name: string; type: string | null }

const PERIODS = [
  { value: '', label: 'All time' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'month', label: 'This month' },
]

function getRange(period: string): { date_from: string; date_to: string } | null {
  if (!period) return null
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  let from: string
  if (period === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  } else {
    const d = new Date(today)
    d.setDate(d.getDate() - (parseInt(period) || 30) + 1)
    from = d.toISOString().slice(0, 10)
  }
  return { date_from: from, date_to: to }
}

export default function Profit() {
  const [items, setItems] = useState<ProfitItem[]>([])
  const [customers, setCustomers] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [customerId, setCustomerId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiJson<Partner[]>('/partners').then(list => setCustomers(Array.isArray(list) ? list.filter(p => p.type === 'customer' || !p.type) : [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true); setError(null)
    const range = getRange(period)
    let url = '/stats/profit-by-customer?'
    if (range) url += `date_from=${range.date_from}&date_to=${range.date_to}&`
    if (customerId) url += `customer_id=${customerId}&`
    apiJson<{ items: ProfitItem[] }>(url)
      .then(d => setItems(d.items || []))
      .catch(e => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [period, customerId])

  const totals = items.reduce((acc, x) => ({ revenue: acc.revenue + x.revenue, cost: acc.cost + x.cost, profit: acc.profit + x.profit }), { revenue: 0, cost: 0, profit: 0 })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">Profit by Customer</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded px-3 py-2 text-sm">
            {PERIODS.map(p => <option key={p.value || 'all'} value={p.value}>{p.label}</option>)}
          </select>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">All Customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue (CAD)</span>
          <div className="text-2xl font-bold text-emerald-700">{totals.revenue.toLocaleString()}</div>
        </div>
        <div className="card flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost (CAD)</span>
          <div className="text-2xl font-bold text-rose-700">{totals.cost.toLocaleString()}</div>
        </div>
        <div className="card flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profit (CAD)</span>
          <div className="text-2xl font-bold text-blue-700">{totals.profit.toLocaleString()}</div>
        </div>
      </div>

      {/* Profit Expense Detail 링크 */}
      <div className="text-right">
        <Link to="/profit/expense-detail" className="text-sm text-blue-600 hover:underline font-medium">View Expense Detail →</Link>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-2.5 text-left">Load #</th>
                <th className="px-4 py-2.5 text-left">Period</th>
                <th className="px-4 py-2.5 text-left">Customer</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Profit</th>
                <th className="px-4 py-2.5 text-right">Margin %</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">No profit data for selected period.</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.load_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">
                      <Link to={`/order/${item.load_id}`} className="text-blue-600 hover:underline">{item.load_number}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{item.period}</td>
                    <td className="px-4 py-2.5">
                      {item.customer_id ? (
                        <Link to={`/partner/${item.customer_id}`} className="text-blue-600 hover:underline">{item.customer_name}</Link>
                      ) : item.customer_name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">{item.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{item.revenue.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-rose-700">{item.cost.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-blue-700">{item.profit.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">{item.margin != null ? `${item.margin}%` : '–'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link to={`/order/${item.load_id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    </td>
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
