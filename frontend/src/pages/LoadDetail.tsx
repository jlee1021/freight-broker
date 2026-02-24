import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type Partner = { id: string; name: string; type: string | null }
type User = { id: string; email: string; full_name: string | null; role: string | null }
type ShipperStop = {
  id?: string
  load_id?: string
  sequence?: number
  name?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  country?: string | null
  postal_code?: string | null
  type?: string | null
  pickup_date?: string | null
  time_start?: string | null
  time_end?: string | null
  pallet_info?: Record<string, unknown> | null
  notes?: string | null
}
type ConsigneeStop = ShipperStop & { due_date?: string | null }
type CarrierSegment = {
  id?: string
  load_id?: string
  carrier_id?: string | null
  carrier_invoice_number?: string | null
  invoice_date?: string | null
  rate?: number | null
  fsc_percent?: number | null
  lc_number?: string | null
  tax_code?: string | null
  total?: number | null
  load_status?: string | null
  rating?: number | null
  on_time?: boolean | null
}
type Reference = {
  id?: string
  load_id?: string
  reference_number?: string | null
  reference_type?: string | null
  special_instructions?: string | null
  internal_notes?: string | null
}

type AttachmentItem = {
  id: string
  original_filename: string
  content_type: string | null
  document_type: string
  created_at: string | null
}

type LoadDetail = {
  id: string
  load_number: string
  status: string
  customer_id: string | null
  dispatcher_id: string | null
  sales_rep_id: string | null
  billing_rep_id: string | null
  rate: number | null
  fsc_percent: number | null
  tax_code: string | null
  other_charges: number | null
  auto_rate: boolean | null
  equipment_type: string | null
  weight: number | null
  weight_unit: string | null
  commodity: string | null
  po_number: string | null
  revenue: number | null
  cost: number | null
  profit_pct: number | null
  gst: number | null
  total_with_gst: number | null
  customer_name: string | null
  dispatcher_name: string | null
  shipper_stops: ShipperStop[]
  consignee_stops: ConsigneeStop[]
  carrier_segments: CarrierSegment[]
  references: Reference[]
}

const STATUS_OPTIONS = [
  'pending', 'unassigned', 'on_hold', 'need_to_cover', 'assigned', 'in_transit', 'delivered', 'cancel',
]

function emptyShipper(): ShipperStop {
  return { sequence: 1, name: '', address: '', city: '', province: '', country: 'CANADA', postal_code: '', type: 'Live Load', pickup_date: '', time_start: '', time_end: '', notes: '' }
}
function emptyConsignee(): ConsigneeStop {
  return { ...emptyShipper(), due_date: '' }
}
function emptyCarrier(): CarrierSegment {
  return { carrier_id: null, rate: null, fsc_percent: null, lc_number: '', tax_code: '', total: null, load_status: '', rating: null, on_time: null }
}
function emptyReference(): Reference {
  return { reference_number: '', reference_type: 'REF#', special_instructions: '', internal_notes: '' }
}

