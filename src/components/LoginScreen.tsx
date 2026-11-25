import { Clover } from './ui'

export function LoginScreen({ error }: { error?: string }) {
  return (
    <div className="app login">
      <div className="login-card">
        <img src="/logo.png" alt="SkinChance" className="login-logo" />
        <Clover size={72} className="login-clover" />
        <h1>Апгрейдер скинов CS2</h1>
        <p>Войдите через Steam, чтобы начать. Мы получаем только ваш публичный SteamID, имя и аватар — пароль остаётся у Steam.</p>
        {error && <div className="login-err" role="alert">{error}</div>}
        <a className="btn go steam" href="/api/auth?a=login">Войти через Steam</a>
        <small>Новый аккаунт начинается с баланса $0.00</small>
      </div>
    </div>
  )
}
