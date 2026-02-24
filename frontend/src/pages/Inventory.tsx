import { useState, useEffect } from 'react'
import { apiJson, apiFetch } from '../api'

type Warehouse = { id: string; name: string; address: string | null }
type InventoryItem = { id: string; warehouse_id: string; sku: string | null; name: string | null; quantity: number }

export default function Inventory() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [itemsByWh, setItemsByWh] = useState<Record<string, InventoryItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedWh, setSelectedWh] = useState<string | null>(null)
  const [modal, setModal] = useState<'warehouse' | 'item' | null>(null)
  const [form, setForm] = useState({ name: '', address: '', sku: '', itemName: '', quantity: '0' })
  const [saving, setSaving] = useState(false)

  const loadWarehouses = () => {
    apiJson<Warehouse[]>('/inventory/warehouses')
      .then((list) => {
        const arr = Array.isArray(list) ? list : []
        setWarehouses(arr)
        if (arr.length && !selectedWh) setSelectedWh(arr[0].id)
        setLoadError(null)
      })
      .catch((e) => {
        setWarehouses([])
        setLoadError(e instanceof Error ? e.message : 'Failed to load warehouses')
      })
  }

  const loadItems = (whId: string) => {
    apiJson<InventoryItem[]>(`/inventory/warehouses/${whId}/items`)
      .then((list) => setItemsByWh((prev) => ({ ...prev, [whId]: list || [] })))
      .catch(() => setItemsByWh((prev) => ({ ...prev, [whId]: [] })))
  }

  useEffect(() => {
    setLoading(true)
    apiJson<Warehouse[]>('/inventory/warehouses')
      .then((list) => {
        const arr = Array.isArray(list) ? list : []
        setWarehouses(arr)
        if (arr.length) setSelectedWh(arr[0].id)
        setLoadError(null)
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : 'Failed to load warehouses')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedWh) loadItems(selectedWh)
  }, [selectedWh])

  const saveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/inventory/warehouses', {
        method: 'POST',
        body: JSON.stringify({ name: form.name.trim(), address: form.address.trim() || null }),
      })
      setModal(null)
      setForm((f) => ({ ...f, name: '', address: '' }))
      loadWarehouses()
    } catch {
      alert('Failed')
    }
    setSaving(false)
  }

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWh) return
    setSaving(true)
    try {
      await apiFetch(`/inventory/warehouses/${selectedWh}/items`, {
        method: 'POST',
        body: JSON.stringify({
          sku: form.sku.trim() || null,
          name: form.itemName.trim() || null,
          quantity: parseFloat(form.quantity) || 0,
        }),
      })
      setModal(null)
      setForm((f) => ({ ...f, sku: '', itemName: '', quantity: '0' }))
      loadItems(selectedWh)
    } catch {
      alert('Failed')
    }
    setSaving(false)
  }

  if (loading && !loadError) return <div className="p-4">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setModal('warehouse'); setForm((f) => ({ ...f, name: '', address: '' })) }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Add warehouse
          </button>
          <button
            type="button"
            disabled={!selectedWh}
            onClick={() => { setModal('item'); setForm((f) => ({ ...f, sku: '', itemName: '', quantity: '0' })) }}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Add item
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-56 bg-white rounded-lg shadow p-3">
          <h2 className="font-semibold mb-2">Warehouses</h2>
          {warehouses.length === 0 ? (
            <p className="text-sm text-gray-500">{loadError ? 'Could not load list.' : 'No warehouses. Add one above.'}</p>
          ) : (
            <ul className="space-y-1">
              {warehouses.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedWh(w.id)}
                    className={`w-full text-left px-2 py-1 rounded text-sm ${selectedWh === w.id ? 'bg-red-100' : 'hover:bg-gray-100'}`}
                  >
                    {w.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">
            {selectedWh ? (warehouses.find((w) => w.id === selectedWh)?.name || '') + ' – Items' : 'Select a warehouse'}
          </h2>
          {selectedWh && (
            itemsByWh[selectedWh]?.length ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsByWh[selectedWh].map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="px-3 py-2">{i.sku ?? '-'}</td>
                      <td className="px-3 py-2">{i.name ?? '-'}</td>
                      <td className="px-3 py-2">{Number(i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-sm">No items. Add one with &quot;Add item&quot;.</p>
            )
          )}
        </div>
      </div>

      {modal === 'warehouse' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add warehouse</h2>
            <form onSubmit={saveWarehouse} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                  Save
                </button>
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'item' && selectedWh && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add item</h2>
            <form onSubmit={saveItem} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  value={form.itemName}
                  onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                  Save
                </button>
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
