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
export interface WheelHandle { spin(roll: number): Promise<void>; reset(): void }
interface Props { odds: Odds; landed: Outcome | null; spinning: boolean }
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const UpgradeWheel = forwardRef<WheelHandle, Props>(({ odds, landed, spinning }, ref) => {
  const pointer = useRef<SVGGElement>(null), angle = useRef(0), oddsRef = useRef(odds)
  oddsRef.current = odds
  const r = sectorRanges(odds)
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)
  useEffect(() => { if (spinning || !pointer.current) return; pointer.current.style.transition = 'transform .35s ease'; pointer.current.style.transform = 'rotate(0deg)'; angle.current = 0 }, [odds.winChance, odds.valid])
  useImperativeHandle(ref, () => ({
    reset() { if (pointer.current) { pointer.current.style.transition = 'none'; pointer.current.style.transform = 'rotate(0deg)'; angle.current = 0 } },
    spin(roll: number) {
      return new Promise<void>(done => {
        const o = oddsRef.current, el = pointer.current!, ranges = sectorRanges(o)
        const result: Outcome = roll < o.winChance ? 'win' : roll < o.winChance + o.cloverChance ? 'clover' : 'fail'
        const [a0, a1] = ranges[result]
        // Pointer is the moving part: it stops inside the outcome segment. The ring remains fixed.
        const stopAt = (a0 + a1) / 2
        const from = angle.current, to = from + 360 * 6 + stopAt - ((from % 360 + 360) % 360)
        el.style.transition = 'none'
        const dur = reduce() ? 550 : 4400, t0 = performance.now()
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - t, 4), v = from + (to - from) * eased
          el.style.transform = `rotate(${v}deg)`
          const tick = Math.floor(v / 5); if (tick !== Math.floor((v - (to - from) * 0.01) / 5) && t < .97) sound.play('tick')
          if (t < 1) requestAnimationFrame(frame); else { angle.current = to; done() }
        }
        requestAnimationFrame(frame)
      })
    },
  }))
  return <div className={`wheel pointer-wheel ${landed ? 'landed-' + landed : ''} ${spinning ? 'is-spinning' : ''}`}>
    <svg viewBox="0 0 400 400" role="img" aria-label={`Шанс ${odds.winChance}%, Clover ${odds.cloverChance}%`}>
      <defs>
        <linearGradient id="gw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d813"/><stop offset="1" stopColor="#1f9a0c"/></linearGradient>
        <linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c8f7a8"/><stop offset="1" stopColor="#8fe06a"/></linearGradient>
        <filter id="pointerGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx={C} cy={C} r={RO+8} fill="none" stroke="#1d221d" strokeWidth="2"/>
      <path d={arc(r.fail[0],r.fail[1])} fill="#191d19" stroke="#0a0b0a" strokeWidth="2"/>
      {ticks.map(a => { const p1=pt(RO-1,a),p2=pt(RO-10,a); return <line key={a} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#2b322b" strokeWidth="1.2"/> })}
      <path className="sec sec-win" d={arc(r.win[0],r.win[1])} fill="url(#gw)" stroke="#101610" strokeWidth="2"/>
      <path className="sec sec-clover" d={arc(r.clover[0],r.clover[1])} fill="url(#gc)" stroke="#101610" strokeWidth="2"/>
      <circle cx={C} cy={C} r={RI-6} fill="#0e100e" stroke="#1d221d" strokeWidth="2"/>
      <g ref={pointer} style={{transformOrigin:'200px 200px'}} className="spin-pointer">
        <path d="M200 29 L188 72 L200 62 L212 72 Z" fill="#eff7eb" stroke="#0a0b0a" strokeWidth="2" filter="url(#pointerGlow)"/>
        <path d="M200 42 L197 64 L200 60 L203 64 Z" fill="#43f51c"/>
      </g>
      <circle cx={C} cy={C} r="13" fill="#161b16" stroke="#3df41a" strokeWidth="2"/>
      <circle cx={C} cy={C} r="5" fill="#3df41a"/>
    </svg>
    <div className="wheel-hub"><Clover size={34} className="hub-clover"/><strong>{odds.valid ? odds.winChance.toFixed(2) : '—'}<em>%</em></strong><span>шанс апгрейда</span></div>
  </div>
})
