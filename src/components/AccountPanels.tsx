import { Modal, Clover, Icon } from './ui'
import type { User } from '../lib/auth'
import type { Item } from '../services/types'
import type { HistoryRow } from './UpgradeHistory'
import { money } from '../lib/storage'
import { useEffect, useState } from 'react'

export function ProfilePanel({ user, balance, inventory, history, onClose, onLogout }: { user: User; balance: number; inventory: Item[]; history: HistoryRow[]; onClose: () => void; onLogout: () => void }) {
  const wins = history.filter(h => h.status !== 'fail').length
  return <Modal title="Профиль" onClose={onClose}>
    <div className="account-panel profile-panel">
      <div className="profile-hero"><div className="profile-avatar">{user.avatar ? <img src={user.avatar} alt=""/> : <Icon n="user" s={30}/>}</div><div><h2>{user.name}</h2><small>SteamID64 · {user.id}</small><span className="verified"><i/> Steam авторизация</span></div></div>
      <div className="account-stats"><div><small>Баланс</small><b>{money(balance)}</b></div><div><small>Предметов</small><b>{inventory.length}</b></div><div><small>Апгрейдов</small><b>{history.filter(h=>h.you).length}</b></div><div><small>Успехов</small><b>{wins}</b></div></div>
      <div className="profile-block"><h3><Clover size={18}/> Инвентарь</h3><p>Инвентарь загружается из публичного Steam API. Если список пуст, проверь настройки приватности Steam.</p></div>
      <div className="profile-block"><h3>Недавняя активность</h3>{history.slice(0,4).map(row=><div className="profile-activity" key={row.id}><span>{row.src}</span><b className={row.status==='fail'?'muted':'green'}>{row.status==='fail'?'Неудача':row.dst ?? 'Успех'}</b></div>)}</div>
      <button className="btn ghost logout" onClick={onLogout}>Выйти из аккаунта</button>
    </div>
  </Modal>
}

