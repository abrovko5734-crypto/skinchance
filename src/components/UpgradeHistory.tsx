import { money } from '../lib/storage'
import { Clover } from './ui'
export interface HistoryRow { id: string; player: string; hue: number; src: string; srcPrice: number; dst?: string; dstPrice?: number; status: 'win' | 'clover' | 'fail'; you?: boolean }
export function UpgradeHistory({ rows }: { rows: HistoryRow[] }) {
  return (
    <section className="history" aria-label="Последние апгрейды">
      <div className="hist-head"><h4 className="eyebrow">Последние апгрейды</h4><small>Чужие записи — демо</small></div>
      <ul>{rows.slice(0, 8).map(r => (
        <li key={r.id} className={`h-${r.status} ${r.you ? 'you' : ''}`}>
          <span className="av" style={{ background: `hsl(${r.hue} 30% 28%)` }}>{r.player[0]}</span>
          <span className="h-name">{r.player}{r.you && <em>вы</em>}</span>
          <span className="h-src">{r.src}<small>{money(r.srcPrice)}</small></span>
          <span className="h-arrow">→</span>
          <span className="h-dst">{r.dst ?? '—'}{r.dstPrice != null && <small>{money(r.dstPrice)}</small>}</span>
          <span className="h-status">{r.status === 'clover' && <Clover size={14} />}{{ win: 'Успех', clover: 'Clover x2', fail: 'Неудача' }[r.status]}</span>
        </li>))}</ul>
    </section>
  )
}
