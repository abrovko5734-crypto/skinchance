import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calcOdds, type Outcome } from './lib/odds'
import { sound } from './lib/sound'
import { load, money, save } from './lib/storage'
import { catalog, isDemoCatalog } from './services/itemCatalog'
import { makeId } from './services/sampleCatalog'
import { upgradeApi, type UpgradeResult } from './services/upgradeService'
import type { Entry, Item, Query } from './services/types'
import { Navbar } from './components/Navbar'
import { SourceSkinCard, TargetSkinCard } from './components/SkinCards'
import { UpgradeWheel, type WheelHandle } from './components/UpgradeWheel'
import { SkinSelectorModal } from './components/SkinSelectorModal'
import { CloverX2Animation } from './components/CloverX2Animation'
import { UpgradeResultModal } from './components/UpgradeResultModal'
import { UpgradeHistory, type HistoryRow } from './components/UpgradeHistory'
import { Clover } from './components/ui'

interface Inv { uid: string; itemId: string }
const uid = () => Math.random().toString(36).slice(2, 10)
// Демо-инвентарь (НЕ Steam). Замените на ответ реального API инвентаря.
const DEMO_INV: Inv[] = [['AK-47', 'Redline', 'FT'], ['P90', 'Asiimov', 'FT'], ['M4A1-S', 'Hyper Beast', 'FT'], ['Glock-18', 'Water Elemental', 'FT'], ['AWP', 'Asiimov', 'FT'], ['Tec-9', 'Fuel Injector', 'FT'], ['P2000', 'Fire Elemental', 'FT']]
  .map(([w, s, x]) => ({ uid: uid(), itemId: makeId(w, s, x) }))
const SEED: HistoryRow[] = [
  { id: 's1', player: 'Nord', hue: 150, src: 'P90 | Asiimov', srcPrice: 5.1, dst: 'AWP | Hyper Beast', dstPrice: 48, status: 'win' },
  { id: 's2', player: 'Vektor', hue: 30, src: 'Tec-9 | Fuel Injector', srcPrice: 2.4, dst: 'AK-47 | Redline', dstPrice: 32, status: 'clover' },
  { id: 's3', player: 'Lira', hue: 260, src: 'AWP | Asiimov', srcPrice: 62, status: 'fail' },
  { id: 's4', player: 'Kaito', hue: 200, src: 'M4A4 | Asiimov', srcPrice: 44, dst: 'Karambit | Doppler', dstPrice: 760, status: 'fail' },
]
type Phase = 'idle' | 'spinning' | 'clover' | 'result'

