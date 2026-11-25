import { Clover } from './ui'

export function LoginScreen({ error, onGuest }: { error?: string; onGuest?: () => void }) {
  return (
    <div className="app login">
      <div className="login-card">
        <img src="/logo.png" alt="SkinChance" className="login-logo" />
        <Clover size={72} className="login-clover" />
        <h1>SkinChance</h1>
        <p>Кейсы, апгрейдер, контракты и инвентарь в DP. Играйте локально или войдите через Steam.</p>
        {error && <div className="login-err" role="alert">{error}</div>}
        <a className="btn go steam" href="/api/auth?a=login">
          Войти через Steam
        </a>
        {onGuest && (
          <button className="btn" onClick={onGuest}>
            Играть локально (гость)
          </button>
        )}
        <small>Валюта — Donate Points (DP). Инвентарь отдельный, не Steam.</small>
      </div>
    </div>
  )
}
