import { useEffect, useState } from 'react'
import { CASES, CASE_CAT_LABEL, CASE_CAT_ORDER, dropToItem, type GameCase, type CaseCat } from '../services/cases'
import { resolveCase, pickWeighted, casePriceDp, type WeightedItem } from '../services/caseResolver'
import { money, moneyDpUsd } from '../lib/storage'
import { sound } from '../lib/sound'
import { rarityColor, type Item } from '../services/types'
import { CaseRoulette } from './CaseRoulette'
import { Icon } from './ui'

export interface CaseWin {
  id: string
  caseName: string
  itemName: string
  image: string | null
  price: number | null
  at: number
}

interface Props {
  balance: number
  onSpend: (amount: number) => Promise<boolean>
  onAddItem: (itemId: string, price?: number, item?: Item) => string
  onSell: (uid: string, priceUsd: number) => void
  onWin: (w: CaseWin) => void
  onToast: (m: string) => void
  openCaseId?: string | null
  onOpenCaseHandled?: () => void
}

const CATS: (CaseCat | 'all')[] = ['all', ...CASE_CAT_ORDER]

export function CasesPage({ balance, onSpend, onAddItem, onSell, onWin, onToast, openCaseId, onOpenCaseHandled }: Props) {
  const [selected, setSelected] = useState<GameCase | null>(null)
  const [resolved, setResolved] = useState<WeightedItem[] | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [roulette, setRoulette] = useState<{ c: GameCase; drops: WeightedItem[]; winner: Item; jackpot: boolean; price: number } | null>(null)
  const [filter, setFilter] = useState<CaseCat | 'all'>('all')

  // Глубокая ссылка с главной страницы — открыть конкретный кейс
  useEffect(() => {
    if (!openCaseId) return
    const c = CASES.find((x) => x.id === openCaseId)
    if (c) {
      setSelected(c)
      sound.play('select')
    }
    onOpenCaseHandled?.()
  }, [openCaseId]) // eslint-disable-line

  // Резолвим дропы выбранного кейса: настоящие предметы + реальные цены Steam
  useEffect(() => {
    if (!selected) { setResolved(null); return }
    let live = true
    setResolved(null)
    resolveCase(selected)
      .then((r) => live && setResolved(r))
      .catch(() => {
        if (!live) return
        // Деградация: предметы без рыночных цен, открытие доступно
        setResolved(selected.drops.map((d) => {
          const it = dropToItem(d)
          it.price = null
          it.priceSource = null
          return { item: it, chance: d.chance }
        }))
      })
    return () => { live = false }
  }, [selected])

  const ensureResolved = async (c: GameCase): Promise<WeightedItem[] | null> => {
    if (resolved && selected?.id === c.id) return resolved
    try {
      const r = await resolveCase(c)
      if (selected?.id === c.id) setResolved(r)
      return r
    } catch {
      return null
    }
  }

  const doOpen = async (c: GameCase) => {
    if (spinning || roulette) return
    const price = casePriceDp(c)
    if (price > balance) {
      onToast('Недостаточно DP. Пополните баланс')
      return
    }
    const drops = await ensureResolved(c)
    if (!drops || drops.length === 0) {
      onToast('Не удалось загрузить содержимое кейса')
      return
    }
    setSpinning(true)
    sound.play('start')
    const ok = await onSpend(-price)
    if (!ok) {
      setSpinning(false)
      return
    }
    // Результат определён крипто-роллом ДО запуска анимации
    const winner = pickWeighted(drops).item
    const prices = drops.map((d) => d.item.price).filter((p): p is number => p != null)
    const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const jackpot = winner.price != null && avg > 0 && winner.price > avg * 2.5
    setRoulette({ c, drops, winner, jackpot, price })
    setSpinning(false)
    setSelected(null)
  }

  const finishOpen = (item: Item, sell: boolean) => {
    const uid = onAddItem(item.id, item.price ?? undefined, item)
    onWin({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      caseName: roulette?.c.name ?? '',
      itemName: item.name,
      image: item.image,
      price: item.price,
      at: Date.now(),
    })
    sound.play(roulette?.jackpot ? 'win' : 'select')
    setRoulette(null)
    if (sell && uid && item.price != null) onSell(uid, item.price)
  }

  const list = filter === 'all' ? CASES : CASES.filter((c) => c.cat === filter)

  const renderCard = (c: GameCase) => (
    <button
      key={c.id}
      className={`case-card rarity-${c.rarity} cat-${c.cat}`}
      onClick={() => {
        if (spinning) return
        setSelected(c)
        sound.play('select')
      }}
    >
      <div
        className="case-visual"
        style={{
          background: `linear-gradient(160deg, hsl(${c.hue} 45% 14%) 0%, hsl(${c.hue} 40% 9%) 55%, #0b110e 100%)`,
        }}
      >
        <div className="case-box">
          <div className="case-lid" style={{ borderColor: `hsl(${c.hue} 70% 55%)`, background: `linear-gradient(180deg, hsl(${c.hue} 60% 30%), hsl(${c.hue} 55% 18%))` }} />
          <div className="case-body" style={{ background: `linear-gradient(180deg, hsl(${c.hue} 45% 16%), hsl(${c.hue} 40% 8%))`, borderColor: `hsl(${c.hue} 50% 30% / .6)` }} />
        </div>
        {c.tag && <span className={`case-tag tag-${c.tag.toLowerCase()}`}>{c.tag}</span>}
        <span className="case-cat">{CASE_CAT_LABEL[c.cat]}</span>
      </div>
      <div className="case-info">
        <strong>{c.name}</strong>
        <span className="case-price">{money(casePriceDp(c))}</span>
      </div>
    </button>
  )

  return (
    <div className="cases-page">
      <section className="cases-hero">
        <div className="cases-hero-copy">
          <span className="hero-kicker"><span className="hero-live-dot" /> SKINCHANCE ORIGINALS</span>
          <h1>Открывай кейсы.<br /><em>Лови свой дроп.</em></h1>
          <p>От бюджетных открытий до охоты за ножами и перчатками. Выбирай кейс и испытывай удачу.</p>
          <div className="hero-pills">
            <span>✦ {CASES.length} кейсов</span>
            <span>◈ 5 категорий</span>
            <span>↗ Цены Steam Market</span>
          </div>
        </div>
        <div className="cases-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-case hero-case-back"><i /></div>
          <div className="hero-case hero-case-front"><i /><b>SC</b></div>
          <div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✧</div>
          <div className="hero-art-caption">YOUR NEXT DROP</div>
        </div>
      </section>

      <div className="cases-header">
        <div>
          <h2>Выбери свой кейс</h2>
          <p className="cases-subtitle">{CASES.length} кейсов · {CASE_CAT_ORDER.length} коллекций · реальные цены Steam Market</p>
        </div>
        <div className="cases-filters" role="tablist">
          {CATS.map((f) => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => { setFilter(f); sound.play('select') }}
            >
              {f === 'all' ? 'Все' : CASE_CAT_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {filter === 'all' ? (
        CASE_CAT_ORDER.map((cat) => {
          const items = CASES.filter((c) => c.cat === cat)
          if (!items.length) return null
          return (
            <section key={cat} className="case-section">
              <div className="case-section-head">
                <h3>{CASE_CAT_LABEL[cat]}</h3>
                <span>{items.length}</span>
              </div>
              <div className="cases-grid">
                {items.map(renderCard)}
              </div>
            </section>
          )
        })
      ) : (
        <div className="cases-grid">
          {list.map(renderCard)}
        </div>
      )}

      {selected && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !spinning && setSelected(null)}>
          <div className="modal wide case-modal">
            <header>
              <h3>{selected.name}</h3>
              <button className="icon-btn" onClick={() => setSelected(null)} disabled={spinning} aria-label="Закрыть">
                <Icon n="x" />
              </button>
            </header>
            <div className="case-open-body">
              <div
                className={`case-preview ${spinning ? 'opening' : ''}`}
                style={{
                  background: `linear-gradient(160deg, hsl(${selected.hue} 45% 13%), hsl(${selected.hue} 40% 8%))`,
                  borderColor: `hsl(${selected.hue} 55% 32% / .55)`,
                }}
              >
                <div className="case-box big">
                  <div className="case-lid" style={{ borderColor: `hsl(${selected.hue} 70% 55%)`, background: `linear-gradient(180deg, hsl(${selected.hue} 60% 30%), hsl(${selected.hue} 55% 18%))` }} />
                  <div className="case-body" style={{ background: `linear-gradient(180deg, hsl(${selected.hue} 45% 16%), hsl(${selected.hue} 40% 8%))` }} />
                </div>
                <div className="case-price-big">{money(casePriceDp(selected))}</div>
              </div>
              <div className="case-drops">
                <h4>
                  Возможные дропы · {selected.drops.length} предметов
                  {resolved == null && <span className="drops-loading"> · загрузка цен…</span>}
                </h4>
                <div className="drops-list">
                  {(resolved ?? selected.drops.map((d) => ({ item: null, chance: d.chance, raw: d }))).map((w, i) => {
                    const it = (w as any).item as Item | null
                    const chance = w.chance
                    if (!it) {
                      const d = (w as any).raw
                      return (
                        <div key={i} className="drop-row drop-loading">
                          <span className="drop-thumb"><span className="drop-ph">···</span></span>
                          <span className="drop-id">Загрузка…</span>
                          <span className="drop-chance">{chance}%</span>
                        </div>
                      )
                    }
                    return (
                      <div key={it.id + i} className="drop-row" style={{ ['--rc' as string]: rarityColor(it.rarity) }}>
                        <span className="drop-thumb"><ItemThumb item={it} /></span>
                        <span className="drop-id" title={it.name}>
                          {it.name}
                          <small className="drop-usd">{moneyDpUsd(it.price)}</small>
                        </span>
                        <span className="drop-chance">{chance}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="case-actions">
                <button
                  className="btn go"
                  disabled={spinning || resolved == null || casePriceDp(selected) > balance}
                  onClick={() => doOpen(selected)}
                >
                  {spinning ? 'Списание DP…' : resolved == null ? 'Загрузка цен…' : `Открыть за ${money(casePriceDp(selected))}`}
                </button>
                {casePriceDp(selected) > balance && <p className="hint">Недостаточно DP — пополните баланс</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {roulette && (
        <CaseRoulette
          caseName={roulette.c.name}
          casePrice={roulette.price}
          drops={roulette.drops}
          winner={roulette.winner}
          jackpot={roulette.jackpot}
          onClaim={() => finishOpen(roulette.winner, false)}
          onSell={(item) => finishOpen(item, true)}
        />
      )}
    </div>
  )
}

function ItemThumb({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false)
  if (!item.image || failed) {
    return <span className="drop-ph" style={{ color: rarityColor(item.rarity) }}>{item.weapon.slice(0, 2)}</span>
  }
  return <img src={item.image} alt="" loading="lazy" onError={() => setFailed(true)} />
}