export default function LoadDetail() {
  const { loadId } = useParams()
  const navigate = useNavigate()
  const isNew = loadId === undefined || loadId === 'new'

  const [load, setLoad] = useState<LoadDetail | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadNumber, setLoadNumber] = useState('')
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [emailModal, setEmailModal] = useState<{ docType: string; toEmail: string } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    Promise.all([
      apiJson<Partner[]>('/partners'),
      apiJson<User[]>('/users'),
    ]).then(([pList, uList]) => {
      setPartners(Array.isArray(pList) ? pList : [])
      setUsers(Array.isArray(uList) ? uList : [])
    })
  }, [])

  useEffect(() => {
    if (isNew) {
      setLoad({
        id: '',
        load_number: '',
        status: 'pending',
        customer_id: null,
        dispatcher_id: null,
        sales_rep_id: null,
        billing_rep_id: null,
        rate: null,
        fsc_percent: null,
        tax_code: null,
        other_charges: null,
        auto_rate: false,
        equipment_type: null,
        weight: null,
        weight_unit: 'lbs',
        commodity: null,
        po_number: null,
        revenue: null,
        cost: null,
        profit_pct: null,
        gst: null,
        total_with_gst: null,
        customer_name: null,
        dispatcher_name: null,
        shipper_stops: [emptyShipper()],
        consignee_stops: [emptyConsignee()],
        carrier_segments: [emptyCarrier()],
        references: [emptyReference()],
      })
      setLoading(false)
      return
    }
    apiJson<LoadDetail>(`/loads/${loadId}`)
      .then((data) => {
        setLoad(data)
        setLoadNumber(data.load_number || '')
        if (!data.shipper_stops?.length) setLoad((l) => l ? { ...l, shipper_stops: [emptyShipper()] } : l)
        if (!data.consignee_stops?.length) setLoad((l) => l ? { ...l, consignee_stops: [emptyConsignee()] } : l)
        if (!data.carrier_segments?.length) setLoad((l) => l ? { ...l, carrier_segments: [emptyCarrier()] } : l)
        if (!data.references?.length) setLoad((l) => l ? { ...l, references: [emptyReference()] } : l)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [loadId, isNew])

  useEffect(() => {
    if (isNew || !loadId) return
    apiJson<{ items: AttachmentItem[] }>(`/loads/${loadId}/attachments`)
      .then((data) => setAttachments(data.items || []))
      .catch(() => setAttachments([]))
  }, [loadId, isNew])

  const refreshAttachments = () => {
    if (!loadId) return
    apiJson<{ items: AttachmentItem[] }>(`/loads/${loadId}/attachments`)
      .then((data) => setAttachments(data.items || []))
      .catch(() => setAttachments([]))
  }

  const update = (patch: Partial<LoadDetail>) => setLoad((l) => (l ? { ...l, ...patch } : l))

  const updateShipper = (index: number, patch: Partial<ShipperStop>) => {
    setLoad((l) => {
      if (!l) return l
      const arr = [...l.shipper_stops]
      arr[index] = { ...arr[index], ...patch }
      return { ...l, shipper_stops: arr }
    })
  }
  const addShipper = () => setLoad((l) => l ? { ...l, shipper_stops: [...l.shipper_stops, emptyShipper()] } : l)
  const removeShipper = (index: number) =>
    setLoad((l) => l ? { ...l, shipper_stops: l.shipper_stops.filter((_, i) => i !== index) } : l)

  const updateConsignee = (index: number, patch: Partial<ConsigneeStop>) => {
    setLoad((l) => {
      if (!l) return l
      const arr = [...l.consignee_stops]
      arr[index] = { ...arr[index], ...patch }
      return { ...l, consignee_stops: arr }
    })
  }
  const addConsignee = () => setLoad((l) => l ? { ...l, consignee_stops: [...l.consignee_stops, emptyConsignee()] } : l)
  const removeConsignee = (index: number) =>
    setLoad((l) => l ? { ...l, consignee_stops: l.consignee_stops.filter((_, i) => i !== index) } : l)

  const updateCarrier = (index: number, patch: Partial<CarrierSegment>) => {
    setLoad((l) => {
      if (!l) return l
      const arr = [...l.carrier_segments]
      arr[index] = { ...arr[index], ...patch }
      return { ...l, carrier_segments: arr }
    })
  }
  const addCarrier = () => setLoad((l) => l ? { ...l, carrier_segments: [...l.carrier_segments, emptyCarrier()] } : l)
  const removeCarrier = (index: number) =>
    setLoad((l) => l ? { ...l, carrier_segments: l.carrier_segments.filter((_, i) => i !== index) } : l)

  const updateRef = (index: number, patch: Partial<Reference>) => {
    setLoad((l) => {
      if (!l) return l
      const arr = [...l.references]
      arr[index] = { ...arr[index], ...patch }
      return { ...l, references: arr }
    })
  }
  const addRef = () => setLoad((l) => l ? { ...l, references: [...l.references, emptyReference()] } : l)
  const removeRef = (index: number) =>
    setLoad((l) => l ? { ...l, references: l.references.filter((_, i) => i !== index) } : l)

  const save = async () => {
    if (!load) return
    if (isNew && !loadNumber.trim()) {
      alert('Load# is required')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const created = await apiJson<{ id: string }>('/loads', {
          method: 'POST',
          body: JSON.stringify({
            load_number: loadNumber.trim(),
            status: load.status,
            customer_id: load.customer_id || null,
            dispatcher_id: load.dispatcher_id || null,
            sales_rep_id: load.sales_rep_id || null,
            billing_rep_id: load.billing_rep_id || null,
            rate: load.rate,
            fsc_percent: load.fsc_percent,
            tax_code: load.tax_code,
            other_charges: load.other_charges,
            auto_rate: load.auto_rate,
            equipment_type: load.equipment_type || null,
            weight: load.weight ?? null,
            weight_unit: load.weight_unit || 'lbs',
            commodity: load.commodity || null,
            po_number: load.po_number || null,
          }),
        })
        if (created.id) {
          await apiFetch(`/loads/${created.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              equipment_type: load.equipment_type || null,
              weight: load.weight ?? null,
              weight_unit: load.weight_unit || 'lbs',
              commodity: load.commodity || null,
              po_number: load.po_number || null,
              shipper_stops: load.shipper_stops.map(({ id, load_id, ...s }) => s),
              consignee_stops: load.consignee_stops.map(({ id, load_id, ...c }) => c),
              carrier_segments: load.carrier_segments.map(({ id, load_id, ...c }) => c),
              references: load.references.map(({ id, load_id, ...r }) => r),
            }),
          })
          navigate(`/order/${created.id}`)
        }
      } else {
        await apiFetch(`/loads/${loadId}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: load.status,
            customer_id: load.customer_id || null,
            dispatcher_id: load.dispatcher_id || null,
            sales_rep_id: load.sales_rep_id || null,
            billing_rep_id: load.billing_rep_id || null,
            rate: load.rate,
            fsc_percent: load.fsc_percent,
            tax_code: load.tax_code,
            other_charges: load.other_charges,
            auto_rate: load.auto_rate,
            equipment_type: load.equipment_type || null,
            weight: load.weight ?? null,
            weight_unit: load.weight_unit || 'lbs',
            commodity: load.commodity || null,
            po_number: load.po_number || null,
            shipper_stops: load.shipper_stops.map(({ id, load_id, ...s }) => s),
            consignee_stops: load.consignee_stops.map(({ id, load_id, ...c }) => c),
            carrier_segments: load.carrier_segments.map(({ id, load_id, ...c }) => c),
            references: load.references.map(({ id, load_id, ...r }) => r),
          }),
        })
        const updated = await apiJson<LoadDetail>(`/loads/${loadId}`)
        setLoad(updated)
      }
    } catch (e) {
      console.error(e)
      alert('Save failed')
    }
    setSaving(false)
  }

  if (loading || !load) return <div className="p-4">Loading...</div>

  const customers = partners.filter((p) => p.type === 'customer' || !p.type)
  const carriers = partners.filter((p) => p.type === 'carrier' || !p.type)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/order" className="text-gray-600 hover:text-gray-800">← Order</Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isNew ? 'New Load' : `Load: ${load.load_number}`}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isNew && load?.id && (
            <>
              <button
                type="button"
                onClick={async () => {
                  const res = await apiFetch(`/documents/load/${load.id}/lc`)
                  const html = await res.text()
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(html); w.document.close() }
                }}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                Load Confirmation
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await apiFetch(`/documents/load/${load.id}/rate-confirmation`)
                  const html = await res.text()
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(html); w.document.close() }
                }}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                Rate Confirmation
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await apiFetch(`/documents/load/${load.id}/bol`)
                  const html = await res.text()
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(html); w.document.close() }
                }}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                Bill of Lading
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await apiFetch(`/documents/load/${load.id}/pallet-tag`)
                  const html = await res.text()
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(html); w.document.close() }
                }}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                Pallet Tag
              </button>
              {[
                { path: 'lc/pdf', name: 'LC', file: `LC-${load.load_number}.pdf` },
                { path: 'rate-confirmation/pdf', name: 'Rate PDF', file: `RateConfirmation-${load.load_number}.pdf` },
                { path: 'bol/pdf', name: 'BOL PDF', file: `BOL-${load.load_number}.pdf` },
                { path: 'pallet-tag/pdf', name: 'Pallet PDF', file: `PalletTag-${load.load_number}.pdf` },
              ].map(({ path, name, file }) => (
                <button
                  key={path}
                  type="button"
                  onClick={async () => {
                    const r = await apiFetch(`/documents/load/${load.id}/${path}`)
                    const blob = await r.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = file
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                  title={`Download ${name}`}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEmailModal({ docType: 'lc', toEmail: '' })}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                Email document
              </button>
            </>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Customer & financial */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Customer & Rate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {isNew && (
            <div>
              <label className="block text-sm text-gray-600">Load#</label>
              <input
                value={loadNumber}
                onChange={(e) => setLoadNumber(e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="e.g. PRO-10001"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600">Customer</label>
            <select
              value={load.customer_id || ''}
              onChange={(e) => update({ customer_id: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">-- Select --</option>
              {customers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Rate (CAD)</label>
            <input
              type="number"
              step="0.01"
              value={load.rate ?? ''}
              onChange={(e) => update({ rate: e.target.value ? Number(e.target.value) : null })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">FSC %</label>
            <input
              type="number"
              step="0.01"
              value={load.fsc_percent ?? ''}
              onChange={(e) => update({ fsc_percent: e.target.value ? Number(e.target.value) : null })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Tax Code</label>
            <select
              value={load.tax_code || ''}
              onChange={(e) => update({ tax_code: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">--</option>
              <option value="GST">GST</option>
              <option value="Exempted">Exempted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Other Charges</label>
            <input
              type="number"
              step="0.01"
              value={load.other_charges ?? ''}
              onChange={(e) => update({ other_charges: e.target.value ? Number(e.target.value) : null })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Equipment</label>
            <select
              value={load.equipment_type || ''}
              onChange={(e) => update({ equipment_type: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">--</option>
              <option value="Dry Van">Dry Van</option>
              <option value="Reefer">Reefer</option>
              <option value="Flatbed">Flatbed</option>
              <option value="Step Deck">Step Deck</option>
              <option value="Hot Shot">Hot Shot</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Weight</label>
            <input
              type="number"
              step="0.01"
              value={load.weight ?? ''}
              onChange={(e) => update({ weight: e.target.value ? Number(e.target.value) : null })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Unit</label>
            <select
              value={load.weight_unit || 'lbs'}
              onChange={(e) => update({ weight_unit: e.target.value || 'lbs' })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Commodity</label>
            <input
              type="text"
              value={load.commodity ?? ''}
              onChange={(e) => update({ commodity: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
              placeholder="e.g. General Freight"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">PO#</label>
            <input
              type="text"
              value={load.po_number ?? ''}
              onChange={(e) => update({ po_number: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          {load.revenue != null && (
            <>
              <div className="text-sm">Revenue: {load.revenue}</div>
              <div className="text-sm">Cost: {load.cost ?? '-'}</div>
              <div className="text-sm">Profit %: {load.profit_pct ?? '-'}</div>
            </>
          )}
        </div>
      </section>

      {/* Shippers */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Shipper(s)</h2>
          <button type="button" onClick={addShipper} className="text-sm text-blue-600 hover:underline">+ Add</button>
        </div>
        {load.shipper_stops.map((s, i) => (
          <div key={i} className="border rounded p-3 mb-3">
            <div className="flex justify-between">
              <span className="font-medium">Shipper {i + 1}</span>
              {load.shipper_stops.length > 1 && (
                <button type="button" onClick={() => removeShipper(i)} className="text-red-600 text-sm">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <input placeholder="Name" value={s.name ?? ''} onChange={(e) => updateShipper(i, { name: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Address" value={s.address ?? ''} onChange={(e) => updateShipper(i, { address: e.target.value })} className="border rounded px-2 py-1 col-span-2" />
              <input placeholder="City" value={s.city ?? ''} onChange={(e) => updateShipper(i, { city: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Province" value={s.province ?? ''} onChange={(e) => updateShipper(i, { province: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Postal" value={s.postal_code ?? ''} onChange={(e) => updateShipper(i, { postal_code: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Pickup date" type="date" value={s.pickup_date ?? ''} onChange={(e) => updateShipper(i, { pickup_date: e.target.value || null })} className="border rounded px-2 py-1" />
              <input placeholder="Time start (e.g. 12:00)" value={s.time_start ?? ''} onChange={(e) => updateShipper(i, { time_start: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Time end" value={s.time_end ?? ''} onChange={(e) => updateShipper(i, { time_end: e.target.value })} className="border rounded px-2 py-1" />
            </div>
          </div>
        ))}
      </section>

      {/* Consignees */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Consignee(s)</h2>
          <button type="button" onClick={addConsignee} className="text-sm text-blue-600 hover:underline">+ Add</button>
        </div>
        {load.consignee_stops.map((c, i) => (
          <div key={i} className="border rounded p-3 mb-3">
            <div className="flex justify-between">
              <span className="font-medium">Consignee {i + 1}</span>
              {load.consignee_stops.length > 1 && (
                <button type="button" onClick={() => removeConsignee(i)} className="text-red-600 text-sm">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <input placeholder="Name" value={c.name ?? ''} onChange={(e) => updateConsignee(i, { name: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Address" value={c.address ?? ''} onChange={(e) => updateConsignee(i, { address: e.target.value })} className="border rounded px-2 py-1 col-span-2" />
              <input placeholder="City" value={c.city ?? ''} onChange={(e) => updateConsignee(i, { city: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Province" value={c.province ?? ''} onChange={(e) => updateConsignee(i, { province: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Due date" type="date" value={c.due_date ?? ''} onChange={(e) => updateConsignee(i, { due_date: e.target.value || null })} className="border rounded px-2 py-1" />
            </div>
          </div>
        ))}
      </section>

      {/* Carriers */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Carrier(s)</h2>
          <button type="button" onClick={addCarrier} className="text-sm text-blue-600 hover:underline">+ Add</button>
        </div>
        {load.carrier_segments.map((c, i) => (
          <div key={i} className="border rounded p-3 mb-3">
            <div className="flex justify-between">
              <span className="font-medium">Segment {i + 1}</span>
              {load.carrier_segments.length > 1 && (
                <button type="button" onClick={() => removeCarrier(i)} className="text-red-600 text-sm">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600">Carrier</label>
                <select
                  value={c.carrier_id ?? ''}
                  onChange={(e) => updateCarrier(i, { carrier_id: e.target.value || null })}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">-- Select --</option>
                  {carriers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <input placeholder="Rate" type="number" step="0.01" value={c.rate ?? ''} onChange={(e) => updateCarrier(i, { rate: e.target.value ? Number(e.target.value) : null })} className="border rounded px-2 py-1" />
              <input placeholder="LC#" value={c.lc_number ?? ''} onChange={(e) => updateCarrier(i, { lc_number: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Tax" value={c.tax_code ?? ''} onChange={(e) => updateCarrier(i, { tax_code: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Total" type="number" step="0.01" value={c.total ?? ''} onChange={(e) => updateCarrier(i, { total: e.target.value ? Number(e.target.value) : null })} className="border rounded px-2 py-1" />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Rating (1-5)</label>
                <select value={c.rating ?? ''} onChange={(e) => updateCarrier(i, { rating: e.target.value ? Number(e.target.value) : null })} className="border rounded px-2 py-1 w-20">
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">On time</label>
                <input type="checkbox" checked={c.on_time === true} onChange={(e) => updateCarrier(i, { on_time: e.target.checked || null })} className="rounded" />
              </div>
              {!isNew && c.id && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiFetch('/invoices/carrier', { method: 'POST', body: JSON.stringify({ carrier_segment_id: c.id }) })
                      alert('Carrier payable created. View in Invoicing → AP.')
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Already exists or failed')
                    }
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Create payable
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* References */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Reference(s)</h2>
          <button type="button" onClick={addRef} className="text-sm text-blue-600 hover:underline">+ Add</button>
        </div>
        {load.references.map((r, i) => (
          <div key={i} className="border rounded p-3 mb-3">
            <div className="flex justify-between">
              <span className="font-medium">Ref {i + 1}</span>
              {load.references.length > 1 && (
                <button type="button" onClick={() => removeRef(i)} className="text-red-600 text-sm">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <input placeholder="Reference #" value={r.reference_number ?? ''} onChange={(e) => updateRef(i, { reference_number: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Type" value={r.reference_type ?? ''} onChange={(e) => updateRef(i, { reference_type: e.target.value })} className="border rounded px-2 py-1" />
              <textarea placeholder="Special instructions" value={r.special_instructions ?? ''} onChange={(e) => updateRef(i, { special_instructions: e.target.value })} className="border rounded px-2 py-1 col-span-2" rows={2} />
              <textarea placeholder="Internal notes" value={r.internal_notes ?? ''} onChange={(e) => updateRef(i, { internal_notes: e.target.value })} className="border rounded px-2 py-1 col-span-2" rows={2} />
            </div>
          </div>
        ))}
      </section>

      {/* Team & Status */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Team & Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600">Load Status</label>
            <select
              value={load.status}
              onChange={(e) => update({ status: e.target.value })}
              className="w-full border rounded px-2 py-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Dispatcher</label>
            <select
              value={load.dispatcher_id ?? ''}
              onChange={(e) => update({ dispatcher_id: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">-- Select --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Sales Rep</label>
            <select
              value={load.sales_rep_id ?? ''}
              onChange={(e) => update({ sales_rep_id: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">-- Select --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Billing Rep</label>
            <select
              value={load.billing_rep_id ?? ''}
              onChange={(e) => update({ billing_rep_id: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">-- Select --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Files / POD - only for existing loads */}
      {!isNew && load?.id && (
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Documents / POD</h2>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <select id="upload-doc-type" className="border rounded px-2 py-1.5 text-sm" defaultValue="pod">
              <option value="pod">POD</option>
              <option value="bol">BOL</option>
              <option value="rate_confirmation">Rate Confirmation</option>
              <option value="other">Other</option>
            </select>
            <input
              type="file"
              className="text-sm"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploading(true)
                e.target.value = ''
                const docType = (document.getElementById('upload-doc-type') as HTMLSelectElement)?.value || 'pod'
                try {
                  const form = new FormData()
                  form.append('file', file)
                  form.append('document_type', docType)
                  await apiFetch(`/loads/${load.id}/attachments`, { method: 'POST', body: form })
                  refreshAttachments()
                } catch {
                  alert('Upload failed')
                }
                setUploading(false)
              }}
            />
            {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
          </div>
          {attachments.length === 0 ? (
            <p className="text-gray-500 text-sm">No files attached.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${(a.document_type || 'other') === 'pod' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                    {(a.document_type || 'other').toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await apiFetch(`/loads/${load.id}/attachments/${a.id}`)
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = a.original_filename
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {a.original_filename}
                  </button>
                  <select
                    value={a.document_type || 'other'}
                    onChange={async (e) => {
                      const val = e.target.value
                      await apiFetch(`/loads/${load.id}/attachments/${a.id}`, { method: 'PATCH', body: JSON.stringify({ document_type: val }), headers: { 'Content-Type': 'application/json' } })
                      refreshAttachments()
                    }}
                    className="border rounded px-1 py-0.5 text-xs"
                  >
                    <option value="pod">POD</option>
                    <option value="bol">BOL</option>
                    <option value="rate_confirmation">Rate Conf.</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Delete this file?')) return
                      await apiFetch(`/loads/${load.id}/attachments/${a.id}`, { method: 'DELETE' })
                      refreshAttachments()
                    }}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Email document modal */}
      {emailModal && !isNew && load?.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setEmailModal(null)}>
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Email document</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Document</label>
                <select
                  value={emailModal.docType}
                  onChange={(e) => setEmailModal((m) => m ? { ...m, docType: e.target.value } : null)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="lc">Load Confirmation</option>
                  <option value="bol">Bill of Lading</option>
                  <option value="pallet-tag">Pallet Tag</option>
                  <option value="rate-confirmation">Rate Confirmation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To email</label>
                <input
                  type="email"
                  value={emailModal.toEmail}
                  onChange={(e) => setEmailModal((m) => m ? { ...m, toEmail: e.target.value } : null)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={sendingEmail || !emailModal.toEmail}
                  onClick={async () => {
                    setSendingEmail(true)
                    try {
                      const res = await apiFetch(`/documents/load/${load.id}/send-email`, {
                        method: 'POST',
                        body: JSON.stringify({
                          document_type: emailModal.docType,
                          to_email: emailModal.toEmail,
                        }),
                      })
                      const data = await res.json()
                      alert(data.sent ? 'Email sent.' : data.message || 'Failed to send')
                      if (data.sent) setEmailModal(null)
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Failed')
                    }
                    setSendingEmail(false)
                    return
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {sendingEmail ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
