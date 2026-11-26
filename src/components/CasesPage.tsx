import { useEffect, useState } from 'react'
import {
  CASES, CASE_CAT_LABEL, rollCase, dropToItem,
  type GameCase, type CaseCat,
} from '../services/cases'
import { money } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
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

const CATS: (CaseCat | 'all')[] = ['all', 'starter', 'popular', 'premium', 'expensive', 'exclusive']

export function CasesPage({ balance, onSpend, onAddItem, onSell, onWin, onToast, openCaseId, onOpenCaseHandled }: Props) {
  const [selected, setSelected] = useState<GameCase | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [roulette, setRoulette] = useState<{ c: GameCase; drop: ReturnType<typeof rollCase> } | null>(null)
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

  const list = filter === 'all' ? CASES : CASES.filter((c) => c.cat === filter)

  const doOpen = async (c: GameCase) => {
    if (spinning || roulette) return
    if (c.price > balance) {
      onToast('Недостаточно DP. Пополните баланс')
      return
    }
    setSpinning(true)
    sound.play('start')
    const ok = await onSpend(-c.price)
    if (!ok) {
      setSpinning(false)
      return
    }
    // Результат определён серверной крипто-логикой ДО запуска анимации
    const drop = rollCase(c)
    const item = dropToItem(drop)
    catalog.refreshPrices([item]).catch(() => {})
    setRoulette({ c, drop })
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
    sound.play((item.price ?? 0) > (roulette?.c.price ?? 0) * 2 ? 'win' : 'select')
    setRoulette(null)
    if (sell && uid) onSell(uid, item.price ?? 0)
  }

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
            <span>↗ Цены рынка Steam</span>
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
          <p className="cases-subtitle">{list.length} кейсов · цены в DP</p>
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

      <div className="cases-grid">
        {list.map((c) => (
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
              {c.tag && <span className="case-tag">{c.tag}</span>}
              <span className="case-cat">{CASE_CAT_LABEL[c.cat]}</span>
            </div>
            <div className="case-info">
              <strong>{c.name}</strong>
              <span className="case-price">{money(c.price)}</span>
            </div>
          </button>
        ))}
      </div>

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
                <div className="case-price-big">{money(selected.price)}</div>
              </div>
              <div className="case-drops">
                <h4>Возможные дропы · {selected.drops.length} предметов</h4>
                <div className="drops-list">
                  {selected.drops
                    .slice()
                    .sort((a, b) => b.price - a.price)
                    .map((d) => {
                      const it = dropToItem(d)
                      return (
                        <div key={d.itemId} className="drop-row" style={{ ['--rc' as string]: rarityColor(it.rarity) }}>
                          <span className="drop-thumb"><ItemThumb item={it} /></span>
                          <span className="drop-id" title={it.name}>{it.name}</span>
                          <span className="drop-chance">{d.chance}%</span>
                        </div>
                      )
                    })}
                </div>
              </div>
              <div className="case-actions">
                <button
                  className="btn go"
                  disabled={spinning || selected.price > balance}
                  onClick={() => doOpen(selected)}
                >
                  {spinning ? 'Списание DP…' : `Открыть за ${money(selected.price)}`}
                </button>
                {selected.price > balance && <p className="hint">Недостаточно DP — пополните баланс</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {roulette && (
        <CaseRoulette
          gameCase={roulette.c}
          winner={roulette.drop}
          onClaim={() => finishOpen(dropToItem(roulette.drop), false)}
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
