import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calcOdds, type Odds, type Outcome } from './lib/odds'
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
import { fetchMe, type AuthState, type User } from './lib/auth'
import { LoginScreen } from './components/LoginScreen'
import { AdminPanel, ProfilePanel } from './components/AccountPanels'

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
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })
  useEffect(() => { fetchMe().then(a => setAuth(a.status === 'out' && !a.error && new URLSearchParams(location.search).get('auth_error') ? { status: 'out', error: 'Не удалось войти через Steam, попробуйте ещё раз' } : a)) }, [])
  if (auth.status === 'loading') return <div className="app boot"><Clover size={56} className="spin" /></div>
  if (auth.status === 'out') return <LoginScreen error={auth.error} />
  return <Game key={auth.user.id} user={auth.user} balance={auth.balance} />
}

function Game({ user, balance }: { user: User; balance: number }) {
  const k = (n: string) => `${user.id}.${n}`
  const [inv, setInv] = useState<Inv[]>(() => load(k('inv'), DEMO_INV))
  const [srcUid, setSrcUid] = useState<string | null>(() => load(k('src'), null))
  const [tgtId, setTgtId] = useState<string | null>(() => load(k('tgt'), null))
  const [cache, setCache] = useState<Record<string, Item>>({})
  const [history, setHistory] = useState<HistoryRow[]>(() => load(k('hist'), SEED))
  const [soundOn, setSoundOn] = useState(sound.enabled)
  const [phase, setPhase] = useState<Phase>('idle')
  const [landed, setLanded] = useState<Outcome | null>(null)
  const [res, setRes] = useState<UpgradeResult | null>(null)
  const [chain, setChain] = useState<{ i: number; stake: number; target: number; odds: Odds } | null>(null)
  const [fx, setFx] = useState<{ source: Item; first: Item; final: Item; quick: boolean; done: () => void } | null>(null)
  const [picker, setPicker] = useState<null | 'source' | 'target'>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const adminIds = (import.meta.env.VITE_ADMIN_STEAM_IDS || '').split(',').map((x: string) => x.trim()).filter(Boolean)
  const isAdmin = adminIds.includes(user.id)
  const [toasts, setToasts] = useState<{ id: number; m: string }[]>([])
  const wheel = useRef<WheelHandle>(null)

  const toast = useCallback((m: string) => {
    const id = Date.now() + Math.random(); setToasts(t => [...t.slice(-2), { id, m }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  const remember = useCallback((items: Item[]) => setCache(c => { const n = { ...c }; items.forEach(i => (n[i.id] = i)); return n }), [])
  useEffect(() => { catalog.getMany([...inv.map(i => i.itemId), ...(tgtId ? [tgtId] : [])]).then(remember).catch(() => toast('Не удалось загрузить каталог')) }, [inv, tgtId, remember, toast])
  useEffect(() => save(k('inv'), inv), [inv]); useEffect(() => save(k('src'), srcUid), [srcUid]); useEffect(() => save(k('tgt'), tgtId), [tgtId])
  useEffect(() => save(k('hist'), history.slice(0, 30)), [history])

  const srcEntry = inv.find(i => i.uid === srcUid) ?? null
  const source = srcEntry ? cache[srcEntry.itemId] ?? null : null
  const target = tgtId ? cache[tgtId] ?? null : null
  const odds = useMemo(() => calcOdds(source?.price ?? 0, target?.price ?? 0), [source, target])
  const shownOdds = chain ? chain.odds : odds
  useEffect(() => { if (phase === 'idle') setChain(null) }, [phase])
  const busy = phase === 'spinning' || phase === 'clover'
  const canGo = !!source && !!target && odds.valid && !busy

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
  const run = async (s: Item, t: Item, uidToSpend: string) => {
    setLanded(null); setRes(null); setChain(null); setPhase('spinning'); sound.play('start')
    try {
      const r = await upgradeApi.perform(s, t)
      remember([r.final, r.first, ...r.steps.map(x => x.targetItem)].filter(Boolean) as Item[])
      for (let i = 0; i < r.steps.length; i++) {
        const st = r.steps[i]
        if (i > 0) { setChain({ i, stake: st.stake, target: st.target, odds: st.odds }); await sleep(60); wheel.current!.reset(); await sleep(700) }
        await wheel.current!.spin(st.roll)
        sound.play('stop'); setLanded(st.outcome)
        await sleep(700)
        if (st.outcome === 'clover' && i < r.steps.length - 1) {
          sound.play('clover'); setPhase('clover')
          await new Promise<void>(done => setFx({ source: i === 0 ? s : r.steps[i].targetItem, first: st.targetItem, final: r.steps[i + 1].targetItem, quick: i > 0, done }))
          setFx(null); setLanded(null); setPhase('spinning')
        }
      }
      const add = r.final ? [{ uid: uid(), itemId: r.final.id }] : []
      setInv(v => [...v.filter(i => i.uid !== uidToSpend), ...add]); setSrcUid(null); setRes(r)
      setHistory(h => [{ id: uid(), player: 'Вы', hue: 140, src: s.name, srcPrice: s.price ?? 0, dst: r.final?.name, dstPrice: r.final?.price ?? undefined, status: r.outcome === 'win' ? 'win' : r.outcome, you: true }, ...h])
      sound.play(r.final ? (r.steps.length > 1 ? 'clover' : 'win') : 'fail'); setPhase('result')
    } catch (e) { setFx(null); setPhase('idle'); toast((e as Error).message) }
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
      <Navbar balance={balance} user={user} onTopUp={() => toast('Пополнение баланса пока не подключено')} sound={soundOn}
        onSound={() => { sound.setEnabled(!soundOn); setSoundOn(!soundOn); sound.play('select') }} onToast={toast} onProfile={() => setProfileOpen(true)} onAdmin={() => setAdminOpen(true)} isAdmin={isAdmin} />
      <main>
        <div className="head">
          <div><h1>Апгрейдер</h1><p>Улучшайте предмет до более дорогого. Шанс считается по цене, сектор Clover — всегда {odds.cloverChance || 5}%.</p></div>
          {isDemoCatalog && <div className="demo-banner">Демо: инвентарь и цены локальные. Вход и баланс — настоящие (Steam + сервер)</div>}
        </div>
        <div className="workspace">
          <SourceSkinCard item={source} disabled={busy} onSelect={() => { sound.play('select'); setPicker('source') }} onClear={() => { setSrcUid(null); sound.play('select') }} />
          <div className="center">
            {chain && <div className="chain-banner"><Clover size={14} /> Цепочка Clover x2 · колесо {chain.i + 1} · {money(chain.stake)} → {money(chain.target)}</div>}
            <UpgradeWheel ref={wheel} odds={shownOdds} landed={landed} spinning={phase === 'spinning'} />
            <button className="btn go" disabled={!canGo} onClick={go}>{phase === 'spinning' ? 'Вращение…' : 'Апгрейд'}</button>
            <div className="odds" aria-live="polite">
              <div><span>Основной шанс</span><b>{shownOdds.valid ? shownOdds.winChance.toFixed(2) + '%' : '—'}</b></div>
              <div className="o-clover"><span><Clover size={13} /> Clover</span><b>{shownOdds.cloverChance ? shownOdds.cloverChance + '%' : '—'}</b></div>
              <div><span>Множитель</span><b>x{shownOdds.cloverMultiplier}</b></div>
              <div><span>Всего на успех</span><b>{shownOdds.valid ? shownOdds.totalWin.toFixed(2) + '%' : '—'}</b></div>
            </div>
            <p className="math">{chain ? `Колесо ${chain.i + 1}: ставка ${money(chain.stake)} → ${money(chain.target)}, шанс ${chain.odds.winChance}%. Clover снова удваивает и ведёт на следующее колесо, fail — потеря всего.` : odds.valid ? `Шанс = ${money(source!.price!)} / ${money(target!.price!)} × 95% (комиссия 5%). Clover x2: до ${money(odds.cloverCeiling)}. Ожидаемый возврат ${money(odds.expectedReturn)}.`
              : source && target ? 'Цель должна быть дороже вашего предмета.' : 'Выберите предмет и цель — шанс рассчитается автоматически.'}</p>
          </div>
          <TargetSkinCard item={target} source={source} odds={odds} disabled={busy} onSelect={() => { sound.play('select'); setPicker('target') }} onClear={() => { setTgtId(null); sound.play('select') }} />
        </div>
        <UpgradeHistory rows={history} />
      </main>

      {picker && <SkinSelectorModal mode={picker === 'source' ? 'inventory' : 'catalog'} fetcher={picker === 'source' ? pickSource : pickTarget}
        selected={picker === 'source' ? srcUid ?? undefined : tgtId ?? undefined} onClose={() => setPicker(null)}
        onPick={e => { sound.play('select'); if (picker === 'source') setSrcUid(e.uid!); else { remember([e.item]); setTgtId(e.item.id) } setLanded(null); setPicker(null) }} />}
      {profileOpen && <ProfilePanel user={user} balance={balance} inventory={inv.map(e => cache[e.itemId]).filter(Boolean)} history={history} onClose={() => setProfileOpen(false)} onLogout={() => { location.href = '/api/auth?a=logout' }} />}
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} onToast={toast} />}
      {fx && <CloverX2Animation source={fx.source} first={fx.first} final={fx.final} quick={fx.quick} onDone={fx.done} />}
      {phase === 'result' && res && <UpgradeResultModal res={res} onClose={() => { setPhase('idle'); setLanded(null) }} onRepeat={repeat} onNew={() => { setPhase('idle'); setLanded(null); setPicker('source') }} />}
      <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className="toast">{t.m}</div>)}</div>
    </div>
  )
}
