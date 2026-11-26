import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  Crosshair,
  Package,
  Plus,
  Search,
  Shield,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from "lucide-react";
import { CASES, PRICE_AS_OF, RATE_AS_OF, SKINS, SKIN_BY_ID, USD_UAH, type GameCase, type Skin } from "@/data/catalog";
import {
  calcOdds,
  caseStrip,
  closestSkin,
  cloverReward,
  rarityKey,
  RARITY_RU,
  resolveContract,
  rollCase,
  rollOutcome,
  targetForChance,
  wearCode,
  type Outcome,
} from "@/lib/skinchance/game";
import { dpLabel, formatDp, formatUah, normalizeTradeUrl, TRADE_HINT } from "@/lib/skinchance/money";
import { sound } from "@/lib/skinchance/sound";
import { skinOf, useGame, type InvItem } from "@/lib/skinchance/store";
import { UpgradeWheel, type WheelHandle } from "@/components/skinchance/Wheel";

type Tab = "cases" | "upgrade" | "contracts" | "inventory" | "profile";

const PACKS = [100, 250, 500, 1000, 2500, 10000];

function Price({ cents, compact }: { cents: number; compact?: boolean }) {
  return (
    <span className={compact ? "price compact" : "price"}>
      <img src="/dp.png" alt="" />
      <b>{formatDp(cents)}</b>
      {!compact && <small>{formatUah(cents)} грн</small>}
    </span>
  );
}

