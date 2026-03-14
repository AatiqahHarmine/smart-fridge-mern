import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password })
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 32 32" fill="none"><rect x="4" y="2" width="24" height="28" rx="4" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/><rect x="4" y="2" width="24" height="11" rx="4" fill="white" fillOpacity="0.25"/><line x1="14" y1="18" x2="14" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <span className={styles.brandName}>SmartFridge</span>
        </div>
        <div className={styles.heroText}>
          <h1>Start reducing food waste today.</h1>
          <p>Connect your ESP32-powered smart fridge and let AI monitor everything for you.</p>
        </div>
        <div className={styles.features}>
          {['Free to get started','Works with any ESP32 fridge kit','Instant expiry notifications','MERN stack — open source'].map(f => (
            <div key={f} className={styles.feature}>
              <div className={styles.featureDot} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Create account</h2>
            <p>Set up your smart fridge dashboard</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full name</label>
              <input name="name" type="text" placeholder="Nicholas Sun" value={form.name} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Confirm password</label>
              <input name="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handleChange} required />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className="spinner" style={{width:18,height:18,borderTopColor:'white'}} /> : 'Create account'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
