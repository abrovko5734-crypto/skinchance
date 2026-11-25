import { useState } from 'react'
import { money } from '../lib/storage'
import { Icon } from './ui'
import type { User } from '../lib/auth'
const NAV = ['Кейсы', 'Апгрейдер', 'Бонусы', 'Рефералы']
export function Navbar({ balance, user, onTopUp, sound, onSound, onToast, onProfile, onAdmin, isAdmin }: { balance: number; user: User; onTopUp: () => void; sound: boolean; onSound: () => void; onToast: (m: string) => void; onProfile: () => void; onAdmin: () => void; isAdmin: boolean }) {
  const [menu, setMenu] = useState(false)
  return <header className="nav">
    <a className="logo" href="/" aria-label="SkinChance"><img src="/logo.png" alt="SkinChance" /></a>
    <nav aria-label="Разделы">{NAV.map(n => n === 'Апгрейдер' ? <a key={n} className="active" aria-current="page"><span className="nav-up">↕</span>{n}</a> : <button key={n} className="nav-off" onClick={() => onToast(`Раздел «${n}» ещё не подключён`)}>{n}</button>)}</nav>
    <div className="nav-right"><button className="icon-btn" onClick={onSound} aria-pressed={sound} aria-label="Звук" title={sound ? 'Звук включён' : 'Звук выключен'}><Icon n={sound ? 'vol' : 'mute'} /></button>
      <div className="balance" title="Ваш баланс"><span>{money(balance)}</span><button onClick={onTopUp} aria-label="Пополнить"><Icon n="plus" s={14}/></button></div>
      <div className="profile"><button className="avatar" onClick={()=>setMenu(m=>!m)} aria-label="Меню профиля">{user.avatar?<img src={user.avatar} alt=""/>:<span>{user.name.slice(0,1).toUpperCase()}</span>}</button>
        {menu && <div className="menu" onMouseLeave={()=>setMenu(false)}><div className="menu-user">{user.name}<small>Steam ID {user.id}</small></div><button onClick={()=>{setMenu(false);onProfile()}}>Мой профиль</button>{isAdmin&&<button onClick={()=>{setMenu(false);onAdmin()}}>Админ-панель</button>}<button onClick={()=>{location.href='/api/auth?a=logout'}}>Выйти</button></div>}
      </div>
    </div>
  </header>
}
