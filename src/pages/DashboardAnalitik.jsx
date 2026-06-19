// ===== IMPORT STATEMENTS =====
// React hooks untuk state management (useState, useEffect) dan optimization (useMemo)
import { useEffect, useMemo, useState } from 'react'

// Supabase client untuk akses database dan autentikasi
import { supabase } from '../lib/supabase'

// Recharts components untuk membuat berbagai jenis chart (Bar, Pie, Line)
// - BarChart, Bar: Chart batang untuk kegiatan per bulan
// - PieChart, Pie: Chart pie untuk distribusi prioritas
// - LineChart, Line: Chart garis untuk tren kinerja
// - ResponsiveContainer: Container yang responsive terhadap ukuran layar
// - Tooltip, Legend, Cell: Komponen utility untuk customization chart
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'

// Import helper functions
import { getPriorityClass } from '../utils/priorityHelpers'

// ===== CONSTANTS =====

/**
 * KONSTANTA: Nama-nama bulan dalam bahasa Indonesia
 * DIGUNAKAN: Sebagai label X-axis di bar chart dan line chart
 * FORMAT: Singkatan 3 huruf (Jan, Feb, Mar, dll)
 */
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/**
 * KONSTANTA: Konfigurasi warna untuk Pie Chart (distribusi prioritas)
 * DIGUNAKAN: Mapping antara label prioritas dan warna hex
 * WARNA:
 * - Sangat Tinggi: Merah (#ef4444) - urgent/danger
 * - Tinggi: Orange (#f59e0b) - warning
 * - Sedang: Hijau (#10b981) - normal
 * - Rendah: Biru (#3b82f6) - info
 */
const PIE_CONFIG = [
  { label: 'Sangat Tinggi', color: '#e95b5b' },
  { label: 'Tinggi',        color: '#f2c94c' },
  { label: 'Sedang',        color: '#69923e' },
  { label: 'Rendah',        color: '#4f8ddf' },
]

// ===== HELPER FUNCTIONS =====

/**
 * FUNGSI: Format number menjadi string dengan decimal places tertentu
 * DIGUNAKAN: Menampilkan angka statistik (mean, median, variance, dll) dengan format rapi
 * INPUT: n (number) - nilai yang akan diformat, dec (number, default 2) - jumlah desimal
 * RETURN: String number dengan format "1.23" atau "4.56"
 * CONTOH: fmt(3.14159, 2) → "3.14"
 */
function fmt(n, dec = 2) {
  return Number(n ?? 0).toFixed(dec)
}

// ===== CUSTOM COMPONENTS =====

/**
 * COMPONENT: ChartTooltip (Custom tooltip untuk semua chart)
 * FUNGSI: Menampilkan informasi detail saat hover mouse di atas chart
 * DIGUNAKAN: Sebagai content prop di Tooltip component Recharts
 * PROPS:
 * - active (bool): Apakah tooltip sedang ditampilkan
 * - payload (array): Data point yang dihover
 * - label (string): Label dari data (misal: nama bulan)
 * TAMPILAN: Box putih dengan border, menampilkan label + nilai dengan warna
 */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p style={{ fontWeight: 900, color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 800 }}>
          {p.name}: <span style={{ fontWeight: 1000 }}>{typeof p.value === 'number' ? fmt(p.value, 1) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * COMPONENT: Card (Wrapper reusable untuk semua kartu)
 * FUNGSI: Container dasar untuk semua kartu di dashboard (chart, summary, stats)
 * DIGUNAKAN: Wrapping bar chart, pie chart, line chart, summary cards
 * PROPS:
 * - children: JSX content di dalam card
 * - className: CSS class tambahan untuk customization (padding, margin, dll)
 * STYLING: Background putih, border abu, rounded corner, shadow tipis
 */
function Card({ children, className = '' }) {
  return (
    <div className={`analytics-card glass-card ${className}`}>
      {children}
    </div>
  )
}

/**
 * COMPONENT: SummaryCard (Kartu statistik ringkas untuk 4 metrik utama)
 * FUNGSI: Menampilkan satu statistik besar dengan label dan sub-text
 * DIGUNAKAN: Di bagian "Summary Cards" untuk Total, Mean, Max, Min
 * PROPS:
 * - label (string): Judul statistik ("Total Kegiatan", "Rata-rata Skor", dll)
 * - value: Nilai yang ditampilkan besar (number atau string)
 * - accent (string): CSS class warna text (default: 'text-blue-950')
 * - sub (string): Teks kecil di bawah (deskripsi)
 * LAYOUT: Label kecil di atas, value besar di tengah, sub text kecil di bawah
 */
function SummaryCard({ label, value, accent = '', sub }) {
  return (
    <Card>
      <p style={{ color: 'var(--muted)', fontWeight: 800, marginBottom: 10 }}>{label}</p>
      <p className={`summary-value ${accent}`}>{value}</p>
      {sub && <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 8 }}>{sub}</p>}
    </Card>
  )
}

