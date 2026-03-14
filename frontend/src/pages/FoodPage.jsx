import { useState, useEffect } from 'react'
import api from '../utils/api'
import styles from './FoodPage.module.css'

const CATEGORIES = ['dairy','meat','vegetable','fruit','beverage','leftover','condiment','other']
const SHELVES = ['top','bottom','door','crisper']
const EMOJIS = { dairy:'🥛', meat:'🍗', vegetable:'🥦', fruit:'🍓', beverage:'🧃', leftover:'🍱', condiment:'🫙', other:'📦' }
const STATUS_STYLE = {
  fresh:        { bg:'#EAF3DE', color:'#639922', label:'Fresh' },
  expiring_soon:{ bg:'#FAEEDA', color:'#BA7517', label:'Expiring Soon' },
  expired:      { bg:'#FCEBEB', color:'#E24B4A', label:'Expired' },
}

const blank = { name:'', category:'other', weight:'', quantity:1, unit:'item', expiryDate:'', shelf:'top', notes:'' }

export default function FoodPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const fetchItems = async () => {
    try {
      const res = await api.get('/food')
      setItems(res.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value, ...(name==='category' ? {emoji: EMOJIS[value]} : {}) }))
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await api.post('/food', { ...form, weight: parseFloat(form.weight)||0, emoji: EMOJIS[form.category] || '📦' })
      setForm(blank); setShowForm(false); fetchItems()
    } catch (err) { setError(err.response?.data?.message || 'Failed to add item') }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!confirm('Remove this item from the fridge?')) return
    try { await api.delete(`/food/${id}`); fetchItems() } catch (e) { console.error(e) }
  }

  const filtered = items.filter(item => {
    const matchFilter = filter === 'all' || item.status === filter
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    all: items.length,
    fresh: items.filter(i=>i.status==='fresh').length,
    expiring_soon: items.filter(i=>i.status==='expiring_soon').length,
    expired: items.filter(i=>i.status==='expired').length,
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Food Inventory</h1>
          <p className={styles.sub}>{items.length} items tracked · {counts.expiring_soon} expiring soon</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          Add Item
        </button>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {['all','fresh','expiring_soon','expired'].map(f => (
          <button key={f} className={`${styles.filterBtn} ${filter===f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : STATUS_STYLE[f]?.label} <span className={styles.filterCount}>{counts[f]}</span>
          </button>
        ))}
        <input className={styles.search} placeholder="Search items…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add food item</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Item name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Whole Milk" required />
                </div>
                <div className={styles.field}>
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Weight (kg)</label>
                  <input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={handleChange} placeholder="0.50" />
                </div>
                <div className={styles.field}>
                  <label>Shelf</label>
                  <select name="shelf" value={form.shelf} onChange={handleChange}>
                    {SHELVES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Expiry date *</label>
                  <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required />
                </div>
                <div className={styles.field}>
                  <label>Quantity</label>
                  <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Notes (optional)</label>
                <input name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. opened on Monday" />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,borderTopColor:'white'}} /> : 'Add to fridge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items table */}
      {loading ? (
        <div className={styles.loadState}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🫙</div>
          <p>{search ? 'No items match your search.' : 'No food items yet. Add your first item!'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th><th>Category</th><th>Shelf</th><th>Weight</th><th>Expiry</th><th>Status</th><th>Days left</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const days = Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000)
                const st = STATUS_STYLE[item.status] || STATUS_STYLE.fresh
                return (
                  <tr key={item._id}>
                    <td>
                      <div className={styles.itemName}>
                        <span className={styles.itemEmoji}>{item.emoji}</span>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className={styles.muted}>{item.category}</td>
                    <td className={styles.muted}>{item.shelf}</td>
                    <td className={styles.mono}>{item.weight} kg</td>
                    <td className={styles.mono}>{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td>
                      <span className={styles.pill} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td className={`${styles.mono} ${days < 0 ? styles.danger : days <= 3 ? styles.warn : styles.ok}`}>
                      {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'Today' : `${days}d`}
                    </td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)} title="Remove from fridge">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
