import { useState } from 'react'
import { money, moneyDpUsd } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Item } from '../services/types'
import type { User } from '../lib/auth'
import { isAdminUser, adminCredit, adminBalance, adminSet } from '../lib/auth'

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
  const [balResult, setBalResult] = useState<{ steamId: string; balance: number } | null>(null)
  const [setBalInput, setSetBalInput] = useState('')

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
    if (targetId.trim() === steamId.trim()) setBalResult({ steamId: targetId.trim(), balance: res.balance })
  }

  const checkBalance = async () => {
    const id = steamId.trim()
    if (!/^\d{17}$/.test(id)) {
      onToast('Укажите корректный SteamID64 (17 цифр)')
      return
    }
    setBusy(true)
    const res = await adminBalance(id)
    setBusy(false)
    if (!res.ok) {
      onToast(res.message)
      return
    }
    setBalResult({ steamId: res.targetId, balance: res.balance })
    sound.play('select')
  }

  const setBalance = async () => {
    const id = steamId.trim()
    const n = parseFloat(setBalInput)
    if (!/^\d{17}$/.test(id) || !Number.isFinite(n) || n < 0) {
      onToast('Укажите SteamID64 и сумму ≥ 0')
      return
    }
    setBusy(true)
    const res = await adminSet(id, n)
    setBusy(false)
    if (!res.ok) {
      onToast(res.message)
      return
    }
    sound.play('win')
    setBalResult({ steamId: res.targetId, balance: res.balance })
    if (id === user.id) onBalance(res.balance)
    onToast(`Баланс ${id.slice(-6)} = ${money(res.balance)}`)
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
          <button className="btn" disabled={busy} onClick={() => credit(user.id, 250000)}>
            Себе +250 000
          </button>
        </div>
        <div className="admin-row" style={{ marginTop: 10 }}>
          <button className="btn" disabled={busy || !/^\d{17}$/.test(steamId.trim())} onClick={checkBalance}>
            Проверить баланс
          </button>
          <input
            type="number"
            value={setBalInput}
            onChange={(e) => setSetBalInput(e.target.value)}
            placeholder="Установить баланс ="
            style={{ maxWidth: 180 }}
          />
          <button className="btn" disabled={busy || !setBalInput} onClick={setBalance}>
            Установить
          </button>
        </div>
        {balResult && (
          <p className="hint">
            Баланс <b>{balResult.steamId}</b>: <b>{money(balResult.balance)}</b>
          </p>
        )}
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
              <span>{moneyDpUsd(it.price)}</span>
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
