import { CASES, CASE_CAT_LABEL, type GameCase } from '../services/cases'
import { money, moneyUsd } from '../lib/storage'
import type { User } from '../lib/auth'
import type { HistoryRow } from './UpgradeHistory'
import type { CaseWin } from './CasesPage'
import type { Tab } from './Navbar'
import { Clover } from './ui'

interface Props {
  user: User
  balance: number
  invCount: number
  invValue: number
  wins: CaseWin[]
  history: HistoryRow[]
  stats: { cases: number; upgrades: number; contracts: number }
  onGo: (t: Tab) => void
  onOpenCase: (c: GameCase) => void
}

const FEATURED = ['phoenix', 'asiimov', 'doppler', 'lore']

export function HomePage({ user, balance, invCount, invValue, wins, history, stats, onGo, onOpenCase }: Props) {
  const featured = FEATURED.map((id) => CASES.find((c) => c.id === id)).filter(Boolean) as GameCase[]
  const best = [...CASES].sort((a, b) => b.price - a.price).slice(0, 4)

  const feed = [
    ...wins.slice(0, 6).map((w) => ({
      key: w.id, name: w.itemName, sub: w.caseName, price: w.price, at: w.at, image: w.image, demo: false,
    })),
    ...history.filter((h) => h.dst && (h.status === 'win' || h.status === 'clover')).slice(0, 4).map((h) => ({
      key: h.id, name: h.dst!, sub: `Апгрейд · ${h.player}`, price: h.dstPrice ?? null, at: Date.now(), image: null, demo: !h.you,
    })),
  ].sort((a, b) => b.at - a.at).slice(0, 8)

  const hour = new Date().getHours()
  const greet = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="hero-kicker"><span className="hero-live-dot" /> SKINCHANCE · CS2 CASES</span>
          <h1>{greet},<br /><em>{user.name}</em></h1>
          <p>Открывай кейсы, апгрейдь скины и собирай контракты. Честные шансы, цены Steam, мгновенные выплаты в DP.</p>
          <div className="home-hero-actions">
            <button className="btn go" onClick={() => onGo('cases')}>Кейсы</button>
            <button className="btn ghost" onClick={() => onGo('upgrade')}>Апгрейдер</button>
          </div>
          <div className="home-stats">
            <div className="hs"><span>Баланс</span><b>{money(balance)}</b></div>
            <div className="hs"><span>Инвентарь</span><b>{invCount} предм. · {moneyUsd(invValue)}</b></div>
            <div className="hs"><span>Кейсов открыто</span><b>{stats.cases}</b></div>
            <div className="hs"><span>Апгрейдов</span><b>{stats.upgrades}</b></div>
          </div>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-case hero-case-back"><i /></div>
          <div className="hero-case hero-case-front"><i /><b>SC</b></div>
          <div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✧</div>
        </div>
      </section>

      {/* FEATURED CASES */}
      <section className="home-section">
        <div className="home-sec-head">
          <h2>Популярные кейсы</h2>
          <button className="link-btn" onClick={() => onGo('cases')}>Все кейсы →</button>
        </div>
        <div className="cases-grid home-grid">
          {featured.map((c) => (
            <CaseTile key={c.id} c={c} onOpen={() => onOpenCase(c)} />
          ))}
        </div>
      </section>

      {/* WINS FEED + TOP */}
      <div className="home-cols">
        <section className="home-section">
          <div className="home-sec-head">
            <h2>Последние выигрыши</h2>
            <button className="link-btn" onClick={() => onGo('inventory')}>Инвентарь →</button>
          </div>
          {feed.length === 0 ? (
            <div className="home-empty">
              <Clover size={34} />
              <p>Пока пусто — открой первый кейс и стань первым в ленте</p>
              <button className="btn primary" onClick={() => onGo('cases')}>Открыть кейс</button>
            </div>
          ) : (
            <ul className="win-feed">
              {feed.map((f) => (
                <li key={f.key} className={f.demo ? 'demo' : ''}>
                  <span className="wf-avatar">{f.demo ? 'D' : user.name[0]}</span>
                  <div className="wf-body">
                    <b>{f.name}</b>
                    <small>{f.sub}{f.demo ? ' · демо' : ''}</small>
                  </div>
                  <div className="wf-price">
                    {f.price != null ? moneyUsd(f.price) : '—'}
                    <small>{timeAgo(f.at)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="home-section">
          <div className="home-sec-head">
            <h2>Топ игроков</h2>
            <span className="demo-note">Демо-рейтинг</span>
          </div>
          <ol className="top-list">
            <TopRow place={1} name={user.name} you stat={`${invCount} предм. · ${moneyUsd(invValue)}`} />
            {[
              { name: 'Nord', v: '$8 420', s: '142 апгрейда' },
              { name: 'Vektor', v: '$5 130', s: '98 апгрейдов' },
              { name: 'Lira', v: '$3 870', s: '64 контракта' },
            ].map((r, i) => (
              <TopRow key={r.name} place={i + 2} name={r.name} stat={r.s} v={r.v} />
            ))}
          </ol>
          <p className="hint">Рейтинг по стоимости инвентаря. Демо-строки не являются реальными игроками.</p>
        </section>
      </div>

      {/* NEW / BEST */}
      <section className="home-section">
        <div className="home-sec-head">
          <h2>Дорогие кейсы</h2>
          <button className="link-btn" onClick={() => onGo('cases')}>Смотреть →</button>
        </div>
        <div className="cases-grid home-grid">
          {best.map((c) => (
            <CaseTile key={c.id} c={c} onOpen={() => onOpenCase(c)} />
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="home-section">
        <div className="home-sec-head"><h2>Почему SkinChance</h2></div>
        <div className="adv-grid">
          <Adv icon="✦" title="Честные шансы" text="Вероятности дропа указаны на каждом кейсе. Результат определяется до анимации криптостойким генератором." />
          <Adv icon="↗" title="Цены Steam" text="Актуальные котировки с Steam Community Market через серверный прокси — без подмены цен." />
          <Adv icon="☘" title="Clover ×2" text="Особый сектор на колесе апгрейда удваивает приз и запускает новое колесо." />
          <Adv icon="◈" title="Мгновенные DP" text="Продажа предметов и пополнение баланса — атомарные операции с записью в историю." />
        </div>
      </section>
    </div>
  )
}

function CaseTile({ c, onOpen }: { c: GameCase; onOpen: () => void }) {
  return (
    <button className={`case-card rarity-${c.rarity} cat-${c.cat}`} onClick={onOpen}>
      <div
        className="case-visual"
        style={{ background: `linear-gradient(160deg, hsl(${c.hue} 45% 14%) 0%, hsl(${c.hue} 40% 9%) 55%, #0b110e 100%)` }}
      >
        <div className="case-box">
          <div className="case-lid" style={{ borderColor: `hsl(${c.hue} 70% 55%)`, background: `linear-gradient(180deg, hsl(${c.hue} 60% 30%), hsl(${c.hue} 55% 18%))` }} />
          <div className="case-body" style={{ background: `linear-gradient(180deg, hsl(${c.hue} 45% 16%), hsl(${c.hue} 40% 8%))`, borderColor: `hsl(${c.hue} 50% 30% / .6)` }} />
        </div>
        {c.tag && <span className="case-tag">{c.tag}</span>}
        <span className="case-cat">{CASE_CAT_LABEL[c.cat]}</span>
      </div>
      <div className="case-info">
        <strong>{c.name}</strong>
        <span className="case-price">{money(c.price)}</span>
      </div>
    </button>
  )
}

function TopRow({ place, name, stat, v, you }: { place: number; name: string; stat: string; v?: string; you?: boolean }) {
  return (
    <li className={`top-row ${you ? 'you' : ''} place-${place}`}>
      <span className="tr-place">{place}</span>
      <span className="tr-name">{name}{you && <em>вы</em>}</span>
      <span className="tr-stat">{stat}</span>
      <b>{v ?? '—'}</b>
    </li>
  )
}

function Adv({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="adv-card">
      <span className="adv-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function timeAgo(at: number): string {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000))
  if (s < 60) return 'только что'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} дн назад`
}

