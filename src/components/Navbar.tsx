import { useState } from 'react'
import { money } from '../lib/storage'
import { Icon } from './ui'

const NAV = ['Кейсы', 'Апгрейдер', 'Контракты', 'Бонусы', 'Рефералы']
export function Navbar({ balance, onTopUp, sound, onSound, onToast }: { balance: number; onTopUp: () => void; sound: boolean; onSound: () => void; onToast: (m: string) => void }) {
  const [menu, setMenu] = useState(false)
  return (
    <header className="nav">
      <a className="logo" href="/" aria-label="SkinChance"><img src="/logo.png" alt="SkinChance" /></a>
      <nav aria-label="Разделы">{NAV.map(n => n === 'Апгрейдер'
        ? <a key={n} className="active" aria-current="page">{n}</a>
        : <button key={n} className="nav-off" onClick={() => onToast(`Раздел «${n}» ещё не подключён`)}>{n}</button>)}</nav>
      <div className="nav-right">
        <button className="icon-btn" onClick={onSound} aria-pressed={sound} aria-label="Звук" title={sound ? 'Звук включён' : 'Звук выключен'}><Icon n={sound ? 'vol' : 'mute'} /></button>
        <div className="balance" title="Демо-баланс"><span>{money(balance)}</span><button onClick={onTopUp} aria-label="Пополнить (демо)"><Icon n="plus" s={14} /></button></div>
        <div className="profile">
          <button className="avatar" onClick={() => setMenu(m => !m)} aria-label="Профиль"><Icon n="user" s={16} /></button>
          {menu && <div className="menu" onMouseLeave={() => setMenu(false)}>
            <button onClick={() => { localStorage.clear(); location.reload() }}>Сбросить демо-данные</button>
            <button onClick={() => { setMenu(false); onToast('Настройки профиля появятся с backend') }}>Настройки</button></div>}
        </div>
      </div>
    </header>
  )
}
