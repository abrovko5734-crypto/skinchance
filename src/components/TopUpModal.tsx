import { Icon } from './ui'

export function TopUpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <header>
          <h3>Пополнение DP</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon n="x" />
          </button>
        </header>
        <div className="topup-body">
          <p>Бесплатной выдачи баланса нет. Пополнение только вручную.</p>
          <ol>
            <li>Напишите в Telegram: <a href="https://t.me/Keldisqq" target="_blank" rel="noreferrer">@Keldisqq</a></li>
            <li>Укажите свой Steam ID (из профиля)</li>
            <li>Сумму в DP и способ оплаты</li>
          </ol>
          <a className="btn go" href="https://t.me/Keldisqq" target="_blank" rel="noreferrer">
            Открыть @Keldisqq
          </a>
          <p className="hint">После оплаты баланс зачисляется на ваш Steam-аккаунт.</p>
        </div>
      </div>
    </div>
  )
}