/**
 * COMPONENT: StatDetailCard (Kartu statistik detail dengan info icon tooltip)
 * FUNGSI: Menampilkan satu metrik statistik dengan penjelasan interaktif
 * DIGUNAKAN: Di bagian "Statistik Analitik" untuk Mean, Median, Modus, Variance, Std Dev, Range
 * PROPS:
 * - label (string): Nama statistik singkat ("Mean", "Median", dll)
 * - value: Nilai numerik yang ditampilkan besar
 * - explanation (string): Penjelasan panjang yang muncul saat hover info icon
 * - accent (string): CSS class warna text (default: 'text-blue-950')
 * FITUR:
 * - Info icon (?) yang hover menampilkan tooltip penjelasan
 * - Tooltip ditempatkan di atas icon dengan background biru
 * - Explanation juga ditampilkan tetap di bawah value
 */
function StatDetailCard({ label, value, explanation, accent = '' }) {
  const [tip, setTip] = useState(false)
  return (
    <Card className="stat-detail">
      <div className="stat-detail-label">
        <p>{label}</p>
        <button
          type="button"
          onMouseEnter={() => setTip(true)}
          onMouseLeave={() => setTip(false)}
          className="info-button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </button>
        {tip && <div className="tooltip-note">{explanation}</div>}
      </div>
      <p className={`summary-value ${accent}`}>{fmt(value)}</p>
      <p className="stat-detail-note">{explanation}</p>
    </Card>
  )
}

/**
 * COMPONENT: Skeleton (Loading placeholder dengan animation)
 * FUNGSI: Menampilkan skeleton screen saat data sedang dimuat dari database
 * DIGUNAKAN: Di guard loading di main component
 * LAYOUT:
 * - Header placeholder (garis panjang)
 * - 4 summary card placeholders
 * - 3 chart placeholders
 * STYLING: Background abu dengan animation pulse (kedip-kedip)
 */
function Skeleton() {
  return (
    <section className="page-transition">
      <div className="state-card glass-card">Memuat dashboard analitik...</div>
    </section>
  )
}

// ===== MAIN COMPONENT =====

/**
 * HALAMAN: Dashboard Analitik
 * FUNGSI: Menampilkan analisis mendalam tentang kinerja dan statistik kegiatan user
 * KONTEN:
 * 1. 4 Summary Cards: Total Kegiatan, Mean, Max, Min
 * 2. Bar Chart: Kegiatan per bulan (Selesai vs Menunggu)
 * 3. Pie Chart: Distribusi prioritas kegiatan
 * 4. Line Chart: Tren kinerja sepanjang bulan
 * 5. 6 Statistik Detail: Mean, Median, Modus, Variance, Std Dev, Range
 * 
 * DATA SOURCE:
 * - rows: Raw task data dari view_priority_tasks (untuk chart data)
 * - stats: Statistik komputasi dari PostgreSQL RPC get_user_task_stats
 */
