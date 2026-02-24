import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Component, ReactNode } from 'react'
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
import Profit from './pages/Profit'
import Account from './pages/Account'
import Inventory from './pages/Inventory'
import Invoicing from './pages/Invoicing'
import Reports from './pages/Reports'
import Setting from './pages/Setting'

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

function AppLayout() {
  const isAdmin = useIsAdmin()
  const isPortal = useIsPortalUser()
  return (
      <div className="flex min-h-screen bg-gray-100">
        <aside className="w-56 bg-slate-800 text-white flex flex-col">
          <div className="p-4 font-bold text-lg border-b border-slate-700">
            Freight Broker
            {isPortal && <div className="text-xs font-normal text-slate-300 mt-0.5">Portal</div>}
          </div>
          <nav className="flex-1 p-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/order"
              className={({ isActive }) =>
                `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`
              }
            >
              {isPortal ? 'My Loads' : 'Order'}
            </NavLink>
            {!isPortal && (
              <>
                <NavLink to="/partner" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
                  Partner
                </NavLink>
                <NavLink to="/profit" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
                  Profit
                </NavLink>
              </>
            )}
            <NavLink to="/invoicing" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
              {isPortal ? 'My Invoices' : 'Invoicing'}
            </NavLink>
            {!isPortal && (
              <NavLink to="/reports" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
                Reports
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/account" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
                Account
              </NavLink>
            )}
            {!isPortal && (
              <NavLink to="/inventory" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
                Inventory
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/setting" className={({ isActive }) => `block px-3 py-2 rounded mb-1 ${isActive ? 'bg-red-600' : 'hover:bg-slate-700'}`}>
                Setting
              </NavLink>
            )}
          </nav>
          <div className="p-2 border-t border-slate-700">
            <button
              type="button"
              onClick={() => { clearToken(); (window as any).location.href = '/login' }}
              className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-slate-300"
            >
              Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <PageErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/order" element={<Order />} />
              <Route path="/order/new" element={<LoadDetail />} />
              <Route path="/order/:loadId" element={<LoadDetail />} />
              <Route path="/partner" element={<Partner />} />
              <Route path="/partner/new" element={<PartnerDetail />} />
              <Route path="/partner/:partnerId" element={<PartnerDetail />} />
              <Route path="/profit" element={<Profit />} />
              <Route path="/invoicing" element={<Invoicing />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/account" element={<RequireAdmin><Account /></RequireAdmin>} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/setting" element={<RequireAdmin><Setting /></RequireAdmin>} />
            </Routes>
          </PageErrorBoundary>
        </main>
      </div>
  )
}

export default App
