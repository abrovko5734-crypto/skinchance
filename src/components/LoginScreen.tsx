import { Clover } from './ui'

export function LoginScreen({ error }: { error?: string }) {
  return (
    <div className="app login">
      <div className="login-card">
        <img src="/logo.png" alt="SkinChance" className="login-logo" />
        <Clover size={56} className="login-clover" />
        <h1>SkinChance</h1>
        <p>Кейсы, апгрейдер и контракты CS2. Валюта — DP. Вход только через Steam.</p>
        {error && <div className="login-err" role="alert">{error}</div>}
        <a className="btn go steam" href="/api/auth?a=login">
          Войти через Steam
        </a>
        <small>Новый аккаунт — 0 DP. Пополнение: Telegram @Keldisqq</small>
      </div>
    </div>
  )
}