export default function DashboardAnalitik() {
  // ===== STATE VARIABLES =====
  
  // STATE 1: rows - Daftar kegiatan lengkap dari database
  // DIGUNAKAN: Sebagai source data untuk bar chart, pie chart, line chart
  const [rows, setRows]       = useState([])
  
  // STATE 2: stats - Hasil statistik dari PostgreSQL RPC 
  // DIGUNAKAN: Untuk 4 Summary Cards dan 6 Statistik Detail
  const [stats, setStats]     = useState(null)
  
  // STATE 3: loading - Menunjukkan apakah data sedang dimuat
  // DIGUNAKAN: Untuk menampilkan skeleton loading state
  const [loading, setLoading] = useState(true)
  
  // STATE 4: error - Pesan error jika fetch data gagal
  // DIGUNAKAN: Untuk menampilkan error message kepada user
  const [error, setError]     = useState('')

  // ===== EFFECT: FETCH DATA DARI SUPABASE =====
  /**
   * EFFECT: useEffect untuk mengambil data kegiatan dan statistik saat component mount
   * KAPAN DIJALANKAN: Hanya sekali saat component mount (dependency array kosong)
   * 
   * LANGKAH-LANGKAH:
   * 1. Ambil user yang sedang login dari Supabase auth
   * 2. Jalankan 2 request paralel (Promise.all):
   *    - Request A: Ambil raw task data dari view_priority_tasks
   *    - Request B: Jalankan RPC get_user_task_stats untuk statistik
   * 3. Handle error dari masing-masing request
   * 4. Simpan hasil ke state (rows dan stats)
   * 5. Set loading = false
   * 
   * CLEANUP: Flag 'alive' untuk membatalkan update state jika component unmount
   */
  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError('')

      // STEP 1: Cek user authentication
      // Jika tidak ada user (belum login), stop fetch dan tampilkan empty
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user) {
        if (alive) setLoading(false)
        return
      }

      // STEP 2: Jalankan 2 request paralel (Promise.all)
      // Ini lebih efisien daripada sequential requests
      const [tasksResult, statsResult] = await Promise.all([
        // REQUEST A: Ambil raw task data dari database
        // Digunakan untuk: Bar Chart, Pie Chart, Line Chart
        supabase
          .from('view_priority_tasks')
          .select('*')
          .eq('user_id', user.id),

        // REQUEST B: Jalankan PostgreSQL RPC function untuk statistik
        // Function calculate: Mean, Median, Modus, Variance, Std Dev, Range, Min, Max
        // Jauh lebih efisien daripada menghitung di JavaScript frontend
        supabase.rpc('get_user_task_stats', { authenticated_user_id: user.id }),
      ])

      if (!alive) return

      // STEP 3: Handle error dari Request A
      if (tasksResult.error) {
        setError(tasksResult.error.message)
        setLoading(false)
        return
      }
      
      // STEP 3b: Handle error dari Request B
      if (statsResult.error) {
        setError(statsResult.error.message)
        setLoading(false)
        return
      }

      // STEP 4: Simpan hasil ke state
      // rows = array kegiatan untuk chart
      setRows(tasksResult.data || [])

      // stats = object statistik dari RPC (ambil elemen pertama array)
      // Jika kosong, set ke null agar guard menampilkan empty state
      setStats(statsResult.data?.[0] ?? null)

      setLoading(false)
    }

    load()
    return () => { alive = false }
  }, [])

  // ===== DERIVED DATA: CHART DATA =====
  /**
   * DATA TRANSFORM: useMemo untuk menghitung data yang ditampilkan di bar chart
   * DIGUNAKAN: Sebagai data prop di BarChart component
   * SOURCE: rows (raw task data)
   * CARA KERJA:
   * - Iterasi semua kegiatan, kelompokkan berdasarkan bulan
   * - Untuk setiap bulan, hitung 2 metric: Selesai dan Menunggu
   * - Urutkan hasil berdasarkan urutan bulan (Jan, Feb, dll)
   * RETURN: Array object dengan struktur { bulan: 'Jan', Selesai: 5, Menunggu: 3 }
   */
  // Bar chart: kegiatan per bulan (selesai vs menunggu)
  const barData = useMemo(() => {
    const map = {}
    rows.forEach(r => {
      const d = new Date(r.created_at)
      if (isNaN(d)) return
      const key = d.getMonth()
      if (!map[key]) map[key] = { bulan: BULAN[key], Selesai: 0, Menunggu: 0 }
      r.status === 'selesai' ? map[key].Selesai++ : map[key].Menunggu++
    })
    return Object.values(map).sort((a, b) => BULAN.indexOf(a.bulan) - BULAN.indexOf(b.bulan))
  }, [rows])

  /**
   * DATA TRANSFORM: useMemo untuk menghitung data pie chart
   * DIGUNAKAN: Sebagai data prop di PieChart component
   * SOURCE: rows (raw task data)
   * CARA KERJA:
   * - Hitung jumlah kegiatan untuk setiap priority class
   * - Map dengan PIE_CONFIG untuk mendapatkan warna
   * - Filter hanya yang memiliki value > 0 (jangan tampilkan 0)
   * RETURN: Array object dengan struktur { name: 'Sangat Tinggi', value: 5, color: '#ef4444' }
   */
  // Pie chart: distribusi prioritas
  const pieData = useMemo(() => {
    const map = { 'Sangat Tinggi': 0, 'Tinggi': 0, 'Sedang': 0, 'Rendah': 0 }
    rows.forEach(r => { map[getPriorityClass(Number(r.total_priority_score || 0), undefined, true)]++ })
    return PIE_CONFIG
      .map(c => ({ name: c.label, value: map[c.label], color: c.color }))
      .filter(d => d.value > 0)
  }, [rows])

  /**
   * DATA TRANSFORM: useMemo untuk line chart
   * DIGUNAKAN: Sebagai data prop di LineChart component
   * NOTE: Line chart menggunakan data yang sama dengan bar chart (barData)
   * Hanya menampilkan tren kegiatan per bulan dengan line style
   */
  // Line chart: tren kinerja per bulan (sama dengan barData)
  const lineData = useMemo(() => barData, [barData])

  // ===== GUARDS: CONDITIONAL RENDERING =====
  
  // GUARD 1: Loading state
  // Tampil skeleton loading saat data sedang diambil dari database
  if (loading) return <Skeleton />

  // GUARD 2: Error state
  // Tampil pesan error jika ada yang gagal saat fetch data
  if (error) return (
    <section className="page-transition">
      <div className="error-card glass-card">{error}</div>
    </section>
  )

  // GUARD 3: Empty state
  // Tampil pesan jika tidak ada data untuk dianalisis (stats kosong)
  // Ini terjadi jika user belum punya kegiatan sama sekali
  if (!stats) return (
    <section className="page-transition">
      <div className="state-card glass-card">
        <p style={{ fontSize: 42, marginBottom: 10 }}>📊</p>
        <strong>Belum ada data untuk dianalisis</strong>
        <p style={{ margin: '6px 0 0' }}>Tambahkan kegiatan terlebih dahulu</p>
      </div>
    </section>
  )

  // ===== RENDER: MAIN DASHBOARD LAYOUT =====
  /**
   * LAYOUT: Dashboard Analitik memiliki 5 bagian utama:
   * 1. HEADER: Judul dan deskripsi
   * 2. SUMMARY CARDS: 4 kartu statistik ringkas (Total, Mean, Max, Min)
   * 3. CHARTS ROW 1: Bar Chart (Kegiatan per Bulan) + Pie Chart (Distribusi Prioritas)
   * 4. CHARTS ROW 2: Line Chart full-width (Tren Kinerja)
   * 5. STATISTICS DETAIL: 6 statistik detail dengan penjelasan (Mean, Median, dll)
   */

  return (
    <section className="page-transition">

      {/* ===== BAGIAN 1: HEADER ===== */}
      {/* Judul halaman dan deskripsi singkat */}
      <div className="page-header">
        <div>
          <span className="eyebrow">♛ Insight</span>
          <h1>Dashboard Analitik</h1>
          <p>Analisis kinerja dan statistik tugas anda.</p>
        </div>
      </div>

      {/* ===== BAGIAN 2: SUMMARY CARDS ===== */}
      {/* 4 kartu statistik ringkas: Total Kegiatan, Mean, Max, Min */}
      {/* Data diambil dari stats (hasil RPC PostgreSQL) */}
      {/* Layout: 2 kolom di mobile, 4 kolom di desktop */}
      {/* ✅ DIPERBARUI: semua value kini dari `stats` hasil RPC, bukan calcStats() */}
      <div className="grid-analytics">
        <SummaryCard
          label="Total Kegiatan"
          value={stats.total_tasks}
          accent="analytics-accent-primary"
          sub="Semua kegiatan tercatat"
        />
        <SummaryCard
          label="Rata-rata Skor"
          value={fmt(stats.mean, 1)}
          accent="analytics-accent-primary"
          sub="Mean produktivitas"
        />
        <SummaryCard
          label="Skor Tertinggi"
          value={fmt(stats.max_val, 1)}
          accent="analytics-accent-green"
          sub="Performa puncak"
        />
        <SummaryCard
          label="Skor Terendah"
          value={fmt(stats.min_val, 1)}
          accent="analytics-accent-yellow"
          sub="Performa minimum"
        />
      </div>

      {/* ===== BAGIAN 3: CHARTS ROW 1 (BAR + PIE) ===== */}
      {/* Dua chart side-by-side: Bar Chart dan Pie Chart */}
      {/* Layout: 1 kolom di mobile/tablet, 2 kolom di desktop */}
      {/* ── Row 1: Bar + Pie ── */}
      <div className="grid-two section-gap">

        {/* BAR CHART: Kegiatan Per Bulan */}
        {/* Menampilkan dua bar untuk setiap bulan: Selesai (biru tua) dan Menunggu (orange) */}
        {/* Data dari barData (computed dari rows) */}
        {/* Bar chart */}
        <Card>
          <h2 >Kegiatan Per Bulan</h2>
          {barData.length === 0 ? (
            <div className="chart-empty">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barSize={22} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
                <Bar dataKey="Selesai"  fill="#69923e" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Menunggu" fill="#f2c94c" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* PIE CHART: Distribusi Prioritas */}
        {/* Menampilkan persentase kegiatan per kategori prioritas */}
        {/* Warna: Merah (Sangat Tinggi), Orange (Tinggi), Hijau (Sedang), Biru (Rendah) */}
        {/* Data dari pieData (computed dari rows) */}
        {/* Pie chart */}
        <Card>
          <h2 >Distribusi Prioritas</h2>
          {pieData.length === 0 ? (
            <div className="chart-empty">Belum ada data</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom legend */}
              <div className="flex flex-col gap-4 flex-1">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                    <div>
                      <p className="analytics-legend-label">{d.name}</p>
                      <p className="analytics-legend-value">{d.value} tugas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ===== BAGIAN 4: CHARTS ROW 2 (LINE CHART) ===== */}
      {/* Chart garis untuk menampilkan tren kinerja sepanjang waktu */}
      {/* Dua line: Selesai (biru tua solid) dan Menunggu (orange dashed) */}
      {/* Data dari lineData (same as barData) */}
      {/* ── Row 2: Line chart full width ── */}
      <Card className="section-gap">
        <h2 >Tren Kinerja</h2>
        {lineData.length === 0 ? (
          <div className="chart-empty">Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
              <Line
                type="monotone" dataKey="Selesai" name="Selesai"
                stroke="#69923e" strokeWidth={2.5}
                dot={{ r: 5, fill: '#69923e', strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone" dataKey="Menunggu" name="Menunggu"
                stroke="#f2c94c" strokeWidth={2.5}
                dot={{ r: 5, fill: '#f2c94c', strokeWidth: 0 }}
                activeDot={{ r: 7 }}
                strokeDasharray="5 4"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ===== BAGIAN 5: STATISTIK ANALITIK DETAIL ===== */}
      {/* 6 kartu statistik dengan penjelasan interaktif */}
      {/* Semua data dari stats (hasil RPC PostgreSQL) */}
      {/* Setiap kartu memiliki info icon (?) dengan tooltip penjelasan */}
      {/* ── Statistik Analitik ── */}
      <div>
        <div className="page-header section-gap">
          <div>
            <span className="eyebrow">Statistik</span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Statistik Analitik</h1>
            <p>Ukuran tendensi pusat dan sebaran data skor kegiatan.</p>
          </div>
        </div>

        {/* ✅ DIPERBARUI: semua value dari `stats` hasil RPC */}
        {/* STATISTIK YANG DITAMPILKAN: */}
        {/* - Mean: Rata-rata skor (ukuran tendensi pusat) */}
        {/* - Median: Nilai tengah (ukuran tendensi pusat) */}
        {/* - Modus: Nilai paling sering muncul (ukuran tendensi pusat) */}
        {/* - Variance: Ukuran penyebaran (variabilitas data) */}
        {/* - Std Dev: Standar deviasi (penyebaran dalam satuan original) */}
        {/* - Range: Rentang (selisih min-max) */}
        <div className="grid-six">
          <StatDetailCard
            label="Mean"
            value={stats.mean}
            accent="analytics-accent-primary"
            explanation="Rata-rata dari seluruh skor kegiatan"
          />
          <StatDetailCard
            label="Median"
            value={stats.median}
            accent="analytics-accent-primary"
            explanation="Nilai tengah setelah data diurutkan"
          />
          <StatDetailCard
            label="Modus"
            value={stats.modus}
            accent="analytics-accent-primary"
            explanation="Nilai yang paling sering muncul"
          />
          <StatDetailCard
            label="Variance"
            value={stats.variance}
            accent="analytics-accent-yellow"
            explanation="Ukuran penyebaran data dari nilai rata-rata"
          />
          <StatDetailCard
            label="Std Dev"
            value={stats.std_dev}
            accent="analytics-accent-yellow"
            explanation="Akar kuadrat variance — makin kecil makin konsisten"
          />
          <StatDetailCard
            label="Range"
            value={stats.range_val}
            accent="analytics-accent-muted"
            explanation="Selisih antara skor tertinggi dan terendah"
          />
        </div>
      </div>

    </section>
  )
}
