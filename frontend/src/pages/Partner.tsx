import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api'

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
}

export default function Partner() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    apiJson('/partners')
      .then((data) => {
        setPartners(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = typeFilter
    ? partners.filter((p) => (p.type || '').toLowerCase() === typeFilter.toLowerCase())
    : partners

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Partner</h1>
        <Link
          to="/partner/new"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          New Partner
        </Link>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 rounded ${!typeFilter ? 'bg-red-600 text-white' : 'bg-white border'}`}
        >
          All
        </button>
        <button
          onClick={() => setTypeFilter('customer')}
          className={`px-3 py-1.5 rounded ${typeFilter === 'customer' ? 'bg-red-600 text-white' : 'bg-white border'}`}
        >
          Customer
        </button>
        <button
          onClick={() => setTypeFilter('carrier')}
          className={`px-3 py-1.5 rounded ${typeFilter === 'carrier' ? 'bg-red-600 text-white' : 'bg-white border'}`}
        >
          Carrier
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No partners. Create one via &quot;New Partner&quot;.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link to={`/partner/${p.id}`} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{p.type || '-'}</td>
                    <td className="px-4 py-2">{p.city || '-'}</td>
                    <td className="px-4 py-2">{p.contact_email || p.contact_phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
