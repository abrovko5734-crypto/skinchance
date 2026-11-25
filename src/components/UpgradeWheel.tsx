import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { sectorRanges, type Odds, type Outcome } from '../lib/odds'
import { sound } from '../lib/sound'
import { Clover } from './ui'

const C = 200, RO = 188, RI = 142
const pt = (r: number, deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)] }
function arc(a0: number, a1: number) {
  if (a1 - a0 < 0.05) return ''
  if (a1 - a0 >= 359.9) a1 = a0 + 359.9
  const [x0, y0] = pt(RO, a0), [x1, y1] = pt(RO, a1), [x2, y2] = pt(RI, a1), [x3, y3] = pt(RI, a0), l = a1 - a0 > 180 ? 1 : 0
  return `M${x0} ${y0}A${RO} ${RO} 0 ${l} 1 ${x1} ${y1}L${x2} ${y2}A${RI} ${RI} 0 ${l} 0 ${x3} ${y3}Z`
}
export interface WheelHandle { spin(roll: number): Promise<void> }
interface Props { odds: Odds; landed: Outcome | null; spinning: boolean }
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const UpgradeWheel = forwardRef<WheelHandle, Props>(({ odds, landed, spinning }, ref) => {
  const rot = useRef<SVGGElement>(null), angle = useRef(0), oddsRef = useRef(odds)
  oddsRef.current = odds
  const r = sectorRanges(odds), cMid = (r.clover[0] + r.clover[1]) / 2
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)

  // при смене шанса возвращаем колесо в исходное положение
  useEffect(() => {
    if (spinning || !rot.current) return
    rot.current.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'
    rot.current.style.transform = 'rotate(0deg)'; angle.current = 0
  }, [odds.winChance, odds.valid]) // eslint-disable-line

  useImperativeHandle(ref, () => ({
    spin(roll: number) {
      return new Promise<void>(res => {
        const o = oddsRef.current, el = rot.current!, rg = sectorRanges(o)
        const key: Outcome = roll < o.winChance ? 'win' : roll < o.winChance + o.cloverChance ? 'clover' : 'fail'
        const [a0, a1] = rg[key], a = Math.min(a1 - 0.6, Math.max(a0 + 0.6, roll * 3.6))
        const from = angle.current, to = from - (from % 360) + 360 * 6 + (360 - a)
        el.style.transition = 'none'
        const dur = reduce() ? 600 : 5800, t0 = performance.now()
        const ss = (x: number) => x * x * (3 - 2 * x)
        const ease = (t: number) => (1 - (1 - t) ** 4) * (t < 0.15 ? ss(t / 0.15) : 1)
        let last = Math.floor(from / 12)
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / dur), v = from + (to - from) * ease(t)
          el.style.transform = `rotate(${v}deg)`
          const k = Math.floor(v / 12); if (k !== last) { last = k; if (t < 0.97) sound.play('tick') }
          if (t < 1) requestAnimationFrame(frame); else { angle.current = to; res() }
        }
        requestAnimationFrame(frame)
      })
    },
  }))

  return (
    <div className={`wheel ${landed ? 'landed-' + landed : ''} ${spinning ? 'is-spinning' : ''}`}>
      <svg viewBox="0 0 400 400" role="img" aria-label={`Шанс ${odds.winChance}%, Clover ${odds.cloverChance}%`}>
        <defs>
          <linearGradient id="gw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d813" /><stop offset="1" stopColor="#1f9a0c" /></linearGradient>
          <linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c8f7a8" /><stop offset="1" stopColor="#8fe06a" /></linearGradient>
        </defs>
        <circle cx={C} cy={C} r={RO + 6} fill="none" stroke="#1d221d" strokeWidth="1.5" />
        <circle cx={C} cy={C} r={RI - 6} fill="#0e100e" stroke="#1d221d" />
        <g ref={rot} style={{ transformOrigin: '200px 200px' }}>
          <path d={arc(r.fail[0], r.fail[1])} fill="#1a1e1a" />
          {ticks.map(a => a >= r.fail[0] && a <= r.fail[1] && <line key={a} x1={pt(RO - 1, a)[0]} y1={pt(RO - 1, a)[1]} x2={pt(RO - 9, a)[0]} y2={pt(RO - 9, a)[1]} stroke="#2a302a" strokeWidth="1.2" />)}
          <path className="sec sec-win" d={arc(r.win[0], r.win[1])} fill="url(#gw)" />
          <path className="sec sec-clover" d={arc(r.clover[0], r.clover[1])} fill="url(#gc)" />
          {odds.valid && (
            <g transform={`rotate(${cMid} 200 200)`}><foreignObject x={200 - 11} y={200 - 165 - 11} width="22" height="22"><Clover size={22} className="sec-icon" /></foreignObject></g>
          )}
        </g>
        <path d="M200 6l-9 -17h18z" transform="translate(0 20)" fill="#e9ede9" stroke="#0a0b0a" strokeWidth="2" />
        <rect x="199" y="30" width="2" height="32" rx="1" fill="#e9ede9" opacity=".9" />
      </svg>
      <div className="wheel-hub">
        <Clover size={34} className="hub-clover" />
        <strong>{odds.valid ? odds.winChance.toFixed(2) : '—'}<em>%</em></strong>
        <span>шанс апгрейда</span>
      </div>
    </div>
  )
})
