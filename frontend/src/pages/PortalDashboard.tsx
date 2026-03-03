/**
 * 포털 전용 대시보드 — 고객/캐리어 파트너가 로그인 시 보는 화면
 * 일반 관리자 Dashboard와 별도로 파트너 맞춤 KPI 제공
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api'
import { useMe } from '../AuthContext'

type LoadItem = {
  id: string
  load_number: string
  status: string
  origin_city: string | null
  destination_city: string | null
  revenue: number | null
  pickup_date: string | null
  delivery_date: string | null
}

type InvoiceItem = {
  id: string
  invoice_number: string
  amount: number
  status: string
  due_date: string | null
}

type PayableItem = {
  id: string
  invoice_number: string | null
  amount: number
  status: string
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  dispatched: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  invoiced: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-emerald-100 text-emerald-700',
}

export default function PortalDashboard() {
  const me = useMe()
  const isCarrier = (me?.partner_type || '').toLowerCase() === 'carrier'
  const partnerName = me?.partner_name || me?.email || 'Partner'

  const [recentLoads, setRecentLoads] = useState<LoadItem[]>([])
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [payables, setPayables] = useState<PayableItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches: Promise<void>[] = [
      apiJson<{ items: LoadItem[] }>('/loads?limit=5')
        .then((d) => setRecentLoads(d.items || []))
        .catch(() => setRecentLoads([])),
    ]
    if (!isCarrier) {
      fetches.push(
        apiJson<InvoiceItem[]>('/invoices/customer')
          .then((list) => setInvoices(Array.isArray(list) ? list : []))
          .catch(() => setInvoices([]))
      )
    } else {
      fetches.push(
        apiJson<PayableItem[]>('/invoices/carrier')
          .then((list) => setPayables(Array.isArray(list) ? list : []))
          .catch(() => setPayables([]))
      )
    }
    Promise.all(fetches).finally(() => setLoading(false))
  }, [isCarrier])

  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid')
  const unpaidPayables = payables.filter((p) => p.status !== 'paid')
  const overdueInvoices = invoices.filter(
    (i) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date()
  )
  const activeLoads = recentLoads.filter((l) => ['dispatched', 'in_transit'].includes(l.status))

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 text-white">
        <p className="text-slate-300 text-sm mb-1">Welcome back,</p>
        <h1 className="text-2xl font-bold">{partnerName}</h1>
        <p className="text-slate-300 text-sm mt-1">
          {isCarrier ? 'Carrier Portal' : 'Customer Portal'}
          {' — '}
          {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Active Loads"
          value={loading ? '...' : String(activeLoads.length)}
          sub="in transit or dispatched"
          color="blue"
        />
        <KpiCard
          label="Total Loads"
          value={loading ? '...' : String(recentLoads.length) + (recentLoads.length >= 5 ? '+' : '')}
          sub="accessible to you"
          color="slate"
        />
        {!isCarrier ? (
          <>
            <KpiCard
              label="Open Invoices"
              value={loading ? '...' : String(unpaidInvoices.length)}
              sub="awaiting payment"
              color="amber"
            />
            <KpiCard
              label="Overdue"
              value={loading ? '...' : String(overdueInvoices.length)}
              sub="past due date"
              color={overdueInvoices.length > 0 ? 'red' : 'green'}
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Open Payables"
              value={loading ? '...' : String(unpaidPayables.length)}
              sub="pending payment"
              color="amber"
            />
            <KpiCard
              label="Paid"
              value={loading ? '...' : String(payables.filter((p) => p.status === 'paid').length)}
              sub="invoices settled"
              color="green"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loads */}
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Recent Loads</h2>
            <Link to="/order" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : recentLoads.length === 0 ? (
            <p className="text-sm text-gray-400">No loads found.</p>
          ) : (
            <div className="space-y-2">
              {recentLoads.map((l) => (
                <Link
                  key={l.id}
                  to={`/order/${l.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{l.load_number}</p>
                    <p className="text-xs text-gray-500">
                      {l.origin_city || '—'} → {l.destination_city || '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLOR[l.status] || 'bg-gray-100 text-gray-600'}`}>
                    {l.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Invoices / Payables */}
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">
              {isCarrier ? 'Recent Payables' : 'Recent Invoices'}
            </h2>
            <Link to="/invoicing" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : !isCarrier ? (
            invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No invoices found.</p>
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((inv) => {
                  const overdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date()
                  return (
                    <div key={inv.id} className={`flex items-center justify-between p-3 rounded-lg ${overdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div>
                        <p className="font-medium text-gray-800">{inv.invoice_number}</p>
                        <p className="text-xs text-gray-500">Due: {inv.due_date || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${Number(inv.amount).toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                          overdue ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{inv.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            payables.length === 0 ? (
              <p className="text-sm text-gray-400">No payables found.</p>
            ) : (
              <div className="space-y-2">
                {payables.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{p.invoice_number || 'Payable'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${Number(p.amount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Carrier: Quick Contact box */}
      {isCarrier && (
        <div className="card bg-blue-50 border border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-2">Need Help?</h2>
          <p className="text-sm text-blue-700">
            For rate questions or load details, please contact your dispatcher directly.
            New tenders will be sent to your registered email — check your inbox!
          </p>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200', slate: 'bg-slate-50 border-slate-200',
    amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200',
    green: 'bg-green-50 border-green-200',
  }
  const text: Record<string, string> = {
    blue: 'text-blue-700', slate: 'text-slate-700',
    amber: 'text-amber-700', red: 'text-red-700', green: 'text-green-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${bg[color] || bg.slate}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text[color] || text.slate}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
