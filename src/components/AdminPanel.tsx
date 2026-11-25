import { useState } from 'react'
import { money } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Item } from '../services/types'
import type { User } from '../lib/auth'
import { isAdminUser } from '../lib/auth'

interface Props {
  user: User
  balance: number
  onBalance: (n: number) => void
  onAddItem: (itemId: string) => void
  onToast: (m: string) => void
}

export function AdminPanel({ user, balance, onBalance, onAddItem, onToast }: Props) {
  const [amount, setAmount] = useState('1000')
  const [itemQuery, setItemQuery] = useState('')
  const [found, setFound] = useState<Item[]>([])

  if (!isAdminUser(user)) {
    return (
      <div className="admin-page locked">
        <h2>Админ-панель</h2>
        <p>Доступ только для Steam ID из VITE_ADMIN_STEAM_IDS.</p>
        <p className="hint">Ваш ID: {user.id}</p>
      </div>
    )
  }

  const searchItems = async () => {
    const list = await catalog.search({
      text: itemQuery,
      category: 'all',
      weapon: '',
      rarity: '',
      wear: '',
      special: 'all',
      min: null,
      max: null,
      sort: 'price-desc',
    })
    setFound(list.slice(0, 16).map((e) => e.item))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Админ-панель</h2>
        <span className="admin-badge">Admin · {user.name}</span>
      </div>

      <section className="admin-section">
        <h3>Баланс (себе)</h3>
        <p>Текущий: <b>{money(balance)}</b></p>
        <div className="admin-row">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма DP" />
          <button
            className="btn go"
            onClick={() => {
              const n = parseFloat(amount)
              if (!isNaN(n) && n !== 0) {
                onBalance(balance + n)
                sound.play('win')
                onToast(`${n > 0 ? '+' : ''}${money(n)}`)
              }
            }}
          >
            Изменить DP
          </button>
        </div>
      </section>

      <section className="admin-section">
        <h3>Выдать предмет</h3>
        <div className="admin-row">
          <input value={itemQuery} onChange={(e) => setItemQuery(e.target.value)} placeholder="Название скина…" />
          <button className="btn" onClick={searchItems}>
            Найти
          </button>
        </div>
        <div className="admin-items">
          {found.map((it) => (
            <button
              key={it.id}
              className="admin-item"
              onClick={() => {
                onAddItem(it.id)
                sound.play('select')
                onToast(`Выдан: ${it.name}`)
              }}
            >
              <strong>{it.name}</strong>
              <span>{money(it.price ?? 0)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h3>Быстро</h3>
        <div className="admin-row">
          <button className="btn go" onClick={() => { onBalance(balance + 10000); onToast('+10 000 DP') }}>
            +10 000 DP
          </button>
          <button className="btn" onClick={() => { onAddItem('ak-47|redline|ft'); onToast('AK-47 Redline') }}>
            Redline
          </button>
          <button className="btn" onClick={() => { onAddItem('karambit|doppler|fn'); onToast('Karambit Doppler') }}>
            Karambit
          </button>
        </div>
      </section>
    </div>
  )
}
