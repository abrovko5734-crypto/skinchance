import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calcOdds, type Odds, type Outcome } from './lib/odds'
import { sound } from './lib/sound'
import { load, money, save } from './lib/storage'
import { catalog, isDemoCatalog } from './services/itemCatalog'
import { makeId } from './services/sampleCatalog'
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
import { fetchMe, type AuthState, type User, isGuest } from './lib/auth'
import { LoginScreen } from './components/LoginScreen'
import { CasesPage } from './components/CasesPage'
import { ContractsPage } from './components/ContractsPage'
import { InventoryPage } from './components/InventoryPage'
import { AdminPanel } from './components/AdminPanel'

interface Inv {
  uid: string
  itemId: string
}

const uid = () => Math.random().toString(36).slice(2, 10)

const START_INV: Inv[] = [
  ['AK-47', 'Redline', 'FT'],
  ['P90', 'Asiimov', 'FT'],
  ['M4A1-S', 'Hyper Beast', 'FT'],
  ['Glock-18', 'Water Elemental', 'FT'],
  ['AWP', 'Asiimov', 'FT'],
  ['Tec-9', 'Fuel Injector', 'FT'],
  ['P2000', 'Fire Elemental', 'FT'],
  ['Desert Eagle', 'Printstream', 'FT'],
  ['M4A4', 'Temukau', 'FT'],
].map(([w, s, x]) => ({ uid: uid(), itemId: makeId(w, s, x) }))

const SEED: HistoryRow[] = [
  { id: 's1', player: 'Nord', hue: 150, src: 'P90 | Asiimov', srcPrice: 135, dst: 'AWP | Hyper Beast', dstPrice: 1250, status: 'win' },
  { id: 's2', player: 'Vektor', hue: 30, src: 'Tec-9 | Fuel Injector', srcPrice: 65, dst: 'AK-47 | Redline', dstPrice: 480, status: 'clover' },
  { id: 's3', player: 'Lira', hue: 260, src: 'AWP | Asiimov', srcPrice: 1580, status: 'fail' },
  { id: 's4', player: 'Kaito', hue: 200, src: 'M4A4 | Asiimov', srcPrice: 1150, dst: 'Karambit | Doppler', dstPrice: 19500, status: 'fail' },
]

