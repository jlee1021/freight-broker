import { useState, useEffect } from 'react'
import { apiJson, apiFetch } from '../api'

type EdiConfig = { id: string; name: string; edi_type?: string; mode?: string; tid?: string; tsi?: string; remarks?: string; is_active: boolean }
type EdiRecord = { id: string; company?: string; report_date?: string; report_type?: string; client?: string; invoice_number?: string; bol_number?: string; po_number?: string; tracking_number?: string; ap_date?: string; sent_by?: string; sent_at?: string; status?: string; tp_number?: string; tp_name?: string }

type EdiTab = 'config' | 'list'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ── EDI Config 탭 ─────────────────────────────────────────────────────
function ConfigTab() {
  const [configs, setConfigs] = useState<EdiConfig[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<EdiConfig | null>(null)
  const [form, setForm] = useState<Partial<EdiConfig>>({ mode: 'Test', is_active: true })
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<EdiConfig[]>('/edi/configs?active_only=false').then(setConfigs).catch(() => {})
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name?.trim()) { alert('Name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/edi/configs/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/edi/configs', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(null); setForm({ mode: 'Test', is_active: true }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Config</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Name</th><th className="border px-3 py-2">Type</th><th className="border px-3 py-2">Mode</th>
          <th className="border px-3 py-2">TID</th><th className="border px-3 py-2">TSI</th><th className="border px-3 py-2">Active</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{configs.map(c => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5 font-medium">{c.name}</td>
            <td className="border px-3 py-1.5">{c.edi_type}</td>
            <td className="border px-3 py-1.5"><span className={`px-2 py-0.5 rounded text-xs ${c.mode === 'Production' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.mode}</span></td>
            <td className="border px-3 py-1.5 font-mono text-xs">{c.tid}</td>
            <td className="border px-3 py-1.5 font-mono text-xs">{c.tsi}</td>
            <td className="border px-3 py-1.5">{c.is_active ? '✓' : '—'}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => { setEditing(c); setForm(c); setShowModal(true) }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/edi/configs/${c.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline text-xs">Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit EDI Config' : 'Add EDI Config'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[{ label: 'Name *', key: 'name' }, { label: 'EDI Type', key: 'edi_type', placeholder: 'e.g. 204, 214, 810' }, { label: 'TID (Sender)', key: 'tid' }, { label: 'TSI (Receiver)', key: 'tsi' }].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Mode</label>
              <select value={form.mode || 'Test'} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="Test">Test</option>
                <option value="Production">Production</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Remarks</label>
              <textarea value={form.remarks || ''} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <label className="text-sm">Active</label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── EDI List 탭 ───────────────────────────────────────────────────────
function RecordListTab() {
  const [records, setRecords] = useState<EdiRecord[]>([])
  const [filterCompany, setFilterCompany] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<EdiRecord | null>(null)
  const [form, setForm] = useState<Partial<EdiRecord>>({ status: 'pending' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (filterCompany) params.set('company', filterCompany)
    if (filterType) params.set('report_type', filterType)
    if (filterStatus) params.set('status', filterStatus)
    if (fromDate) params.set('from_date', fromDate)
    if (toDate) params.set('to_date', toDate)
    apiJson<EdiRecord[]>(`/edi/records?${params}`).then(setRecords).catch(() => {})
  }
  useEffect(() => { load() }, [filterCompany, filterType, filterStatus, fromDate, toDate])

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/edi/records/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/edi/records', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  const statusColor = (s?: string) => {
    if (s === 'sent') return 'bg-green-100 text-green-700'
    if (s === 'failed') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div>
      {/* 필터 */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={filterCompany} onChange={e => setFilterCompany(e.target.value)} placeholder="Company..." className="border rounded px-2 py-1.5 text-sm w-36" />
        <input value={filterType} onChange={e => setFilterType(e.target.value)} placeholder="Report Type..." className="border rounded px-2 py-1.5 text-sm w-36" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">From</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">To</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="flex-1" />
        <button onClick={() => { setEditing(null); setForm({ status: 'pending' }); setShowModal(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead><tr className="bg-gray-50 text-left">
            <th className="border px-2 py-2">Company</th><th className="border px-2 py-2">Date</th><th className="border px-2 py-2">Type</th>
            <th className="border px-2 py-2">Client</th><th className="border px-2 py-2">Inv #</th><th className="border px-2 py-2">BoL #</th>
            <th className="border px-2 py-2">P.O #</th><th className="border px-2 py-2">Trk #</th><th className="border px-2 py-2">Ap Date</th>
            <th className="border px-2 py-2">Sent By</th><th className="border px-2 py-2">Status</th><th className="border px-2 py-2">T.P #</th><th className="border px-2 py-2">T.P Name</th>
            <th className="border px-2 py-2">Action</th>
          </tr></thead>
          <tbody>
            {records.length === 0 && <tr><td colSpan={14} className="text-center text-gray-400 py-4">No records found</td></tr>}
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{r.company}</td>
                <td className="border px-2 py-1">{r.report_date}</td>
                <td className="border px-2 py-1">{r.report_type}</td>
                <td className="border px-2 py-1">{r.client}</td>
                <td className="border px-2 py-1">{r.invoice_number}</td>
                <td className="border px-2 py-1">{r.bol_number}</td>
                <td className="border px-2 py-1">{r.po_number}</td>
                <td className="border px-2 py-1">{r.tracking_number}</td>
                <td className="border px-2 py-1">{r.ap_date}</td>
                <td className="border px-2 py-1">{r.sent_by}</td>
                <td className="border px-2 py-1"><span className={`px-1.5 py-0.5 rounded ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="border px-2 py-1">{r.tp_number}</td>
                <td className="border px-2 py-1">{r.tp_name}</td>
                <td className="border px-2 py-1">
                  <button onClick={() => { setEditing(r); setForm(r); setShowModal(true) }} className="text-blue-600 hover:underline mr-1">Edit</button>
                  <button onClick={async () => { if (confirm('Delete?')) { await apiFetch(`/edi/records/${r.id}`, { method: 'DELETE' }); load() } }} className="text-red-500 hover:underline">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit EDI Record' : 'Add EDI Record'} onClose={() => setShowModal(false)}>
          <div className="space-y-2">
            {[
              { label: 'Company', key: 'company' }, { label: 'Report Type', key: 'report_type' },
              { label: 'Client', key: 'client' }, { label: 'Invoice #', key: 'invoice_number' },
              { label: 'BoL #', key: 'bol_number' }, { label: 'P.O #', key: 'po_number' },
              { label: 'Tracking #', key: 'tracking_number' }, { label: 'Sent By', key: 'sent_by' },
              { label: 'T.P #', key: 'tp_number' }, { label: 'T.P Name', key: 'tp_name' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
                <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Report Date</label>
                <input type="date" value={form.report_date || ''} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Approved Date</label>
                <input type="date" value={form.ap_date || ''} onChange={e => setForm(f => ({ ...f, ap_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-0.5">Status</label>
                <select value={form.status || 'pending'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── 메인 EDI 페이지 ────────────────────────────────────────────────────
export default function Edi() {
  const [tab, setTab] = useState<EdiTab>('config')
  const tabs: { key: EdiTab; label: string }[] = [
    { key: 'config', label: 'EDI Config' },
    { key: 'list', label: 'EDI List' },
  ]

  return (
    <div>
      <h1 className="page-title">EDI</h1>
      <div className="flex gap-0 border-b mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>
      {tab === 'config' && <div className="card"><ConfigTab /></div>}
      {tab === 'list' && <div className="card"><RecordListTab /></div>}
    </div>
  )
}
