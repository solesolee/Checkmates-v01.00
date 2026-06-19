import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Search, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TaskCard from '../components/TaskCard'
import { getPriorityClass } from '../utils/priorityHelpers'
import { getCategory } from '../utils/taskHelpers'

function TabButton({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} type="button" className={`tab-button ${active ? 'active' : ''}`}>
      {label}
      {count !== undefined && <b>{count}</b>}
    </button>
  )
}

const TABS = ['semua', 'dalam_proses', 'terlambat', 'selesai']

const TAB_LABELS = {
  semua:        'Semua',
  dalam_proses: 'Dalam Proses',
  terlambat:    'Terlambat',
  selesai:      'Selesai',
}

const PRIORITY_OPTIONS = ['Semua Prioritas', 'SANGAT TINGGI', 'TINGGI', 'SEDANG', 'RENDAH']

export default function SemualKegiatan() {
  const navigate = useNavigate()

  const [loading, setLoading]               = useState(true)
  const [rows, setRows]                     = useState([])
  const [error, setError]                   = useState('')
  const [activeTab, setActiveTab]           = useState('semua')
  const [search, setSearch]                 = useState('')
  const [priorityFilter, setPriorityFilter] = useState('Semua Prioritas')

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const { data, error } = await supabase
        .from('view_priority_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('total_priority_score', { ascending: false, nullsFirst: false })

      if (!alive) return
      if (error) { setError(error.message || 'Gagal mengambil data'); setRows([]) }
      else setRows(data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const counts = useMemo(() => {
    const result = { semua: 0, dalam_proses: 0, terlambat: 0, selesai: 0 }
    rows.forEach((row) => {
      const cat = getCategory(row)
      result[cat] = (result[cat] || 0) + 1
      if (cat === 'dalam_proses') result.semua += 1
    })
    return result
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const cat = getCategory(row)
      if (activeTab === 'semua' && cat !== 'dalam_proses') return false
      if (activeTab !== 'semua' && cat !== activeTab) return false
      if (search.trim() && !String(row.judul || '').toLowerCase().includes(search.toLowerCase())) return false
      if (priorityFilter !== 'Semua Prioritas' && getPriorityClass(Number(row.total_priority_score || 0)) !== priorityFilter) return false
      return true
    })
  }, [rows, activeTab, search, priorityFilter])

  return (
    <section className="page-transition">
      <div className="page-header">
        <div>
          <span className="eyebrow">♘ Data kegiatan</span>
          <h1>Semua Kegiatan</h1>
          <p>Kelola dan pantau semua kegiatan tugas anda.</p>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-wrap">
          <Search size={17} />
          <input
            type="text"
            placeholder="Cari kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="select-wrap">
          <SlidersHorizontal size={16} />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            {PRIORITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="tab-group">
        {TABS.map((tab) => (
          <TabButton key={tab} label={TAB_LABELS[tab]} count={counts[tab]} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      <div className="stack">
        {loading && <div className="state-card glass-card">Memuat data kegiatan...</div>}
        {!loading && error && <div className="error-card glass-card">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="state-card glass-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, opacity: .5 }}>
              <Inbox size={42} strokeWidth={1.5} />
            </div>
            <strong>Tidak ada kegiatan ditemukan</strong>
            <p style={{ margin: '6px 0 0' }}>Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
        {!loading && !error && filtered.map((row) => (
          <TaskCard key={row.id} row={row} mode="kegiatan" onClick={() => navigate(`/dashboard/detail/${row.id}`)} />
        ))}
      </div>
    </section>
  )
}
