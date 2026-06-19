import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, LogIn, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BackgroundEffects from '../components/BackgroundEffects'
import mascot from '../assets/horse-mascot.svg'

export default function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message, type = 'info') => setToast({ message, type })

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const fakeEmail = `${username}@checkmates.local`
      const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
      if (error) { showToast('Username atau password salah', 'error'); return }
      showToast('Login berhasil', 'success')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <BackgroundEffects />

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="auth-shell">
        <section className="auth-hero glass-card">
          <div>
            <div className="auth-brand">
              <img src={mascot} alt="CheckMates" />
              <div>
                <strong>CheckMates</strong>
                <small>Priority System</small>
              </div>
            </div>
            <h1>Smart Task Priority.</h1>
            <p>
              Tampilan baru bergaya CheckMates: glassy, minimalis, chess pattern,
              dan tetap memakai logic CheckMates yang sudah terhubung ke Supabase.
            </p>
          </div>

          <div className="auth-preview">
            <img src={mascot} alt="Mascot" />
          </div>
        </section>

        <section className="auth-card glass-card">
          <span className="eyebrow"><LogIn size={16} /> Masuk Akun</span>
          <h2>Login</h2>
          <p>Masuk ke akun CheckMates untuk melihat dashboard prioritas kegiatan.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="primary-button full" disabled={loading}>
              {loading ? 'Loading...' : 'Masuk'}
            </button>
          </form>

          <p className="auth-switch">
            Belum punya akun? <Link to="/register">Daftar di sini</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
