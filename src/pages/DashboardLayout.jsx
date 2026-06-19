import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Bell,
  CalendarCheck,
  LogOut,
  Menu,
} from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import mascot from '../assets/horse-mascot.svg'

function ChessIcon({ piece }) {
  return (
    <span className="chess-piece-icon" aria-hidden="true">
      {piece}
    </span>
  )
}

function ChessKing() {
  return <ChessIcon piece="♔" />
}

function ChessPawn() {
  return <ChessIcon piece="♙" />
}

function ChessRook() {
  return <ChessIcon piece="♘" />
}

function ChessKnight() {
  return <ChessIcon piece="♖" />
}

function ChessQueen() {
  return <ChessIcon piece="♕" />
}

function daysLeft(deadline) {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diff = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function countUnread(rows) {
  let readIds
  try {
    readIds = new Set(JSON.parse(localStorage.getItem('checkmates_read_notifs') || '[]'))
  } catch {
    readIds = new Set()
  }

  let count = 0
  rows.forEach((row) => {
    if (row.status === 'selesai') return

    const left = daysLeft(row.deadline_at)
    const score = Number(row.total_priority_score || 0)
    let id = null

    if (left !== null && left < 0) id = `overdue-${row.id}`
    else if (left !== null && left <= 1) id = `urgent-${row.id}`
    else if (left !== null && left <= 3) id = `soon-${row.id}`
    else if (score > 74) id = `priority-${row.id}`

    if (id && !readIds.has(id)) count++
  })

  return count
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [rows, setRows] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user

      if (!user) {
        navigate('/login')
        return
      }

      if (alive) setUserEmail(user.email || '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (alive && profileData?.username) setUserName(profileData.username)

      const { data } = await supabase
        .from('view_priority_tasks')
        .select('id, status, deadline_at, total_priority_score')
        .eq('user_id', user.id)

      if (alive) setRows(data || [])
    }

    load()

    return () => {
      alive = false
    }
  }, [navigate])

  const unreadCount = useMemo(() => countUnread(rows), [rows])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: ChessKing, end: true },
    { to: '/dashboard/input', label: 'Input Kegiatan', icon: ChessPawn },
    { to: '/dashboard/semua', label: 'Semua Kegiatan', icon: ChessRook },
    { to: '/dashboard/notifikasi', label: 'Notifikasi', icon: ChessKnight, badge: unreadCount },
    { to: '/dashboard/analitik', label: 'Dashboard Analitik', icon: ChessQueen },
  ]

  return (
    <div className="app-shell">
      <BackgroundEffects />

      {!isMobileMenuOpen && (
        <button
          className="sidebar-float-toggle"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Buka menu"
          type="button"
        >
          <Menu size={22} />
        </button>
      )}

      {isMobileMenuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Tutup menu"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar glass-card ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand-mini">
            <img src={mascot} alt="CheckMates Mascot" />
            <div>
              <strong>CheckMates</strong>
              <small>Priority System</small>
            </div>
          </div>
        </div>

        <div className="user-pill">
          <div className="avatar-small">
            <CalendarCheck size={18} />
          </div>
          <div>
            <strong>{userName || 'User'}</strong>
            <small>{userEmail}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>
                <Icon />
                {label}
              </span>
              {badge > 0 && <b>{badge > 9 ? '9+' : badge}</b>}
            </NavLink>
          ))}
        </nav>

        <button className="logout-button" onClick={handleLogout} type="button">
          <LogOut size={19} /> Keluar
        </button>
      </aside>

      <div className="app-content">
        <header className="topbar glass-card">
          <div className="topbar-left">
            <div>
              <p className="topbar-title">CheckMates</p>
              <p className="topbar-greeting">Selamat datang kembali, {userName}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <NavLink to="/dashboard/notifikasi" className="bell-link" aria-label="Buka notifikasi">
              <Bell size={21} />
              {unreadCount > 0 && (
                <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </NavLink>

            <div className="user-pill">
              <div>
                <strong>{userName}</strong>
                <small>{userEmail}</small>
              </div>
              <div className="avatar-small">
                {String(userName || 'U').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}