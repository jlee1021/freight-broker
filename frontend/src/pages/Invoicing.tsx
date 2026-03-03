import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type CustomerInvoice = {
  id: string
  load_id: string
  invoice_number: string
  amount: number
  status: string
  due_date: string | null
  load_number: string | null
  customer_name: string | null
  last_reminder_sent_at: string | null
  reminder_sent_count: number
}
type CarrierPayable = {
  id: string
  carrier_segment_id: string
  amount: number
  invoice_number: string | null
  status: string
  load_number: string | null
  carrier_name: string | null
}
type Load = { id: string; load_number: string; revenue: number | null }
type ViewMode = 'ar' | 'ap' | 'all'

type ArTab = 'all' | 'overdue' | 'unpaid' | 'upcoming' | 'paid'
type ApTab = 'all' | 'overdue' | 'unpaid' | 'paid' | 'upcoming'

const AR_TABS: { key: ArTab; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'bg-gray-600' },
  { key: 'overdue', label: 'Overdue', color: 'bg-red-600' },
  { key: 'unpaid', label: 'Unpaid', color: 'bg-lime-600' },
  { key: 'upcoming', label: 'Upcoming', color: 'bg-amber-500' },
  { key: 'paid', label: 'Paid', color: 'bg-blue-600' },
]

const AP_TABS: { key: ApTab; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'bg-gray-600' },
  { key: 'overdue', label: 'Overdue', color: 'bg-red-600' },
  { key: 'unpaid', label: 'Unpaid', color: 'bg-lime-600' },
  { key: 'paid', label: 'Paid', color: 'bg-blue-600' },
  { key: 'upcoming', label: 'Upcoming', color: 'bg-amber-500' },
]

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  unpaid: 'bg-amber-100 text-amber-700',
}

function fmtMoney(v: number) { return `$${Number(v).toLocaleString()}` }
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('en-CA') : '-' }

function isOverdue(inv: CustomerInvoice) {
  return inv.due_date && (inv.status === 'draft' || inv.status === 'sent') && new Date(inv.due_date) < new Date()
}

function applyArTab(ar: CustomerInvoice[], tab: ArTab): CustomerInvoice[] {
  const now = new Date()
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  switch (tab) {
    case 'overdue': return ar.filter(i => isOverdue(i))
    case 'unpaid': return ar.filter(i => i.status !== 'paid')
    case 'upcoming': return ar.filter(i => i.due_date && new Date(i.due_date) >= now && new Date(i.due_date) <= soon)
    case 'paid': return ar.filter(i => i.status === 'paid')
    default: return ar
  }
}

function applyApTab(ap: CarrierPayable[], tab: ApTab): CarrierPayable[] {
  switch (tab) {
    case 'overdue': return ap.filter(p => p.status !== 'paid')
    case 'unpaid': return ap.filter(p => p.status !== 'paid')
    case 'paid': return ap.filter(p => p.status === 'paid')
    case 'upcoming': return ap.filter(p => p.status !== 'paid')
    default: return ap
  }
}

