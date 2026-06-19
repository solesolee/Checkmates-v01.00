import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, UserPlus, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BackgroundEffects from '../components/BackgroundEffects'
import mascot from '../assets/horse-mascot.svg'

export default function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message, type = 'info') => setToast({ message, type })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showToast('Konfirmasi password tidak sama', 'error')
      return
    }

    try {
      setLoading(true)
      const fakeEmail = `${formData.username}@checkmates.local`
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: formData.password
      })

      if (error) { showToast(error.message, 'error'); return }

      const user = data.user
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, username: formData.username })

        if (profileError) {
          console.error(profileError)
          showToast('Profile gagal dibuat', 'error')
          return
        }
      }

      showToast('Register berhasil', 'success')
      setTimeout(() => navigate('/login'), 2000)
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
            <h1>Start Prioritizing.</h1>
            <p>
              Buat akun baru dengan UI bergaya CheckMates tanpa mengubah sistem login
              username lokal CheckMates yang sudah ada.
            </p>
          </div>

          <div className="auth-preview">
            <img src={mascot} alt="Mascot" />
          </div>
        </section>

        <section className="auth-card glass-card">
          <span className="eyebrow"><UserPlus size={16} /> Buat Akun</span>
          <h2>Daftar Akun</h2>
          <p>Isi data akun untuk mulai memakai dashboard prioritas kegiatan.</p>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="primary-button full" disabled={loading}>
              {loading ? 'Loading...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="auth-switch">
            Sudah punya akun? <Link to="/login">Masuk di sini</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
