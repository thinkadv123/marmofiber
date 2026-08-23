/* ==========================================================================
   MarmoFiber — page-transitions.js

   A five-panel curtain wipes between pages. This deliberately keeps real
   multi-page navigation (every URL is a real document, good for SEO and for
   sharing) instead of turning the site into a single-page app — Barba.js can
   be dropped in later if a client-side router is ever needed.

   On the first visit of a session an architectural loader draws the MF mark
   before the curtain lifts.
   ========================================================================== */

const $ = (s, c = document) => c.querySelector(s)
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s))

const SESSION_KEY = 'mf-loader-shown'

export function initPageTransitions({ gsap, reduced }) {
  const loader = $('.loader')
  const curtain = $('.curtain')
  const panels = curtain ? $$('i', curtain) : []

  const firstVisit = !sessionStorage.getItem(SESSION_KEY)

  /* ------------------------------------------------------------- Loader */
  if (loader && firstVisit && !reduced) {
    sessionStorage.setItem(SESSION_KEY, '1')
    document.body.style.overflow = 'hidden'

    const strokes = $$('.loader__mark path, .loader__mark line', loader)
    const word = $('.loader__word', loader)
    const barFill = $('.loader__bar i', loader)
    const count = $('.loader__count', loader)
    const counter = { v: 0 }

    strokes.forEach((s) => {
      const len = s.getTotalLength ? s.getTotalLength() : 200
      gsap.set(s, { strokeDasharray: len, strokeDashoffset: len })
    })

    gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        document.body.style.overflow = ''
        loader.remove()
      }
    })
      .to(strokes, { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: 'power2.inOut' })
      .fromTo(word, { opacity: 0, letterSpacing: '0.8em' }, { opacity: 1, letterSpacing: '0.34em', duration: 0.9 }, '-=0.55')
      .to(barFill, { right: '0%', duration: 1.1, ease: 'power2.inOut' }, '-=0.9')
      .to(counter, {
        v: 100, duration: 1.1, ease: 'power2.inOut',
        onUpdate: () => { if (count) count.textContent = `${String(Math.round(counter.v)).padStart(3, '0')} —` }
      }, '<')
      .to(loader, { yPercent: -100, duration: 0.95, ease: 'power3.inOut' }, '+=0.15')
  } else if (loader) {
    sessionStorage.setItem(SESSION_KEY, '1')
    loader.remove()
  }

  if (!curtain || reduced) return

  /* ---------------------------------------------------- Entry (curtain up) */
  gsap.set(panels, { scaleY: firstVisit ? 0 : 1, transformOrigin: 'top' })

  if (!firstVisit) {
    gsap.to(panels, {
      scaleY: 0,
      transformOrigin: 'top',
      duration: 0.75,
      stagger: 0.06,
      ease: 'power3.inOut',
      delay: 0.05
    })
  }

  /* ------------------------------------------------- Exit (curtain down) */
  const isInternal = (a) => {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false
    const href = a.getAttribute('href')
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
    if (a.dataset.noTransition !== undefined) return false
    return new URL(a.href, location.href).origin === location.origin
  }

  document.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const a = e.target.closest('a')
    if (!isInternal(a)) return

    const url = new URL(a.href, location.href)
    if (url.pathname === location.pathname && url.search === location.search) return

    e.preventDefault()
    gsap.to(panels, {
      scaleY: 1,
      transformOrigin: 'bottom',
      duration: 0.6,
      stagger: 0.055,
      ease: 'power3.inOut',
      onComplete: () => { window.location.href = a.href }
    })
  })

  // Coming back through history should not leave the curtain down.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set(panels, { scaleY: 0 })
  })
}