export default function App() {
  const [inv, setInv] = useState<Inv[]>(() => load('inv', DEMO_INV))
  const [srcUid, setSrcUid] = useState<string | null>(() => load('src', null))
  const [tgtId, setTgtId] = useState<string | null>(() => load('tgt', null))
  const [cache, setCache] = useState<Record<string, Item>>({})
  const [balance, setBalance] = useState(() => load('bal', 100))
  const [history, setHistory] = useState<HistoryRow[]>(() => load('hist', SEED))
  const [soundOn, setSoundOn] = useState(sound.enabled)
  const [phase, setPhase] = useState<Phase>('idle')
  const [landed, setLanded] = useState<Outcome | null>(null)
  const [res, setRes] = useState<UpgradeResult | null>(null)
  const [picker, setPicker] = useState<null | 'source' | 'target'>(null)
  const [toasts, setToasts] = useState<{ id: number; m: string }[]>([])
  const wheel = useRef<WheelHandle>(null)

  const toast = useCallback((m: string) => {
    const id = Date.now() + Math.random(); setToasts(t => [...t.slice(-2), { id, m }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  const remember = useCallback((items: Item[]) => setCache(c => { const n = { ...c }; items.forEach(i => (n[i.id] = i)); return n }), [])
  useEffect(() => { catalog.getMany([...inv.map(i => i.itemId), ...(tgtId ? [tgtId] : [])]).then(remember).catch(() => toast('Не удалось загрузить каталог')) }, [inv, tgtId, remember, toast])
  useEffect(() => save('inv', inv), [inv]); useEffect(() => save('src', srcUid), [srcUid]); useEffect(() => save('tgt', tgtId), [tgtId])
  useEffect(() => save('bal', balance), [balance]); useEffect(() => save('hist', history.slice(0, 30)), [history])

  const srcEntry = inv.find(i => i.uid === srcUid) ?? null
  const source = srcEntry ? cache[srcEntry.itemId] ?? null : null
  const target = tgtId ? cache[tgtId] ?? null : null
  const odds = useMemo(() => calcOdds(source?.price ?? 0, target?.price ?? 0), [source, target])
  const busy = phase === 'spinning' || phase === 'clover'
  const canGo = !!source && !!target && odds.valid && !busy

  const run = async (s: Item, t: Item, uidToSpend: string) => {
    setLanded(null); setRes(null); setPhase('spinning'); sound.play('start')
    try {
      const r = await upgradeApi.perform(s, t)
      await wheel.current!.spin(r.roll)
      sound.play('stop'); setLanded(r.outcome)
      // применяем результат (в продакшене инвентарь придёт с сервера)
      const add = r.final ? [{ uid: uid(), itemId: r.final.id }] : []
      remember([r.final, r.first].filter(Boolean) as Item[])
      setInv(v => [...v.filter(i => i.uid !== uidToSpend), ...add]); setSrcUid(null); setRes(r)
      setHistory(h => [{ id: uid(), player: 'Вы', hue: 140, src: s.name, srcPrice: s.price ?? 0, dst: r.final?.name, dstPrice: r.final?.price ?? undefined, status: r.outcome === 'win' ? 'win' : r.outcome, you: true }, ...h])
      await new Promise(x => setTimeout(x, 700))
      if (r.outcome === 'clover') { sound.play('clover'); setPhase('clover') } else { sound.play(r.outcome === 'win' ? 'win' : 'fail'); setPhase('result') }
    } catch (e) { setPhase('idle'); toast((e as Error).message) }
  }
  const go = () => canGo && srcEntry && run(source!, target!, srcEntry.uid)

  const repeat = () => {
    const last = res?.source; setPhase('idle'); setLanded(null)
    const same = last && inv.find(i => i.itemId === last.id)
    if (same) { setSrcUid(same.uid); toast('Выбрана копия предмета — нажмите «Апгрейд»') }
    else { toast('Предмет списан — выберите новый'); setPicker('source') }
  }
  const pickSource = useCallback(async (q: Query): Promise<Entry[]> => {
    const all = await catalog.search(q), by = new Map(all.map(i => [i.id, i]))
    return inv.filter(e => by.has(e.itemId)).map(e => ({ item: by.get(e.itemId)!, uid: e.uid, disabledReason: e.itemId === tgtId ? 'Уже цель' : undefined }))
      .sort((a, b) => all.indexOf(a.item) - all.indexOf(b.item))
  }, [inv, tgtId])
  const pickTarget = useCallback(async (q: Query): Promise<Entry[]> => (await catalog.search(q)).filter(i => i.price != null).map(item => ({
    item, disabledReason: source && (item.price ?? 0) <= (source.price ?? 0) ? 'Дешевле предмета' : undefined })), [source])

  return (
    <div className="app">
      <Navbar balance={balance} onTopUp={() => { setBalance(b => b + 50); toast('Демо: +$50 на тестовый баланс') }} sound={soundOn}
        onSound={() => { sound.setEnabled(!soundOn); setSoundOn(!soundOn); sound.play('select') }} onToast={toast} />
      <main>
        <div className="head">
          <div><h1>Апгрейдер</h1><p>Улучшайте предмет до более дорогого. Шанс считается по цене, сектор Clover — всегда {odds.cloverChance || 5}%.</p></div>
          {isDemoCatalog && <div className="demo-banner">Демо-режим: инвентарь и цены локальные, Steam не подключён</div>}
        </div>
        <div className="workspace">
          <SourceSkinCard item={source} disabled={busy} onSelect={() => { sound.play('select'); setPicker('source') }} onClear={() => { setSrcUid(null); sound.play('select') }} />
          <div className="center">
            <UpgradeWheel ref={wheel} odds={odds} landed={landed} spinning={phase === 'spinning'} />
            <button className="btn go" disabled={!canGo} onClick={go}>{phase === 'spinning' ? 'Вращение…' : 'Апгрейд'}</button>
            <div className="odds" aria-live="polite">
              <div><span>Основной шанс</span><b>{odds.valid ? odds.winChance.toFixed(2) + '%' : '—'}</b></div>
              <div className="o-clover"><span><Clover size={13} /> Clover</span><b>{odds.cloverChance ? odds.cloverChance + '%' : '—'}</b></div>
              <div><span>Множитель</span><b>x{odds.cloverMultiplier}</b></div>
              <div><span>Всего на успех</span><b>{odds.valid ? odds.totalWin.toFixed(2) + '%' : '—'}</b></div>
            </div>
            <p className="math">{odds.valid ? `Шанс = ${money(source!.price!)} / ${money(target!.price!)} × 95% (комиссия 5%). Clover x2: до ${money(odds.cloverCeiling)}. Ожидаемый возврат ${money(odds.expectedReturn)}.`
              : source && target ? 'Цель должна быть дороже вашего предмета.' : 'Выберите предмет и цель — шанс рассчитается автоматически.'}</p>
          </div>
          <TargetSkinCard item={target} source={source} odds={odds} disabled={busy} onSelect={() => { sound.play('select'); setPicker('target') }} onClear={() => { setTgtId(null); sound.play('select') }} />
        </div>
        <UpgradeHistory rows={history} />
      </main>

      {picker && <SkinSelectorModal mode={picker === 'source' ? 'inventory' : 'catalog'} fetcher={picker === 'source' ? pickSource : pickTarget}
        selected={picker === 'source' ? srcUid ?? undefined : tgtId ?? undefined} onClose={() => setPicker(null)}
        onPick={e => { sound.play('select'); if (picker === 'source') setSrcUid(e.uid!); else { remember([e.item]); setTgtId(e.item.id) } setLanded(null); setPicker(null) }} />}
      {phase === 'clover' && res?.first && res.final && <CloverX2Animation source={res.source} first={res.first} final={res.final} onDone={() => setPhase('result')} />}
      {phase === 'result' && res && <UpgradeResultModal res={res} onClose={() => { setPhase('idle'); setLanded(null) }} onRepeat={repeat} onNew={() => { setPhase('idle'); setLanded(null); setPicker('source') }} />}
      <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className="toast">{t.m}</div>)}</div>
    </div>
  )
}
