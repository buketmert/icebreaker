import { useMemo } from 'react'

const COLORS = ['#ef476f', '#ffd166', '#06a77d', '#118ab2', '#6a4c93', '#f78c35']

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.4,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            rotate: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}
