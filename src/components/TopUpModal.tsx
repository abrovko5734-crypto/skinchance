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
          <p>Пополнение только через Telegram. Бесплатной выдачи баланса нет.</p>
          <p className="hint" style={{ marginTop: 8 }}>
            Курс: <b>1 DP = 0.50 грн</b> · 1 $ ≈ 83 DP
          </p>
          <div className="topup-packages">
            {[
              [100, 50],
              [500, 250],
              [1000, 500],
              [5000, 2500],
              [10000, 5000],
            ].map(([dp, uah]) => (
              <div key={dp} className="topup-pkg">
                <strong>{dp.toLocaleString('ru-RU')} DP</strong>
                <span>{uah.toLocaleString('ru-RU')} грн</span>
              </div>
            ))}
          </div>
          <ol>
            <li>
              Напишите в Telegram:{' '}
              <a href="https://t.me/Keldisqq" target="_blank" rel="noreferrer">
                @Keldisqq
              </a>
            </li>
            <li>Укажите свой Steam ID из профиля</li>
            <li>Сумму в DP и способ оплаты</li>
          </ol>
          <a className="btn go" href="https://t.me/Keldisqq" target="_blank" rel="noreferrer">
            Написать @Keldisqq
          </a>
          <p className="hint">
            После оплаты администратор зачислит DP на ваш аккаунт через админ-панель.
          </p>
        </div>
      </div>
    </div>
  )
}
