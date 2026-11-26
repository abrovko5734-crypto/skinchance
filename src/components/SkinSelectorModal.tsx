import { useEffect, useMemo, useState } from 'react'
import { moneyDpUsd } from '../lib/storage'
import { catalog } from '../services/itemCatalog'
import { EMPTY_QUERY, RARITIES, RARITY_COLOR, type Entry, type Query } from '../services/types'
import { Icon, ItemImage, Modal, Tag } from './ui'

interface Props { mode: 'inventory' | 'catalog'; fetcher: (q: Query) => Promise<Entry[]>; selected?: string; onPick: (e: Entry) => void; onClose: () => void }
const WEARS = ['Factory New']
const PAGE = 90

export function SkinSelectorModal({ mode, fetcher, selected, onPick, onClose }: Props) {
  const [q, setQ] = useState<Query>({ ...EMPTY_QUERY, wear: 'Factory New' })
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [err, setErr] = useState(''), [limit, setLimit] = useState(PAGE), [weapons, setWeapons] = useState<string[]>([]), [tick, setTick] = useState(0)
  useEffect(() => { catalog.weapons().then(setWeapons).catch(() => {}) }, [])
  useEffect(() => { const t = setTimeout(() => setQ(p => ({ ...p, text })), 180); return () => clearTimeout(t) }, [text])
  useEffect(() => {
    let live = true; setState('loading'); setLimit(PAGE)
    fetcher(q).then(r => live && (setEntries(r), setState('ok'))).catch(e => live && (setErr(String(e.message ?? e)), setState('error')))
    return () => { live = false }
  }, [q, tick]) // eslint-disable-line
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  const set = <K extends keyof Query>(k: K, v: Query[K]) => setQ(p => ({ ...p, [k]: v }))
  const shown = useMemo(() => entries.slice(0, limit), [entries, limit])
  const num = (v: string) => (v === '' ? null : Math.max(0, Number(v)))

  return (
    <Modal title={mode === 'inventory' ? 'Ваш инвентарь' : 'Каталог предметов'} onClose={onClose} wide>
      <div className="filters">
        <label className="search"><Icon n="search" s={16} /><input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="AK-47 | Redline, Karambit Doppler…" /></label>
        <div className="seg" role="tablist">{(['all', 'weapon', 'knife', 'gloves'] as const).map(c =>
          <button key={c} className={q.category === c ? 'on' : ''} onClick={() => set('category', c)}>{{ all: 'Все', weapon: 'Оружие', knife: 'Ножи', gloves: 'Перчатки' }[c]}</button>)}</div>
        <div className="frow">
          <select value={q.weapon} onChange={e => set('weapon', e.target.value)} aria-label="Оружие"><option value="">Любое оружие</option>{weapons.map(w => <option key={w}>{w}</option>)}</select>
          <select value={q.rarity} onChange={e => set('rarity', e.target.value)} aria-label="Редкость"><option value="">Любая редкость</option>{RARITIES.map(r => <option key={r}>{r}</option>)}</select>
          <select value={q.wear} onChange={e => set('wear', e.target.value)} aria-label="Качество"><option value="">Любое качество</option>{WEARS.map(w => <option key={w}>{w}</option>)}</select>
          <select value={q.special} onChange={e => set('special', e.target.value as Query['special'])} aria-label="Тип"><option value="all">Обычные и особые</option><option value="stattrak">StatTrak™</option><option value="souvenir">Souvenir</option></select>
          <input className="num" inputMode="decimal" placeholder="Мин DP" onChange={e => set('min', num(e.target.value))} aria-label="Минимальная цена" />
          <input className="num" inputMode="decimal" placeholder="Макс DP" onChange={e => set('max', num(e.target.value))} aria-label="Максимальная цена" />
          <select value={q.sort} onChange={e => set('sort', e.target.value as Query['sort'])} aria-label="Сортировка">
            <option value="price-desc">Цена ↓</option><option value="price-asc">Цена ↑</option><option value="rarity">Редкость</option><option value="name">Название</option></select>
        </div>
      </div>
      <div className="grid-wrap">
        {state === 'loading' && <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="cell skeleton" />)}</div>}
        {state === 'error' && <div className="state"><p>Не удалось загрузить: {err}</p><button className="btn ghost" onClick={() => setTick(t => t + 1)}>Повторить</button></div>}
        {state === 'ok' && entries.length === 0 && <div className="state"><p>{mode === 'inventory' ? 'Инвентарь пуст или ничего не найдено' : 'Ничего не найдено'}</p>
          <button className="btn ghost" onClick={() => { setText(''); setQ({ ...EMPTY_QUERY, wear: 'Factory New' }) }}>Сбросить фильтры</button></div>}
        {state === 'ok' && entries.length > 0 && <>
          <div className="grid">{shown.map(e => {
            const sel = selected === (e.uid ?? e.item.id), dis = !!e.disabledReason
            return (
              <button key={e.uid ?? e.item.id} className={`cell ${sel ? 'sel' : ''}`} disabled={dis} title={e.disabledReason} onClick={() => onPick(e)}
                style={{ ['--rc' as string]: RARITY_COLOR[e.item.rarity] }}>
                <ItemImage item={e.item} size="sm" />
                <small>{e.item.weapon}</small><b>{e.item.skin}</b>
                <div className="cell-foot"><span>{e.item.price != null ? moneyDpUsd(e.item.price) : '—'}</span>{e.item.wear && <Tag>{e.item.wear.split(/[ -]/).map(w => w[0]).join('')}</Tag>}</div>
                {dis && <em className="cell-dis">{e.disabledReason}</em>}{sel && <i className="cell-check"><Icon n="check" s={14} /></i>}
              </button>)
          })}</div>
          {entries.length > limit && <button className="btn ghost more" onClick={() => setLimit(l => l + PAGE)}>Показать ещё ({entries.length - limit})</button>}
        </>}
      </div>
    </Modal>
  )
}