type Phase = 'idle' | 'spinning' | 'clover' | 'result'

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })
  const [guest, setGuest] = useState(false)

  useEffect(() => {
    fetchMe().then((a) => {
      if (a.status === 'out' && !a.error && new URLSearchParams(location.search).get('auth_error')) {
        setAuth({ status: 'out', error: 'Не удалось войти через Steam' })
      } else {
        setAuth(a)
      }
    })
  }, [])

  // Local state keys per user
  const userKey = auth.status === 'in' ? auth.user.id : 'guest'
  const [balance, setBalance] = useState(0)
  const [inv, setInv] = useState<Inv[]>([])
  const [history, setHistory] = useState<HistoryRow[]>(SEED)
  const [soundOn, setSoundOn] = useState(true)
  const [tab, setTab] = useState<Tab>('cases')
  const [isAdmin, setIsAdmin] = useState(() => load('isAdmin', false))
  const [toasts, setToasts] = useState<{ id: string; m: string }[]>([])
  const [ready, setReady] = useState(false)

  // Upgrade state
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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // Load local data
  useEffect(() => {
    if (auth.status !== 'in' && !guest) return
    const bal = load(`bal.${userKey}`, 2500)
    const invData = load<Inv[]>(`inv.${userKey}`, START_INV)
    const hist = load<HistoryRow[]>(`hist.${userKey}`, SEED)
    setBalance(bal)
    setInv(invData)
    setHistory(hist)
    setReady(true)
    catalog.load().then(() => {
      // warm cache
    })
  }, [auth, guest, userKey])

  // Persist
  useEffect(() => {
    if (!ready) return
    save(`bal.${userKey}`, balance)
  }, [balance, userKey, ready])
  useEffect(() => {
    if (!ready) return
    save(`inv.${userKey}`, inv)
  }, [inv, userKey, ready])
  useEffect(() => {
    if (!ready) return
    save(`hist.${userKey}`, history.slice(0, 40))
  }, [history, userKey, ready])
  useEffect(() => {
    save('isAdmin', isAdmin)
  }, [isAdmin])
  useEffect(() => {
    sound.enabled = soundOn
  }, [soundOn])

  const remember = useCallback((list: Item[]) => {
    setItemsCache((c) => {
      const n = { ...c }
      for (const it of list) n[it.id] = it
      return n
    })
  }, [])

  const resolveItem = useCallback(
    async (id: string): Promise<Item | null> => {
      if (itemsCache[id]) return itemsCache[id]
      const it = await catalog.byId(id)
      if (it) remember([it])
      return it
    },
    [itemsCache, remember],
  )

  const inventoryEntries = useMemo(() => {
    return inv
      .map((i) => {
        const item = itemsCache[i.itemId]
        if (!item) return null
        return { item, uid: i.uid } as Entry
      })
      .filter(Boolean) as Entry[]
  }, [inv, itemsCache])

  // Load inventory items into cache
  useEffect(() => {
    if (!ready) return
    ;(async () => {
      const missing = inv.filter((i) => !itemsCache[i.itemId]).map((i) => i.itemId)
      if (missing.length === 0) return
      const unique = [...new Set(missing)]
      const loaded: Item[] = []
      for (const id of unique) {
        const it = await catalog.byId(id)
        if (it) loaded.push(it)
      }
      if (loaded.length) remember(loaded)
    })()
  }, [inv, ready]) // eslint-disable-line

  const source = srcUid ? inventoryEntries.find((e) => e.uid === srcUid)?.item ?? null : null
  const target = tgtId ? itemsCache[tgtId] ?? null : null
  const odds: Odds = useMemo(() => (source && target ? calcOdds(source.price ?? 0, target.price ?? 0) : calcOdds(0, 0)), [source, target])

  const busy = phase === 'spinning' || phase === 'clover'
  const canGo = !!source && !!target && odds.valid && phase === 'idle'

  const pickSource = useCallback(
    async (q: Query) => {
      const all = inventoryEntries
      let list = all
      if (q.text) {
        const t = q.text.toLowerCase()
        list = list.filter((e) => e.item.name.toLowerCase().includes(t))
      }
      if (q.category !== 'all') list = list.filter((e) => e.item.category === q.category)
      return list
    },
    [inventoryEntries],
  )

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

  const sellItem = useCallback(
    (u: string, price: number) => {
      setInv((prev) => prev.filter((i) => i.uid !== u))
      setBalance((b) => b + price)
    },
    [],
  )

  const sellAll = useCallback(() => {
    const total = inventoryEntries.reduce((s, e) => s + (e.item.price ?? 0), 0)
    setInv([])
    setBalance((b) => b + total)
  }, [inventoryEntries])

  const go = async () => {
    if (!canGo || !source || !target) return
    setPhase('spinning')
    setLanded(null)
    try {
      const result = await upgradeApi.perform(source, target)
      setRes(result)
      // animate wheel
      await wheelRef.current?.spin(result.odds, result.roll, result.steps[0].outcome)
      setLanded(result.steps[0].outcome)

      if (result.steps.length > 1 && result.outcome === 'clover' && result.first && result.final) {
        setPhase('clover')
        await new Promise<void>((resolve) => {
          setFx({
            source,
            first: result.first!,
            final: result.final!,
            quick: false,
            done: () => {
              setFx(null)
              resolve()
            },
          })
        })
      }

      // apply result to inventory
      if (srcUid) {
        setInv((prev) => prev.filter((i) => i.uid !== srcUid))
      }
      if (result.outcome === 'win' || (result.outcome === 'clover' && result.final)) {
        const won = result.final ?? result.target
        addItem(won.id)
        remember([won])
      }

      setHistory((h) => [
        {
          id: uid(),
          player: auth.status === 'in' ? auth.user.name : 'Вы',
          hue: Math.floor(Math.random() * 360),
          src: source.name,
          srcPrice: source.price ?? 0,
          dst: (result.final ?? result.target).name,
          dstPrice: (result.final ?? result.target).price ?? 0,
          status: result.outcome === 'clover' && result.final ? 'clover' : result.outcome === 'win' ? 'win' : 'fail',
        },
        ...h,
      ].slice(0, 40))

      setPhase('result')
      setSrcUid(null)
    } catch (e: any) {
      toast(e?.message || 'Ошибка апгрейда')
      setPhase('idle')
    }
  }

  const repeat = () => {
    setPhase('idle')
    setLanded(null)
    setRes(null)
  }

  const topUp = () => {
    // local top-up for guest / demo
    setBalance((b) => b + 500)
    toast('+500 DP (локальное пополнение)')
    sound.play('win')
  }

  // Auth screens
  if (auth.status === 'loading' && !guest) {
    return (
      <div className="app loading">
        <Clover size={48} className="spin-clover" />
        <p>Загрузка…</p>
      </div>
    )
  }

  if (auth.status === 'out' && !guest) {
    return (
      <LoginScreen
        error={auth.error}
        onGuest={() => {
          setGuest(true)
          setAuth({ status: 'in', user: { id: 'guest-local', name: 'Игрок', avatar: '' }, balance: 0 })
        }}
      />
    )
  }

  const user: User = auth.status === 'in' ? auth.user : { id: 'guest-local', name: 'Игрок', avatar: '' }

  const shownOdds = res && phase !== 'idle' ? res.odds : odds
  const chain = res && res.steps.length > 1 ? { i: 0, stake: res.steps[0].stake, target: res.steps[0].target, odds: res.steps[0].odds } : null

  return (
    <div className="app">
      <Navbar
        balance={balance}
        user={user}
        onTopUp={topUp}
        sound={soundOn}
        onSound={() => setSoundOn((s) => !s)}
        tab={tab}
        onTab={setTab}
      />

      <main className="main">
        {tab === 'cases' && (
          <CasesPage balance={balance} onBalance={setBalance} onAddItem={addItem} onToast={toast} />
        )}

        {tab === 'contracts' && (
          <ContractsPage
            inventory={inventoryEntries}
            onRemoveItems={removeItems}
            onAddItem={addItem}
            onToast={toast}
          />
        )}

        {tab === 'inventory' && (
          <InventoryPage inventory={inventoryEntries} onSell={sellItem} onSellAll={sellAll} onToast={toast} />
        )}

        {tab === 'admin' && (
          <AdminPanel
            balance={balance}
            onBalance={setBalance}
            onAddItem={addItem}
            onToast={toast}
            isAdmin={isAdmin}
            onToggleAdmin={() => setIsAdmin((a) => !a)}
          />
        )}

        {tab === 'upgrade' && (
          <>
            <div className="upgrade-layout">
              <SourceSkinCard
                item={source}
                disabled={busy}
                onSelect={() => {
                  sound.play('select')
                  setPicker('source')
                }}
                onClear={() => {
                  setSrcUid(null)
                  sound.play('select')
                }}
              />
              <div className="wheel-col">
                <UpgradeWheel ref={wheelRef} odds={shownOdds} landed={landed} spinning={phase === 'spinning'} />
                <button className="btn go" disabled={!canGo} onClick={go}>
                  {phase === 'spinning' ? 'Вращение…' : 'Апгрейд'}
                </button>
                <div className="odds" aria-live="polite">
                  <div>
                    <span>Основной шанс</span>
                    <b>{shownOdds.valid ? shownOdds.winChance.toFixed(2) + '%' : '—'}</b>
                  </div>
                  <div className="o-clover">
                    <span>
                      <Clover size={13} /> Clover
                    </span>
                    <b>{shownOdds.cloverChance ? shownOdds.cloverChance + '%' : '—'}</b>
                  </div>
                  <div>
                    <span>Множитель</span>
                    <b>x{shownOdds.cloverMultiplier}</b>
                  </div>
                  <div>
                    <span>Всего на успех</span>
                    <b>{shownOdds.valid ? shownOdds.totalWin.toFixed(2) + '%' : '—'}</b>
                  </div>
                </div>
                <p className="math">
                  {odds.valid
                    ? `Clover 20%. При попадании — следующее колесо с ~50% и падающим шансом. Цель должна быть дороже. Комиссия 5%.`
                    : source && target
                      ? 'Цель должна быть дороже вашего предмета.'
                      : 'Выберите предмет из инвентаря и цель — шанс рассчитается автоматически.'}
                </p>
              </div>
              <TargetSkinCard
                item={target}
                source={source}
                odds={odds}
                disabled={busy}
                onSelect={() => {
                  sound.play('select')
                  setPicker('target')
                }}
                onClear={() => {
                  setTgtId(null)
                  sound.play('select')
                }}
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
            else {
              remember([e.item])
              setTgtId(e.item.id)
            }
            setLanded(null)
            setPicker(null)
          }}
        />
      )}
      {fx && <CloverX2Animation source={fx.source} first={fx.first} final={fx.final} quick={fx.quick} onDone={fx.done} />}
      {phase === 'result' && res && (
        <UpgradeResultModal
          res={res}
          onClose={() => {
            setPhase('idle')
            setLanded(null)
          }}
          onRepeat={repeat}
          onNew={() => {
            setPhase('idle')
            setLanded(null)
            setPicker('source')
          }}
        />
      )}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.m}
          </div>
        ))}
      </div>
    </div>
  )
}