type AdminUser = { id: string; name: string; avatar?: string; balance: number; banned: boolean; lastLogin?: string }
type AdminStats = { users: number; balanceTotal: number; upgrades: number; upgradeTracking: boolean; online: string }
async function adminGet(action: string, query = '') { const r = await fetch(`/api/auth?a=${action}${query}`, {credentials:'same-origin'}); const j:any=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.message||j.error||`HTTP ${r.status}`); return j }
async function adminPost(body: any) { const r=await fetch('/api/auth?a=admin-action',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); const j:any=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.message||j.error||`HTTP ${r.status}`); return j }
export function AdminPanel({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const [stats,setStats]=useState<AdminStats|null>(null),[query,setQuery]=useState(''),[player,setPlayer]=useState<AdminUser|null>(null),[percent,setPercent]=useState(5),[logs,setLogs]=useState<any[]>([]),[tab,setTab]=useState<'users'|'clover'|'logs'>('users'),[loading,setLoading]=useState(true),[error,setError]=useState(''),[amount,setAmount]=useState(''),[reason,setReason]=useState('')
  const refresh=async()=>{setLoading(true);setError('');try{const s=await adminGet('admin-stats');setStats(s);const c=await adminGet('admin-settings');setPercent(c.clover);const l=await adminGet('admin-logs');setLogs(l.logs||[])}catch(e:any){setError(e.message||'Не удалось загрузить данные')}finally{setLoading(false)}}
  useEffect(()=>{refresh()},[])
  const search=async()=>{if(!/^\d{17}$/.test(query.trim())){onToast('Введите SteamID64 из 17 цифр');return}try{const r=await adminGet('admin-users',`&q=${encodeURIComponent(query.trim())}`);setPlayer(r.user)}catch(e:any){onToast(e.message)}}
  const act=async(action:string,extra:any={})=>{if(!player)return;try{await adminPost({action,target:player.id,...extra});onToast('Изменение сохранено');const r=await adminGet('admin-users',`&q=${player.id}`);setPlayer(r.user);await refresh()}catch(e:any){onToast(e.message)}}
  return <Modal title="Админ-панель" onClose={onClose} wide>
    <div className="admin-panel-ui">
      <div className="admin-warning"><Icon n="shield"/> Это подключённая панель. Все действия проверяются сервером и записываются в Redis. Статистика показывает реальные ключи/балансы; апгрейды ещё не ведутся серверным счётчиком.</div>
      {error&&<div className="admin-warning admin-error">{error} — проверь ADMIN_STEAM_IDS в Vercel и Redis.</div>}
      <div className="admin-summary"><div><small>Аккаунты в Redis</small><strong>{stats?.users??'—'}</strong><span>реальные записи балансов</span></div><div><small>Апгрейды</small><strong>{stats?.upgradeTracking?stats.upgrades:'—'}</strong><span>{stats?.upgradeTracking?'счётчик сервера':'не учитываются'}</span></div><div><small>Сумма балансов</small><strong>{stats?money(stats.balanceTotal):'—'}</strong><span>по сохранённым аккаунтам</span></div><div><small>База</small><strong className="green">{stats?.online??(loading?'…':'—')}</strong><span>статус Redis</span></div></div>
      <div className="admin-sections"><button className={tab==='users'?'active':''} onClick={()=>setTab('users')}>👥 Игроки</button><button className={tab==='clover'?'active':''} onClick={()=>setTab('clover')}>🍀 Clover</button><button className={tab==='logs'?'active':''} onClick={()=>setTab('logs')}>📋 Логи</button><button onClick={refresh}>↻ Обновить</button></div>
      {tab==='users'&&<><div className="admin-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="SteamID64 (17 цифр)"/><button className="btn primary" onClick={search}>Найти</button></div>{player&&<div className="admin-player-card"><div className="profile-hero"><div className="profile-avatar">{player.avatar?<img src={player.avatar} alt=""/>:<Icon n="user" s={24}/>}</div><div><h3>{player.name}</h3><small>{player.id} · {player.lastLogin?`последний вход ${new Date(player.lastLogin).toLocaleString()}`:'профиль не сохранён'}</small></div><span className={player.banned?'admin-status banned':'admin-status'}>{player.banned?'Заблокирован':'Активен'}</span></div><div className="admin-balance"><label>Баланс, $</label><input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={player.balance.toFixed(2)}/><button onClick={()=>act('set-balance',{amount:Number(amount)})}>Установить</button><button onClick={()=>act('add-balance',{amount:Number(amount)})}>Добавить</button></div><div className="admin-balance"><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Причина блокировки (необязательно)"/><button className={player.banned?'':'danger'} onClick={()=>act(player.banned?'unban':'ban',{reason})}>{player.banned?'Разблокировать':'Заблокировать'}</button></div></div>}{!player&&<p className="admin-hint">Найди аккаунт по SteamID64. Ники не ищутся — Steam-профиль сохраняется при входе.</p>}</>}
      {tab==='clover'&&<div className="admin-player-card"><h3>Настройка Clover</h3><p>Значение сохраняется в Redis. Пока игровая логика апгрейда не читает эту настройку с сервера, оно влияет только на сохранённую конфигурацию.</p><div className="admin-balance"><label>Шанс Clover %</label><input type="number" min="0" max="100" step="0.1" value={percent} onChange={e=>setPercent(Number(e.target.value))}/><button onClick={async()=>{try{await adminPost({action:'set-clover',percent});onToast('Настройка сохранена');await refresh()}catch(e:any){onToast(e.message)}}}>Сохранить</button></div></div>}
      {tab==='logs'&&<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Дата</th><th>Действие</th><th>Администратор</th><th>Игрок</th><th>Детали</th></tr></thead><tbody>{logs.map((l,i)=><tr key={i}><td>{l.at?new Date(l.at).toLocaleString():'—'}</td><td>{l.action}</td><td>{l.actor}</td><td>{l.target||'—'}</td><td>{l.detail||'—'}</td></tr>)}</tbody></table>{!logs.length&&<p className="admin-hint">Журнал пуст — новые действия будут появляться здесь.</p>}</div>}
    </div>
  </Modal>
}
