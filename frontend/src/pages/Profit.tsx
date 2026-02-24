import { useState, useEffect } from 'react'
import { apiJson } from '../api'

type ProfitSummary = {
  total_revenue: number
  total_cost: number
  total_profit: number
}

export default function Profit() {
  const [summary, setSummary] = useState<ProfitSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setLoading(true)
    apiJson<ProfitSummary>('/stats/profit')
      .then(setSummary)
      .catch((e) => {
        setSummary(null)
        setError(e instanceof Error ? e.message : 'Failed to load profit summary')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (loading && !summary) return <div className="p-4">Loading...</div>
  if (error) {
    return (
      <div>
        <h1 className="page-title">Profit</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-800">{error}</span>
          <button type="button" onClick={load} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Retry</button>
        </div>
      </div>
    )
  }
  if (!summary) return <div className="p-4 text-gray-500">No data.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Profit</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Revenue (CAD)</span>
            <span className="font-semibold">{summary.total_revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Cost (CAD)</span>
            <span className="font-semibold">{summary.total_cost.toLocaleString()}</span>
          </div>
          <hr />
          <div className="flex justify-between text-lg">
            <span className="font-medium">Profit (CAD)</span>
            <span className="font-bold">{summary.total_profit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
