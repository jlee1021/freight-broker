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

export default function Profit() {
  const [items, setItems] = useState<ProfitItem[]>([])
  const [customers, setCustomers] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState(firstOfMonth)
  const [dateTo, setDateTo] = useState(todayStr)
  const [nameFilter, setNameFilter] = useState('')

  useEffect(() => {
    apiJson<Partner[]>('/partners').then(list => setCustomers(Array.isArray(list) ? list.filter(p => p.type === 'customer' || !p.type) : [])).catch(() => {})
  }, [])

  const doSearch = () => {
    setLoading(true); setError(null)
    let url = '/stats/profit-by-customer?'
    if (dateFrom) url += `date_from=${dateFrom}&`
    if (dateTo) url += `date_to=${dateTo}&`
    if (customerId) url += `customer_id=${customerId}&`
    apiJson<{ items: ProfitItem[] }>(url)
      .then(d => setItems(d.items || []))
      .catch(e => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { doSearch() }, [])

  const filteredItems = nameFilter ? items.filter(i => i.customer_name.toLowerCase().includes(nameFilter.toLowerCase())) : items
  const totals = filteredItems.reduce((acc, x) => ({ revenue: acc.revenue + x.revenue, cost: acc.cost + x.cost, profit: acc.profit + x.profit }), { revenue: 0, cost: 0, profit: 0 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-gray-800">Profit by Customer</h1>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-gray-500">Period Date</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5 text-xs" />
        <span className="text-xs text-gray-400">To</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1.5 text-xs" />
        <input value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="Customer name..." className="border rounded px-3 py-1.5 text-xs w-40" />
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="border rounded px-2 py-1.5 text-xs">
          <option value="">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={doSearch} className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Apply</button>
        <button onClick={() => { setDateFrom(firstOfMonth); setDateTo(todayStr); setNameFilter(''); setCustomerId('') }} className="px-4 py-1.5 border rounded text-xs hover:bg-gray-50">Clear</button>
        {/* Totals (right) */}
        <div className="ml-auto flex gap-4 text-xs text-gray-600">
          <span>Total Revenue: <strong className="text-emerald-700">${totals.revenue.toLocaleString()}</strong></span>
          <span>Total Cost: <strong className="text-rose-700">${totals.cost.toLocaleString()}</strong></span>
          <span>Total Profit: <strong className="text-blue-700">${totals.profit.toLocaleString()}</strong></span>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 p-4">
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Load #</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Customer</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">Revenue</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">Expense</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">Profit</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">Margin %</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">No profit data for selected period.</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.load_id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{item.date ? new Date(item.date).toLocaleDateString('en-CA') : '-'}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/order/${item.load_id}`} className="text-blue-600 hover:underline">{item.load_number}</Link>
                    </td>
                    <td className="px-3 py-2">
                      {item.customer_id ? (
                        <Link to={`/partner/${item.customer_id}`} className="text-blue-600 hover:underline">{item.customer_name}</Link>
                      ) : item.customer_name}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">{item.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700">${item.revenue.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-rose-700">${item.cost.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-blue-700">${item.profit.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{item.margin != null ? `${item.margin}%` : '–'}</td>
                    <td className="px-3 py-2">
                      <Link to={`/order/${item.load_id}`} className="text-blue-500 hover:underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Summary footer */}
          {filteredItems.length > 0 && (
            <div className="border-t px-4 py-2 bg-gray-50 flex gap-6 text-xs text-gray-600">
              <span>Total Loads: <strong>{filteredItems.length}</strong></span>
              <span>Revenue: <strong className="text-emerald-700">${totals.revenue.toLocaleString()}</strong></span>
              <span>Expense: <strong className="text-rose-700">${totals.cost.toLocaleString()}</strong></span>
              <span>Profit: <strong className="text-blue-700">${totals.profit.toLocaleString()}</strong></span>
            </div>
          )}
        </div>
      )}

      <div className="text-right mt-2">
        <Link to="/profit/expense-detail" className="text-xs text-blue-600 hover:underline">View Expense Detail →</Link>
      </div>
    </div>
  )
}
