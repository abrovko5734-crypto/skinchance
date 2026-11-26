import { moneyDpUsd } from '../lib/storage'
import type { Odds } from '../lib/odds'
import { rarityColor, rarityRu, type Item } from '../services/types'
import { Icon, ItemImage, Tag } from './ui'

function Meta({ item }: { item: Item }) {
  return <div className="tags"><span className="rar"><i style={{ background: rarityColor(item.rarity) }} />{rarityRu(item.rarity)}</span>
    {item.wear && <Tag>{item.wear}</Tag>}{item.stattrak && <Tag tone="gold">StatTrak™</Tag>}{item.souvenir && <Tag tone="gold">Souvenir</Tag>}</div>
}
interface SProps { item: Item | null; onSelect: () => void; onClear: () => void; disabled: boolean }
export function SourceSkinCard({ item, onSelect, onClear, disabled }: SProps) {
  return (
    <section className="card skin-card" aria-label="Ваш предмет">
      <h4 className="eyebrow">Ваш предмет</h4>
      {item ? (<>
        <ItemImage item={item} size="lg" />
        <div className="skin-info"><small>{item.weapon}</small><h3>{item.skin}</h3><Meta item={item} /></div>
        <div className="price-row"><span>Цена · DP</span><strong key={item.price}>{moneyDpUsd(item.price)}</strong></div>
        <div className="btn-row"><button className="btn ghost" disabled={disabled} onClick={onSelect}><Icon n="swap" s={16} />Сменить</button>
          <button className="btn ghost danger" disabled={disabled} onClick={onClear} aria-label="Убрать предмет"><Icon n="x" s={16} /></button></div>
      </>) : (
        <div className="empty-slot"><div className="slot-ring"><Icon n="plus" s={26} /></div><p>Выберите предмет из инвентаря</p>
          <button className="btn primary" disabled={disabled} onClick={onSelect}>Выбрать скин</button></div>
      )}
    </section>
  )
}
interface TProps { item: Item | null; source: Item | null; odds: Odds; onSelect: () => void; onClear: () => void; disabled: boolean }
export function TargetSkinCard({ item, odds, onSelect, onClear, disabled }: TProps) {
  return (
    <section className="card skin-card" aria-label="Желаемый предмет">
      <h4 className="eyebrow">Вы получите</h4>
      {item ? (<>
        <ItemImage item={item} size="lg" />
        <div className="skin-info"><small>{item.weapon}</small><h3>{item.skin}</h3><Meta item={item} /></div>
        <div className="price-row"><span>Цена · DP</span><strong key={item.price}>{moneyDpUsd(item.price)}</strong></div>
        {odds.valid && <div className="win-info"><div><span>Обычный выигрыш</span><b>{moneyDpUsd(item.price)}</b></div>
          <div className="clv"><span>Clover x{odds.cloverMultiplier}, до</span><b>{moneyDpUsd(odds.cloverCeiling)}</b></div></div>}
        <div className="btn-row"><button className="btn ghost" disabled={disabled} onClick={onSelect}><Icon n="swap" s={16} />Сменить</button>
          <button className="btn ghost danger" disabled={disabled} onClick={onClear} aria-label="Убрать цель"><Icon n="x" s={16} /></button></div>
      </>) : (
        <div className="empty-slot"><div className="slot-ring"><Icon n="search" s={24} /></div><p>Найдите предмет в каталоге</p>
          <button className="btn primary" disabled={disabled} onClick={onSelect}>Выбрать цель</button></div>
      )}
    </section>
  )
}
export { Meta }
