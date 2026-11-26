import { forwardRef, useImperativeHandle, useRef } from "react";
import type { Odds, Outcome } from "@/lib/skinchance/game";
import { sound } from "@/lib/skinchance/sound";

export interface WheelHandle {
  spin: (roll: number, odds: Odds) => Promise<void>;
  reset: () => void;
}

interface Props {
  odds: Odds;
  landed: Outcome | null;
  spinning: boolean;
}

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const UpgradeWheel = forwardRef<WheelHandle, Props>(function UpgradeWheel({ odds, landed, spinning }, ref) {
  const needle = useRef<SVGGElement>(null);
  const angle = useRef(0);

  useImperativeHandle(ref, () => ({
    reset() {
      angle.current = 0;
      if (needle.current) {
        needle.current.style.transition = "none";
        needle.current.style.transform = "rotate(0deg)";
      }
    },
    spin(roll, o) {
      return new Promise((resolve) => {
        const el = needle.current;
        if (!el) {
          resolve();
          return;
        }
        const winDeg = o.winChance * 3.6;
        const cloverDeg = o.cloverChance * 3.6;
        const key: Outcome = roll < o.winChance ? "win" : roll < o.winChance + o.cloverChance ? "clover" : "fail";
        const start = key === "win" ? 0 : key === "clover" ? winDeg : winDeg + cloverDeg;
        const end = key === "win" ? winDeg : key === "clover" ? winDeg + cloverDeg : 360;
        const span = Math.max(end - start, 0.05);
        const pad = span * 0.18;
        const target = start + pad + ((roll * 13) % 1) * Math.max(span - pad * 2, span * 0.2);
        const from = angle.current;
        const turns = reduceMotion() ? 2 : 6 + Math.floor((roll % 7) / 2);
        const to = from - (from % 360) + 360 * turns + target;
        const dur = reduceMotion() ? 700 : 5200;
        const t0 = performance.now();
        const ease = (t: number) => 1 - Math.pow(1 - t, 3.2);
        let last = -1;
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / dur);
          const v = from + (to - from) * ease(t);
          el.style.transform = `rotate(${v}deg)`;
          const tick = Math.floor(v / 9);
          if (tick !== last) {
            last = tick;
            if (t < 0.92) sound.tick();
          }
          if (t < 1) requestAnimationFrame(frame);
          else {
            angle.current = to;
            resolve();
          }
        };
        requestAnimationFrame(frame);
      });
    },
  }));

  const CX = 200;
  const CY = 200;
  const RO = 168;
  const RI = 118;
  const trueWin = Math.min(360, Math.max(0, odds.winChance * 3.6));
  const trueClover = Math.min(360 - trueWin, Math.max(0, odds.cloverChance * 3.6));
  const winDeg = trueWin > 0 ? Math.max(trueWin, 1.15) : 0;
  const cloverDeg = trueClover > 0 ? Math.max(trueClover, 1.15) : 0;

  const polar = (deg: number, rad: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [CX + rad * Math.cos(a), CY + rad * Math.sin(a)];
  };

  const arcPath = (a0: number, a1: number) => {
    if (a1 - a0 < 0.05) return "";
    let end = a1;
    if (end - a0 >= 359.9) end = a0 + 359.9;
    const large = end - a0 > 180 ? 1 : 0;
    const [x0, y0] = polar(a0, RO);
    const [x1, y1] = polar(end, RO);
    const [x2, y2] = polar(end, RI);
    const [x3, y3] = polar(a0, RI);
    return `M${x0} ${y0} A${RO} ${RO} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${RI} ${RI} 0 ${large} 0 ${x3} ${y3} Z`;
  };

  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const hub =
    landed === "win" ? "Победа" : landed === "clover" ? "Clover" : landed === "fail" ? "Мимо" : spinning ? "Крутим" : "шанс";

  return (
    <div className={`wheel ${landed ? "landed-" + landed : ""} ${spinning ? "is-spinning" : ""}`}>
      <svg viewBox="0 0 400 400" role="img" aria-label={odds.valid ? `Шанс ${odds.winChance}%` : "Колесо апгрейда"}>
        <defs>
          <linearGradient id="winGreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b8ff6a" />
            <stop offset="45%" stopColor="#3dff8a" />
            <stop offset="100%" stopColor="#14964a" />
          </linearGradient>
          <linearGradient id="cloverLime" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#d6ff4a" />
            <stop offset="100%" stopColor="#7CFF2E" />
          </linearGradient>
          <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={CX} cy={CY} r={RO + 12} className="wheel-rim" />
        <path d={arcPath(0, 360)} className="wheel-fail" />
        {winDeg > 0 && <path d={arcPath(0, winDeg)} fill="url(#winGreen)" filter="url(#greenGlow)" />}
        {cloverDeg > 0 && <path d={arcPath(winDeg, winDeg + cloverDeg)} fill="url(#cloverLime)" />}
        {ticks.map((deg) => {
          const hot = deg <= winDeg + cloverDeg && (winDeg > 0 || cloverDeg > 0) && deg <= winDeg + cloverDeg;
          const [x1, y1] = polar(deg, RO - 2);
          const [x2, y2] = polar(deg, RO - (deg % 30 === 0 ? 16 : 8));
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={hot && deg <= winDeg + cloverDeg ? "tick-hot" : "tick-dim"}
              strokeWidth={deg % 30 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={CX} cy={CY} r={RI - 6} className="wheel-hole" />
        <g ref={needle} className="needle" filter="url(#greenGlow)">
          <line x1={CX} y1={CY} x2={CX} y2={CY - RO + 6} className="needle-shaft" strokeWidth="3" strokeLinecap="round" />
          <path
            d={`M${CX} ${CY - RO - 4} L${CX - 13} ${CY - RO + 20} L${CX} ${CY - RO + 12} L${CX + 13} ${CY - RO + 20} Z`}
            className="needle-head"
          />
          <circle cx={CX} cy={CY} r="8" className="needle-core" />
          <circle cx={CX} cy={CY} r="3.5" className="needle-dot" />
        </g>
      </svg>
      <div className="wheel-hub">
        <strong className={landed === "win" || landed === "clover" ? "hub-good" : landed === "fail" ? "hub-bad" : ""}>
          {odds.valid ? odds.winChance.toFixed(2) : "—"}
          <em>%</em>
        </strong>
        <span>{hub}</span>
      </div>
    </div>
  );
});
