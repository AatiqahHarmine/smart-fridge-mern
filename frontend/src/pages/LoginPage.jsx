import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
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
          <h1>Keep your food fresh, always.</h1>
          <p>IoT-powered monitoring with AI-driven spoilage alerts. Built on ESP32, MQTT, and MongoDB.</p>
        </div>
        <div className={styles.features}>
          {['Real-time sensor monitoring','AI-powered expiry prediction','Smart inventory tracking','Instant spoilage alerts'].map(f => (
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
            <h2>Welcome back</h2>
            <p>Sign in to your fridge dashboard</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email" name="email" type="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                placeholder="••••••••"
                value={form.password} onChange={handleChange} required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className="spinner" style={{width:18,height:18,borderTopColor:'white'}} /> : 'Sign in'}
            </button>
          </form>

          <div className={styles.hint}>
            <div className={styles.demoBox}>
              <span className={styles.demoLabel}>Demo credentials</span>
              <code>demo@smartfridge.com / demo1234</code>
            </div>
          </div>

          <p className={styles.switchLink}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
