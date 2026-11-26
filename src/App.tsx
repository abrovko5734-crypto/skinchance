import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calcOdds, targetForChance, targetForMult, type Odds, type Outcome } from './lib/odds'
import { sound } from './lib/sound'
import { load, money, save } from './lib/storage'
import { catalog } from './services/itemCatalog'
import { upgradeApi, type UpgradeResult } from './services/upgradeService'
import type { Entry, Item, Query } from './services/types'
import { Navbar, type Tab } from './components/Navbar'
import { SourceSkinCard, TargetSkinCard } from './components/SkinCards'
import { UpgradeWheel, type WheelHandle } from './components/UpgradeWheel'
import { SkinSelectorModal } from './components/SkinSelectorModal'
import { CloverX2Animation } from './components/CloverX2Animation'
import { UpgradeResultModal } from './components/UpgradeResultModal'
import { UpgradeHistory, type HistoryRow } from './components/UpgradeHistory'
import { Clover } from './components/ui'
import { fetchMe, deltaBalance, type AuthState, type User, isAdminUser } from './lib/auth'
import { LoginScreen } from './components/LoginScreen'
import { CasesPage } from './components/CasesPage'
import { ContractsPage } from './components/ContractsPage'
import { InventoryPage } from './components/InventoryPage'
import { AdminPanel } from './components/AdminPanel'
import { ProfilePage } from './components/ProfilePage'
import { TopUpModal } from './components/TopUpModal'

interface Inv { uid: string; itemId: string }
const uid = () => Math.random().toString(36).slice(2, 10)

const SEED: HistoryRow[] = [
  { id: 's1', player: 'Nord', hue: 150, src: 'P90 | Asiimov', srcPrice: 135, dst: 'AWP | Hyper Beast', dstPrice: 1250, status: 'win' },
  { id: 's2', player: 'Vektor', hue: 30, src: 'Tec-9 | Fuel Injector', srcPrice: 65, dst: 'AK-47 | Redline', dstPrice: 480, status: 'clover' },
  { id: 's3', player: 'Lira', hue: 260, src: 'AWP | Asiimov', srcPrice: 1580, status: 'fail' },
]

