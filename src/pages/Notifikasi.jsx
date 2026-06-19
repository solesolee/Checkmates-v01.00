import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  CheckCheck,
  Circle,
  Clock,
  PartyPopper,
  Siren,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react'
import { daysLeft, timeAgo } from '../utils/dateHelpers'
import { getPriorityClass, NOTIF_HIGH_PRIORITY, NOTIF_VERY_HIGH_PRIORITY } from '../utils/priorityHelpers'

function generateNotifications(rows) {
  const notifs = []

  rows.forEach((row) => {
    const left  = daysLeft(row.deadline_at)
    const score = Number(row.total_priority_score || 0)
    const pc    = getPriorityClass(score, { veryHigh: NOTIF_VERY_HIGH_PRIORITY, high: NOTIF_HIGH_PRIORITY, medium: 0 })
    const title = row.judul

    if (row.status === 'selesai') return

    if (left !== null && left < 0) {
      notifs.push({
        id:       `overdue-${row.id}`,
        type:     'overdue',
        title:    'Kegiatan Terlambat',
        message:  `"${title}" sudah melewati deadline ${Math.abs(left)} hari yang lalu.`,
        tag:      'TERLAMBAT',
        icon:     <Clock size={18} />,
        date:     row.deadline_at,
        isNew:    Math.abs(left) <= 1,
      })
      return
    }

    if (left !== null && left <= 1) {
      notifs.push({
        id:       `urgent-${row.id}`,
        type:     'urgent',
        title:    'Deadline Hari Ini!',
        message:  `"${title}" harus diselesaikan hari ini. Prioritas: ${pc}.`,
        tag:      'MENDESAK',
        icon:     <Siren size={18} />,
        date:     row.deadline_at,
        isNew:    true,
      })
      return
    }

    if (left !== null && left <= 3) {
      notifs.push({
        id:       `soon-${row.id}`,
        type:     'soon',
        title:    'Deadline Mendekat',
        message:  `"${title}" akan jatuh tempo dalam ${left} hari.`,
        tag:      'SEGERA',
        icon:     <TriangleAlert size={18} />,
        date:     row.deadline_at,
        isNew:    false,
      })
      return
    }

    if (score > 74) {
      notifs.push({
        id:       `priority-${row.id}`,
        type:     'priority',
        title:    'Kegiatan Sangat Prioritas',
        message:  `"${title}" memiliki skor prioritas tinggi (${score}). Sisa ${left} hari.`,
        tag:      'PRIORITAS',
        icon:     <Circle size={18} className="fill-current" />,
        date:     row.created_at,
        isNew:    false,
      })
    }
  })

  return notifs.sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1
    return new Date(a.date) - new Date(b.date)
  })
}

function NotifCard({ notif, isRead, onRead }) {
  const badgeKey = notif.type === 'overdue' ? 'terlambat' : notif.type === 'urgent' ? 'sangat-tinggi' : notif.type === 'soon' ? 'tinggi' : 'sedang'
  return (
    <article
      onClick={() => onRead(notif.id)}
      className={`notification-card glass-card ${notif.type} ${isRead ? 'read' : 'unread'}`}
    >
      <button type="button" className="notification-main">
        <div className="notification-piece">{notif.icon}</div>
        <div>
          <h3>
            {notif.title}
            {notif.isNew && !isRead && <span className="chip-new">BARU</span>}
          </h3>
          <p>{notif.message}</p>
          <span>{timeAgo(notif.date)}</span>
        </div>
      </button>

      <div className="item-side">
        <span className={`priority-badge priority-${badgeKey}`}>{notif.tag}</span>
        {!isRead && <span className="unread-dot" />}
      </div>
    </article>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} type="button" className={`filter-chip ${active ? 'active' : ''}`}>
      {label}
    </button>
  )
}

const FILTERS = [
  { key: 'semua',    label: 'Semua'     },
  { key: 'urgent',   label: 'Mendesak'  },
  { key: 'soon',     label: 'Segera'    },
  { key: 'overdue',  label: 'Terlambat' },
  { key: 'priority', label: 'Prioritas' },
]

export default function Notifikasi() {
  const [rows, setRows]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')
  const [showFilter, setShowFilter]     = useState(false)
  const [readIds, setReadIds]           = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('checkmates_read_notifs') || '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const { data, error } = await supabase
        .from('view_priority_tasks')
        .select('*')
        .eq('user_id', user.id)

      if (!alive) return
      if (error) { setError(error.message); setRows([]) }
      else setRows(data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const notifications = useMemo(() => generateNotifications(rows), [rows])

  const filtered = useMemo(() => {
    if (activeFilter === 'semua') return notifications
    return notifications.filter(n => n.type === activeFilter)
  }, [notifications, activeFilter])

  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.has(n.id)).length,
    [notifications, readIds]
  )

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('checkmates_read_notifs', JSON.stringify([...next]))
      return next
    })
  }

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(new Set(allIds))
    localStorage.setItem('checkmates_read_notifs', JSON.stringify(allIds))
  }

  const todayNotifs  = filtered.filter(n => n.isNew)
  const olderNotifs  = filtered.filter(n => !n.isNew)

  return (
    <section className="page-transition">
      <div className="page-header">
        <div>
          <span className="eyebrow">♖ Alert Center</span>
          <h1>Notifikasi Anda</h1>
          <p>Kelola informasi penting, deadline mendesak, dan kegiatan prioritas.</p>
        </div>

        <div className="hero-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} type="button" className="primary-button">
              <CheckCheck size={16} /> Tandai Semua Dibaca
            </button>
          )}
          <button onClick={() => setShowFilter(f => !f)} type="button" className="ghost-button">
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="filter-chip-group">
          {FILTERS.map(f => (
            <FilterChip key={f.key} label={f.label} active={activeFilter === f.key} onClick={() => setActiveFilter(f.key)} />
          ))}
        </div>
      )}

      {unreadCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontWeight: 850, color: 'var(--green-dark)' }}>
          <span className="unread-dot" />
          <span>{unreadCount} notifikasi belum dibaca</span>
        </div>
      )}

      {loading && <div className="state-card glass-card">Memuat notifikasi...</div>}
      {!loading && error && <div className="error-card glass-card">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="state-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, opacity: .6 }}>
            <PartyPopper size={42} />
          </div>
          <strong>Tidak ada notifikasi</strong>
          <p style={{ margin: '6px 0 0' }}>Semua kegiatan dalam kondisi baik</p>
        </div>
      )}

      {!loading && !error && todayNotifs.length > 0 && (
        <div className="section-gap">
          <span className="eyebrow">Hari Ini</span>
          <div className="stack" style={{ marginTop: 12 }}>
            {todayNotifs.map(n => <NotifCard key={n.id} notif={n} isRead={readIds.has(n.id)} onRead={markRead} />)}
          </div>
        </div>
      )}

      {!loading && !error && olderNotifs.length > 0 && (
        <div className="section-gap">
          <span className="eyebrow">Sebelumnya</span>
          <div className="stack" style={{ marginTop: 12 }}>
            {olderNotifs.map(n => <NotifCard key={n.id} notif={n} isRead={readIds.has(n.id)} onRead={markRead} />)}
          </div>
        </div>
      )}
    </section>
  )
}
