import { useState } from 'react'
import { money, moneyUsd } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Item } from '../services/types'
import type { User } from '../lib/auth'
import { isAdminUser, adminCredit } from '../lib/auth'

interface Props {
  user: User
  balance: number
  onBalance: (n: number) => void
  onAddItem: (itemId: string) => void
  onToast: (m: string) => void
}

export function AdminPanel({ user, balance, onBalance, onAddItem, onToast }: Props) {
  const [steamId, setSteamId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [itemQuery, setItemQuery] = useState('')
  const [found, setFound] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)

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

  const credit = async (targetId: string, n: number) => {
    if (busy) return
    if (!/^\d{17}$/.test(targetId.trim())) {
      onToast('Укажите корректный SteamID64 (17 цифр)')
      return
    }
    if (!Number.isFinite(n) || n === 0) {
      onToast('Укажите сумму')
      return
    }
    setBusy(true)
    const res = await adminCredit(targetId.trim(), n)
    setBusy(false)
    if (!res.ok) {
      onToast(res.message)
      return
    }
    sound.play('win')
    onToast(`${n > 0 ? '+' : ''}${money(n)} → ${targetId.slice(-6)} · баланс ${money(res.balance)}`)
    if (targetId.trim() === user.id) onBalance(res.balance)
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Админ-панель</h2>
        <span className="admin-badge">Admin · {user.name}</span>
      </div>

      <section className="admin-section">
        <h3>Выдать DP игроку</h3>
        <p className="hint">Баланс хранится на сервере. Игроки получают DP только через эту выдачу.</p>
        <div className="admin-row">
          <input
            value={steamId}
            onChange={(e) => setSteamId(e.target.value.replace(/\D/g, '').slice(0, 17))}
            placeholder="SteamID64 (17 цифр)"
            inputMode="numeric"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма DP"
          />
          <button
            className="btn go"
            disabled={busy}
            onClick={() => credit(steamId, parseFloat(amount))}
          >
            Выдать
          </button>
        </div>
        <div className="admin-row" style={{ marginTop: 10 }}>
          <button
            className="btn go"
            disabled={busy}
            onClick={() => credit(user.id, parseFloat(amount) || 1000)}
          >
            Себе +{amount || '1000'}
          </button>
          <button className="btn go" disabled={busy} onClick={() => credit(user.id, 10000)}>
            Себе +10 000
          </button>
          <button className="btn" disabled={busy} onClick={() => credit(user.id, 50000)}>
            Себе +50 000
          </button>
        </div>
        <p className="hint">Ваш баланс сейчас: <b>{money(balance)}</b></p>
      </section>

      <section className="admin-section">
        <h3>Выдать предмет (себе)</h3>
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
              <span>{moneyUsd(it.price)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h3>Быстро (предметы себе)</h3>
        <div className="admin-row">
          <button
            className="btn"
            onClick={() => {
              onAddItem('ak-47|redline|ft')
              onToast('AK-47 Redline')
            }}
          >
            Redline
          </button>
          <button
            className="btn"
            onClick={() => {
              onAddItem('karambit|doppler|fn')
              onToast('Karambit Doppler')
            }}
          >
            Karambit
          </button>
        </div>
      </section>
    </div>
  )
}
