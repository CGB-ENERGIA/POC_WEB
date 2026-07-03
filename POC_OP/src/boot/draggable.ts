import { boot } from 'quasar/wrappers'
import type { Directive } from 'vue'

const STORAGE_KEY = 'cgb-fab-pos'

function loadPos(): { left: number; top: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { left: number; top: number }) : null
  } catch { return null }
}
function savePos(left: number, top: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }))
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

const vDraggable: Directive<HTMLElement> = {
  mounted(el) {
    // ── Posição inicial ────────────────────────────────────────────────────
    requestAnimationFrame(() => {
      const saved = loadPos()
      let left: number, top: number
      if (saved) {
        left = clamp(saved.left, 0, window.innerWidth  - el.offsetWidth)
        top  = clamp(saved.top,  0, window.innerHeight - el.offsetHeight)
      } else {
        left = window.innerWidth  - el.offsetWidth  - 24
        top  = window.innerHeight - el.offsetHeight - 24
      }
      el.style.left   = left + 'px'
      el.style.top    = top  + 'px'
      el.style.bottom = 'auto'
      el.style.right  = 'auto'
    })

    // ── Drag ────────────────────────────────────────────────────────────
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, moved = false

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true
      const nl = clamp(startLeft + dx, 0, window.innerWidth  - el.offsetWidth)
      const nt = clamp(startTop  + dy, 0, window.innerHeight - el.offsetHeight)
      el.style.left   = nl + 'px'
      el.style.top    = nt + 'px'
      el.style.cursor = 'grabbing'
    }

    const onMouseUp = () => {
      el.style.cursor = ''
      if (moved) {
        savePos(parseInt(el.style.left), parseInt(el.style.top))
      }
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }

    el.addEventListener('mousedown', (e: MouseEvent) => {
      moved = false
      startX    = e.clientX
      startY    = e.clientY
      startLeft = parseInt(el.style.left) || 0
      startTop  = parseInt(el.style.top)  || 0
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup',   onMouseUp)
    })

    el.addEventListener('click', (e: MouseEvent) => {
      if (moved) { e.stopImmediatePropagation(); moved = false }
    }, true)

    // ── Touch ──────────────────────────────────────────────────────────────
    el.addEventListener('touchstart', (e: TouchEvent) => {
      moved = false
      const t = e.touches[0]!
      startX    = t.clientX
      startY    = t.clientY
      startLeft = parseInt(el.style.left) || 0
      startTop  = parseInt(el.style.top)  || 0

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const t = e.touches[0]!
        const dx = t.clientX - startX
        const dy = t.clientY - startY
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true
        el.style.left = clamp(startLeft + dx, 0, window.innerWidth  - el.offsetWidth)  + 'px'
        el.style.top  = clamp(startTop  + dy, 0, window.innerHeight - el.offsetHeight) + 'px'
      }
      const onTouchEnd = () => {
        if (moved) savePos(parseInt(el.style.left), parseInt(el.style.top))
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend',  onTouchEnd)
      }
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend',  onTouchEnd)
    }, { passive: true })
  }
}

export default boot(({ app }) => {
  app.directive('draggable', vDraggable)
})
