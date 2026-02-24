import { useState, useEffect } from 'react'
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
}

export default function Setting() {
  const [form, setForm] = useState<SettingValues>({
    tax_code_default: 'GST',
    default_fsc_percent: '0',
    company_name: '',
    company_logo_url: '',
    company_address: '',
    company_mc: '',
    company_dot: '',
    default_equipment_types: 'Dry Van,Reefer,Flatbed,Step Deck',
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)

  const load = () => {
    setLoadError(null)
    setLoading(true)
    apiJson<SettingValues>('/settings')
      .then((data) => {
        setForm(data)
        setLoadError(null)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed to load settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      alert('Saved.')
    } catch {
      alert('Save failed')
    }
    setSaving(false)
  }

  if (loading && !loadError) return <div className="p-4">Loading...</div>

  return (
    <div>
      <h1 className="page-title">Setting</h1>
      {loadError && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-amber-800">{loadError}</span>
          <button type="button" onClick={load} className="ml-3 px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm">Retry</button>
        </div>
      )}
      <form onSubmit={save} className="card max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Default Tax Code</label>
          <select
            value={form.tax_code_default}
            onChange={(e) => setForm((f) => ({ ...f, tax_code_default: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">--</option>
            <option value="GST">GST</option>
            <option value="Exempted">Exempted</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Default FSC %</label>
          <input
            type="text"
            value={form.default_fsc_percent}
            onChange={(e) => setForm((f) => ({ ...f, default_fsc_percent: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company Name</label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Your company name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company Logo URL</label>
          <input
            type="url"
            value={form.company_logo_url}
            onChange={(e) => setForm((f) => ({ ...f, company_logo_url: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-gray-500 mt-1">RC/BOL 등 문서에 표시됩니다.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company Address</label>
          <textarea
            value={form.company_address}
            onChange={(e) => setForm((f) => ({ ...f, company_address: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Address for documents"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company MC#</label>
          <input
            type="text"
            value={form.company_mc}
            onChange={(e) => setForm((f) => ({ ...f, company_mc: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company DOT#</label>
          <input
            type="text"
            value={form.company_dot}
            onChange={(e) => setForm((f) => ({ ...f, company_dot: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Default Equipment Types (comma-separated)</label>
          <input
            type="text"
            value={form.default_equipment_types}
            onChange={(e) => setForm((f) => ({ ...f, default_equipment_types: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Dry Van, Reefer, Flatbed"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>

      <div className="card max-w-lg mt-6">
        <h2 className="text-lg font-semibold mb-2">Email (SMTP) 테스트</h2>
        <p className="text-sm text-gray-600 mb-3">서버 .env에 SMTP_HOST, FROM_EMAIL 등 설정 후 테스트 메일을 보냅니다.</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="받을 이메일 주소"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="button"
            disabled={testingEmail || !testEmail.trim()}
            onClick={async () => {
              setTestingEmail(true)
              try {
                const res = await apiFetch('/settings/test-email', { method: 'POST', body: JSON.stringify({ to_email: testEmail.trim() }) })
                const data = await res.json()
                alert(data.sent ? '테스트 메일이 발송되었습니다.' : data.message || '발송 실패')
              } catch {
                alert('요청 실패')
              }
              setTestingEmail(false)
            }}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {testingEmail ? '발송 중...' : '테스트 메일 발송'}
          </button>
        </div>
      </div>
    </div>
  )
}
