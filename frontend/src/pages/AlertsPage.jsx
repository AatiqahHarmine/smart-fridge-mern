import { useState, useEffect } from 'react'
import api from '../utils/api'
import styles from './AlertsPage.module.css'

const SEV = {
  info:    { bg:'#E6F1FB', color:'#185FA5', label:'Info',    dot:'#378ADD' },
  warning: { bg:'#FAEEDA', color:'#BA7517', label:'Warning', dot:'#EF9F27' },
  danger:  { bg:'#FCEBEB', color:'#A32D2D', label:'Danger',  dot:'#E24B4A' },
}
const TYPE_ICON = { expiry:'🥛', temperature:'🌡️', humidity:'💧', motion:'👤', storage:'📦', ai_suggestion:'✨' }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts?limit=50')
      setAlerts(res.data.data)
      setUnread(res.data.unreadCount)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAlerts() }, [])

  const markRead = async id => {
    await api.put(`/alerts/${id}/read`)
    setAlerts(a => a.map(x => x._id === id ? { ...x, isRead: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }

  const markAllRead = async () => {
    await api.put('/alerts/read-all')
    setAlerts(a => a.map(x => ({ ...x, isRead: true })))
    setUnread(0)
  }

  const formatTime = ts => {
    const d = new Date(ts)
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  }

  const filtered = filter === 'all' ? alerts : filter === 'unread' ? alerts.filter(a => !a.isRead) : alerts.filter(a => a.severity === filter)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alerts</h1>
          <p className={styles.sub}>{unread} unread · {alerts.length} total</p>
        </div>
        {unread > 0 && (
          <button className={styles.markAllBtn} onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      <div className={styles.filterRow}>
        {['all','unread','danger','warning','info'].map(f => (
          <button key={f} className={`${styles.filterBtn} ${filter===f ? styles.active : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadState}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔔</div>
          <p>No alerts found. Your fridge is looking great!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(alert => {
            const sev = SEV[alert.severity] || SEV.info
            return (
              <div key={alert._id} className={`${styles.alertCard} ${!alert.isRead ? styles.unread : ''}`}>
                <div className={styles.alertLeft}>
                  <span className={styles.typeIcon}>{TYPE_ICON[alert.type] || '🔔'}</span>
                  <div className={styles.alertDot} style={{ background: sev.dot }} />
                </div>
                <div className={styles.alertBody}>
                  <div className={styles.alertTop}>
                    <span className={styles.alertTitle}>{alert.title}</span>
                    <span className={styles.sevPill} style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                  </div>
                  <p className={styles.alertMsg}>{alert.message}</p>
                  <div className={styles.alertFoot}>
                    <span className={styles.alertSource}>{alert.source}</span>
                    <span className={styles.alertTime}>{formatTime(alert.timestamp)}</span>
                  </div>
                </div>
                {!alert.isRead && (
                  <button className={styles.readBtn} onClick={() => markRead(alert._id)} title="Mark as read">✓</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
