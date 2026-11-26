import { money } from '../lib/storage'
import type { User } from '../lib/auth'
import { isAdminUser } from '../lib/auth'
import { Icon } from './ui'

interface Props {
  user: User
  balance: number
  invCount: number
  invValue: number
  onTopUp: () => void
}

export function ProfilePage({ user, balance, invCount, invValue, onTopUp }: Props) {
  return (
    <div className="profile-page">
      <h2>Профиль</h2>
      <div className="profile-card">
        <div className="profile-avatar">
          {user.avatar ? <img src={user.avatar} alt="" /> : <Icon n="user" s={40} />}
        </div>
        <div className="profile-info">
          <h3>{user.name}</h3>
          <p className="steam-id">Steam ID: <code>{user.id}</code></p>
          {isAdminUser(user) && <span className="admin-badge">Администратор</span>}
        </div>
      </div>
      <div className="profile-stats">
        <div className="stat">
          <span>Баланс</span>
          <b>{money(balance)}</b>
        </div>
        <div className="stat">
          <span>Предметов</span>
          <b>{invCount}</b>
        </div>
        <div className="stat">
          <span>Стоимость инвентаря</span>
          <b>{money(invValue)}</b>
        </div>
      </div>
      <button className="btn go" onClick={onTopUp}>
        Пополнить через @Keldisqq
      </button>
      <p className="hint">Напишите @Keldisqq в Telegram со своим Steam ID. После оплаты DP зачислят через админ-панель.</p>
    </div>
  )
}
