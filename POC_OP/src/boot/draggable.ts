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
function headerH(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--q-header-height')
  return v ? parseFloat(v) : 50
}

const vDraggable: Directive<HTMLElement> = {
  mounted(el) {
    let isDocked = false
    let freePos = { left: 0, top: 0 }

    // ── Posição inicial ────────────────────────────────────────────────────
    requestAnimationFrame(() => {
      const saved = loadPos()
      if (saved) {
        freePos = {
          left: clamp(saved.left, 0, window.innerWidth  - el.offsetWidth),
          top:  clamp(saved.top,  0, window.innerHeight - el.offsetHeight),
        }
      } else {
        freePos = {
          left: window.innerWidth  - el.offsetWidth  - 24,
          top:  window.innerHeight - el.offsetHeight - 24,
        }
      }
      el.style.left   = freePos.left + 'px'
      el.style.top    = freePos.top  + 'px'
      el.style.bottom = 'auto'
      el.style.right  = 'auto'
    })

    // ── Dock / Undock ──────────────────────────────────────────────────────
    function getDockPos() {
      const h = headerH()
      const filterBar = document.querySelector('.filter-bar') as HTMLElement | null
      let barH = 0
      if (filterBar) {
        // Espera o CSS expandir antes de calcular a altura
        barH = filterBar.getBoundingClientRect().height
      }
      const dockTop  = h + Math.max(barH - el.offsetHeight, 0) / 2 + 6
      const dockLeft = window.innerWidth - el.offsetWidth - 20
      return { left: dockLeft, top: dockTop }
    }

    function animateTo(target: { left: number; top: number }, onDone?: () => void) {
      el.style.transition = 'left .32s cubic-bezier(.4,0,.2,1), top .32s cubic-bezier(.4,0,.2,1)'
      el.style.left = target.left + 'px'
      el.style.top  = target.top  + 'px'
      const tid = setTimeout(() => {
        el.style.transition = ''
        onDone?.()
      }, 350)
      return tid
    }

    const observer = new MutationObserver(() => {
      const active = el.classList.contains('filter-fab--active')

      if (active && !isDocked) {
        isDocked = true
        freePos = {
          left: parseInt(el.style.left) || freePos.left,
          top:  parseInt(el.style.top)  || freePos.top,
        }
        // Pequeno delay para o filter-bar já ter aberto e ter altura
        setTimeout(() => animateTo(getDockPos()), 30)
      } else if (!active && isDocked) {
        isDocked = false
        animateTo(freePos)
      }
    })
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })

    // ── Drag (bloqueado quando docked) ────────────────────────────────────
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
        freePos = { left: parseInt(el.style.left), top: parseInt(el.style.top) }
        savePos(freePos.left, freePos.top)
      }
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }

    el.addEventListener('mousedown', (e: MouseEvent) => {
      if (isDocked) return
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
      if (isDocked) return
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
        if (moved) {
          freePos = { left: parseInt(el.style.left), top: parseInt(el.style.top) }
          savePos(freePos.left, freePos.top)
        }
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
