import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api'

type DashboardStats = {
  total_loads: number
  by_status: Record<string, number>
  total_revenue: number
  total_cost: number
  total_profit: number
  recent_loads?: { id: string; load_number: string; status: string; rate: number; created_at: string | null }[]
  ar_outstanding?: number
  overdue_invoices_count?: number
  insurance_expiring_soon_count?: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setLoading(true)
    apiJson<DashboardStats>('/stats/dashboard')
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

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-800">{error}</span>
          <button type="button" onClick={load} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            Retry
          </button>
        </div>
      )}
      {loading && !stats && <p className="text-gray-500 mb-4">Loading stats...</p>}
      {stats && (stats.overdue_invoices_count > 0 || stats.insurance_expiring_soon_count > 0) && (
        <div className="mb-4 space-y-2">
          {stats.overdue_invoices_count > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-amber-800 font-medium">Overdue invoices: {stats.overdue_invoices_count}</span>
              <Link to="/invoicing" className="text-amber-700 hover:underline text-sm">View Invoicing →</Link>
            </div>
          )}
          {stats.insurance_expiring_soon_count > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-orange-800 font-medium">Carriers with insurance expiring in 30 days: {stats.insurance_expiring_soon_count}</span>
              <Link to="/partner?type=carrier" className="text-orange-700 hover:underline text-sm">View Partners →</Link>
            </div>
          )}
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-600">Total Loads</div>
            <div className="text-2xl font-bold">{stats.total_loads}</div>
            <Link to="/order" className="text-sm text-blue-600 hover:underline">View orders →</Link>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Revenue (CAD)</div>
            <div className="text-2xl font-bold">{stats.total_revenue.toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Cost (CAD)</div>
            <div className="text-2xl font-bold">{stats.total_cost.toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Profit (CAD)</div>
            <div className="text-2xl font-bold">{stats.total_profit.toLocaleString()}</div>
          </div>
          {stats.ar_outstanding != null && (
            <div className="card">
              <div className="text-sm text-gray-600">AR Outstanding (CAD)</div>
              <div className="text-2xl font-bold">{stats.ar_outstanding.toLocaleString()}</div>
              <Link to="/invoicing" className="text-sm text-blue-600 hover:underline">Invoicing →</Link>
            </div>
          )}
        </div>
      )}
      {stats?.recent_loads && stats.recent_loads.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent Loads</h2>
          <ul className="space-y-1">
            {stats.recent_loads.map((l) => (
              <li key={l.id}>
                <Link to={`/order/${l.id}`} className="text-blue-600 hover:underline">{l.load_number}</Link>
                {' '}<span className="text-gray-500">{l.status}</span> · Rate: {l.rate?.toLocaleString() ?? '-'}
              </li>
            ))}
          </ul>
        </div>
      )}
      {stats && Object.keys(stats.by_status).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Loads by Status</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.by_status).map(([status, count]) => (
              <Link
                key={status}
                to={`/order?status=${status}`}
                className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200"
              >
                {status.replace(/_/g, ' ')}: <strong>{count}</strong>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
