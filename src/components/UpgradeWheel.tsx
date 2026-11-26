import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { sectorRanges, type Odds, type Outcome } from '../lib/odds'
import { sound } from '../lib/sound'

/**
 * Стиль как CaseSer: сектора стоят, крутится СТРЕЛКА по кругу.
 * 0° = верх, по часовой.
 */
export interface WheelHandle {
  spin(roll: number, oddsOverride?: Odds): Promise<void>
  reset(): void
}

interface Props {
  odds: Odds
  landed: Outcome | null
  spinning: boolean
}

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const UpgradeWheel = forwardRef<WheelHandle, Props>(({ odds, landed, spinning }, ref) => {
  const needle = useRef<SVGGElement>(null)
  const angle = useRef(0)
  const oddsRef = useRef(odds)
  const spinningRef = useRef(spinning)
  oddsRef.current = odds
  spinningRef.current = spinning

  const r = sectorRanges(odds)
  // Сектора в градусах: win [0..win], clover [win..win+clover], fail rest
  // У CaseSer часто «победа» снизу/сбоку — оставляем win сверху (0°)

  useEffect(() => {
    if (spinningRef.current || !needle.current) return
    needle.current.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)'
    needle.current.style.transform = 'rotate(0deg)'
    angle.current = 0
  }, [odds.winChance, odds.cloverChance, odds.valid])

  useImperativeHandle(ref, () => ({
    reset() {
      if (needle.current) {
        needle.current.style.transition = 'none'
        needle.current.style.transform = 'rotate(0deg)'
        angle.current = 0
      }
    },
    spin(roll: number, oddsOverride?: Odds) {
      return new Promise<void>((resolve) => {
        const o = oddsOverride ?? oddsRef.current
        if (oddsOverride) oddsRef.current = oddsOverride
        const el = needle.current
        if (!el) {
          resolve()
          return
        }
        const rg = sectorRanges(o)
        const key: Outcome =
          roll < o.winChance ? 'win' : roll < o.winChance + o.cloverChance ? 'clover' : 'fail'
        const [a0, a1] = rg[key]
        const span = Math.max(a1 - a0, 0.8)
        // точка остановки внутри сектора (чуть со смещением)
        const target = a0 + span * 0.4 + ((roll * 17) % 100) / 100 * span * 0.25

        const from = angle.current
        // 6–8 оборотов по часовой + до target
        const turns = 7 + Math.floor((roll % 10) / 3)
        const to = from - (from % 360) + 360 * turns + target

        el.style.transition = 'none'
        const dur = reduce() ? 900 : 7600
        const t0 = performance.now()
        // ease-out cubic
        const ease = (t: number) => 1 - Math.pow(1 - t, 3.4)
        let lastTick = Math.floor(from / 8)

        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / dur)
          const v = from + (to - from) * ease(t)
          el.style.transform = `rotate(${v}deg)`
          const k = Math.floor(v / 8)
          if (k !== lastTick) {
            lastTick = k
            if (t < 0.95) sound.play('tick')
          }
          if (t < 1) requestAnimationFrame(frame)
          else {
            angle.current = to
            resolve()
          }
        }
        requestAnimationFrame(frame)
      })
    },
  }))

  // SVG geometry
  const CX = 200
  const CY = 200
  const RO = 168 // outer ring
  const RI = 118 // inner hole
  const TRACK = 22

  const polar = (deg: number, rad: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [CX + rad * Math.cos(a), CY + rad * Math.sin(a)]
  }

  const arcPath = (a0: number, a1: number, outer: number, inner: number) => {
    if (a1 - a0 < 0.08) return ''
    let end = a1
    if (end - a0 >= 359.9) end = a0 + 359.9
    const large = end - a0 > 180 ? 1 : 0
    const [x0, y0] = polar(a0, outer)
    const [x1, y1] = polar(end, outer)
    const [x2, y2] = polar(end, inner)
    const [x3, y3] = polar(a0, inner)
    return `M${x0} ${y0}A${outer} ${outer} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${inner} ${inner} 0 ${large} 0 ${x3} ${y3}Z`
  }

  // ticks every 5°
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)

  const winDeg = Math.min(360, Math.max(0, odds.winChance * 3.6))
  const cloverDeg = Math.min(360 - winDeg, Math.max(0, odds.cloverChance * 3.6))

  return (
    <div className={`wheel caser-style ${landed ? 'landed-' + landed : ''} ${spinning ? 'is-spinning' : ''}`}>
      <svg viewBox="0 0 400 400" role="img" aria-label="Колесо апгрейда">
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b8ff6a" />
            <stop offset="45%" stopColor="#3dff8a" />
            <stop offset="100%" stopColor="#14964a" />
          </linearGradient>
          <linearGradient id="cloverGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee03a" />
            <stop offset="100%" stopColor="#2db810" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="arrowShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* rotating accent ring */}
        <g className="wheel-ring">
          <circle cx={CX} cy={CY} r={RO + 15} fill="none" stroke="rgba(57,255,128,.4)" strokeWidth="2.5" strokeDasharray="2 14" strokeLinecap="round" />
        </g>

        {/* outer dark ring */}
        <circle cx={CX} cy={CY} r={RO + 10} fill="#0d1410" stroke="rgba(65,255,130,.14)" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={RO + 4} fill="none" stroke="rgba(65,255,130,.08)" strokeWidth="1" />

        {/* track background (fail zone) */}
        <circle cx={CX} cy={CY} r={(RO + RI) / 2} fill="none" stroke="#131b15" strokeWidth={RO - RI} />

        {/* FAIL sector full ring then overlay win/clover */}
        <path d={arcPath(0, 360, RO, RI)} fill="#182219" />

        {/* WIN sector — зелёный */}
        {winDeg > 0.2 && (
          <path className="sec sec-win" d={arcPath(0, winDeg, RO, RI)} fill="url(#winGrad)" filter="url(#softGlow)" />
        )}

        {/* CLOVER sector — зелёный */}
        {cloverDeg > 0.2 && (
          <path
            className="sec sec-clover"
            d={arcPath(winDeg, winDeg + cloverDeg, RO, RI)}
            fill="url(#cloverGrad)"
          />
        )}

        {/* ticks */}
        {ticks.map((deg) => {
          const inWin = deg >= 0 && deg <= winDeg
          const inClover = deg > winDeg && deg <= winDeg + cloverDeg
          const [x1, y1] = polar(deg, RO - 2)
          const [x2, y2] = polar(deg, RO - (deg % 30 === 0 ? 14 : 8))
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={inWin || inClover ? 'rgba(0,0,0,0.4)' : '#2a352c'}
              strokeWidth={deg % 30 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          )
        })}

        {/* inner hole */}
        <circle cx={CX} cy={CY} r={RI - 4} fill="#0d1410" stroke="rgba(65,255,130,.16)" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={RI - 14} fill="#111a14" stroke="rgba(65,255,130,.08)" strokeWidth="1" />

        {/* rim labels — без точных % */}
        <text x={CX} y={CY - RO - 16} textAnchor="middle" fill="#8d9b91" fontSize="11" fontWeight="600">
          WIN
        </text>
        <text x={CX + RO + 14} y={CY + 4} textAnchor="start" fill="#8d9b91" fontSize="11" fontWeight="600">
          ·
        </text>
        <text x={CX} y={CY + RO + 28} textAnchor="middle" fill="#8d9b91" fontSize="11" fontWeight="600">
          FAIL
        </text>

        {/* === КРУТЯЩАЯСЯ СТРЕЛКА (без тонкой полоски, крупный зелёный наконечник) === */}
        <g
          ref={needle}
          style={{ transformOrigin: '200px 200px', willChange: 'transform' }}
          filter="url(#arrowShadow)"
        >
          {/* короткий толстый стебель — не полоска через всё колесо */}
          <line
            x1={CX}
            y1={CY - RO + 34}
            x2={CX}
            y2={CY - RO + 14}
            stroke="#3dff8a"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* крупный зелёный наконечник у обода */}
          <path
            d={`M${CX} ${CY - RO - 10} L${CX - 20} ${CY - RO + 30} L${CX} ${CY - RO + 18} L${CX + 20} ${CY - RO + 30} Z`}
            fill="#3dff8a"
            stroke="#063318"
            strokeWidth="1.4"
          />
          {/* центр */}
          <circle cx={CX} cy={CY} r="9" fill="#0d1410" stroke="#39ff80" strokeWidth="2.5" />
          <circle cx={CX} cy={CY} r="4" fill="#39ff80" />
        </g>
      </svg>

      {/* хаб — без чисел шансов */}
      <div className="wheel-hub caser-hub">
        <strong className={landed === 'win' ? 'hub-win' : landed === 'clover' ? 'hub-clover' : landed === 'fail' ? 'hub-fail' : ''}>
          {landed === 'win' ? 'WIN' : landed === 'clover' ? '×2' : landed === 'fail' ? 'FAIL' : spinning ? '···' : 'GO'}
        </strong>
        <span>
          {landed === 'win'
            ? 'Победа!'
            : landed === 'clover'
              ? 'Clover ×2'
              : landed === 'fail'
                ? 'Промах'
                : spinning
                  ? 'Крутим…'
                  : odds.valid
                    ? 'Удача'
                    : 'Выбери скины'}
        </span>
      </div>
    </div>
  )
})
