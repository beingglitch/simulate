import { useRef, useEffect } from 'react'

interface Props {
  rfFingerprint: string
  active: boolean
}

const NUM_BARS = 32
const W = 120, H = 40

function fingerprintColor(fp: string): string {
  if (/2\.4GHz|5\.8GHz/.test(fp)) return '#4da6ff'
  if (/433MHz|315MHz/.test(fp))    return '#f59e0b'
  if (/900MHz/.test(fp))           return '#3dd68c'
  if (/1\.4GHz/.test(fp))          return '#e050a0'
  return '#4da6ff'
}

export default function RFSpectrum({ rfFingerprint, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bars      = useRef<Float32Array>(new Float32Array(NUM_BARS))
  const targets   = useRef<Float32Array>(new Float32Array(NUM_BARS))
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const barW = W / NUM_BARS
    const color = fingerprintColor(rfFingerprint)

    function randomize() {
      for (let i = 0; i < NUM_BARS; i++) {
        targets.current[i] = Math.random() * 0.9 + 0.05
      }
    }
    randomize()

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const b = bars.current
      const t = targets.current

      for (let i = 0; i < NUM_BARS; i++) {
        if (active) {
          b[i] += (t[i] - b[i]) * 0.4
        } else {
          b[i] *= 0.97
        }
        const bh = b[i] * H
        ctx.fillStyle = color
        ctx.globalAlpha = active ? 0.85 : 0.3
        ctx.fillRect(i * barW + 0.5, H - bh, barW - 1, bh)
      }
      ctx.globalAlpha = 1
    }

    timerRef.current = setInterval(() => {
      if (active) randomize()
      draw()
    }, 200)

    draw()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [rfFingerprint, active])

  return (
    <canvas
      ref={canvasRef}
      width={W} height={H}
      style={{ display: 'block', width: W, height: H }}
    />
  )
}
