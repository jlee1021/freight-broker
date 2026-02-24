import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  mc_number: string | null
  dot_number: string | null
  insurance_expiry: string | null
  payment_terms: string | null
}

export default function PartnerDetail() {
  const { partnerId } = useParams()
  const navigate = useNavigate()
  const isNew = !partnerId || partnerId === 'new'

  const [partner, setPartner] = useState<Partner | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    province: '',
    country: 'CANADA',
    postal_code: '',
    mc_number: '',
    dot_number: '',
    insurance_expiry: '',
    payment_terms: '',
  })

  useEffect(() => {
    if (isNew) {
      setPartner(null)
      setForm({ name: '', type: '', contact_email: '', contact_phone: '', address: '', city: '', province: '', country: 'CANADA', postal_code: '', mc_number: '', dot_number: '', insurance_expiry: '', payment_terms: '' })
      return
    }
    apiJson<Partner>(`/partners/${partnerId}`)
      .then((data) => {
        setPartner(data)
        setForm({
          name: data.name || '',
          type: data.type || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          country: data.country || 'CANADA',
          postal_code: data.postal_code || '',
          mc_number: data.mc_number || '',
          dot_number: data.dot_number || '',
          insurance_expiry: data.insurance_expiry ? String(data.insurance_expiry).slice(0, 10) : '',
          payment_terms: data.payment_terms || '',
        })
      })
  }, [partnerId, isNew])

  const save = async () => {
    if (!form.name.trim()) {
      alert('Name is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        type: form.type.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        country: form.country.trim() || 'CANADA',
        postal_code: form.postal_code.trim() || null,
        mc_number: form.mc_number.trim() || null,
        dot_number: form.dot_number.trim() || null,
        insurance_expiry: form.insurance_expiry.trim() || null,
        payment_terms: form.payment_terms.trim() || null,
      }
      if (isNew) {
        const created = await apiJson<Partner>('/partners', { method: 'POST', body: JSON.stringify(body) })
        if (created?.id) navigate(`/partner/${created.id}`)
      } else {
        await apiFetch(`/partners/${partnerId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        setPartner((p) => (p ? { ...p, ...body } : p))
      }
    } catch (e) {
      console.error(e)
      alert('Save failed')
    }
    setSaving(false)
  }

  if (!isNew && !partner) return <div className="p-4">Loading...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/partner" className="text-gray-600 hover:text-gray-800">← Partner</Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isNew ? 'New Partner' : partner?.name}
          </h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-600">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">--</option>
            <option value="customer">Customer</option>
            <option value="carrier">Carrier</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contact Email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contact Phone</label>
          <input
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Province</label>
            <input
              value={form.province}
              onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Postal Code</label>
            <input
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">MC#</label>
            <input
              value={form.mc_number}
              onChange={(e) => setForm((f) => ({ ...f, mc_number: e.target.value }))}
              className="w-full border rounded px-2 py-1"
              placeholder="Carrier MC number"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">DOT#</label>
            <input
              value={form.dot_number}
              onChange={(e) => setForm((f) => ({ ...f, dot_number: e.target.value }))}
              className="w-full border rounded px-2 py-1"
              placeholder="DOT number"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Insurance Expiry</label>
            <input
              type="date"
              value={form.insurance_expiry}
              onChange={(e) => setForm((f) => ({ ...f, insurance_expiry: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Payment Terms</label>
            <input
              value={form.payment_terms}
              onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
              className="w-full border rounded px-2 py-1"
              placeholder="e.g. Net 30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
