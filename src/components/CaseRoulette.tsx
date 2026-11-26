import { useEffect, useMemo, useRef, useState } from 'react'
import { money, moneyDpUsd, usdToDp } from '../lib/storage'
import { sound } from '../lib/sound'
import { rarityColor, rarityRu, type Item } from '../services/types'
import type { WeightedItem } from '../services/caseResolver'
import { ItemImage, Icon } from './ui'
import { Confetti } from './Confetti'

/**
 * Горизонтальная рулетка открытия кейса.
 * Движение СПРАВА НАЛЕВО, центральный указатель, плавное замедление ~7–8с.
 * Выигрыш (winner) определён ДО старта анимации — рулетка лишь показывает его.
 */

const STRIP_LEN = 72
const WIN_INDEX = 58 // позиция выигрышной карточки в ленте
const CARD_W = 104
const GAP = 10
const STEP = CARD_W + GAP
const PAD = 14

const weightedPick = (drops: WeightedItem[]): Item => {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  const roll = (a[0] / 2 ** 32) * 100
  let acc = 0
  for (const d of drops) {
    acc += d.chance
    if (roll < acc) return d.item
  }
  return drops[drops.length - 1].item
}

interface Props {
  caseName: string
  casePrice: number // DP
  drops: WeightedItem[]
  winner: Item
  jackpot: boolean
  onClaim: () => void
  onSell: (item: Item) => void
}

type Phase = 'spin' | 'done'

export function CaseRoulette({ caseName, casePrice, drops, winner, jackpot, onClaim, onSell }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('spin')
  const [won, setWon] = useState<Item | null>(null)
  const timers = useRef<number[]>([])

  // Лента предметов: случайные дропы + гарантированный выигрыш на WIN_INDEX.
  const items = useMemo<Item[]>(() => {
    const arr: Item[] = []
    for (let i = 0; i < STRIP_LEN; i++) {
      arr.push(i === WIN_INDEX ? winner : weightedPick(drops))
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track) return

    const vw = vp.clientWidth
    // Центр выигрышной карточки в координатах трека
    const winCenter = PAD + WIN_INDEX * STEP + CARD_W / 2
    // Целевой сдвиг: карточка точно под указателем (центр вьюпорта)
    const target = vw / 2 - winCenter
    // Старт: лента справа за экраном
    const start = vw - PAD

    track.style.transform = `translate3d(${start}px,0,0)`

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dur = reduced ? 1400 : 7200 + Math.random() * 800 // 7.2–8с

    // Тиканье с замедлением
    let tickTimer = 0
    const t0 = performance.now()
    const tick = () => {
      sound.play('tick')
      const elapsed = performance.now() - t0
      const wait = elapsed < dur * 0.7 ? 90 : elapsed < dur * 0.9 ? 160 : 320
      tickTimer = window.setTimeout(tick, wait)
    }
    sound.play('start')
    tickTimer = window.setTimeout(tick, 120)

    const anim = track.animate(
      [{ transform: `translate3d(${start}px,0,0)` }, { transform: `translate3d(${target}px,0,0)` }],
      { duration: dur, easing: 'cubic-bezier(0.12, 0.72, 0.06, 1)', fill: 'forwards' },
    )

    anim.onfinish = () => {
      window.clearTimeout(tickTimer)
      sound.play('stop')
      setWon(winner)
      timers.current.push(window.setTimeout(() => {
        setPhase('done')
        sound.play(jackpot ? 'win' : 'select')
      }, 650))
    }
    return () => {
      window.clearTimeout(tickTimer)
      timers.current.forEach(clearTimeout)
      anim.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overlay roulette-overlay" role="dialog" aria-modal aria-label={`Открытие кейса ${caseName}`}>
      <div className="roulette">
        <header className="roulette-head">
          <div>
            <span className="eyebrow">Кейс</span>
            <h3>{caseName}</h3>
          </div>
          <div className="roulette-price">{money(casePrice)}</div>
        </header>

        <div className="roulette-viewport" ref={viewportRef}>
          <div className="roulette-pointer" aria-hidden />
          <div className="roulette-track" ref={trackRef}>
            {items.map((it, i) => {
              const isWin = i === WIN_INDEX
              return (
                <div
                  key={i}
                  className={`rl-card ${isWin && phase === 'done' ? 'rl-win' : ''}`}
                  style={{ width: CARD_W, ['--rc' as string]: rarityColor(it.rarity) }}
                >
                  <ItemImage item={it} size="sm" />
                  <span className="rl-name">{it.weapon}</span>
                  <span className="rl-skin">{it.skin}</span>
                  <span className="rl-rar" style={{ color: rarityColor(it.rarity) }}>
                    {rarityRu(it.rarity)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="roulette-fade left" aria-hidden />
          <div className="roulette-fade right" aria-hidden />
        </div>

        <div className="roulette-status" aria-live="polite">
          {phase === 'spin' ? 'Удача решает…' : won ? 'Выпало!' : ''}
        </div>

        {phase === 'done' && won && (
          <div className="roulette-result">
            {jackpot && <Confetti count={36} />}
            <div className="rr-item">
              <div className="rr-img">
                <ItemImage item={won} size="lg" />
              </div>
              <div className="rr-info">
                <span className="eyebrow" style={{ color: rarityColor(won.rarity) }}>{rarityRu(won.rarity)}</span>
                <h4>{won.name}</h4>
                <div className="rr-price">
                  {moneyDpUsd(won.price)}
                  {won.price != null && <em>1 DP = 0.50 грн</em>}
                </div>
              </div>
            </div>
            <div className="btn-row wide rr-actions">
              <button className="btn primary" onClick={onClaim}>
                <Icon n="check" s={16} /> Забрать
              </button>
              <button
                className="btn ghost"
                onClick={() => onSell(won)}
                disabled={won.price == null}
                title={won.price == null ? 'Цена недоступна' : undefined}
              >
                Продать ≈ {won.price != null ? money(usdToDp(won.price)) : '—'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