type Phase = 'idle' | 'spinning' | 'clover' | 'result'

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })
  useEffect(() => {
    fetchMe().then((a) => {
      if (a.status === 'out' && new URLSearchParams(location.search).get('auth_error')) {
        setAuth({ status: 'out', error: 'Не удалось войти через Steam' })
      } else setAuth(a)
    })
  }, [])

  const userKey = auth.status === 'in' ? auth.user.id : 'none'
  const [balance, setBalance] = useState(0)
  const [inv, setInv] = useState<Inv[]>([])
  const [history, setHistory] = useState<HistoryRow[]>(SEED)
  const [soundOn, setSoundOn] = useState(true)
  const [tab, setTab] = useState<Tab>('cases')
  const [toasts, setToasts] = useState<{ id: string; m: string }[]>([])
  const [ready, setReady] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)

  const [srcUid, setSrcUid] = useState<string | null>(null)
  const [tgtId, setTgtId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [res, setRes] = useState<UpgradeResult | null>(null)
  const [landed, setLanded] = useState<Outcome | null>(null)
  const [picker, setPicker] = useState<'source' | 'target' | null>(null)
  const [fx, setFx] = useState<{ source: Item; first: Item; final: Item; quick: boolean; done: () => void } | null>(null)
  const [itemsCache, setItemsCache] = useState<Record<string, Item>>({})
  const wheelRef = useRef<WheelHandle>(null)

  const toast = useCallback((m: string) => {
    const id = uid()
    setToasts((t) => [...t, { id, m }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  useEffect(() => {
    if (auth.status !== 'in') return
    // Баланс только с сервера (Redis) — не из localStorage
    setBalance(auth.balance ?? 0)
    setInv(load<Inv[]>(`inv.${userKey}`, []))
    setHistory(load<HistoryRow[]>(`hist.${userKey}`, SEED))
    setReady(true)
    catalog.load()
  }, [auth, userKey])

  useEffect(() => { if (ready) save(`inv.${userKey}`, inv) }, [inv, userKey, ready])
  useEffect(() => { if (ready) save(`hist.${userKey}`, history.slice(0, 50)) }, [history, userKey, ready])
  useEffect(() => { sound.enabled = soundOn }, [soundOn])

  /** Синхронизация баланса с сервером */
  const applyDelta = useCallback(async (amount: number): Promise<boolean> => {
    const res = await deltaBalance(amount)
    if (!res.ok) {
      toast(res.message || 'Недостаточно DP')
      if (typeof res.balance === 'number') setBalance(res.balance)
      return false
    }
    setBalance(res.balance)
    return true
  }, [toast])

  const remember = useCallback((list: Item[]) => {
    setItemsCache((c) => {
      const n = { ...c }
      for (const it of list) n[it.id] = it
      return n
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    ;(async () => {
      const missing = [...new Set(inv.filter((i) => !itemsCache[i.itemId]).map((i) => i.itemId))]
      const loaded: Item[] = []
      for (const id of missing) {
        const it = await catalog.byId(id)
        if (it) loaded.push(it)
      }
      if (loaded.length) remember(loaded)
    })()
  }, [inv, ready]) // eslint-disable-line

  const inventoryEntries = useMemo(() => {
    return inv
      .map((i) => {
        const item = itemsCache[i.itemId]
        return item ? ({ item, uid: i.uid } as Entry) : null
      })
      .filter(Boolean) as Entry[]
  }, [inv, itemsCache])

  const source = srcUid ? inventoryEntries.find((e) => e.uid === srcUid)?.item ?? null : null
  const target = tgtId ? itemsCache[tgtId] ?? null : null
  // Display odds: force clover check stable for UI by not re-rolling appear on every render
  // We compute base odds without random clover for display; actual roll uses random in perform
  const odds: Odds = useMemo(() => {
    if (!source || !target) return calcOdds(0, 0)
    // For UI show potential clover (force true if win>=5) so user sees max clover sector
    const base = calcOdds(source.price ?? 0, target.price ?? 0, undefined, true)
    // But if win < 5, clover already 0
    return base
  }, [source, target])

  const busy = phase === 'spinning' || phase === 'clover'
  const canGo = !!source && !!target && odds.valid && phase === 'idle'

  const pickSource = useCallback(async (q: Query) => {
    let list = inventoryEntries
    if (q.text) {
      const t = q.text.toLowerCase()
      list = list.filter((e) => e.item.name.toLowerCase().includes(t))
    }
    if (q.category !== 'all') list = list.filter((e) => e.item.category === q.category)
    return list
  }, [inventoryEntries])

  const pickTarget = useCallback(async (q: Query) => {
    const list = await catalog.search(q)
    remember(list.map((e) => e.item))
    return list
  }, [remember])

  const addItem = useCallback((itemId: string) => {
    setInv((prev) => [...prev, { uid: uid(), itemId }])
  }, [])

  const removeItems = useCallback((uids: string[]) => {
    setInv((prev) => prev.filter((i) => !uids.includes(i.uid)))
  }, [])

  const sellItem = useCallback(async (u: string, price: number) => {
    setInv((prev) => prev.filter((i) => i.uid !== u))
    await applyDelta(price)
  }, [applyDelta])

  const sellAll = useCallback(async () => {
    const total = inventoryEntries.reduce((s, e) => s + (e.item.price ?? 0), 0)
    if (total <= 0) return
    setInv([])
    await applyDelta(total)
  }, [inventoryEntries, applyDelta])

  const applyPreset = async (kind: 'chance' | 'mult', value: number) => {
    if (!source) {
      toast('Сначала выберите предмет')
      return
    }
    const price = source.price ?? 0
    const targetPrice = kind === 'chance' ? targetForChance(price, value) : targetForMult(price, value)
    const item = await catalog.closest(targetPrice * 1.15, targetPrice * 0.7, source)
    if (item && item.id !== source.id && (item.price ?? 0) > price) {
      remember([item])
      setTgtId(item.id)
      setLanded(null)
      sound.play('select')
    } else {
      toast('Не найден подходящий скин')
    }
  }

  const go = async () => {
    if (!canGo || !source || !target) return
    setPhase('spinning')
    setLanded(null)
    try {
      const result = await upgradeApi.perform(source, target)
      setRes(result)
      await wheelRef.current?.spin(result.roll, result.odds)
      setLanded(result.steps[0].outcome)

      if (result.steps.length > 1 && result.outcome === 'clover' && result.first && result.final) {
        setPhase('clover')
        await new Promise<void>((resolve) => {
          setFx({
            source,
            first: result.first!,
            final: result.final!,
            quick: false,
            done: () => { setFx(null); resolve() },
          })
        })
      }

      if (srcUid) setInv((prev) => prev.filter((i) => i.uid !== srcUid))
      if (result.outcome === 'win' || (result.outcome === 'clover' && result.final)) {
        const won = result.final ?? result.target
        addItem(won.id)
        remember([won])
      }

      const userName = auth.status === 'in' ? auth.user.name : 'Вы'
      setHistory((h) => [
        {
          id: uid(),
          player: userName,
          hue: Math.floor(Math.random() * 360),
          src: source.name,
          srcPrice: source.price ?? 0,
          dst: (result.final ?? result.target).name,
          dstPrice: (result.final ?? result.target).price ?? 0,
          status: (result.outcome === 'clover' && result.final ? 'clover' : result.outcome === 'win' ? 'win' : 'fail') as 'win' | 'clover' | 'fail',
        },
        ...h,
      ].slice(0, 50))

      setPhase('result')
      setSrcUid(null)
    } catch (e: any) {
      toast(e?.message || 'Ошибка апгрейда')
      setPhase('idle')
    }
  }

  if (auth.status === 'loading') {
    return (
      <div className="app loading">
        <Clover size={48} className="spin-clover" />
        <p>Загрузка…</p>
      </div>
    )
  }

  if (auth.status === 'out') {
    return <LoginScreen error={auth.error} />
  }

  const user: User = auth.user
  const shownOdds = res && phase !== 'idle' ? res.odds : odds
  const invValue = inventoryEntries.reduce((s, e) => s + (e.item.price ?? 0), 0)

  return (
    <div className="app">
      <Navbar
        balance={balance}
        user={user}
        onTopUp={() => setShowTopUp(true)}
        sound={soundOn}
        onSound={() => setSoundOn((s) => !s)}
        tab={tab}
        onTab={setTab}
      />

      <main className="main">
        {tab === 'cases' && (
          <CasesPage balance={balance} onSpend={applyDelta} onAddItem={addItem} onToast={toast} />
        )}
        {tab === 'contracts' && (
          <ContractsPage inventory={inventoryEntries} onRemoveItems={removeItems} onAddItem={addItem} onToast={toast} />
        )}
        {tab === 'inventory' && (
          <InventoryPage inventory={inventoryEntries} onSell={sellItem} onSellAll={sellAll} onToast={toast} />
        )}
        {tab === 'profile' && (
          <ProfilePage user={user} balance={balance} invCount={inventoryEntries.length} invValue={invValue} onTopUp={() => setShowTopUp(true)} />
        )}
        {tab === 'admin' && (
          <AdminPanel user={user} balance={balance} onBalance={setBalance} onAddItem={addItem} onToast={toast} />
        )}

        {tab === 'upgrade' && (
          <>
            <div className="upgrade-layout">
              <SourceSkinCard
                item={source}
                disabled={busy}
                onSelect={() => { sound.play('select'); setPicker('source') }}
                onClear={() => { setSrcUid(null); sound.play('select') }}
              />
              <div className="wheel-col">
                <UpgradeWheel ref={wheelRef} odds={shownOdds} landed={landed} spinning={phase === 'spinning'} />
                <div className="presets">
                  <button className="preset" disabled={!source || busy} onClick={() => applyPreset('chance', 80)}>Лёгкий</button>
                  <button className="preset" disabled={!source || busy} onClick={() => applyPreset('chance', 55)}>Средний</button>
                  <button className="preset" disabled={!source || busy} onClick={() => applyPreset('chance', 35)}>Риск</button>
                  <button className="preset" disabled={!source || busy} onClick={() => applyPreset('mult', 5)}>5×</button>
                  <button className="preset" disabled={!source || busy} onClick={() => applyPreset('mult', 10)}>10×</button>
                </div>
                <button className="btn go" disabled={!canGo} onClick={go}>
                  {phase === 'spinning' ? 'Вращение…' : 'Апгрейд'}
                </button>
                <div className="odds odds-clean" aria-live="polite">
                  <div className="o-clover">
                    <span><Clover size={13} /> Clover</span>
                    <b>{shownOdds.cloverActive ? 'активен ×2' : shownOdds.valid ? 'может выпасть' : '—'}</b>
                  </div>
                  <div>
                    <span>Зона</span>
                    <b className={shownOdds.valid ? 'zone-ok' : ''}>{shownOdds.valid ? 'зелёная' : '—'}</b>
                  </div>
                </div>
                <p className="math">
                  Зелёная зона — победа. Clover даёт ×2. Шансы скрыты — играй на удачу.
                </p>
              </div>
              <TargetSkinCard
                item={target}
                source={source}
                odds={odds}
                disabled={busy}
                onSelect={() => { sound.play('select'); setPicker('target') }}
                onClear={() => { setTgtId(null); sound.play('select') }}
              />
            </div>
            <UpgradeHistory rows={history} />
          </>
        )}
      </main>

      {picker && (
        <SkinSelectorModal
          mode={picker === 'source' ? 'inventory' : 'catalog'}
          fetcher={picker === 'source' ? pickSource : pickTarget}
          selected={picker === 'source' ? srcUid ?? undefined : tgtId ?? undefined}
          onClose={() => setPicker(null)}
          onPick={(e) => {
            sound.play('select')
            if (picker === 'source') setSrcUid(e.uid!)
            else { remember([e.item]); setTgtId(e.item.id) }
            setLanded(null)
            setPicker(null)
          }}
        />
      )}
      {fx && <CloverX2Animation source={fx.source} first={fx.first} final={fx.final} quick={fx.quick} onDone={fx.done} />}
      {phase === 'result' && res && (
        <UpgradeResultModal
          res={res}
          onClose={() => { setPhase('idle'); setLanded(null) }}
          onRepeat={() => { setPhase('idle'); setLanded(null); setRes(null) }}
          onNew={() => { setPhase('idle'); setLanded(null); setPicker('source') }}
        />
      )}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.m}</div>
        ))}
      </div>
    </div>
  )
}
