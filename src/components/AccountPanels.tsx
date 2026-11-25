import { Modal, Clover, Icon } from './ui'
import type { User } from '../lib/auth'
import type { Item } from '../services/types'
import type { HistoryRow } from './UpgradeHistory'
import { money } from '../lib/storage'

export function ProfilePanel({ user, balance, inventory, history, onClose, onLogout }: { user: User; balance: number; inventory: Item[]; history: HistoryRow[]; onClose: () => void; onLogout: () => void }) {
  const wins = history.filter(h => h.status !== 'fail').length
  return <Modal title="Профиль" onClose={onClose}>
    <div className="account-panel profile-panel">
      <div className="profile-hero"><div className="profile-avatar">{user.avatar ? <img src={user.avatar} alt=""/> : <Icon n="user" s={30}/>}</div><div><h2>{user.name}</h2><small>SteamID64 · {user.id}</small><span className="verified"><i/> Steam авторизация</span></div></div>
      <div className="account-stats"><div><small>Баланс</small><b>{money(balance)}</b></div><div><small>Предметов</small><b>{inventory.length}</b></div><div><small>Апгрейдов</small><b>{history.filter(h=>h.you).length}</b></div><div><small>Успехов</small><b>{wins}</b></div></div>
      <div className="profile-block"><h3><Clover size={18}/> Инвентарь</h3><p>Инвентарь Steam пока не подключён. Здесь отображаются тестовые предметы интерфейса.</p></div>
      <div className="profile-block"><h3>Недавняя активность</h3>{history.slice(0,4).map(row=><div className="profile-activity" key={row.id}><span>{row.src}</span><b className={row.status==='fail'?'muted':'green'}>{row.status==='fail'?'Неудача':row.dst ?? 'Успех'}</b></div>)}</div>
      <button className="btn ghost logout" onClick={onLogout}>Выйти из аккаунта</button>
    </div>
  </Modal>
}

export function AdminPanel({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const rows = [
    {id:'76561198000000001',name:'LuckyPlayer',bal:124.50,status:'Активен'},
    {id:'76561198000000002',name:'GreenFox',bal:52.10,status:'Активен'},
    {id:'76561198000000003',name:'NightTrade',bal:0,status:'Активен'},
  ]
  return <Modal title="Админ-панель" onClose={onClose} wide>
    <div className="admin-panel-ui"><div className="admin-warning"><Icon n="user"/> Демонстрационный интерфейс. Управление пользователями и балансом ещё не подключено к защищённому API.</div>
      <div className="admin-summary"><div><small>Пользователи</small><strong>1,284</strong><span>+12 сегодня</span></div><div><small>Апгрейды</small><strong>8,642</strong><span>за всё время</span></div><div><small>Оборот</small><strong>$24,891</strong><span>демо-данные</span></div><div><small>Система</small><strong className="green">Online</strong><span>все сервисы</span></div></div>
      <div className="admin-tools"><input placeholder="Поиск SteamID или никнейма"/><button className="btn primary" onClick={()=>onToast('Добавление пользователей появится после подключения API')}>Найти игрока</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Игрок</th><th>Steam ID</th><th>Баланс</th><th>Статус</th><th>Управление</th></tr></thead><tbody>{rows.map(u=><tr key={u.id}><td><b>{u.name}</b></td><td>{u.id}</td><td>{money(u.bal)}</td><td><span className="admin-status">{u.status}</span></td><td><button className="admin-action" onClick={()=>onToast('Действия требуют защищённого серверного API')}>⋯</button></td></tr>)}</tbody></table></div>
      <div className="admin-sections"><button onClick={()=>onToast('Раздел статистики в разработке')}>📊 Статистика</button><button onClick={()=>onToast('Управление Clover odds в разработке')}>🍀 Настройки Clover</button><button onClick={()=>onToast('Журнал событий в разработке')}>📋 Логи</button></div>
    </div>
  </Modal>
}
