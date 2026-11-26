import { useState } from 'react'
import { CASES, openCase, RARITY_LABEL, type GameCase, type CaseDrop } from '../services/cases'
import { money, moneyShort } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Item } from '../services/types'
import { ItemImage, Icon } from './ui'

interface Props {
  balance: number
  onBalance: (n: number) => void
  onAddItem: (itemId: string) => void
  onToast: (m: string) => void
}

export function CasesPage({ balance, onBalance, onAddItem, onToast }: Props) {
  const [selected, setSelected] = useState<GameCase | null>(null)
  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState<{ drop: CaseDrop; item: Item | null } | null>(null)
  const [filter, setFilter] = useState<'all' | GameCase['rarity']>('all')

  const list = filter === 'all' ? CASES : CASES.filter((c) => c.rarity === filter)

  const doOpen = async (c: GameCase) => {
    if (opening) return
    if (c.price > balance) {
      onToast('Недостаточно DP. Пополнение: @Keldisqq')
      return
    }
    setOpening(true)
    sound.play('tick')
    onBalance(balance - c.price)
    await new Promise((r) => setTimeout(r, 1100))
    const drop = openCase(c)
    const item = await catalog.byId(drop.itemId)
    setResult({ drop, item })
    if (item) onAddItem(item.id)
    sound.play(drop.price > c.price * 2.5 ? 'win' : 'select')
    setOpening(false)
  }

  return (
    <div className="cases-page">
      <div className="cases-header">
        <h2>Кейсы</h2>
        <div className="cases-filters">
          {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Все' : RARITY_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="cases-grid">
        {list.map((c) => (
          <button
            key={c.id}
            className={`case-card rarity-${c.rarity}`}
            onClick={() => {
              setSelected(c)
              setResult(null)
              sound.play('select')
            }}
          >
            <div
              className="case-visual"
              style={{
                background: `linear-gradient(145deg, hsl(${c.hue} 35% 16%) 0%, hsl(${c.hue} 45% 8%) 50%, #0a0b0a 100%)`,
              }}
            >
              <div className="case-box">
                <div className="case-lid" style={{ borderColor: `hsl(${c.hue} 60% 45%)` }} />
                <div className="case-body" style={{ boxShadow: `inset 0 0 30px hsl(${c.hue} 40% 20% / 0.5)` }} />
              </div>
              {c.tag && <span className="case-tag">{c.tag}</span>}
            </div>
            <div className="case-info">
              <strong>{c.name}</strong>
              <span className="case-price">{money(c.price)}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal wide case-modal">
            <header>
              <h3>{selected.name}</h3>
              <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Закрыть">
                <Icon n="x" />
              </button>
            </header>
            <div className="case-open-body">
              <div
                className="case-preview"
                style={{
                  background: `linear-gradient(160deg, hsl(${selected.hue} 40% 18%), hsl(${selected.hue} 30% 8%))`,
                }}
              >
                <div className="case-box big">
                  <div className="case-lid" style={{ borderColor: `hsl(${selected.hue} 55% 50%)` }} />
                  <div className="case-body" />
                </div>
                <div className="case-price-big">{money(selected.price)}</div>
              </div>
              <div className="case-drops">
                <h4>Возможные дропы</h4>
                <div className="drops-list">
                  {selected.drops
                    .slice()
                    .sort((a, b) => b.price - a.price)
                    .map((d) => (
                      <div key={d.itemId} className="drop-row">
                        <span className="drop-chance">{d.chance}%</span>
                        <span className="drop-id">{d.itemId.replace(/\|/g, ' | ').replace(/-/g, ' ')}</span>
                        <span className="drop-price">{moneyShort(d.price)} DP</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="case-actions">
                <button
                  className="btn go"
                  disabled={opening || selected.price > balance}
                  onClick={() => doOpen(selected)}
                >
                  {opening ? 'Открытие…' : `Открыть за ${money(selected.price)}`}
                </button>
              </div>
              {result && (
                <div className={`case-result ${result.drop.price > selected.price * 2 ? 'big' : ''}`}>
                  <div className="result-label">Выпало</div>
                  {result.item ? (
                    <>
                      <ItemImage item={result.item} size="lg" />
                      <strong>{result.item.name}</strong>
                      <span className="result-price">{money(result.drop.price)}</span>
                    </>
                  ) : (
                    <strong>{result.drop.itemId}</strong>
                  )}
                  <button
                    className="btn"
                    onClick={() => {
                      setResult(null)
                      setSelected(null)
                    }}
                  >
                    В инвентарь
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
