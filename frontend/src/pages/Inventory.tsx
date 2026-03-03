import { useState, useEffect } from 'react'
import { apiJson, apiFetch } from '../api'

type Warehouse = { id: string; name: string; address: string | null }
type InventoryItem = {
  id: string; warehouse_id: string; sku: string | null; name: string | null
  quantity: number; size: string | null; cost: number | null; total: number | null
  entry_date: string | null; note: string | null
}

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

export default function Inventory() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWh, setSelectedWh] = useState<string>('')
  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [modal, setModal] = useState<'warehouse' | 'item' | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [whForm, setWhForm] = useState({ name: '', address: '' })
  const [itemForm, setItemForm] = useState<Partial<InventoryItem & { quantity: number; cost: number; total: number }>>({
    quantity: 0, cost: 0, total: 0,
  })
  const [saving, setSaving] = useState(false)

  const loadWarehouses = () => apiJson<Warehouse[]>('/inventory/warehouses').then(list => {
    const arr = Array.isArray(list) ? list : []
    setWarehouses(arr)
    if (arr.length && !selectedWh) setSelectedWh(arr[0].id)
  }).catch(() => setWarehouses([]))

  const loadItems = () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (fromDate) params.set('from_date', fromDate)
    if (toDate) params.set('to_date', toDate)
    const base = selectedWh ? `/inventory/warehouses/${selectedWh}/items` : '/inventory/items'
    apiJson<InventoryItem[]>(`${base}?${params}`).then(list => setItems(Array.isArray(list) ? list : [])).catch(() => setItems([]))
  }

  useEffect(() => {
    setLoading(true)
    loadWarehouses().finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadItems() }, [selectedWh, q, fromDate, toDate])

  // total 자동 계산
  const calcTotal = (qty: number, cost: number) => Math.round(qty * cost * 100) / 100

  const saveWarehouse = async () => {
    if (!whForm.name.trim()) { alert('Name required'); return }
    setSaving(true)
    try { await apiFetch('/inventory/warehouses', { method: 'POST', body: JSON.stringify(whForm) }); setModal(null); loadWarehouses() }
    catch { alert('Save failed') }
    setSaving(false)
  }

  const saveItem = async () => {
    if (!selectedWh) { alert('Select a warehouse first'); return }
    setSaving(true)
    // total 자동 계산
    const form = { ...itemForm, total: calcTotal(itemForm.quantity || 0, itemForm.cost || 0) }
    try {
      if (editingItem) {
        await apiFetch(`/inventory/warehouses/${selectedWh}/items/${editingItem.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch(`/inventory/warehouses/${selectedWh}/items`, { method: 'POST', body: JSON.stringify(form) })
      }
      setModal(null); loadItems()
    } catch { alert('Save failed') }
    setSaving(false)
  }

  const delItem = async (wId: string, iId: string) => {
    if (!confirm('Delete this item?')) return
    await apiFetch(`/inventory/warehouses/${wId}/items/${iId}`, { method: 'DELETE' }); loadItems()
  }

  const delWarehouse = async (id: string) => {
    if (!confirm('Delete this warehouse and all its items?')) return
    await apiFetch(`/inventory/warehouses/${id}`, { method: 'DELETE' })
    setSelectedWh('')
    loadWarehouses()
    setItems([])
  }

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="page-title">Inventory</h1>
      <div className="flex gap-4">
        {/* 창고 사이드바 */}
        <div className="w-56 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Warehouses</span>
            <button onClick={() => { setWhForm({ name: '', address: '' }); setModal('warehouse') }} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">+ Add</button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedWh('')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedWh === '' ? 'bg-red-50 text-red-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
            >All Warehouses</button>
            {warehouses.map(wh => (
              <div key={wh.id} className="group relative">
                <button
                  onClick={() => setSelectedWh(wh.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm pr-8 ${selectedWh === wh.id ? 'bg-red-50 text-red-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                >{wh.name}</button>
                <button onClick={() => delWarehouse(wh.id)} className="absolute right-2 top-2 hidden group-hover:block text-gray-400 hover:text-red-600 text-xs">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* 아이템 영역 */}
        <div className="flex-1">
          {/* 필터 바 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search item/SKU..." className="border rounded px-3 py-1.5 text-sm flex-1 min-w-32" />
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
            </div>
            {selectedWh && (
              <button onClick={() => { setEditingItem(null); setItemForm({ quantity: 0, cost: 0, total: 0 }); setModal('item') }} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Item</button>
            )}
          </div>

          {/* 아이템 테이블 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700">Item # / SKU</th>
                  <th className="px-3 py-2 text-left text-gray-700">Name</th>
                  <th className="px-3 py-2 text-left text-gray-700">Size</th>
                  <th className="px-3 py-2 text-right text-gray-700">Qty</th>
                  <th className="px-3 py-2 text-right text-gray-700">Cost</th>
                  <th className="px-3 py-2 text-right text-gray-700">Total</th>
                  <th className="px-3 py-2 text-left text-gray-700">Entry Date</th>
                  <th className="px-3 py-2 text-left text-gray-700">Note</th>
                  <th className="px-3 py-2 text-left text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">No items found.</td></tr>
                  : items.map(item => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-600">{item.sku || '—'}</td>
                      <td className="px-3 py-1.5 font-medium">{item.name}</td>
                      <td className="px-3 py-1.5 text-gray-600">{item.size}</td>
                      <td className="px-3 py-1.5 text-right">{Number(item.quantity).toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right">{item.cost != null ? `$${Number(item.cost).toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{item.total != null ? `$${Number(item.total).toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{item.entry_date}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[150px] truncate">{item.note}</td>
                      <td className="px-3 py-1.5">
                        <button onClick={() => { setEditingItem(item); setItemForm({ ...item, quantity: Number(item.quantity), cost: Number(item.cost || 0), total: Number(item.total || 0) }); setModal('item') }} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                        <button onClick={() => delItem(item.warehouse_id, item.id)} className="text-red-500 hover:underline text-xs">Del</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Total:</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">${items.reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Warehouse 추가 모달 */}
      {modal === 'warehouse' && (
        <Modal title="Add Warehouse" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Name *</label>
              <input value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Address</label>
              <textarea value={whForm.address} onChange={e => setWhForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveWarehouse} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Item 추가/수정 모달 */}
      {modal === 'item' && (
        <Modal title={editingItem ? 'Edit Item' : 'Add Item'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">SKU / Item #</label>
                <input value={itemForm.sku || ''} onChange={e => setItemForm(f => ({ ...f, sku: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Name</label>
                <input value={itemForm.name || ''} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Size</label>
                <input value={itemForm.size || ''} onChange={e => setItemForm(f => ({ ...f, size: e.target.value }))} placeholder="e.g. S/M/L or 10x20cm" className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Entry Date</label>
                <input type="date" value={itemForm.entry_date || ''} onChange={e => setItemForm(f => ({ ...f, entry_date: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Quantity</label>
                <input type="number" step="0.01" value={itemForm.quantity || 0}
                  onChange={e => {
                    const qty = Number(e.target.value)
                    setItemForm(f => ({ ...f, quantity: qty, total: calcTotal(qty, f.cost || 0) }))
                  }}
                  className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-0.5">Cost</label>
                <input type="number" step="0.01" value={itemForm.cost || 0}
                  onChange={e => {
                    const cst = Number(e.target.value)
                    setItemForm(f => ({ ...f, cost: cst, total: calcTotal(f.quantity || 0, cst) }))
                  }}
                  className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-0.5">Total (auto-calc: Qty × Cost)</label>
                <input type="number" step="0.01" value={itemForm.total || 0} onChange={e => setItemForm(f => ({ ...f, total: Number(e.target.value) }))} className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">Note</label>
              <textarea value={itemForm.note || ''} onChange={e => setItemForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveItem} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