function SkinFace({ skin, compact }: { skin: Skin; compact?: boolean }) {
  const [broken, setBroken] = useState(false);
  return (
    <article className={compact ? "skin skin-sm" : "skin"} data-rarity={rarityKey(skin.rarity)}>
      <div className="skin-art">
        {broken ? (
          <span className="skin-fallback">{skin.weapon.replace("★ ", "").slice(0, 2)}</span>
        ) : (
          <img src={skin.image} alt="" onError={() => setBroken(true)} />
        )}
        <i>{wearCode(skin.wear)}</i>
        {skin.stattrak && <em className="st">ST</em>}
      </div>
      <div className="skin-meta">
        <strong>{skin.weapon.replace("★ ", "")}</strong>
        <span>{skin.skin}</span>
        <Price cents={skin.price} compact={compact} />
      </div>
    </article>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function SkinChanceApp() {
  const [tab, setTab] = useState<Tab>("cases");
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const [topup, setTopup] = useState(false);
  const [lock, setLock] = useState(false);
  const soundOn = useGame((s) => s.soundOn);
  const balance = useGame((s) => s.balance);
  const setSound = useGame((s) => s.setSound);
  const name = useGame((s) => s.profileName);

  useEffect(() => {
    sound.enabled = soundOn;
  }, [soundOn]);

  const toast = (text: string) => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const goTab = (next: Tab) => {
    if (lock) return;
    sound.click();
    setTab(next);
  };

  return (
    <div className="sc">
      <header className="topbar">
        <button className="brand" onClick={() => goTab("cases")}>
          <img src="/logo.png" alt="SkinChance" />
        </button>
        <nav className="nav-scroll" aria-label="Разделы">
          {(
            [
              ["cases", "Кейсы", Boxes],
              ["upgrade", "Апгрейд", Crosshair],
              ["contracts", "Контракты", Shield],
              ["inventory", "Инвентарь", Package],
              ["profile", "Профиль", Wallet],
            ] as const
          ).map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? "nav-btn active" : "nav-btn"} onClick={() => goTab(id)} aria-current={tab === id ? "page" : undefined}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button
            className="icon-btn"
            aria-label={soundOn ? "Выключить звук" : "Включить звук"}
            onClick={() => {
              sound.unlock();
              setSound(!soundOn);
            }}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <div className="bal">
            <img src="/dp.png" alt="" />
            <div>
              <b>{formatDp(balance)}</b>
              <small>{formatUah(balance)} грн</small>
            </div>
            <button aria-label="Пополнить" onClick={() => setTopup(true)}>
              <Plus size={16} />
            </button>
          </div>
          <button className="who" onClick={() => goTab("profile")}>
            {name.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="page">
        {tab === "cases" && <CasesView toast={toast} setLock={setLock} />}
        {tab === "upgrade" && <UpgradeView toast={toast} setLock={setLock} />}
        {tab === "contracts" && <ContractsView toast={toast} setLock={setLock} />}
        {tab === "inventory" && <InventoryView toast={toast} />}
        {tab === "profile" && <ProfileView toast={toast} onTopup={() => setTopup(true)} />}
        <p className="foot">
          Цены Steam на {PRICE_AS_OF}. Курс НБУ на {RATE_AS_OF}: 1 USD = {USD_UAH.toLocaleString("uk-UA")} грн. 1 DP = 0,50 грн.
        </p>
      </main>

      {topup && <TopUp onClose={() => setTopup(false)} toast={toast} />}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopUp({ onClose, toast }: { onClose: () => void; toast: (s: string) => void }) {
  const deposit = useGame((s) => s.deposit);
  const pushLog = useGame((s) => s.pushLog);
  const [pack, setPack] = useState(500);
  const [method, setMethod] = useState("Карта");
  const cents = pack * 100;
  return (
    <Modal title="Пополнение" onClose={onClose}>
      <p className="lead">1 DP = 0,50 грн. Сумма зачисляется на баланс сразу после подтверждения.</p>
      <div className="pack-grid">
        {PACKS.map((p) => (
          <button key={p} className={pack === p ? "pack on" : "pack"} onClick={() => setPack(p)}>
            <b>{p.toLocaleString("uk-UA")} DP</b>
            <span>{(p * 0.5).toLocaleString("uk-UA")} грн</span>
          </button>
        ))}
      </div>
      <div className="methods">
        {["Карта", "Крипта", "P2P"].map((m) => (
          <button key={m} className={method === m ? "chip on" : "chip"} onClick={() => setMethod(m)}>
            {m}
          </button>
        ))}
      </div>
      <button
        className="btn btn-go"
        onClick={() => {
          sound.unlock();
          deposit(cents);
          pushLog(`Пополнение ${dpLabel(cents)} · ${method}`);
          toast(`На баланс зачислено ${dpLabel(cents)}`);
          sound.win();
          onClose();
        }}
      >
        Оплатить {formatUah(cents)} грн
      </button>
    </Modal>
  );
}

function CasesView({ toast, setLock }: { toast: (s: string) => void; setLock: (v: boolean) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const gameCase = CASES.find((c) => c.id === openId) ?? null;
  return (
    <section>
      <div className="section-head">
        <h2>Кейсы</h2>
        <p>Шанс каждого скина указан на карточке. Выплата идёт предметом в инвентарь.</p>
      </div>
      <div className="case-grid">
        {CASES.map((c) => (
          <button key={c.id} className="case-card" style={{ ["--hue" as string]: String(c.hue) }} onClick={() => { sound.unlock(); sound.select(); setOpenId(c.id); }}>
            <div className="case-box" aria-hidden>
              <span />
            </div>
            <div className="case-copy">
              <strong>{c.name}</strong>
              <small>{c.blurb}</small>
              <Price cents={c.price} />
            </div>
          </button>
        ))}
      </div>
      {gameCase && <CaseOpen gameCase={gameCase} onClose={() => setOpenId(null)} toast={toast} setLock={setLock} />}
    </section>
  );
}

function CaseOpen({
  gameCase,
  onClose,
  toast,
  setLock,
}: {
  gameCase: GameCase;
  onClose: () => void;
  toast: (s: string) => void;
  setLock: (v: boolean) => void;
}) {
  const balance = useGame((s) => s.balance);
  const spend = useGame((s) => s.spend);
  const addSkin = useGame((s) => s.addSkin);
  const sell = useGame((s) => s.sell);
  const pushLog = useGame((s) => s.pushLog);
  const [phase, setPhase] = useState<"idle" | "spin" | "done">("idle");
  const [strip, setStrip] = useState<Skin[]>(() => caseStrip(gameCase, SKIN_BY_ID[gameCase.drops[0].itemId] ?? SKINS[0], 12, -1));
  const [won, setWon] = useState<Skin | null>(null);
  const [wonUid, setWonUid] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLock(phase === "spin");
    return () => setLock(false);
  }, [phase, setLock]);

  useEffect(() => {
    if (phase !== "spin" || !won) return;
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".reel-card");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 450 : 5600;
    if (el && card) {
      const gap = 10;
      const w = card.offsetWidth + gap;
      const view = el.parentElement?.clientWidth ?? 320;
      const x = 36 * w - view / 2 + card.offsetWidth / 2;
      el.style.transition = "none";
      el.style.transform = "translate3d(0,0,0)";
      requestAnimationFrame(() => {
        if (!track.current) return;
        track.current.style.transition = `transform ${dur}ms cubic-bezier(.12,.7,.08,1)`;
        track.current.style.transform = `translate3d(${-x}px,0,0)`;
      });
    }
    const timer = window.setTimeout(() => {
      setPhase("done");
      if (won.price >= gameCase.price) sound.win();
      else sound.fail();
    }, dur + 60);
    return () => window.clearTimeout(timer);
  }, [phase, won, gameCase.price]);

  const open = () => {
    if (phase === "spin") return;
    sound.unlock();
    if (!spend(gameCase.price)) {
      toast("Не хватает DP — пополните баланс");
      return;
    }
    const item = rollCase(gameCase);
    const id = addSkin(item.id);
    setWon(item);
    setWonUid(id);
    setStrip(caseStrip(gameCase, item));
    setPhase("spin");
    pushLog(`Кейс ${gameCase.name}: ${item.marketHash}`);
  };

  const close = () => {
    if (phase === "spin") return;
    onClose();
  };

  return (
    <Modal title={gameCase.name} onClose={close}>
      <p className="lead">{gameCase.blurb}</p>
      <div className="reel-window">
        <div className="reel-mark" />
        <div className="reel-track" ref={track}>
          {strip.map((skin, i) => (
            <div key={`${skin.id}-${i}`} className="reel-card">
              <SkinFace skin={skin} compact />
            </div>
          ))}
        </div>
      </div>
      <div className="drop-table">
        {gameCase.drops.map((d) => {
          const skin = SKIN_BY_ID[d.itemId];
          if (!skin) return null;
          return (
            <div key={d.itemId} className="drop-row">
              <span>
                {skin.weapon.replace("★ ", "")} | {skin.skin}
              </span>
              <b>{d.chance.toLocaleString("uk-UA")}%</b>
              <Price cents={skin.price} compact />
            </div>
          );
        })}
      </div>
      {phase !== "done" ? (
        <button className="btn btn-go" disabled={phase === "spin" || balance < gameCase.price} onClick={open}>
          {phase === "spin" ? "Открываем…" : `Открыть за ${dpLabel(gameCase.price)}`}
        </button>
      ) : won ? (
        <div className="result-block">
          <SkinFace skin={won} />
          <p>{won.price >= gameCase.price ? "Скин дороже кейса." : "Скин уже в инвентаре."}</p>
          <div className="row-btns">
            <button
              className="btn"
              onClick={() => {
                if (wonUid) {
                  const got = sell([wonUid]);
                  toast(`Продано за ${dpLabel(got)}`);
                  sound.select();
                }
                onClose();
              }}
            >
              Продать за {dpLabel(won.price)}
            </button>
            <button className="btn btn-go" onClick={onClose}>
              В инвентарь
            </button>
          </div>
        </div>
      ) : null}
      {balance < gameCase.price && phase === "idle" && (
        <p className="warn">
          На балансе {dpLabel(balance)}. Нужно {dpLabel(gameCase.price)}.
        </p>
      )}
    </Modal>
  );
}

function UpgradeView({ toast, setLock }: { toast: (s: string) => void; setLock: (v: boolean) => void }) {
  const inventory = useGame((s) => s.inventory);
  const remove = useGame((s) => s.remove);
  const addSkin = useGame((s) => s.addSkin);
  const pushLog = useGame((s) => s.pushLog);
  const [srcUid, setSrcUid] = useState<string | null>(null);
  const [tgtId, setTgtId] = useState<string | null>(null);
  const [picker, setPicker] = useState<"source" | "target" | null>(null);
  const [phase, setPhase] = useState<"idle" | "spin" | "result">("idle");
  const [landed, setLanded] = useState<Outcome | null>(null);
  const [reward, setReward] = useState<Skin | null>(null);
  const wheelRef = useRef<WheelHandle>(null);
  const source = inventory.find((i) => i.uid === srcUid);
  const sourceSkin = source ? skinOf(source) : undefined;
  const target = tgtId ? SKIN_BY_ID[tgtId] : undefined;
  const odds = useMemo(() => calcOdds(sourceSkin?.price ?? 0, target?.price ?? 0), [sourceSkin?.price, target?.price]);

  useEffect(() => {
    setLock(phase === "spin");
    return () => setLock(false);
  }, [phase, setLock]);

  const preset = (kind: "chance" | "mult", value: number) => {
    if (!sourceSkin) {
      toast("Сначала выберите свой скин");
      return;
    }
    const ideal = kind === "chance" ? targetForChance(sourceSkin.price, value) : sourceSkin.price * value;
    const found = closestSkin(ideal, sourceSkin.price, [sourceSkin.id]);
    if (!found) {
      toast("В каталоге нет скина дороже");
      return;
    }
    setTgtId(found.id);
    setLanded(null);
    sound.select();
  };

  const go = async () => {
    if (phase !== "idle" || !source || !sourceSkin || !target || !odds.valid) return;
    sound.unlock();
    const snapshotOdds = odds;
    const rolled = rollOutcome(snapshotOdds);
    const bonus = rolled.outcome === "clover" ? cloverReward(target) : null;
    setPhase("spin");
    setLanded(null);
    setReward(null);
    await wheelRef.current?.spin(rolled.roll, snapshotOdds);
    remove([source.uid]);
    let got: Skin | null = null;
    if (rolled.outcome === "win") {
      addSkin(target.id);
      got = target;
      sound.win();
    } else if (rolled.outcome === "clover" && bonus) {
      addSkin(bonus.id);
      got = bonus;
      sound.win();
    } else {
      sound.fail();
    }
    setReward(got);
    setLanded(rolled.outcome);
    setPhase("result");
    setSrcUid(null);
    pushLog(
      rolled.outcome === "fail"
        ? `Апгрейд мимо: ${sourceSkin.marketHash}`
        : `Апгрейд ${rolled.outcome === "clover" ? "Clover" : "успех"}: ${got?.marketHash ?? ""}`,
    );
  };

  return (
    <section>
      <div className="section-head">
        <h2>Апгрейд</h2>
        <p>Зелёная зона — победа, лаймовая — Clover. Стрелка останавливается внутри выпавшего сектора.</p>
      </div>
      <div className="upgrade-grid">
        <PickCard
          title="Ваш скин"
          skin={sourceSkin}
          empty="Выбрать из инвентаря"
          disabled={phase === "spin"}
          onPick={() => setPicker("source")}
          onClear={() => setSrcUid(null)}
        />
        <div className="wheel-col">
          <UpgradeWheel ref={wheelRef} odds={odds} landed={landed} spinning={phase === "spin"} />
          <div className="presets">
            <button className="chip" disabled={!sourceSkin || phase === "spin"} onClick={() => preset("chance", 75)}>75%</button>
            <button className="chip" disabled={!sourceSkin || phase === "spin"} onClick={() => preset("chance", 50)}>50%</button>
            <button className="chip" disabled={!sourceSkin || phase === "spin"} onClick={() => preset("chance", 30)}>30%</button>
            <button className="chip" disabled={!sourceSkin || phase === "spin"} onClick={() => preset("mult", 5)}>5×</button>
            <button className="chip" disabled={!sourceSkin || phase === "spin"} onClick={() => preset("mult", 10)}>10×</button>
          </div>
          <button className="btn btn-go" disabled={!odds.valid || phase === "spin"} onClick={() => void go()}>
            {phase === "spin" ? "Крутим…" : "Апгрейд"}
          </button>
          <div className="odds">
            <div><span>Зелёная</span><b>{odds.valid ? `${odds.winChance.toFixed(2)}%` : "—"}</b></div>
            <div><span>Clover</span><b>{odds.cloverChance ? `${odds.cloverChance.toFixed(2)}%` : "нет"}</b></div>
            <div><span>Успех</span><b>{odds.valid ? `${odds.success.toFixed(2)}%` : "—"}</b></div>
          </div>
          <p className="fine">Комиссия 8%. Минимальный шанс 0,01%. Clover забирает часть шанса и даёт скин дороже цели.</p>
        </div>
        <PickCard
          title="Цель"
          skin={target}
          empty="Выбрать из каталога"
          disabled={phase === "spin"}
          onPick={() => setPicker("target")}
          onClear={() => setTgtId(null)}
        />
      </div>
      {phase === "result" && (
        <div className="result-banner">
          {landed === "fail" ? <p>Промах. Скин сгорел.</p> : reward ? <p>Получен {reward.marketHash} · {dpLabel(reward.price)}</p> : null}
          <button className="btn" onClick={() => { setPhase("idle"); setLanded(null); setReward(null); }}>
            Ещё раз
          </button>
        </div>
      )}
      {picker && (
        <SkinPicker
          mode={picker}
          inventory={inventory}
          minPrice={picker === "target" ? sourceSkin?.price : undefined}
          onClose={() => setPicker(null)}
          onPick={(itemId, uid) => {
            sound.select();
            if (picker === "source" && uid) {
              setSrcUid(uid);
              const skin = SKIN_BY_ID[itemId];
              if (target && skin && target.price <= skin.price) setTgtId(null);
            } else setTgtId(itemId);
            setLanded(null);
            setPhase("idle");
            setPicker(null);
          }}
        />
      )}
    </section>
  );
}

function PickCard({
  title,
  skin,
  empty,
  disabled,
  onPick,
  onClear,
}: {
  title: string;
  skin?: Skin;
  empty: string;
  disabled: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="pick-card">
      <header>
        <span>{title}</span>
        {skin && (
          <button className="text-btn" disabled={disabled} onClick={onClear}>
            Убрать
          </button>
        )}
      </header>
      {skin ? <SkinFace skin={skin} /> : <p className="empty">{empty}</p>}
      <button className="btn" disabled={disabled} onClick={onPick}>
        {skin ? "Сменить" : "Выбрать"}
      </button>
    </div>
  );
}

function SkinPicker({
  mode,
  inventory,
  minPrice,
  onClose,
  onPick,
}: {
  mode: "source" | "target";
  inventory: InvItem[];
  minPrice?: number;
  onClose: () => void;
  onPick: (itemId: string, uid?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"price-asc" | "price-desc">("price-asc");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows: { skin: Skin; uid?: string }[] = [];
    if (mode === "source") {
      rows = inventory.flatMap((row) => {
        const skin = skinOf(row);
        return skin ? [{ skin, uid: row.uid }] : [];
      });
    } else {
      rows = SKINS.filter((s) => (minPrice == null ? true : s.price > minPrice)).map((skin) => ({ skin }));
    }
    if (query) rows = rows.filter((r) => r.skin.marketHash.toLowerCase().includes(query));
    rows.sort((a, b) => (sort === "price-asc" ? a.skin.price - b.skin.price : b.skin.price - a.skin.price));
    return rows.slice(0, 80);
  }, [mode, inventory, minPrice, q, sort]);

  return (
    <Modal title={mode === "source" ? "Инвентарь" : "Каталог"} onClose={onClose}>
      <div className="search-line">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название скина" />
        <button className="chip" onClick={() => setSort((s) => (s === "price-asc" ? "price-desc" : "price-asc"))}>
          {sort === "price-asc" ? "Дешевле" : "Дороже"}
        </button>
      </div>
      <div className="pick-grid">
        {list.length === 0 && <p className="empty">{mode === "source" ? "Инвентарь пуст — откройте кейс." : "Ничего не найдено."}</p>}
        {list.map((row) => (
          <button key={row.uid ?? row.skin.id} className="pick-hit" onClick={() => onPick(row.skin.id, row.uid)}>
            <SkinFace skin={row.skin} compact />
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ContractsView({ toast, setLock }: { toast: (s: string) => void; setLock: (v: boolean) => void }) {
  const inventory = useGame((s) => s.inventory);
  const remove = useGame((s) => s.remove);
  const addSkin = useGame((s) => s.addSkin);
  const pushLog = useGame((s) => s.pushLog);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ up: boolean; item: Skin; sum: number } | null>(null);

  const rows = picked.flatMap((id) => {
    const row = inventory.find((i) => i.uid === id);
    const skin = row ? skinOf(row) : undefined;
    return row && skin ? [{ row, skin }] : [];
  });
  const sum = rows.reduce((s, r) => s + r.skin.price, 0);

  useEffect(() => {
    setLock(busy);
    return () => setLock(false);
  }, [busy, setLock]);

  const toggle = (uid: string) => {
    sound.select();
    setPicked((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : prev.length < 3 ? [...prev, uid] : prev));
  };

  const run = async () => {
    if (rows.length !== 3 || busy) return;
    sound.unlock();
    setBusy(true);
    setResult(null);
    const inputs = rows.map((r) => r.skin);
    const uids = rows.map((r) => r.row.uid);
    await new Promise((r) => setTimeout(r, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 200 : 900));
    const out = resolveContract(inputs);
    remove(uids);
    addSkin(out.item.id);
    setPicked([]);
    setResult(out);
    setBusy(false);
    pushLog(`Контракт ${out.up ? "вверх" : "вниз"}: ${out.item.marketHash}`);
    toast(out.up ? `Апгрейд контракта: ${out.item.skin}` : `Контракт ушёл вниз: ${out.item.skin}`);
    if (out.up) sound.win();
    else sound.fail();
  };

  return (
    <section>
      <div className="section-head">
        <h2>Контракты</h2>
        <p>Нужны любые 3 скина. На выходе один случайный: либо дороже суммы, либо дешевле. Предметы не пропадают без замены.</p>
      </div>
      <div className="contract-board">
        <div className="slots">
          {Array.from({ length: 3 }).map((_, i) => {
            const row = rows[i];
            return (
              <div key={i} className={row ? "slot filled" : "slot"}>
                {row ? (
                  <>
                    <SkinFace skin={row.skin} compact />
                    <button className="slot-x" onClick={() => toggle(row.row.uid)} aria-label="Убрать">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="contract-side">
          <p>Выбрано <b>{rows.length} / 3</b></p>
          <p>Сумма <Price cents={sum} /></p>
          <p className="fine">46% шанс получить скин дороже суммы, 54% — дешевле. Редкость не важна.</p>
          <button className="btn btn-go" disabled={rows.length !== 3 || busy} onClick={() => void run()}>
            {busy ? "Смешиваем…" : "Заключить контракт"}
          </button>
        </div>
      </div>
      {result && (
        <div className="result-banner">
          <SkinFace skin={result.item} />
          <p>
            {result.up ? "Улучшение" : "Ухудшение"} · было {dpLabel(result.sum)} → стало {dpLabel(result.item.price)} (
            {(result.item.price / Math.max(1, result.sum)).toFixed(2)}×)
          </p>
          <button className="btn" onClick={() => setResult(null)}>Скрыть</button>
        </div>
      )}
      <h3 className="subhead">Инвентарь</h3>
      <InvGrid
        rows={inventory}
        selected={picked}
        onToggle={toggle}
        empty="Сначала откройте кейс или выиграйте апгрейд."
      />
    </section>
  );
}

function InventoryView({ toast }: { toast: (s: string) => void }) {
  const inventory = useGame((s) => s.inventory);
  const sell = useGame((s) => s.sell);
  const tradeUrl = useGame((s) => s.tradeUrl);
  const setTradeUrl = useGame((s) => s.setTradeUrl);
  const withdraw = useGame((s) => s.withdraw);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [askLink, setAskLink] = useState(false);
  const [draft, setDraft] = useState(tradeUrl);
  const [confirm, setConfirm] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter((row) => skinOf(row)?.marketHash.toLowerCase().includes(query));
  }, [inventory, q]);

  const selectedRows = inventory.filter((r) => selected.includes(r.uid));
  const selectedValue = selectedRows.reduce((s, r) => s + (skinOf(r)?.price ?? 0), 0);

  const startWithdraw = () => {
    if (!selectedRows.length) {
      toast("Отметьте скины для вывода");
      return;
    }
    if (!normalizeTradeUrl(tradeUrl)) {
      setDraft(tradeUrl);
      setAskLink(true);
      return;
    }
    setConfirm(true);
  };

  return (
    <section>
      <div className="section-head">
        <h2>Инвентарь</h2>
        <p>{inventory.length} шт. · вывод только на вашу трейд-ссылку Steam.</p>
      </div>
      <div className="toolbar">
        <div className="search-line grow">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
        </div>
        <button
          className="btn"
          disabled={!inventory.length}
          onClick={() => {
            const ids = inventory.map((i) => i.uid);
            const got = sell(ids);
            setSelected([]);
            toast(`Продано на ${dpLabel(got)}`);
            sound.select();
          }}
        >
          Продать всё
        </button>
        <button className="btn btn-go" disabled={!selected.length} onClick={startWithdraw}>
          Вывести {selected.length ? dpLabel(selectedValue) : ""}
        </button>
      </div>
      <InvGrid
        rows={filtered}
        selected={selected}
        onToggle={(uid) => {
          sound.select();
          setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
        }}
        empty="Пусто."
        extra={(row, skin) => (
          <button
            className="text-btn"
            onClick={(e) => {
              e.stopPropagation();
              const got = sell([row.uid]);
              setSelected((prev) => prev.filter((id) => id !== row.uid));
              toast(`Продано за ${dpLabel(got)}`);
              sound.select();
            }}
          >
            Продать {dpLabel(skin.price)}
          </button>
        )}
      />
      {askLink && (
        <Modal title="Трейд-ссылка" onClose={() => setAskLink(false)}>
          <p className="lead">Без трейд-ссылки вывод не создаётся. Возьмите её в Steam: Инвентарь → Предложения обмена → Кто может присылать мне предложения обмена?</p>
          <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={TRADE_HINT} />
          <button
            className="btn btn-go"
            onClick={() => {
              const saved = setTradeUrl(draft);
              if (!saved) {
                toast("Нужна ссылка вида steamcommunity.com/tradeoffer/new/?partner=…&token=…");
                return;
              }
              setAskLink(false);
              setConfirm(true);
            }}
          >
            Сохранить и продолжить
          </button>
        </Modal>
      )}
      {confirm && (
        <Modal title="Заявка на вывод" onClose={() => setConfirm(false)}>
          <p className="lead">Скины уйдут с баланса и встанут в очередь на отправку по ссылке:</p>
          <code className="trade-code">{tradeUrl}</code>
          <ul className="plain">
            {selectedRows.map((row) => {
              const skin = skinOf(row);
              return skin ? <li key={row.uid}>{skin.marketHash} · {dpLabel(skin.price)}</li> : null;
            })}
          </ul>
          <button
            className="btn btn-go"
            onClick={() => {
              const err = withdraw(selected);
              if (err) {
                toast(err);
                return;
              }
              toast("Заявка принята и ждёт отправки");
              sound.win();
              setSelected([]);
              setConfirm(false);
            }}
          >
            Подтвердить вывод
          </button>
        </Modal>
      )}
    </section>
  );
}

function InvGrid({
  rows,
  selected,
  onToggle,
  empty,
  extra,
}: {
  rows: InvItem[];
  selected: string[];
  onToggle: (uid: string) => void;
  empty: string;
  extra?: (row: InvItem, skin: Skin) => React.ReactNode;
}) {
  if (!rows.length) return <p className="empty">{empty}</p>;
  return (
    <div className="inv-grid">
      {rows.map((row) => {
        const skin = skinOf(row);
        if (!skin) return null;
        const on = selected.includes(row.uid);
        return (
          <div key={row.uid} className={on ? "inv-card on" : "inv-card"}>
            <button className="inv-hit" onClick={() => onToggle(row.uid)}>
              <SkinFace skin={skin} compact />
              <small className="float">float {row.float.toFixed(6)}</small>
            </button>
            {extra?.(row, skin)}
          </div>
        );
      })}
    </div>
  );
}

function ProfileView({ toast, onTopup }: { toast: (s: string) => void; onTopup: () => void }) {
  const name = useGame((s) => s.profileName);
  const setName = useGame((s) => s.setName);
  const tradeUrl = useGame((s) => s.tradeUrl);
  const setTradeUrl = useGame((s) => s.setTradeUrl);
  const balance = useGame((s) => s.balance);
  const inventory = useGame((s) => s.inventory);
  const withdrawals = useGame((s) => s.withdrawals);
  const log = useGame((s) => s.log);
  const [draftName, setDraftName] = useState(name);
  const [draftTrade, setDraftTrade] = useState(tradeUrl);
  const value = inventory.reduce((s, row) => s + (skinOf(row)?.price ?? 0), 0);

  return (
    <section>
      <div className="section-head">
        <h2>Профиль</h2>
        <p>Трейд-ссылка нужна только для вывода скинов.</p>
      </div>
      <div className="stat-row">
        <div><span>Баланс</span><b>{dpLabel(balance)}</b><small>{formatUah(balance)} грн</small></div>
        <div><span>Скинов</span><b>{inventory.length}</b></div>
        <div><span>Инвентарь</span><b>{dpLabel(value)}</b><small>{formatUah(value)} грн</small></div>
      </div>
      <div className="profile-grid">
        <label>
          Имя
          <input className="field" value={draftName} maxLength={24} onChange={(e) => setDraftName(e.target.value)} />
          <button className="btn" onClick={() => { setName(draftName); toast("Имя сохранено"); }}>Сохранить имя</button>
        </label>
        <label>
          Трейд-ссылка Steam
          <input className="field" value={draftTrade} onChange={(e) => setDraftTrade(e.target.value)} placeholder={TRADE_HINT} />
          <button
            className="btn btn-go"
            onClick={() => {
              const saved = setTradeUrl(draftTrade);
              if (!saved) {
                toast("Ссылка должна содержать partner и token");
                return;
              }
              setDraftTrade(saved);
              toast("Трейд-ссылка сохранена");
            }}
          >
            Сохранить ссылку
          </button>
        </label>
      </div>
      <button className="btn" onClick={onTopup}>Пополнить баланс</button>
      <h3 className="subhead">Заявки на вывод</h3>
      {withdrawals.length === 0 && <p className="empty">Заявок пока нет.</p>}
      <ul className="withdraw-list">
        {withdrawals.map((w) => (
          <li key={w.id}>
            <div>
              <b>В обработке</b>
              <small>{new Date(w.at).toLocaleString("ru-UA")}</small>
            </div>
            <span>{w.items.length} скин. · {dpLabel(w.total)}</span>
            <code>{w.tradeUrl}</code>
          </li>
        ))}
      </ul>
      <h3 className="subhead">История</h3>
      <ul className="plain">
        {log.map((row) => (
          <li key={row.id}>{row.text}</li>
        ))}
      </ul>
    </section>
  );
}
