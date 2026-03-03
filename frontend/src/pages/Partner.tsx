import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type Partner = {
  id: string
  name: string
  type: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  city: string | null
  province: string | null
  country: string | null
  postal_code: string | null
  payment_terms: string | null
  credit_limit: number | null
  truck_calls: number | null
  account_type: string | null
  is_active: boolean
  created_at: string | null
}

type PartnerLocation = {
  id: string
  partner_id: string
  partner_name: string | null
  name: string | null
  address: string | null
  tel: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  is_active: boolean
  created_at: string | null
}

type PartnerStaff = {
  id: string
  partner_id: string
  partner_name: string | null
  full_name: string
  department: string | null
  email: string | null
  phone: string | null
  title: string | null
  is_active: boolean
  created_at: string | null
}

type ViewType = 'customer' | 'carrier' | 'location' | 'staff'

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function fmtDate(dt: string | null) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('en-CA', { year: '2-digit', month: '2-digit', day: '2-digit' })
}

// ─────────────────── Customer / Carrier list ───────────────────────
function PartnerList({ partnerType }: { partnerType: 'customer' | 'carrier' }) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    apiJson<Partner[]>(`/partners?type=${partnerType}`)
      .then(d => setPartners(Array.isArray(d) ? d : []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false))
  }, [partnerType])

  useEffect(() => { load() }, [load])

  const filtered = partners.filter(p => {
    if (activeOnly && !p.is_active) return false
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const title = partnerType === 'customer' ? 'Customer' : 'Carrier'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <Link to="/partner/new" className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          + Add
        </Link>
      </div>
      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="rounded" />
          Active
        </label>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search..."
          className="border rounded px-3 py-1.5 text-sm w-48"
        />
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Created</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Address</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Truck Calls</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Payment Terms</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Credit Limit</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No {title.toLowerCase()}s found.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{fmtDate(p.created_at)}</td>
                <td className="px-3 py-2">
                  <Link to={`/partner/${p.id}`} className="text-blue-600 hover:underline font-medium">{p.name}</Link>
                </td>
                <td className="px-3 py-2 text-gray-600 max-w-[180px] truncate">{[p.address, p.city, p.province].filter(Boolean).join(', ') || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{p.account_type || p.type || '-'}</td>
                <td className="px-3 py-2 text-right text-gray-600">{p.truck_calls ?? '-'}</td>
                <td className="px-3 py-2 text-gray-600">{p.payment_terms || '-'}</td>
                <td className="px-3 py-2 text-right text-gray-600">{p.credit_limit != null ? `$${p.credit_limit.toLocaleString()}` : '-'}</td>
                <td className="px-3 py-2"><StatusBadge active={p.is_active} /></td>
                <td className="px-3 py-2">
                  <Link to={`/partner/${p.id}`} className="text-blue-500 hover:underline mr-2">Edit</Link>
                  <button onClick={async () => {
                    if (!confirm('Delete?')) return
                    await apiFetch(`/partners/${p.id}`, { method: 'DELETE' })
                    load()
                  }} className="text-red-400 hover:underline">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────── Location list ────────────────────────────────
function LocationList() {
  const [items, setItems] = useState<PartnerLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const load = () => {
    setLoading(true)
    apiJson<PartnerLocation[]>('/partners/all-locations')
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = items.filter(x => {
    if (activeOnly && !x.is_active) return false
    if (q && !(x.name || '').toLowerCase().includes(q.toLowerCase()) && !(x.partner_name || '').toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Location</h1>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="rounded" />
          Active
        </label>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border rounded px-3 py-1.5 text-sm w-48" />
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Created</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Address</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Phone</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Partner</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No locations found.</td></tr>
            ) : filtered.map(x => (
              <tr key={x.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{fmtDate(x.created_at)}</td>
                <td className="px-3 py-2 font-medium">{x.name || '-'}</td>
                <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{[x.address, x.city, x.state].filter(Boolean).join(', ') || '-'}</td>
                <td className="px-3 py-2 text-gray-600">-</td>
                <td className="px-3 py-2 text-gray-600">{x.tel || '-'}</td>
                <td className="px-3 py-2">
                  {x.partner_id ? (
                    <Link to={`/partner/${x.partner_id}`} className="text-blue-500 hover:underline">{x.partner_name || '-'}</Link>
                  ) : '-'}
                </td>
                <td className="px-3 py-2"><StatusBadge active={x.is_active} /></td>
                <td className="px-3 py-2">
                  {x.partner_id && <Link to={`/partner/${x.partner_id}`} className="text-blue-500 hover:underline">Edit</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────── Staff list ────────────────────────────────────
function StaffList() {
  const [items, setItems] = useState<PartnerStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const load = () => {
    setLoading(true)
    apiJson<PartnerStaff[]>('/partners/all-staff')
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = items.filter(x => {
    if (activeOnly && !x.is_active) return false
    if (q && !x.full_name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Staff</h1>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="rounded" />
          Active
        </label>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border rounded px-3 py-1.5 text-sm w-48" />
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Created</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Department</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Phone</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Title</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Partner</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No staff found.</td></tr>
            ) : filtered.map(x => (
              <tr key={x.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{fmtDate(x.created_at)}</td>
                <td className="px-3 py-2 font-medium">{x.full_name}</td>
                <td className="px-3 py-2 text-gray-600">{x.department || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{x.email || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{x.phone || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{x.title || '-'}</td>
                <td className="px-3 py-2">
                  {x.partner_id ? (
                    <Link to={`/partner/${x.partner_id}`} className="text-blue-500 hover:underline">{x.partner_name || '-'}</Link>
                  ) : '-'}
                </td>
                <td className="px-3 py-2"><StatusBadge active={x.is_active} /></td>
                <td className="px-3 py-2">
                  {x.partner_id && <Link to={`/partner/${x.partner_id}`} className="text-blue-500 hover:underline">Edit</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────── Main router component ─────────────────────────
export default function Partner() {
  const [searchParams] = useSearchParams()
  const view = (searchParams.get('view') || 'customer') as ViewType

  if (view === 'location') return <LocationList />
  if (view === 'staff') return <StaffList />
  if (view === 'carrier') return <PartnerList partnerType="carrier" />
  return <PartnerList partnerType="customer" />
}
