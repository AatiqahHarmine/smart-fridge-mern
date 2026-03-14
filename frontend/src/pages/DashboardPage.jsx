import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import api from '../utils/api'
import styles from './DashboardPage.module.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const EXPIRY_COLORS = {
  fresh: { bg: '#EAF3DE', color: '#639922', label: 'Fresh' },
  expiring_soon: { bg: '#FAEEDA', color: '#BA7517', label: 'Soon' },
  expired: { bg: '#FCEBEB', color: '#E24B4A', label: 'Expired' },
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard/summary')
      setData(res.data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className={styles.loadState}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
      <span>Loading sensor data…</span>
    </div>
  )

  const sensor = data?.sensor || {}
  const food = data?.food || {}
  const alerts = data?.alerts || {}

  // Build temp chart data
  const tempHistory = data?.tempHistory || []
  const chartLabels = tempHistory.map(r => `${r._id}:00`)
  const chartTemps = tempHistory.map(r => parseFloat(r.avgTemp.toFixed(1)))
  const chartHumidity = tempHistory.map(r => parseFloat(r.avgHumidity.toFixed(1)))

  const tempChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Temperature °C',
      data: chartTemps,
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(1) + '°C' } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#888780', font: { size: 11 }, maxTicksLimit: 8 } },
      y: { min: 0, max: 10, grid: { color: 'rgba(136,135,128,0.12)' }, ticks: { color: '#888780', font: { size: 11 }, callback: v => v + '°C' } }
    }
  }

  const formatTimeAgo = ts => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  }

  const severityColor = { info: '#378ADD', warning: '#BA7517', danger: '#E24B4A' }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>Last updated {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchData}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className={`${styles.metrics} fade-up`}>
        <MetricCard label="Temperature" value={sensor.temperature ? sensor.temperature.toFixed(1) + '°C' : '--'} sub="DHT22 sensor" status={sensor.temperature > 5 ? 'warn' : 'ok'} icon="🌡️" />
        <MetricCard label="Humidity" value={sensor.humidity ? sensor.humidity.toFixed(0) + '%' : '--'} sub="DHT22 sensor" status={sensor.humidity > 80 ? 'warn' : 'ok'} icon="💧" />
        <MetricCard label="Total Weight" value={sensor.weightTotal ? sensor.weightTotal.toFixed(2) + ' kg' : '--'} sub="HX711 load cell" status="ok" icon="⚖️" />
        <MetricCard label="Items Tracked" value={food.total || 0} sub={`${food.expiringSoon || 0} expiring soon`} status={food.expiringSoon > 0 ? 'warn' : 'ok'} icon="📦" />
        <MetricCard label="Alerts" value={alerts.unreadCount || 0} sub="unread" status={alerts.unreadCount > 0 ? 'warn' : 'ok'} icon="🔔" />
      </div>

      {/* Compartment fullness */}
      <div className={`${styles.grid2} fade-up fade-up-1`}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Compartment fullness</div>
          <FillBar label="Top shelf" pct={sensor.fullnessTop || 0} />
          <FillBar label="Bottom shelf" pct={sensor.fullnessBottom || 0} />
          <FillBar label="Door rack" pct={40} />
          <FillBar label="Crisper drawer" pct={65} />
          <div className={styles.overallFill}>
            <span className={styles.ofLabel}>Overall storage</span>
            <span className={styles.ofVal}>{Math.round(((sensor.fullnessTop || 0) + (sensor.fullnessBottom || 0) + 40 + 65) / 4)}%</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Sensor status</div>
          {[
            { name: 'DHT22 — Temp/Humidity', val: sensor.temperature ? `${sensor.temperature.toFixed(1)}°C / ${sensor.humidity?.toFixed(0)}%` : '--', ok: !!sensor.temperature },
            { name: 'HX711 — Weight sensor', val: sensor.weightTotal ? `${sensor.weightTotal.toFixed(2)} kg` : '--', ok: !!sensor.weightTotal },
            { name: 'HC-SR501 — PIR motion', val: sensor.motionDetected ? 'Motion detected' : 'Idle', ok: true },
            { name: 'HC-SR04 Top — Ultrasonic', val: sensor.distanceTop ? `${sensor.distanceTop} cm` : '--', ok: !!sensor.distanceTop },
            { name: 'HC-SR04 Bottom — Ultrasonic', val: sensor.distanceBottom ? `${sensor.distanceBottom} cm` : '--', ok: !!sensor.distanceBottom },
          ].map(s => (
            <div key={s.name} className={styles.sensorRow}>
              <div className={styles.sensorLeft}>
                <div className={`${styles.dot} ${s.ok ? styles.dotOk : styles.dotOff}`} />
                <span className={styles.sensorName}>{s.name}</span>
              </div>
              <span className={`${styles.sensorVal} ${s.ok ? styles.valOk : ''}`}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Temp chart + AI */}
      <div className={`${styles.grid2} fade-up fade-up-2`}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Temperature — 24 hour history</div>
          <div className={styles.chartWrap}>
            {chartTemps.length > 0
              ? <Line data={tempChartData} options={chartOptions} />
              : <div className={styles.noData}>No sensor data yet. Connect your ESP32 to start logging.</div>
            }
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent alerts</div>
          {alerts.recent?.length > 0
            ? alerts.recent.map(a => (
              <div key={a._id} className={styles.alertRow}>
                <div className={styles.alertDot} style={{ background: severityColor[a.severity] }} />
                <div>
                  <div className={styles.alertText}>{a.message}</div>
                  <div className={styles.alertMeta}>{a.source} · {formatTimeAgo(a.timestamp)}</div>
                </div>
              </div>
            ))
            : <div className={styles.noData}>No recent alerts. Your fridge looks healthy! 🎉</div>
          }
        </div>
      </div>

      {/* Food inventory */}
      <div className={`${styles.card} fade-up fade-up-3`}>
        <div className={styles.cardTitle}>Food inventory — expiry status</div>
        {food.items?.length > 0 ? (
          <div className={styles.foodGrid}>
            {food.items.map(item => {
              const days = Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000)
              const st = item.status || (days < 0 ? 'expired' : days <= 3 ? 'expiring_soon' : 'fresh')
              const c = EXPIRY_COLORS[st]
              return (
                <div key={item._id} className={styles.foodCard}>
                  <div className={styles.foodEmoji}>{item.emoji}</div>
                  <div className={styles.foodInfo}>
                    <div className={styles.foodName}>{item.name}</div>
                    <div className={styles.foodWeight}>{item.weight} kg · {item.shelf} shelf</div>
                  </div>
                  <span className={styles.expiryPill} style={{ background: c.bg, color: c.color }}>
                    {days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.noData}>No food items tracked yet. Add items in the Food Inventory page.</div>
        )}
      </div>

      {/* System info */}
      <div className={`${styles.grid3} fade-up fade-up-4`}>
        <InfoCard title="MQTT Broker" rows={[['Provider','EMQX Public'],['Status','Connected'],['Protocol','MQTT v5'],['QoS','Level 1']]} statusRow="Status" />
        <InfoCard title="MongoDB Atlas" rows={[['Cluster','M0 Free Tier'],['Status','Connected'],['Collections','5'],['Region','Singapore']]} statusRow="Status" />
        <InfoCard title="IoT Level" rows={[['Deployment','Level 4 Cloud'],['Controller','ESP32 Dual-core'],['Connectivity','Wi-Fi 802.11 b/g/n'],['Platform','Node-RED']]} />
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, status, icon }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={`${styles.metricStatus} ${status === 'warn' ? styles.statusWarn : styles.statusOk}`}>
          {status === 'warn' ? '⚠' : '✓'}
        </span>
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricSub}>{sub}</div>
    </div>
  )
}

function FillBar({ label, pct }) {
  const color = pct > 80 ? '#EF9F27' : '#1D9E75'
  return (
    <div className={styles.barWrap}>
      <div className={styles.barMeta}>
        <span className={styles.barLabel}>{label}</span>
        <span className={styles.barPct} style={{ color }}>{pct}%</span>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function InfoCard({ title, rows, statusRow }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      {rows.map(([k, v]) => (
        <div key={k} className={styles.infoRow}>
          <span className={styles.infoKey}>{k}</span>
          <span className={styles.infoVal} style={k === statusRow ? { color: '#1D9E75', fontWeight: 500 } : {}}>{v}</span>
        </div>
      ))}
    </div>
  )
}
