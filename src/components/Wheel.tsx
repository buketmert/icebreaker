import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react'
import type { WheelItem } from '../types'
import { playTick } from '../lib/sound'
import { random, randomInt } from '../lib/random'
import {
  easeOut,
  indexAtRotation,
  polar,
  segmentAngle,
  slicePath,
  targetRotation,
  wrapLabel,
} from '../lib/wheelMath'

export interface WheelHandle {
  spin: () => void
}

interface WheelProps {
  items: WheelItem[]
  spinSeconds: number
  soundOn: boolean
  emptyTitle: string
  emptyHint: string
  onSpinStart: () => void
  /** Dönüş başladığı andaki listeden seçilen dilim (dönüş sırasında liste değişse bile). */
  onResult: (item: WheelItem) => void
  ref?: Ref<WheelHandle>
}

const SIZE = 1000
const C = SIZE / 2
const R = 440
const HUB_R = 78
const LABEL_END = R - 28
/** Gösterge saat 3 yönünde: kazanan dilimin yazısı durduğunda yatay ve okunur olur. */
const POINTER = 90

const PALETTE = ['#ef476f', '#f78c35', '#ffd166', '#06a77d', '#118ab2', '#6a4c93', '#e56b9f', '#0fb5ae', '#ff6b6b', '#4361ee']

function textColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#1f2340' : '#ffffff'
}

function sliceColor(i: number, count: number): string {
  let idx = i % PALETTE.length
  // Son dilim ilk dilimle aynı renge denk gelmesin.
  if (count > 1 && i === count - 1 && idx === 0) idx = 2
  return PALETTE[idx]
}

export function Wheel({ items, spinSeconds, soundOn, emptyTitle, emptyHint, onSpinStart, onResult, ref }: WheelProps) {
  const discRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<SVGGElement>(null)
  const rotationRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const spinningRef = useRef(false)

  // Animasyon sırasında güncel prop'ları okumak için (yeniden render tetiklemeden).
  const live = useRef({ items, spinSeconds, soundOn, onSpinStart, onResult })
  useEffect(() => {
    live.current = { items, spinSeconds, soundOn, onSpinStart, onResult }
  })

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  // Yalnızca ref'leri okuduğu için kimliği hiç değişmez.
  const spin = useCallback(() => {
    const { items, spinSeconds, onSpinStart } = live.current
    const count = items.length
    if (spinningRef.current || count === 0) return
    spinningRef.current = true
    onSpinStart()

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const duration = (reduceMotion ? 1 : spinSeconds) * 1000
    const target = randomInt(count)
    const offset = 0.15 + random() * 0.7
    const turns = reduceMotion ? 1 : Math.max(3, Math.round(spinSeconds * 1.1)) + randomInt(2)
    const start = rotationRef.current
    const end = targetRotation(start, target, count, turns, offset, POINTER)

    let lastIndex = indexAtRotation(start, count, POINTER)
    let lastTick = 0
    const t0 = performance.now()

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const rot = start + (end - start) * easeOut(t)
      rotationRef.current = rot
      if (discRef.current) discRef.current.style.transform = `rotate(${rot}deg)`

      const idx = indexAtRotation(rot, count, POINTER)
      if (idx !== lastIndex) {
        lastIndex = idx
        if (now - lastTick > 45) {
          lastTick = now
          if (live.current.soundOn) playTick()
          pointerRef.current?.animate(
            [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(0deg)' }],
            { duration: 120, easing: 'ease-out' },
          )
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        rafRef.current = null
        spinningRef.current = false
        live.current.onResult(items[target])
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [])

  useImperativeHandle(ref, () => ({ spin }), [spin])

  const slices = useMemo(() => {
    const count = items.length
    if (count === 0) return []
    const seg = segmentAngle(count)
    // Yazıya dilime dik doğrultuda kalan boşluk, yarıçapın ~%60'ında ölçülür.
    const room = (2 * Math.PI * R * 0.6) / count
    const twoLines = count <= 16
    const fontSize = Math.round(Math.max(12, Math.min(twoLines ? 30 : 34, room * (twoLines ? 0.36 : 0.55))))
    const textLength = LABEL_END - (HUB_R + 24)
    const maxChars = Math.max(4, Math.floor(textLength / (fontSize * 0.54)))

    return items.map((item, i) => {
      const start = i * seg
      const color = sliceColor(i, count)
      return {
        key: item.refId,
        path: slicePath(C, C, R, start, start + seg),
        color,
        text: textColor(color),
        mid: start + seg / 2,
        lines: wrapLabel(item.label, maxChars, twoLines ? 2 : 1),
        fontSize,
        peg: polar(C, C, R - 10, start),
      }
    })
  }, [items])

  const empty = items.length === 0

  return (
    <div className="wheel">
      <div className="wheel-disc" ref={discRef}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${items.length} dilimli çark`}>
          <circle cx={C} cy={C} r={R + 14} className="wheel-rim" />
          {empty && <circle cx={C} cy={C} r={R} className="wheel-empty" />}
          {slices.map((s) => (
            <g key={s.key}>
              <path d={s.path} fill={s.color} stroke="rgba(255,255,255,.55)" strokeWidth={2} />
              <g transform={`rotate(${s.mid - 90} ${C} ${C})`}>
                <text x={C + LABEL_END} y={C} textAnchor="end" fontSize={s.fontSize} fill={s.text} className="wheel-label">
                  {s.lines.map((line, j) => (
                    <tspan
                      key={j}
                      x={C + LABEL_END}
                      dy={j === 0 ? `${0.35 - ((s.lines.length - 1) * 1.1) / 2}em` : '1.1em'}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            </g>
          ))}
          {slices.map((s) => (
            <circle key={`peg-${s.key}`} cx={s.peg[0]} cy={s.peg[1]} r={7} className="wheel-peg" />
          ))}
        </svg>
      </div>

      <svg className="wheel-overlay" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <g ref={pointerRef} className="wheel-pointer">
          <path d={`M ${C + R - 40} ${C} L ${SIZE - 4} ${C - 42} L ${SIZE - 4} ${C + 42} Z`} />
        </g>
      </svg>

      <button
        type="button"
        className="wheel-hub"
        style={{ width: `${((HUB_R * 2) / SIZE) * 100}%` }}
        onClick={spin}
        disabled={empty}
        aria-label="Çarkı çevir"
      >
        ÇEVİR
      </button>

      {empty && (
        <div className="wheel-empty-text">
          {emptyTitle}
          <small>{emptyHint}</small>
        </div>
      )}
    </div>
  )
}
