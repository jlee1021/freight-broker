import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Component, ReactNode, useState } from 'react'
import { getToken, clearToken } from './api'
import { AuthProvider, useIsAdmin, useMe, useIsPortalUser } from './AuthContext'

class PageErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  componentDidCatch(error: Error) { console.error('[PageError]', error) }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
            <h2 className="text-red-800 font-semibold mb-2">페이지 오류</h2>
            <p className="text-red-700 text-sm mb-4">{this.state.error}</p>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              onClick={() => this.setState({ error: null })}
            >
              다시 시도
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
import Login from './pages/Login'
import Order from './pages/Order'
import LoadDetail from './pages/LoadDetail'
import Partner from './pages/Partner'
import PartnerDetail from './pages/PartnerDetail'
import Dashboard from './pages/Dashboard'
import PortalDashboard from './pages/PortalDashboard'
import Profit from './pages/Profit'
import Account from './pages/Account'
import Inventory from './pages/Inventory'
import Invoicing from './pages/Invoicing'
import Reports from './pages/Reports'
import Setting from './pages/Setting'
import Consolidation from './pages/Consolidation'
import Edi from './pages/Edi'
import OsOrderPage from './pages/OsOrder'
import OsdPage from './pages/Osd'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  if (!getToken()) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const me = useMe()
  if (me === undefined) return <div className="p-4 text-gray-600">Loading...</div>
  if ((me?.role ?? '').toLowerCase() !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <RequireAuth>
            <AuthProvider>
              <AppLayout />
            </AuthProvider>
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  )
}

// ── 아이콘 (참조 솔루션 스타일) ────────────────────────────────────────
const IconDispatch = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
)
const IconPartner = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
)
const IconProfit = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
)
const IconAccount = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
)
const IconInventory = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
)
const IconSetting = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
)
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
)

