import { Link, useNavigate } from 'react-router-dom'
import mascot from '../assets/horse-mascot.svg'

const features = [
  {
    icon: '♙',
    title: 'Deadline jadi value',
    text: 'Sisa hari otomatis dihitung menjadi nilai prioritas agar kamu tahu mana yang harus dikerjakan dulu.',
  },
  {
    icon: '♘',
    title: 'Notifikasi prioritas',
    text: 'CheckMates memberi peringatan saat kegiatan masuk prioritas tinggi, sangat tinggi, atau terlambat.',
  },
  {
    icon: '♖',
    title: 'Dashboard terarah',
    text: 'Pantau total kegiatan, status terlambat, dan daftar kegiatan berdasarkan urutan prioritas.',
  },
  {
    icon: '♕',
    title: 'Glassy chess UI',
    text: 'Tampilan modern bertema catur dengan nuansa glassy, clean, dan responsive untuk mobile.',
  },
]

const steps = [
  ['♙', 'Input kegiatan', 'Masukkan nama kegiatan, deadline, status, dan variabel prioritas.'],
  ['♘', 'Hitung otomatis', 'Sistem menghitung skor prioritas berdasarkan data yang sudah kamu isi.'],
  ['♖', 'Urutkan prioritas', 'Kegiatan ditampilkan dengan badge Rendah, Sedang, Tinggi, atau Sangat Tinggi.'],
  ['♔', 'Selesaikan tugas', 'Kerjakan kegiatan paling penting lebih dulu sebelum deadline datang.'],
]

export default function Onboarding() {
  const navigate = useNavigate()

  const goToLogin = () => {
    navigate('/login')
  }

  return (
    <main className="onboarding-page page-transition">
      <header className="landing-nav glass-card">
        <Link className="landing-brand" to="/">
          <img src={mascot} alt="CheckMates mascot" />
          <div>
            <strong>CheckMates</strong>
            <small>Priority System</small>
          </div>
        </Link>

        <div className="landing-actions">
          <Link className="ghost-button" to="/register">Daftar</Link>
          <button className="primary-button" type="button" onClick={goToLogin}>
            Get Started <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <span className="hero-kicker">♘ Priority Notification System</span>
          <h1>Atur kegiatan dengan strategi ala catur.</h1>
          <p>
            CheckMates membantu kamu memilih langkah terbaik: kegiatan mana yang harus dikerjakan dulu,
            mana yang mulai mendesak, dan deadline mana yang perlu diprioritaskan.
          </p>

          <div className="hero-actions">
            <button className="primary-button large" type="button" onClick={goToLogin}>
              Mulai Sekarang <span aria-hidden="true">→</span>
            </button>
            <a className="ghost-button large" href="#fitur">Lihat Fitur</a>
          </div>
        </div>

        <div className="hero-card glass-card">
          <div className="hero-board">
            <img src={mascot} alt="Mascot kuda CheckMates" />
            <div className="floating-badge badge-red">Sangat Tinggi 92</div>
            <div className="floating-badge badge-yellow">Tinggi 81</div>
            <div className="floating-badge badge-green">Sedang 66</div>
          </div>
        </div>
      </section>

      <section id="fitur" className="section-block">
        <div className="section-heading">
          <span className="eyebrow">Kenapa CheckMates?</span>
          <h2>Bukan cuma daftar kegiatan, tapi papan strategi deadline.</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card glass-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block split-section">
        <div className="glass-card explain-card">
          <span className="eyebrow">Cara kerja</span>
          <h2>Masukkan data, lalu biarkan sistem menyusun prioritas.</h2>
          <p>
            CheckMates tetap memakai logic Supabase dan sistem prioritas yang sudah ada di project kamu.
            Onboarding ini hanya menjadi halaman pembuka sebelum user masuk ke login.
          </p>
          <div className="mini-scale">
            <span className="scale-red">Sangat Tinggi</span>
            <span className="scale-yellow">Tinggi</span>
            <span className="scale-green">Sedang</span>
            <span className="scale-blue">Rendah</span>
          </div>
        </div>

        <div className="steps-stack">
          {steps.map(([piece, title, text]) => (
            <div className="step-card glass-card" key={title}>
              <b>{piece}</b>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section glass-card">
        <div>
          <span className="eyebrow">Ready to move?</span>
          <h2>Mulai atur prioritas sebelum deadline melakukan checkmate.</h2>
          <p>Login, tambahkan kegiatan, lalu biarkan CheckMates membantu mengurutkan prioritasmu.</p>
        </div>
        <button className="primary-button large" type="button" onClick={goToLogin}>
          Get Started <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  )
}
