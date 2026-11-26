import { moneyUsd } from '../lib/storage'
import type { UpgradeResult } from '../services/upgradeService'
import { Clover, Icon, ItemImage, Modal } from './ui'

interface Props { res: UpgradeResult; onClose: () => void; onRepeat: () => void; onNew: () => void }
export function UpgradeResultModal({ res, onClose, onRepeat, onNew }: Props) {
  const { outcome, final, source, target } = res
  const fail = outcome === 'fail', clover = outcome === 'clover'
  return (
    <Modal title={fail ? 'Апгрейд не удался' : clover ? 'Clover x2' : 'Апгрейд успешен'} onClose={onClose}>
      <div className={`result r-${outcome}`}>
        <div className="r-badge">{clover ? <Clover size={34} /> : fail ? <Icon n="x" s={24} /> : <Icon n="check" s={24} />}</div>
        {final ? (<>
          <ItemImage item={final} size="lg" />
          <h3>{final.name}</h3>
          <strong className="r-price">{moneyUsd(final.price)}</strong>
          {clover && <p className="r-note">Цепочка Clover: {res.steps.map(s => `${moneyUsd(s.stake)}→${moneyUsd(s.target)}`).join(' · ')}. Итог: {moneyUsd(final.price)}.</p>}
          <p className="r-meta">Предмет добавлен в инвентарь · {source.name} списан</p>
        </>) : (<>
          <p className="r-fail-t">Цель не получена</p>
          <p className="r-meta">{source.name} ({moneyUsd(source.price)}) списан.{res.steps.length > 1 ? ` Цепочка Clover оборвалась на колесе ${res.steps.length}: ${moneyUsd(res.steps[res.steps.length - 1].stake)}→${moneyUsd(res.steps[res.steps.length - 1].target)}.` : ` Выпало ${res.roll.toFixed(2)} — вне зоны успеха (${res.odds.totalWin}%).`}</p>
        </>)}
        <div className="btn-row wide">
          {fail ? <button className="btn primary" onClick={onRepeat}>Повторить</button> : <button className="btn primary" onClick={onClose}>Продолжить</button>}
          {!fail && <button className="btn ghost" onClick={onRepeat}>Повторить</button>}
          <button className="btn ghost" onClick={onNew}>{fail ? 'Выбрать новый предмет' : 'Новый апгрейд'}</button>
        </div>
      </div>
    </Modal>
  )
}
