import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiJson, apiFetch } from '../api'

type SettingValues = {
  tax_code_default: string
  default_fsc_percent: string
  company_name: string
  company_logo_url: string
  company_address: string
  company_mc: string
  company_dot: string
  default_equipment_types: string
  ar_reminder_days: string
  ar_reminder_repeat_days: string
}

// ── 마스터 데이터 타입 ────────────────────────────────────────────────
type City = { id: string; code?: string; name: string; province?: string; country?: string; zip_code?: string; timezone?: string; remarks?: string; is_active: boolean }
type SubType = { id: string; parent_id: string; subtype_name: string; is_active: boolean }
type TypeMaster = { id: string; type_name: string; use_subtype: boolean; description?: string; remark?: string; is_active: boolean; subtypes: SubType[] }
type Permission = { id: string; name: string; description?: string; resource?: string; action?: string; is_active: boolean; created_at?: string }

type Tab = 'default' | 'city' | 'type' | 'permission'

// ── 공통 모달 ────────────────────────────────────────────────────────
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

// ── City 탭 ──────────────────────────────────────────────────────────
function CityTab() {
  const [cities, setCities] = useState<City[]>([])
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<City | null>(null)
  const [form, setForm] = useState({ code: '', name: '', province: '', country: 'CANADA', zip_code: '', timezone: '', remarks: '' })
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<City[]>('/master/cities?active_only=false').then(setCities).catch(() => {})
  useEffect(() => { load() }, [])

  const filtered = cities.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.code || '').toLowerCase().includes(q.toLowerCase()))

  const openAdd = () => { setEditing(null); setForm({ code: '', name: '', province: '', country: 'CANADA', zip_code: '', timezone: '', remarks: '' }); setShowModal(true) }
  const openEdit = (c: City) => { setEditing(c); setForm({ code: c.code || '', name: c.name, province: c.province || '', country: c.country || 'CANADA', zip_code: c.zip_code || '', timezone: c.timezone || '', remarks: c.remarks || '' }); setShowModal(true) }

  const save = async () => {
    if (!form.name.trim()) { alert('City name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/master/cities/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/master/cities', { method: 'POST', body: JSON.stringify(form) })
      }
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this city?')) return
    await apiFetch(`/master/cities/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search city..." className="border rounded px-3 py-1.5 text-sm flex-1" />
        <button onClick={openAdd} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Code</th><th className="border px-3 py-2">City</th><th className="border px-3 py-2">Province</th>
          <th className="border px-3 py-2">Country</th><th className="border px-3 py-2">Timezone</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{filtered.map(c => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="border px-3 py-1.5">{c.code}</td>
            <td className="border px-3 py-1.5 font-medium">{c.name}</td>
            <td className="border px-3 py-1.5">{c.province}</td>
            <td className="border px-3 py-1.5">{c.country}</td>
            <td className="border px-3 py-1.5 text-xs text-gray-500">{c.timezone}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={() => del(c.id)} className="text-red-500 hover:underline text-xs">Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit City' : 'Add City'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {[
              { label: 'City Name *', key: 'name', placeholder: 'e.g. Vancouver' },
              { label: 'Code', key: 'code', placeholder: 'e.g. YVR' },
              { label: 'Province', key: 'province', placeholder: 'e.g. BC' },
              { label: 'Country', key: 'country', placeholder: 'CANADA' },
              { label: 'Zip Code', key: 'zip_code', placeholder: 'V6B 1A1' },
              { label: 'Timezone', key: 'timezone', placeholder: 'America/Vancouver' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-sm text-gray-600 block mb-1">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Remarks</label>
              <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Type/SubType 탭 ───────────────────────────────────────────────────
function TypeTab() {
  const [types, setTypes] = useState<TypeMaster[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TypeMaster | null>(null)
  const [form, setForm] = useState({ type_name: '', use_subtype: false, description: '', remark: '' })
  const [subtypeInput, setSubtypeInput] = useState('')
  const [pendingSubtypes, setPendingSubtypes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<TypeMaster[]>('/master/types?active_only=false').then(setTypes).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null); setForm({ type_name: '', use_subtype: false, description: '', remark: '' })
    setPendingSubtypes([]); setSubtypeInput(''); setShowModal(true)
  }
  const openEdit = (t: TypeMaster) => {
    setEditing(t); setForm({ type_name: t.type_name, use_subtype: t.use_subtype, description: t.description || '', remark: t.remark || '' })
    setPendingSubtypes([]); setSubtypeInput(''); setShowModal(true)
  }

  const save = async () => {
    if (!form.type_name.trim()) { alert('Type name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/master/types/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
        for (const st of pendingSubtypes) {
          await apiFetch(`/master/types/${editing.id}/subtypes`, { method: 'POST', body: JSON.stringify({ subtype_name: st }) })
        }
      } else {
        await apiFetch('/master/types', { method: 'POST', body: JSON.stringify({ ...form, subtypes: pendingSubtypes.map(s => ({ subtype_name: s })) }) })
      }
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this type?')) return
    await apiFetch(`/master/types/${id}`, { method: 'DELETE' }); load()
  }

  const delSubtype = async (stId: string) => {
    await apiFetch(`/master/subtypes/${stId}`, { method: 'DELETE' }); load()
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={openAdd} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">+ Add Type</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-50 text-left">
          <th className="border px-3 py-2">Type Name</th><th className="border px-3 py-2">SubType</th><th className="border px-3 py-2">Description</th><th className="border px-3 py-2">Action</th>
        </tr></thead>
        <tbody>{types.map(t => (
          <tr key={t.id} className="hover:bg-gray-50 align-top">
            <td className="border px-3 py-1.5 font-medium">{t.type_name}</td>
            <td className="border px-3 py-1.5">
              {t.use_subtype && t.subtypes.map(st => (
                <span key={st.id} className="inline-flex items-center gap-1 mr-1 mb-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs">
                  {st.subtype_name}
                  <button onClick={() => delSubtype(st.id)} className="text-red-400 hover:text-red-600 ml-0.5 font-bold">×</button>
                </span>
              ))}
            </td>
            <td className="border px-3 py-1.5 text-gray-500 text-xs">{t.description}</td>
            <td className="border px-3 py-1.5">
              <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
              <button onClick={() => del(t.id)} className="text-red-500 hover:underline text-xs">Delete</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {showModal && (
        <Modal title={editing ? 'Edit Type' : 'Add Type'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Type Name *</label>
              <input value={form.type_name} onChange={e => setForm(f => ({ ...f, type_name: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Remark</label>
              <textarea value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} rows={2} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="use_subtype" checked={form.use_subtype} onChange={e => setForm(f => ({ ...f, use_subtype: e.target.checked }))} />
              <label htmlFor="use_subtype" className="text-sm text-gray-600">Use SubType</label>
            </div>
            {form.use_subtype && (
              <div>
                <label className="text-sm text-gray-600 block mb-1">SubTypes</label>
                <div className="flex gap-2 mb-2">
                  <input value={subtypeInput} onChange={e => setSubtypeInput(e.target.value)} placeholder="SubType name" className="flex-1 border rounded px-3 py-1.5 text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (subtypeInput.trim()) { setPendingSubtypes(p => [...p, subtypeInput.trim()]); setSubtypeInput('') } } }} />
                  <button type="button" onClick={() => { if (subtypeInput.trim()) { setPendingSubtypes(p => [...p, subtypeInput.trim()]); setSubtypeInput('') } }} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pendingSubtypes.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded text-xs">
                      {s}<button onClick={() => setPendingSubtypes(p => p.filter((_, j) => j !== i))} className="text-red-400 font-bold">×</button>
                    </span>
                  ))}
                  {editing && editing.subtypes.map(st => (
                    <span key={st.id} className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs">{st.subtype_name}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Permission 탭 (참조 이미지 기준 CRUD 매트릭스) ─────────────────
const PERMISSION_MODULES: { section: string; items: string[] }[] = [
  { section: 'Dispatch', items: ['Order', 'Consolidation', 'EDI', 'OSD'] },
  { section: 'Partner', items: ['Customer', 'Location', 'Carrier', 'OEF'] },
  { section: 'Account', items: ['AR', 'AP', 'Expense', 'Debit+Credit', 'Item+List'] },
  { section: 'Inventory', items: ['List'] },
  { section: 'Group', items: ['Default', 'Qty', 'Permission'] },
]
const PERM_ACTIONS = ['Read', 'Edit', 'Create'] as const
type PermAction = typeof PERM_ACTIONS[number]
type PermMatrix = Record<string, Record<PermAction, boolean>>

function defaultMatrix(): PermMatrix {
  const m: PermMatrix = {}
  PERMISSION_MODULES.forEach(({ items }) => {
    items.forEach(item => {
      m[item] = { Read: false, Edit: false, Create: false }
    })
  })
  return m
}

function PermissionTab() {
  const [perms, setPerms] = useState<Permission[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [matrix, setMatrix] = useState<PermMatrix>(defaultMatrix())
  const [saving, setSaving] = useState(false)

  const load = () => apiJson<Permission[]>('/master/permissions').then(setPerms).catch(() => {})
  useEffect(() => { load() }, [])

  // 저장된 퍼미션을 매트릭스로 복원
  const buildMatrix = (name: string): PermMatrix => {
    const m = defaultMatrix()
    perms.filter(p => p.name === name).forEach(p => {
      const resource = p.resource || ''
      const action = (p.action || '') as PermAction
      if (m[resource] && PERM_ACTIONS.includes(action as any)) {
        m[resource][action] = !!p.is_active
      }
    })
    return m
  }

  const openAdd = () => {
    setEditing(null); setFormName(''); setFormDesc(''); setMatrix(defaultMatrix()); setShowModal(true)
  }
  const openEdit = (p: Permission) => {
    setEditing(p); setFormName(p.name); setFormDesc(p.description || '')
    setMatrix(buildMatrix(p.name)); setShowModal(true)
  }

  const toggleCell = (resource: string, action: PermAction) => {
    setMatrix(m => ({ ...m, [resource]: { ...m[resource], [action]: !m[resource][action] } }))
  }

  const save = async () => {
    if (!formName.trim()) { alert('Permission Name is required'); return }
    setSaving(true)
    try {
      // 기존 같은 이름 권한 삭제 후 재생성
      const existing = perms.filter(p => p.name === formName)
      await Promise.all(existing.map(p => apiFetch(`/master/permissions/${p.id}`, { method: 'DELETE' })))
      // 체크된 항목만 생성
      const creates: Promise<any>[] = []
      PERMISSION_MODULES.forEach(({ items }) => {
        items.forEach(resource => {
          PERM_ACTIONS.forEach(action => {
            if (matrix[resource]?.[action]) {
              creates.push(apiFetch('/master/permissions', {
                method: 'POST',
                body: JSON.stringify({ name: formName, description: formDesc, resource, action: action.toLowerCase() }),
              }))
            }
          })
        })
      })
      await Promise.all(creates)
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || 'Save failed') }
    setSaving(false)
  }

  const del = async (name: string) => {
    if (!confirm(`Delete permission "${name}"?`)) return
    const toDelete = perms.filter(p => p.name === name)
    await Promise.all(toDelete.map(p => apiFetch(`/master/permissions/${p.id}`, { method: 'DELETE' })))
    load()
  }

  // 고유 퍼미션 이름 목록
  const permNames = [...new Set(perms.map(p => p.name))]

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">+ Add</button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-3 py-2 text-left font-medium text-gray-600">Permission Name</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">Read</th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">Edit</th>
            <th className="px-3 py-2 text-center font-medium text-gray-600">Create</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {permNames.length === 0 ? (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No permissions. Click + Add to create one.</td></tr>
          ) : permNames.map(name => {
            const group = perms.filter(p => p.name === name)
            const desc = group[0]?.description || ''
            const hasRead = group.some(p => p.action === 'read' && p.is_active)
            const hasEdit = group.some(p => p.action === 'edit' && p.is_active)
            const hasCreate = group.some(p => p.action === 'create' && p.is_active)
            return (
              <tr key={name} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{name}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{desc}</td>
                <td className="px-3 py-2 text-center">{hasRead ? <span className="text-green-600">✓</span> : <span className="text-gray-300">–</span>}</td>
                <td className="px-3 py-2 text-center">{hasEdit ? <span className="text-green-600">✓</span> : <span className="text-gray-300">–</span>}</td>
                <td className="px-3 py-2 text-center">{hasCreate ? <span className="text-green-600">✓</span> : <span className="text-gray-300">–</span>}</td>
                <td className="px-3 py-2 flex gap-2">
                  <button onClick={() => openEdit(group[0])} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => del(name)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">{editing ? 'Edit Permission' : 'Add Permission'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <div className="p-4 flex gap-6">
              {/* Left: Name + Description */}
              <div className="w-56 shrink-0 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">* Permission Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Permission Name" className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Description</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} placeholder="Description..." className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
              {/* Right: CRUD matrix */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left w-32">Resource</th>
                      {PERM_ACTIONS.map(a => <th key={a} className="border px-3 py-2 text-center w-16">{a}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map(({ section, items }) => (
                      <>
                        <tr key={section} className="bg-gray-100">
                          <td colSpan={4} className="border px-3 py-1 font-semibold text-gray-700 text-xs">• {section}</td>
                        </tr>
                        {items.map(item => (
                          <tr key={item} className="hover:bg-blue-50">
                            <td className="border px-3 py-1.5 text-gray-700">{item}</td>
                            {PERM_ACTIONS.map(action => (
                              <td key={action} className="border px-3 py-1.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={matrix[item]?.[action] ?? false}
                                  onChange={() => toggleCell(item, action)}
                                  className="rounded"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 기존 Default 설정 (기존 Setting 내용) ────────────────────────────
function DefaultSettingTab() {
  const [form, setForm] = useState<SettingValues>({
    tax_code_default: 'GST', default_fsc_percent: '0',
    company_name: '', company_logo_url: '', company_address: '',
    company_mc: '', company_dot: '',
    default_equipment_types: 'Dry Van,Reefer,Flatbed,Step Deck',
    ar_reminder_days: '0', ar_reminder_repeat_days: '0',
  })
  const [runningReminder, setRunningReminder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)

  const load = () => {
    setLoading(true)
    apiJson<SettingValues>('/settings').then(setForm).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(form) }); alert('Saved.') }
    catch { alert('Save failed') }
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="card max-w-lg space-y-4">
        <h2 className="font-semibold text-gray-700">Company & Defaults</h2>
        {[
          { label: 'Company Name', key: 'company_name', type: 'text', placeholder: '' },
          { label: 'Company Logo URL', key: 'company_logo_url', type: 'url', placeholder: 'https://...' },
          { label: 'Company MC#', key: 'company_mc', type: 'text', placeholder: '' },
          { label: 'Company DOT#', key: 'company_dot', type: 'text', placeholder: '' },
          { label: 'Default FSC %', key: 'default_fsc_percent', type: 'text', placeholder: '0' },
          { label: 'Default Equipment Types (comma)', key: 'default_equipment_types', type: 'text', placeholder: 'Dry Van,Reefer,Flatbed' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm text-gray-600 mb-1">{label}</label>
            <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full border rounded px-3 py-2" />
          </div>
        ))}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company Address</label>
          <textarea value={form.company_address} onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))} rows={3} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Default Tax Code</label>
          <select value={form.tax_code_default} onChange={e => setForm(f => ({ ...f, tax_code_default: e.target.value }))} className="w-full border rounded px-3 py-2">
            <option value="">--</option>
            <option value="GST">GST</option>
            <option value="Exempted">Exempted</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
      </form>

      <div className="card max-w-lg">
        <h2 className="font-semibold text-gray-700 mb-3">AR Invoice Reminder</h2>
        <form onSubmit={save} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">기준일 (0 = 비활성)</label>
              <input type="number" min="0" value={form.ar_reminder_days} onChange={e => setForm(f => ({ ...f, ar_reminder_days: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">반복 간격 (0 = 1회)</label>
              <input type="number" min="0" value={form.ar_reminder_repeat_days} onChange={e => setForm(f => ({ ...f, ar_reminder_repeat_days: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" disabled={runningReminder} onClick={async () => {
              setRunningReminder(true)
              try {
                const data = await apiJson<{ sent: number; skipped: number; reason?: string; error?: string }>('/settings/run-reminder', { method: 'POST' })
                if (data.reason === 'disabled') alert('리마인더 비활성화 상태')
                else if (data.error) alert(`오류: ${data.error}`)
                else alert(`완료 — 발송: ${data.sent}건, 스킵: ${data.skipped}건`)
              } catch { alert('실행 실패') }
              setRunningReminder(false)
            }} className="px-4 py-2 border rounded text-sm hover:bg-gray-100 disabled:opacity-50">{runningReminder ? '실행 중...' : '즉시 실행'}</button>
          </div>
        </form>
      </div>

      <div className="card max-w-lg">
        <h2 className="font-semibold text-gray-700 mb-2">Email (SMTP) Test</h2>
        <div className="flex gap-2">
          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="받을 이메일" className="flex-1 border rounded px-3 py-2" />
          <button type="button" disabled={testingEmail || !testEmail.trim()} onClick={async () => {
            setTestingEmail(true)
            try {
              const res = await apiFetch('/settings/test-email', { method: 'POST', body: JSON.stringify({ to_email: testEmail.trim() }) })
              const data = await res.json()
              alert(data.sent ? '발송 완료' : data.message || '발송 실패')
            } catch { alert('요청 실패') }
            setTestingEmail(false)
          }} className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">{testingEmail ? '발송 중...' : '테스트 메일'}</button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 Setting 페이지 ───────────────────────────────────────────────
export default function Setting() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = (searchParams.get('tab') || 'default') as Tab
  const validTab: Tab = ['default', 'city', 'type', 'permission'].includes(tabParam) ? tabParam : 'default'
  const [tab, setTab] = useState<Tab>(validTab)

  useEffect(() => { setTab(validTab) }, [validTab])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'default', label: 'Default' },
    { key: 'city', label: 'City' },
    { key: 'type', label: 'Type / SubType' },
    { key: 'permission', label: 'Permission' },
  ]

  const onTabClick = (t: Tab) => {
    setTab(t)
    setSearchParams({ tab: t })
  }

  return (
    <div>
      <h1 className="page-title">Setting</h1>
      <div className="flex gap-0 border-b mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => onTabClick(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>
      {tab === 'default' && <DefaultSettingTab />}
      {tab === 'city' && <div className="card"><CityTab /></div>}
      {tab === 'type' && <div className="card"><TypeTab /></div>}
      {tab === 'permission' && <div className="card"><PermissionTab /></div>}
    </div>
  )
}