// ── 계층형 사이드바 (참조 솔루션 구조) ─────────────────────────────────
function SidebarNav() {
  const location = useLocation()
  const isAdmin = useIsAdmin()
  const isPortal = useIsPortalUser()
  const me = useMe()
  const isCarrier = (me?.partner_type || '').toLowerCase() === 'carrier'

  const path = location.pathname
  const isDispatch = path === '/order' || path.startsWith('/order/') || path === '/consolidation' || path === '/edi' || path === '/reports'
  const isPartner = path === '/partner' || path.startsWith('/partner')
  const isProfit = path === '/profit' || path.startsWith('/profit')
  const isAccount = path.startsWith('/account')
  const isInventory = path === '/inventory'
  const isSetting = path === '/setting'

  const [open, setOpen] = useState<Record<string, boolean>>(() => ({
    dispatch: isDispatch,
    partner: isPartner,
    profit: isProfit,
    account: isAccount,
    inventory: isInventory,
    setting: isSetting,
  }))

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  const subLinkClass = (to: string, search?: string) => {
    const match = path === to && (!search || location.search.includes(search))
    return `flex items-center gap-2 pl-9 pr-3 py-2 rounded mb-0.5 text-sm ${match ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`
  }

  if (isPortal) {
    return (
      <nav className="flex-1 p-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${isActive ? 'bg-red-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>Dashboard</NavLink>
        <NavLink to="/order" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${isActive ? 'bg-red-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>{isCarrier ? 'My Loads' : 'My Invoices'}</NavLink>
        <NavLink to="/invoicing" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${isActive ? 'bg-red-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>{isCarrier ? 'My Payables' : 'My Invoices'}</NavLink>
      </nav>
    )
  }

  return (
    <nav className="flex-1 p-2 overflow-y-auto">
      <NavLink to="/" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${isActive ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>
        Dashboard
      </NavLink>

      {/* Dispatch */}
      <div className="mb-0.5">
        <button type="button" onClick={() => toggle('dispatch')} className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded text-sm hover:bg-slate-700 text-slate-200 ${isDispatch ? 'bg-slate-700' : ''}`}>
          <span className="flex items-center gap-2"><IconDispatch /> Dispatch</span>
          <ChevronDown open={open.dispatch} />
        </button>
        {open.dispatch && (
          <div className="mt-0.5">
            <NavLink to="/order" className={({ isActive }) => subLinkClass('/order') + (isActive ? ' bg-slate-600 text-white' : '')}>Order</NavLink>
            <NavLink to="/os-orders" className={({ isActive }) => subLinkClass('/os-orders') + (isActive ? ' bg-slate-600 text-white' : '')}>OS List</NavLink>
            <NavLink to="/osd" className={({ isActive }) => subLinkClass('/osd') + (isActive ? ' bg-slate-600 text-white' : '')}>OSD</NavLink>
            <NavLink to="/consolidation" className={({ isActive }) => subLinkClass('/consolidation') + (isActive ? ' bg-slate-600 text-white' : '')}>Consolidation</NavLink>
            <NavLink to="/edi" className={({ isActive }) => subLinkClass('/edi') + (isActive ? ' bg-slate-600 text-white' : '')}>EDI</NavLink>
          </div>
        )}
      </div>

      {/* Partner */}
      <div className="mb-0.5">
        <button type="button" onClick={() => toggle('partner')} className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded text-sm hover:bg-slate-700 text-slate-200 ${isPartner ? 'bg-slate-700' : ''}`}>
          <span className="flex items-center gap-2"><IconPartner /> Partner</span>
          <ChevronDown open={open.partner} />
        </button>
        {open.partner && (
          <div className="mt-0.5">
            <NavLink to="/partner?type=customer" className={() => `flex items-center gap-2 pl-9 pr-3 py-2 rounded mb-0.5 text-sm ${location.search.includes('customer') ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>Customer</NavLink>
            <NavLink to="/partner" className={({ isActive }) => `flex items-center gap-2 pl-9 pr-3 py-2 rounded mb-0.5 text-sm ${isActive && !location.search ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>Location</NavLink>
            <NavLink to="/partner?type=carrier" className={() => `flex items-center gap-2 pl-9 pr-3 py-2 rounded mb-0.5 text-sm ${location.search.includes('carrier') ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>Carrier</NavLink>
            <NavLink to="/partner" className={({ isActive }) => `flex items-center gap-2 pl-9 pr-3 py-2 rounded mb-0.5 text-sm ${isActive ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-200'}`}>Staff</NavLink>
          </div>
        )}
      </div>

      {/* Profit */}
      <div className="mb-0.5">
        <button type="button" onClick={() => toggle('profit')} className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded text-sm hover:bg-slate-700 text-slate-200 ${isProfit ? 'bg-slate-700' : ''}`}>
          <span className="flex items-center gap-2"><IconProfit /> Profit</span>
          <ChevronDown open={open.profit} />
        </button>
        {open.profit && (
          <div className="mt-0.5">
            <NavLink to="/profit" className={({ isActive }) => subLinkClass('/profit') + (isActive && !path.includes('expense-detail') ? ' bg-slate-600 text-white' : '')}>Customer</NavLink>
            <NavLink to="/profit/expense-detail" className={({ isActive }) => subLinkClass('/profit/expense-detail') + (isActive ? ' bg-slate-600 text-white' : '')}>Expense Detail</NavLink>
          </div>
        )}
      </div>

      {/* Account (AR, AP, Expense, Debit/Credit, Item Type) - 참조 솔루션 구조 */}
      <div className="mb-0.5">
        <button type="button" onClick={() => toggle('account')} className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded text-sm hover:bg-slate-700 text-slate-200 ${isAccount ? 'bg-slate-700' : ''}`}>
          <span className="flex items-center gap-2"><IconAccount /> Account</span>
          <ChevronDown open={open.account} />
        </button>
        {open.account && (
          <div className="mt-0.5">
            <NavLink to="/account/ar" className={({ isActive }) => subLinkClass('/account/ar') + (isActive ? ' bg-slate-600 text-white' : '')}>AR List</NavLink>
            <NavLink to="/account/ap" className={({ isActive }) => subLinkClass('/account/ap') + (isActive ? ' bg-slate-600 text-white' : '')}>AP List</NavLink>
            <NavLink to="/account/expense" className={({ isActive }) => subLinkClass('/account/expense') + (isActive ? ' bg-slate-600 text-white' : '')}>Expense</NavLink>
            <NavLink to="/account/debit-credit" className={({ isActive }) => subLinkClass('/account/debit-credit') + (isActive ? ' bg-slate-600 text-white' : '')}>Debit / Credit</NavLink>
            <NavLink to="/account/item-type" className={({ isActive }) => subLinkClass('/account/item-type') + (isActive ? ' bg-slate-600 text-white' : '')}>Item Type List</NavLink>
            {isAdmin && <NavLink to="/account/users" className={({ isActive }) => subLinkClass('/account/users') + (isActive ? ' bg-slate-600 text-white' : '')}>Users</NavLink>}
          </div>
        )}
      </div>

      {/* Inventory */}
      <div className="mb-0.5">
        <button type="button" onClick={() => toggle('inventory')} className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded text-sm hover:bg-slate-700 text-slate-200 ${isInventory ? 'bg-slate-700' : ''}`}>
          <span className="flex items-center gap-2"><IconInventory /> Inventory</span>
          <ChevronDown open={open.inventory} />
        </button>
        {open.inventory && (
          <div className="mt-0.5">
            <NavLink to="/inventory" className={({ isActive }) => subLinkClass('/inventory') + (isActive ? ' bg-slate-600 text-white' : '')}>List</NavLink>
          </div>
        )}
      </div>

      {/* Setting (Admin) */}
      {isAdmin && (
      <div className="mb-0.5">
        <button type="button" onClick={() => toggle('setting')} className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded text-sm hover:bg-slate-700 text-slate-200 ${isSetting ? 'bg-slate-700' : ''}`}>
          <span className="flex items-center gap-2"><IconSetting /> Setting</span>
          <ChevronDown open={open.setting} />
        </button>
        {open.setting && (
          <div className="mt-0.5">
            <NavLink to="/setting" className={({ isActive }) => subLinkClass('/setting') + (isActive && !location.search ? ' bg-slate-600 text-white' : '')}>Default</NavLink>
            <NavLink to="/setting?tab=city" className={() => subLinkClass('/setting', 'tab=city') + (location.search.includes('city') ? ' bg-slate-600 text-white' : '')}>City</NavLink>
            <NavLink to="/setting?tab=type" className={() => subLinkClass('/setting', 'tab=type') + (location.search.includes('type') ? ' bg-slate-600 text-white' : '')}>Type</NavLink>
            <NavLink to="/setting?tab=permission" className={() => subLinkClass('/setting', 'tab=permission') + (location.search.includes('permission') ? ' bg-slate-600 text-white' : '')}>Permission</NavLink>
          </div>
        )}
      </div>
      )}
    </nav>
  )
}

function AppLayout() {
  const isPortal = useIsPortalUser()
  const me = useMe()
  const partnerName = me?.partner_name || me?.email || ''

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-slate-800 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <p className="font-bold text-base leading-tight">
            {isPortal ? (me?.partner_type?.toLowerCase() === 'carrier' ? 'Carrier Portal' : 'Customer Portal') : 'Freight Broker Pro'}
          </p>
          {isPortal && partnerName && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{partnerName}</p>
          )}
        </div>
        <SidebarNav />
        <div className="p-2 border-t border-slate-700">
          <button
            type="button"
            onClick={() => { clearToken(); (window as any).location.href = '/login' }}
            className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-slate-300 text-sm"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <PageErrorBoundary>
          <Routes>
            <Route path="/" element={isPortal ? <PortalDashboard /> : <Dashboard />} />
            <Route path="/order" element={<Order />} />
            <Route path="/order/new" element={<LoadDetail />} />
            <Route path="/order/:loadId" element={<LoadDetail />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/partner/new" element={<PartnerDetail />} />
            <Route path="/partner/:partnerId" element={<PartnerDetail />} />
            <Route path="/profit" element={<Profit />} />
            <Route path="/profit/expense-detail" element={<ProfitExpenseDetail />} />
            <Route path="/invoicing" element={<Invoicing />} />
            <Route path="/account" element={<Navigate to="/account/ar" replace />} />
            <Route path="/account/ar" element={<Invoicing viewMode="ar" />} />
            <Route path="/account/ap" element={<Invoicing viewMode="ap" />} />
            <Route path="/account/expense" element={<RequireAdmin><Account /></RequireAdmin>} />
            <Route path="/account/debit-credit" element={<RequireAdmin><Account /></RequireAdmin>} />
            <Route path="/account/item-type" element={<RequireAdmin><Account /></RequireAdmin>} />
            <Route path="/account/users" element={<RequireAdmin><Account /></RequireAdmin>} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/consolidation" element={<Consolidation />} />
            <Route path="/edi" element={<Edi />} />
            <Route path="/os-orders" element={<OsOrderPage />} />
            <Route path="/osd" element={<OsdPage />} />
            <Route path="/setting" element={<RequireAdmin><Setting /></RequireAdmin>} />
          </Routes>
        </PageErrorBoundary>
      </main>
    </div>
  )
}

function ProfitExpenseDetail() {
  return (
    <div>
      <h1 className="page-title">Profit – Expense Detail</h1>
      <div className="card p-6">
        <p className="text-gray-600 mb-4">Expense detail by account, vendor, and status. Use Account &gt; Expense for full expense list and details.</p>
        <NavLink to="/account/expense" className="text-red-600 hover:underline font-medium">Go to Account → Expense</NavLink>
      </div>
    </div>
  )
}

export default App
