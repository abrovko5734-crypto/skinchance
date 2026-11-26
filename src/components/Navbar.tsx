import { useState } from 'react'
import { money } from '../lib/storage'
import { Icon } from './ui'
import type { User } from '../lib/auth'
import { isAdminUser } from '../lib/auth'

export type Tab = 'cases' | 'upgrade' | 'contracts' | 'inventory' | 'profile' | 'admin'

const NAV: { id: Tab; label: string; adminOnly?: boolean }[] = [
  { id: 'cases', label: 'Кейсы' },
  { id: 'upgrade', label: 'Апгрейдер' },
  { id: 'contracts', label: 'Контракты' },
  { id: 'inventory', label: 'Инвентарь' },
  { id: 'profile', label: 'Профиль' },
  { id: 'admin', label: 'Админ', adminOnly: true },
]

export function Navbar({
  balance,
  user,
  onTopUp,
  sound,
  onSound,
  tab,
  onTab,
}: {
  balance: number
  user: User
  onTopUp: () => void
  sound: boolean
  onSound: () => void
  tab: Tab
  onTab: (t: Tab) => void
}) {
  const [menu, setMenu] = useState(false)
  const admin = isAdminUser(user)

  return (
    <header className="nav">
      <a
        className="logo"
        href="/"
        aria-label="SkinChance"
        onClick={(e) => {
          e.preventDefault()
          onTab('cases')
        }}
      >
        <img src="/logo.png" alt="SkinChance" />
      </a>
      <nav aria-label="Разделы">
        {NAV.filter((n) => !n.adminOnly || admin).map((n) => (
          <button
            key={n.id}
            className={tab === n.id ? 'active' : 'nav-off'}
            aria-current={tab === n.id ? 'page' : undefined}
            onClick={() => onTab(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <button className="icon-btn" onClick={onSound} aria-pressed={sound} aria-label="Звук">
          <Icon n={sound ? 'vol' : 'mute'} />
        </button>
        <div className="balance" title="Баланс DP">
          <img src="/dp.png" alt="" className="dp-icon" width={18} height={18} />
          <span>{money(balance)}</span>
          <button onClick={onTopUp} aria-label="Пополнить" title="Пополнить">
            <Icon n="plus" s={14} />
          </button>
        </div>
        <div className="profile">
          <button className="avatar" onClick={() => setMenu((m) => !m)} aria-label="Профиль">
            {user.avatar ? <img src={user.avatar} alt="" /> : <Icon n="user" s={16} />}
          </button>
          {menu && (
            <div className="menu" onMouseLeave={() => setMenu(false)}>
              <div className="menu-user">
                {user.name}
                <small>Steam {user.id}</small>
              </div>
              <button onClick={() => { onTab('profile'); setMenu(false) }}>Профиль</button>
              <button onClick={() => { onTab('inventory'); setMenu(false) }}>Инвентарь</button>
              {admin && <button onClick={() => { onTab('admin'); setMenu(false) }}>Админ</button>}
              <button onClick={() => { location.href = '/api/auth?a=logout' }}>Выйти</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