export default function Invoicing({ viewMode = 'all' }: { viewMode?: ViewMode }) {
  const [ar, setAr] = useState<CustomerInvoice[]>([])
  const [ap, setAp] = useState<CarrierPayable[]>([])
  const [loading, setLoading] = useState(true)
  const [createArLoadId, setCreateArLoadId] = useState('')
  const [creating, setCreating] = useState(false)
  const [arTab, setArTab] = useState<ArTab>('all')
  const [apTab, setApTab] = useState<ApTab>('all')

  // AR filters
  const [arDateFrom, setArDateFrom] = useState('')
  const [arDateTo, setArDateTo] = useState('')
  // AP filters
  const [apSearch, setApSearch] = useState('')
  const [apDateFrom, setApDateFrom] = useState('')
  const [apDateTo, setApDateTo] = useState('')

  const loadData = () => {
    const needAr = viewMode === 'ar' || viewMode === 'all'
    const needAp = viewMode === 'ap' || viewMode === 'all'
    if (needAr) {
      apiJson<CustomerInvoice[]>('/invoices/customer')
        .then(list => setAr(Array.isArray(list) ? list : []))
        .catch(() => setAr([]))
    }
    if (needAp) {
      apiJson<CarrierPayable[]>('/invoices/carrier')
        .then(list => setAp(Array.isArray(list) ? list : []))
        .catch(() => setAp([]))
        .finally(() => setLoading(false))
    }
    if (!needAp) setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const markSent = async (id: string) => {
    await apiFetch(`/invoices/customer/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'sent' }) })
    loadData()
  }
  const markPaid = async (id: string) => {
    await apiFetch(`/invoices/customer/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) })
    loadData()
  }
  const markPayablePaid = async (id: string) => {
    await apiFetch(`/invoices/carrier/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) })
    loadData()
  }
  const createCustomerInvoice = async () => {
    if (!createArLoadId) return
    setCreating(true)
    try {
      await apiFetch('/invoices/customer', { method: 'POST', body: JSON.stringify({ load_id: createArLoadId }) })
      setCreateArLoadId(''); loadData()
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    setCreating(false)
  }

  if (loading) return <div className="p-4">Loading...</div>

  const showAr = viewMode === 'ar' || viewMode === 'all'
  const showAp = viewMode === 'ap' || viewMode === 'all'

  // Filter AR
  let filteredAr = applyArTab(ar, arTab)
  if (arDateFrom) filteredAr = filteredAr.filter(i => i.due_date && i.due_date >= arDateFrom)
  if (arDateTo) filteredAr = filteredAr.filter(i => i.due_date && i.due_date <= arDateTo)

  // Filter AP
  let filteredAp = applyApTab(ap, apTab)
  if (apSearch) filteredAp = filteredAp.filter(p => (p.carrier_name || '').toLowerCase().includes(apSearch.toLowerCase()) || (p.load_number || '').toLowerCase().includes(apSearch.toLowerCase()))
  if (apDateFrom || apDateTo) { /* date filter on ap not available without date field */ }

  // Counts for tabs
  const arCounts: Record<ArTab, number> = {
    all: ar.length,
    overdue: ar.filter(i => isOverdue(i)).length,
    unpaid: ar.filter(i => i.status !== 'paid').length,
    upcoming: ar.filter(i => { const soon = new Date(Date.now() + 7 * 86400000); return i.due_date && new Date(i.due_date) >= new Date() && new Date(i.due_date) <= soon }).length,
    paid: ar.filter(i => i.status === 'paid').length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">
        {viewMode === 'ar' ? 'AR List' : viewMode === 'ap' ? 'AP List' : 'Invoicing'}
      </h1>

      {/* ── AR Section ── */}
      {showAr && (
        <section className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            {/* Status tabs */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {AR_TABS.map(t => (
                <button key={t.key} onClick={() => setArTab(t.key)}
                  className={`px-3 py-1 rounded text-xs font-medium ${arTab === t.key ? `${t.color} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t.label} {arCounts[t.key] > 0 && <span className="ml-1 opacity-80">({arCounts[t.key]})</span>}
                </button>
              ))}
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Due Date</span>
              <input type="date" value={arDateFrom} onChange={e => setArDateFrom(e.target.value)} className="border rounded px-2 py-1 text-xs" />
              <span className="text-xs text-gray-400">~</span>
              <input type="date" value={arDateTo} onChange={e => setArDateTo(e.target.value)} className="border rounded px-2 py-1 text-xs" />
              <button onClick={() => { setArDateFrom(''); setArDateTo('') }} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Clear</button>
              <div className="ml-auto flex gap-2">
                <select value={createArLoadId} onChange={e => setCreateArLoadId(e.target.value)} className="border rounded px-2 py-1 text-xs">
                  <option value="">Select load to invoice</option>
                  <LoadOptions />
                </select>
                <button disabled={!createArLoadId || creating} onClick={createCustomerInvoice}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Invoice #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Load</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Customer</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Due Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Reminder</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAr.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No customer invoices.</td></tr>
                ) : filteredAr.map(i => {
                  const overdue = isOverdue(i)
                  const statusLabel = overdue ? 'overdue' : i.status
                  return (
                    <tr key={i.id} className={`border-t ${overdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2 font-medium">{i.invoice_number}</td>
                      <td className="px-3 py-2"><Link to={`/order/${i.load_id}`} className="text-blue-600 hover:underline">{i.load_number ?? '-'}</Link></td>
                      <td className="px-3 py-2">{i.customer_name ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(i.amount)}</td>
                      <td className="px-3 py-2">{fmtDate(i.due_date)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[statusLabel] || 'bg-gray-100 text-gray-600'}`}>{statusLabel}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {i.last_reminder_sent_at ? `${new Date(i.last_reminder_sent_at).toLocaleDateString()} (${i.reminder_sent_count}x)` : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={async () => { const r = await apiFetch(`/invoices/customer/${i.id}/document`); const html = await r.text(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close() } }} className="text-blue-500 hover:underline">View</button>
                          <button onClick={async () => { const r = await apiFetch(`/invoices/customer/${i.id}/document/pdf`); const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Invoice-${i.invoice_number}.pdf`; a.click(); URL.revokeObjectURL(url) }} className="text-blue-500 hover:underline">PDF</button>
                          {i.status === 'draft' && <button onClick={() => markSent(i.id)} className="text-blue-500 hover:underline">Mark Sent</button>}
                          {(i.status === 'draft' || i.status === 'sent') && <button onClick={() => markPaid(i.id)} className="text-green-600 hover:underline">Paid</button>}
                          {overdue && <button onClick={async () => { try { const r = await apiFetch(`/invoices/customer/${i.id}/send-reminder`, { method: 'POST' }); const d = await r.json(); alert(d.sent ? 'Reminder sent.' : (d.message || 'Failed')) } catch(e) { alert(e instanceof Error ? e.message : 'Failed') } }} className="text-amber-600 hover:underline">Remind</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── AP Section ── */}
      {showAp && (
        <section className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            {/* Status tabs */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {AP_TABS.map(t => (
                <button key={t.key} onClick={() => setApTab(t.key)}
                  className={`px-3 py-1 rounded text-xs font-medium ${apTab === t.key ? `${t.color} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input value={apSearch} onChange={e => setApSearch(e.target.value)} placeholder="Search carrier / load..." className="border rounded px-3 py-1.5 text-xs w-48" />
              <input type="date" value={apDateFrom} onChange={e => setApDateFrom(e.target.value)} className="border rounded px-2 py-1 text-xs" />
              <span className="text-xs text-gray-400">~</span>
              <input type="date" value={apDateTo} onChange={e => setApDateTo(e.target.value)} className="border rounded px-2 py-1 text-xs" />
              <button onClick={() => { setApSearch(''); setApDateFrom(''); setApDateTo('') }} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Clear</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Invoice #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Load</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Carrier</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAp.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No carrier payables.</td></tr>
                ) : filteredAp.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{p.invoice_number ?? p.id.slice(0, 8)}</td>
                    <td className="px-3 py-2"><Link to={`/order/${p.carrier_segment_id}`} className="text-blue-600 hover:underline">{p.load_number ?? '–'}</Link></td>
                    <td className="px-3 py-2">{p.carrier_name ?? '–'}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(p.amount)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={async () => { const r = await apiFetch(`/invoices/carrier/${p.id}/document`); const html = await r.text(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close() } }} className="text-blue-500 hover:underline">View</button>
                        <button onClick={async () => { const r = await apiFetch(`/invoices/carrier/${p.id}/document/pdf`); const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `CarrierInvoice-${p.invoice_number ?? p.id.slice(0, 8)}.pdf`; a.click(); URL.revokeObjectURL(url) }} className="text-blue-500 hover:underline">PDF</button>
                        {p.status !== 'paid' && <button onClick={() => markPayablePaid(p.id)} className="text-green-600 hover:underline">Paid</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function LoadOptions() {
  const [loads, setLoads] = useState<Load[]>([])
  useEffect(() => {
    apiJson<{ items: Load[] }>('/loads?limit=500').then(d => setLoads(d.items ?? [])).catch(() => {})
  }, [])
  return loads.map(l => <option key={l.id} value={l.id}>{l.load_number} ({l.revenue ?? 0})</option>)
}
