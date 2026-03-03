import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { apiJson } from '../api'

type ApSummary = { total_ap: number; unpaid_ap: number; overdue_ap_count: number }

type DashboardStats = {
  total_loads: number
  by_status: Record<string, number>
  total_revenue: number
  total_cost: number
  total_profit: number
  recent_loads?: {
    id: string
    load_number: string
    status: string
    rate: number
    created_at: string | null
    customer_name?: string | null
  }[]
  ar_outstanding?: number
  overdue_invoices_count?: number
  insurance_expiring_soon_count?: number
  date_from?: string | null
  date_to?: string | null
  prev_revenue?: number
  prev_cost?: number
  prev_profit?: number
  prev_loads?: number
  pct_change_revenue?: number | null
  pct_change_cost?: number | null
  pct_change_profit?: number | null
  pct_change_loads?: number | null
  top_customers?: {
    customer_id: string
    name: string
    balance: number
    income: number
    cost: number
    profit: number
    ratio: number | null
  }[]
  recently_dispatched_carriers?: {
    date: string | null
    carrier_name: string
    carrier_id: string | null
    load_id: string
    load_number: string
  }[]
}

type TrendItem = { period: string; revenue: number; cost: number; profit: number }

// ── Phase 1: KPI 카드용 아이콘 (SVG) ─────────────────────────────────────
const IconLoads = () => (
  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)
const IconRevenue = () => (
  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconCost = () => (
  <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
)
const IconProfit = () => (
  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)
const IconAR = () => (
  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const IconAlert = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const PERIODS = [
  { value: '', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'month', label: 'This month' },
] as const

function getDateRange(period: string): { date_from: string; date_to: string } | null {
  if (!period) return null
  const today = new Date()
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let from: Date
  if (period === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1)
  } else {
    const days = parseInt(period, 10) || 30
    from = new Date(to)
    from.setDate(from.getDate() - days + 1)
  }
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  }
}

