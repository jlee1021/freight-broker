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

export default function Invoicing({ viewMode = 'all' }: { viewMode?: ViewMode }) {
  const [ar, setAr] = useState<CustomerInvoice[]>([])
  const [ap, setAp] = useState<CarrierPayable[]>([])
  const [loading, setLoading] = useState(true)
  const [createArLoadId, setCreateArLoadId] = useState('')
  const [creating, setCreating] = useState(false)
  const [arFilter, setArFilter] = useState<'all' | 'overdue'>('all')
  const [apStatusFilter, setApStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all')

  const load = () => {
    const needAr = viewMode === 'ar' || viewMode === 'all'
    const needAp = viewMode === 'ap' || viewMode === 'all'
    const arUrl = arFilter === 'overdue' ? '/invoices/customer?overdue=true' : '/invoices/customer'
    if (needAr) {
      apiJson<CustomerInvoice[]>(arUrl)
        .then((list) => setAr(Array.isArray(list) ? list : []))
        .catch(() => setAr([]))
    }
    if (needAp) {
      apiJson<CarrierPayable[]>('/invoices/carrier')
        .then((list) => setAp(Array.isArray(list) ? list : []))
        .catch(() => setAp([]))
        .finally(() => setLoading(false))
    }
    if (!needAp) setLoading(false)
  }

  useEffect(() => { load() }, [arFilter])

  const markSent = async (id: string) => {
    await apiFetch(`/invoices/customer/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'sent' }) })
    load()
  }
  const markPaid = async (id: string) => {
    await apiFetch(`/invoices/customer/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) })
    load()
  }
  const markPayablePaid = async (id: string) => {
    await apiFetch(`/invoices/carrier/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) })
    load()
  }

  const createCustomerInvoice = async () => {
    if (!createArLoadId) return
    setCreating(true)
    try {
      await apiFetch('/invoices/customer', { method: 'POST', body: JSON.stringify({ load_id: createArLoadId }) })
      setCreateArLoadId('')
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
    setCreating(false)
  }

  if (loading) return <div className="p-4">Loading...</div>

  const showAr = viewMode === 'ar' || viewMode === 'all'
  const showAp = viewMode === 'ap' || viewMode === 'all'
  const filteredAp = apStatusFilter === 'all' ? ap
    : apStatusFilter === 'unpaid' ? ap.filter(p => p.status !== 'paid')
    : ap.filter(p => p.status === 'paid')

  return (
    <div className="space-y-8">
      <h1 className="page-title">{viewMode === 'ar' ? 'AR List' : viewMode === 'ap' ? 'AP List' : 'Invoicing'}</h1>

      {showAr && (
      <section className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">AR – Customer Invoices</h2>
            <div className="flex rounded border border-gray-300 overflow-hidden">
              <button type="button" onClick={() => setArFilter('all')} className={`px-3 py-1.5 text-sm ${arFilter === 'all' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>All</button>
              <button type="button" onClick={() => setArFilter('overdue')} className={`px-3 py-1.5 text-sm ${arFilter === 'overdue' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Overdue</button>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={createArLoadId}
              onChange={(e) => setCreateArLoadId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select load to invoice</option>
              <LoadOptions />
            </select>
            <button
              type="button"
              disabled={!createArLoadId || creating}
              onClick={createCustomerInvoice}
              className="btn-primary"
            >
              Create Invoice
            </button>
          </div>
        </div>
        <div className="table-wrap">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="px-3 py-2 text-left">Invoice #</th>
              <th className="px-3 py-2 text-left">Load</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Amount</th>
              <th className="px-3 py-2 text-left">Due</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last Reminder</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ar.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-gray-500 text-center">No customer invoices.</td></tr>
            ) : (
              ar.map((i) => {
                const isOverdue = i.due_date && (i.status === 'draft' || i.status === 'sent') && new Date(i.due_date) < new Date()
                return (
                <tr key={i.id} className={`border-t ${isOverdue ? 'bg-red-50' : ''}`}>
                  <td className="px-3 py-2">{i.invoice_number}</td>
                  <td className="px-3 py-2"><Link to={`/order/${i.load_id}`} className="text-blue-600 hover:underline">{i.load_number ?? '-'}</Link></td>
                  <td className="px-3 py-2">{i.customer_name ?? '-'}</td>
                  <td className="px-3 py-2">{Number(i.amount).toLocaleString()}</td>
                  <td className="px-3 py-2">{i.due_date ?? '-'}</td>
                  <td className="px-3 py-2">{i.status}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {i.last_reminder_sent_at
                      ? <span title={`${i.reminder_sent_count}회 발송`}>{new Date(i.last_reminder_sent_at).toLocaleDateString()}<br/><span className="text-gray-400">{i.reminder_sent_count}회</span></span>
                      : '-'}
                  </td>
                  <td className="px-3 py-2 flex gap-1 flex-wrap">
                    <button type="button" onClick={async () => { const r = await apiFetch(`/invoices/customer/${i.id}/document`); const html = await r.text(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close() } }} className="text-sm text-blue-600 hover:underline">View</button>
                    <button type="button" onClick={async () => { const r = await apiFetch(`/invoices/customer/${i.id}/document/pdf`); const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Invoice-${i.invoice_number}.pdf`; a.click(); URL.revokeObjectURL(url) }} className="text-sm text-blue-600 hover:underline">PDF</button>
                    {i.status === 'draft' && <button type="button" onClick={() => markSent(i.id)} className="text-sm text-blue-600 hover:underline">Mark Sent</button>}
                    {(i.status === 'draft' || i.status === 'sent') && <button type="button" onClick={() => markPaid(i.id)} className="text-sm text-green-600 hover:underline">Mark Paid</button>}
                    {isOverdue && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const r = await apiFetch(`/invoices/customer/${i.id}/send-reminder`, { method: 'POST' })
                            const d = await r.json()
                            alert(d.sent ? '리마인더 이메일이 발송되었습니다.' : (d.message || '발송 실패'))
                          } catch (e) {
                            alert(e instanceof Error ? e.message : 'Failed')
                          }
                        }}
                        className="text-sm text-amber-700 hover:underline"
                      >
                        Send reminder
                      </button>
                    )}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
        </div>
      </section>
      )}

      {showAp && (
      <section className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">AP – Carrier Payables</h2>
            <div className="flex rounded border border-gray-300 overflow-hidden">
              {(['all', 'unpaid', 'paid'] as const).map((f) => (
                <button key={f} type="button"
                  onClick={() => { setApStatusFilter(f) }}
                  className={`px-3 py-1.5 text-sm capitalize ${apStatusFilter === f ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="table-wrap overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="px-3 py-2 text-left">Invoice #</th>
              <th className="px-3 py-2 text-left">Load</th>
              <th className="px-3 py-2 text-left">Carrier</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAp.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-gray-500 text-center">No carrier payables.</td></tr>
            ) : (
              filteredAp.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{p.invoice_number ?? p.id.slice(0, 8)}</td>
                  <td className="px-3 py-2"><Link to={`/order/${p.carrier_segment_id}`} className="text-blue-600 hover:underline">{p.load_number ?? '–'}</Link></td>
                  <td className="px-3 py-2">{p.carrier_name ?? '–'}</td>
                  <td className="px-3 py-2 text-right">{Number(p.amount).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2 flex gap-1">
                    <button type="button" onClick={async () => { const r = await apiFetch(`/invoices/carrier/${p.id}/document`); const html = await r.text(); const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close() } }} className="text-sm text-blue-600 hover:underline">View</button>
                    <button type="button" onClick={async () => { const r = await apiFetch(`/invoices/carrier/${p.id}/document/pdf`); const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `CarrierInvoice-${p.invoice_number ?? p.id.slice(0, 8)}.pdf`; a.click(); URL.revokeObjectURL(url) }} className="text-sm text-blue-600 hover:underline">PDF</button>
                    {p.status !== 'paid' && <button type="button" onClick={() => markPayablePaid(p.id)} className="text-sm text-green-600 hover:underline">Mark Paid</button>}
                  </td>
                </tr>
              ))
            )}
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
    apiJson<{ items: Load[] }>('/loads?limit=500').then((d) => setLoads(d.items ?? [])).catch(() => {})
  }, [])
  return loads.map((l) => <option key={l.id} value={l.id}>{l.load_number} ({l.revenue ?? 0})</option>)
}