export default function Dashboard() {
  const [period, setPeriod] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [apSummary, setApSummary] = useState<ApSummary | null>(null)
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => getDateRange(period), [period])

  useEffect(() => {
    setError(null)
    setLoading(true)
    const params = range ? `?date_from=${range.date_from}&date_to=${range.date_to}` : ''
    apiJson<DashboardStats>(`/stats/dashboard${params}`)
      .then((data) => {
        setStats(data)
        setError(null)
      })
      .catch((e) => {
        setStats(null)
        setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      })
      .finally(() => setLoading(false))
  }, [period, range?.date_from, range?.date_to])

  useEffect(() => {
    if (!range) {
      setTrend([])
      return
    }
    const group = period === '7' ? 'week' : 'month'
    apiJson<{ items: TrendItem[] }>(
      `/stats/revenue-cost-trend?date_from=${range.date_from}&date_to=${range.date_to}&group=${group}`
    )
      .then((data) => setTrend(data.items || []))
      .catch(() => setTrend([]))
  }, [period, range?.date_from, range?.date_to])

  useEffect(() => {
    apiJson<ApSummary>('/stats/ap-summary').then(setApSummary).catch(() => {})
  }, [])

  const load = () => {
    setError(null)
    setLoading(true)
    const params = range ? `?date_from=${range.date_from}&date_to=${range.date_to}` : ''
    apiJson<DashboardStats>(`/stats/dashboard${params}`)
      .then((data) => {
        setStats(data)
        setError(null)
      })
      .catch((e) => {
        setStats(null)
        setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      })
      .finally(() => setLoading(false))
  }

  const totalByStatus = stats ? Object.values(stats.by_status || {}).reduce((a, b) => a + b, 0) : 0
  const maxStatusCount = stats && totalByStatus > 0 ? Math.max(...Object.values(stats.by_status || {})) : 1

  const renderPct = (pct: number | null | undefined, inverse = false) => {
    if (pct == null) return null
    const positive = inverse ? pct <= 0 : pct >= 0
    return (
      <span className={`text-xs font-medium ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {pct >= 0 ? '+' : ''}{pct}% vs prev
      </span>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          {PERIODS.map((p) => (
            <option key={p.value || 'all'} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span className="text-red-800">{error}</span>
          <button type="button" onClick={load} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      )}
      {loading && !stats && (
        <div className="flex items-center gap-2 text-gray-500">
          <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
          Loading...
        </div>
      )}

      {/* Alerts */}
      {stats && ((stats.overdue_invoices_count ?? 0) > 0 || (stats.insurance_expiring_soon_count ?? 0) > 0) && (
        <div className="card border-l-4 border-amber-500 bg-amber-50/50 py-3">
          <div className="flex items-center gap-2 mb-2">
            <IconAlert />
            <h2 className="font-semibold text-gray-800">Alerts</h2>
          </div>
          <ul className="space-y-1.5">
            {(stats.overdue_invoices_count ?? 0) > 0 && (
              <li className="flex items-center justify-between">
                <span className="text-amber-800 text-sm">Overdue invoices: <strong>{stats.overdue_invoices_count}</strong></span>
                <Link to="/account/ar" className="text-xs text-amber-700 hover:underline">View AR →</Link>
              </li>
            )}
            {(stats.insurance_expiring_soon_count ?? 0) > 0 && (
              <li className="flex items-center justify-between">
                <span className="text-orange-800 text-sm">Insurance expiring (30d): <strong>{stats.insurance_expiring_soon_count}</strong></span>
                <Link to="/partner?view=carrier" className="text-xs text-orange-700 hover:underline">View Carriers →</Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ── Row 1: KPI Cards ─────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link to="/order" className="card flex flex-col gap-1 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase">Total Loads</span>
              <IconLoads />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_loads.toLocaleString()}</div>
            {stats.pct_change_loads != null && renderPct(stats.pct_change_loads)}
          </Link>
          <div className="card flex flex-col gap-1 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase">Revenue</span>
              <IconRevenue />
            </div>
            <div className="text-2xl font-bold text-emerald-700">${stats.total_revenue.toLocaleString()}</div>
            {stats.pct_change_revenue != null && renderPct(stats.pct_change_revenue)}
          </div>
          <div className="card flex flex-col gap-1 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase">Cost</span>
              <IconCost />
            </div>
            <div className="text-2xl font-bold text-rose-700">${stats.total_cost.toLocaleString()}</div>
            {stats.pct_change_cost != null && renderPct(stats.pct_change_cost, true)}
          </div>
          <div className="card flex flex-col gap-1 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase">Profit</span>
              <IconProfit />
            </div>
            <div className="text-2xl font-bold text-blue-700">${stats.total_profit.toLocaleString()}</div>
            {stats.pct_change_profit != null && renderPct(stats.pct_change_profit)}
          </div>
          {stats.ar_outstanding != null ? (
            <Link to="/account/ar" className="card flex flex-col gap-1 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase">AR Outstanding</span>
                <IconAR />
              </div>
              <div className="text-2xl font-bold text-amber-700">${stats.ar_outstanding.toLocaleString()}</div>
              <span className="text-xs text-blue-600">View →</span>
            </Link>
          ) : apSummary ? (
            <Link to="/account/ap" className="card flex flex-col gap-1 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-xs font-medium text-gray-500 uppercase">Total AP</span>
              <div className="text-2xl font-bold text-gray-800">${apSummary.total_ap.toLocaleString()}</div>
              <span className="text-xs text-blue-600">View AP →</span>
            </Link>
          ) : null}
        </div>
      )}

      {/* ── Row 2: AP Summary (left) + Recently Dispatched Carriers (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* AP Summary card */}
        {apSummary && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">AP Summary</h2>
              <Link to="/account/ap" className="text-xs text-blue-600 hover:underline">View AP →</Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Total AP</span>
                <span className="font-bold text-gray-800">${apSummary.total_ap.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Unpaid AP</span>
                <span className="font-bold text-rose-700">${apSummary.unpaid_ap.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Overdue Count</span>
                <span className="font-bold text-amber-700">{apSummary.overdue_ap_count}</span>
              </div>
            </div>
            {/* Loads by Status mini list */}
            {stats && Object.keys(stats.by_status || {}).length > 0 && (
              <div className="border-t pt-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Loads by Status</h3>
                <div className="space-y-1.5">
                  {Object.entries(stats.by_status)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([status, count]) => {
                      const pct = totalByStatus > 0 ? (count / totalByStatus) * 100 : 0
                      const barPct = maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0
                      return (
                        <Link key={status} to={`/order?status=${status}`} className="block group">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs text-gray-600 capitalize group-hover:text-blue-600">{status.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 group-hover:bg-blue-500 rounded-full" style={{ width: `${barPct}%` }} />
                          </div>
                        </Link>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recently Dispatched Carriers */}
        {stats?.recently_dispatched_carriers && stats.recently_dispatched_carriers.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Recently Dispatched Carriers</h2>
              <Link to="/partner?view=carrier" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <table className="min-w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Carrier</th>
                  <th className="px-3 py-2 text-left">Load #</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recently_dispatched_carriers.map((d, i) => (
                  <tr key={d.load_id + String(i)} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 text-xs">{d.date ? new Date(d.date).toLocaleDateString() : '–'}</td>
                    <td className="px-3 py-2 font-medium">
                      {d.carrier_id
                        ? <Link to={`/partner/${d.carrier_id}`} className="text-blue-600 hover:underline">{d.carrier_name}</Link>
                        : d.carrier_name}
                    </td>
                    <td className="px-3 py-2">
                      <Link to={`/order/${d.load_id}`} className="text-blue-600 hover:underline">{d.load_number}</Link>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link to={`/order/${d.load_id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Row 3: Profit Chart (left) + Top 10 Customers (right) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profit Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Profit (Sales)</h2>
            <Link to="/order" className="text-xs text-blue-600 hover:underline">View orders →</Link>
          </div>
          {trend.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                  <Tooltip formatter={(v: number | string | undefined) => (v != null ? `$${Number(v).toLocaleString()}` : '–')} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cost" name="Cost" fill="#e11d48" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#2563eb" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              Select a period to see the profit trend chart.
            </div>
          )}
          {stats && (
            <div className="mt-3 pt-3 border-t flex gap-4 text-xs text-gray-600">
              <span>Revenue: <strong className="text-emerald-700">${stats.total_revenue.toLocaleString()}</strong></span>
              <span>Cost: <strong className="text-rose-700">${stats.total_cost.toLocaleString()}</strong></span>
              <span>Profit: <strong className="text-blue-700">${stats.total_profit.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* Top 10 Customers */}
        {stats?.top_customers && stats.top_customers.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Top 10 Customers</h2>
              <Link to="/partner?view=customer" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="table-header">
                  <tr>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                    <th className="px-3 py-2 text-right">Profit</th>
                    <th className="px-3 py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_customers.map((c) => (
                    <tr key={c.customer_id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">
                        {c.customer_id !== '_no_customer'
                          ? <Link to={`/partner/${c.customer_id}`} className="text-blue-600 hover:underline">{c.name}</Link>
                          : c.name}
                      </td>
                      <td className="px-3 py-2 text-right">{c.balance.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">{c.income.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-rose-700">{c.cost.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-blue-700">{c.profit.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{c.ratio != null ? `${c.ratio}%` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Row 4: Recent Loads ───────────────────────────────────────── */}
      {stats?.recent_loads && stats.recent_loads.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent Loads</h2>
            <Link to="/order" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-3 py-2 text-left">Load #</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_loads.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/order/${l.id}`} className="text-blue-600 hover:underline">{l.load_number}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 capitalize">{l.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{l.customer_name ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{l.rate != null ? `$${l.rate.toLocaleString()}` : '–'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '–'}</td>
                    <td className="px-3 py-2 text-right">
                      <Link to={`/order/${l.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    </td>
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
