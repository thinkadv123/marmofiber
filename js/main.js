/* ==========================================================================
   MarmoFiber — main.js
   Entry point. Boots smooth scrolling, chrome (header / rail / menu / cursor)
   and the page-level interactions: filtering, finish modal, project overlay
   and the contact form.
   ========================================================================== */

// Vendor styles first — our own sheets must be able to override them.
import 'swiper/css'
import 'swiper/css/effect-fade'

import '../css/main.css'
import '../css/responsive.css'

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { initAnimations } from './animations.js'
import { initSliders } from './sliders.js'
import { initPageTransitions } from './page-transitions.js'

gsap.registerPlugin(ScrollTrigger)

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isTouch = window.matchMedia('(hover: none)').matches || window.innerWidth <= 1080

const $ = (sel, ctx = document) => ctx.querySelector(sel)
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel))

/**
 * Vite rewrites src/href in HTML, but NOT paths held in data-* attributes.
 * The finish modal and the project overlay both load their images from data-*,
 * so those paths have to be mapped to the built (hashed) URLs by hand. These
 * globs do that at build time; in dev they resolve to the source paths.
 */
const ASSET_URLS = {
  ...import.meta.glob('../assets/projects/**/*.webp', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/finishes/*.webp', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/finishes/tile/*.webp', { eager: true, query: '?url', import: 'default' })
}

const assetUrl = (path) => ASSET_URLS[`../${String(path).trim().replace(/^\/+/, '')}`] || path

/* ------------------------------------------------------- Smooth scrolling */
export let lenis = null

function initSmoothScroll() {
  if (reduced) return null

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6
  })

  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  return lenis
}

export function stopScroll() { lenis ? lenis.stop() : document.body.classList.add('nav-open') }
export function startScroll() { lenis ? lenis.start() : document.body.classList.remove('nav-open') }

/* --------------------------------------------------------------- Header */
function initHeader() {
  const header = $('.header')
  if (!header) return

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
}

/* -------------------------------------------------------- Mobile menu */
function initMobileMenu() {
  const toggle = $('.menu-toggle')
  const nav = $('.mobile-nav')
  if (!toggle || !nav) return

  const items = $$('.mobile-nav__item', nav)
  const foot = $('.mobile-nav__foot', nav)
  let open = false

  // `y: 0` clears the CSS translateY(-100%) fallback so GSAP owns the axis.
  gsap.set(nav, { y: 0, yPercent: -100, visibility: 'hidden' })

  const tl = gsap.timeline({ paused: true })
    .set(nav, { visibility: 'visible' })
    .to(nav, { yPercent: 0, duration: 0.75, ease: 'power3.inOut' })
    .from(items.map((i) => i.firstElementChild), {
      yPercent: 110, opacity: 0, duration: 0.6, stagger: 0.055, ease: 'power3.out'
    }, '-=0.35')
    .from(foot, { opacity: 0, y: 18, duration: 0.5, ease: 'power3.out' }, '-=0.3')

  const setState = (next) => {
    open = next
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    document.body.classList.toggle('nav-open', open)
    if (open) {
      stopScroll()
      tl.timeScale(1).play()
    } else {
      tl.timeScale(1.5).reverse()
      startScroll()
    }
  }

  toggle.addEventListener('click', () => setState(!open))
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setState(false) })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setState(false) })
  window.addEventListener('resize', () => { if (open && window.innerWidth > 1080) setState(false) })
}

/* ------------------------------------------------------- Custom cursor */
function initCursor() {
  if (isTouch || reduced) return

  const dot = $('.cursor')
  const ring = $('.cursor-ring')
  const label = ring && $('span', ring)
  if (!dot || !ring) return

  const pos = { x: innerWidth / 2, y: innerHeight / 2 }
  const ringPos = { ...pos }
  let visible = false

  const xTo = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' })
  const yTo = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' })
  const rxTo = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' })
  const ryTo = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' })

  window.addEventListener('mousemove', (e) => {
    pos.x = e.clientX; pos.y = e.clientY
    if (!visible) {
      visible = true
      gsap.to([dot, ring], { opacity: 1, duration: 0.4 })
    }
    xTo(pos.x); yTo(pos.y); rxTo(pos.x); ryTo(pos.y)
  })

  document.addEventListener('mouseleave', () => {
    visible = false
    gsap.to([dot, ring], { opacity: 0, duration: 0.3 })
  })

  // Elements can ask the cursor for a label: data-cursor="EXPLORE"
  document.addEventListener('mouseover', (e) => {
    const labelled = e.target.closest('[data-cursor]')
    const hoverable = e.target.closest('a, button, input, select, textarea, [role="button"]')
    if (labelled) {
      label.textContent = labelled.dataset.cursor
      ring.classList.add('is-labelled')
      ring.classList.remove('is-hover')
    } else {
      ring.classList.remove('is-labelled')
      ring.classList.toggle('is-hover', Boolean(hoverable))
    }
  })

  void ringPos
}

/* --------------------------------------------------- Magnetic CTA buttons */
function initMagnetic() {
  if (isTouch || reduced) return

  $$('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.32
    const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    })
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0) })
  })
}

/* ------------------------------------ Scroll progress (top bar + left rail) */
function initProgress() {
  const bar = $('.scroll-progress i')
  const rail = $('.rail__progress')
  if (!bar && !rail) return

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
    if (bar) bar.style.width = `${p * 100}%`
    if (rail) rail.style.height = `${p * 100}%`
  }

  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
}

/* ------------------------------------------------------------- Filtering */
/**
 * Generic, reusable filter. Wrap any grid in [data-filter-group] and give the
 * items a space-separated `data-tags` list; buttons carry `data-filter`.
 */
function initFilters() {
  $$('[data-filter-group]').forEach((group) => {
    const buttons = $$('[data-filter]', group)
    const items = $$('[data-tags]', group)
    const counter = $('[data-filter-count]', group)

    const apply = (value) => {
      let shown = 0
      items.forEach((item) => {
        const tags = item.dataset.tags.split(/\s+/)
        const match = value === 'all' || tags.includes(value)
        item.classList.toggle('is-hidden', !match)
        if (match) shown += 1
      })

      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === value)))
      if (counter) counter.textContent = String(shown).padStart(2, '0')

      if (!reduced) {
        gsap.fromTo(
          items.filter((i) => !i.classList.contains('is-hidden')),
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.035, ease: 'power3.out', overwrite: true }
        )
      }
      ScrollTrigger.refresh()
    }

    buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)))

    // Deep links such as collections.html?collection=marble open pre-filtered.
    const param = group.dataset.filterParam
    const requested = param ? new URLSearchParams(location.search).get(param) : null
    const valid = requested && buttons.some((b) => b.dataset.filter === requested)
    apply(valid ? requested : group.dataset.filterGroup || 'all')
  })
}

/* --------------------------------------------------------- Finish modal */
function initFinishModal() {
  const modal = $('#finish-modal')
  if (!modal) return

  const panel = $('.modal__panel', modal)
  const img = $('[data-modal-image]', modal)
  const name = $('[data-modal-name]', modal)
  const coll = $('[data-modal-collection]', modal)
  const desc = $('[data-modal-desc]', modal)
  const code = $('[data-modal-code]', modal)
  const use = $('[data-modal-use]', modal)
  const apps = $('[data-modal-applications]', modal)
  const sampleLink = $('[data-modal-sample]', modal)
  let lastFocus = null

  const open = (card) => {
    const d = card.dataset
    img.src = assetUrl(d.image)
    img.alt = `${d.name} — MarmoFiber ${d.collection} finish`
    name.textContent = d.name
    coll.textContent = d.collection
    desc.textContent = d.desc
    code.textContent = d.code
    use.textContent = d.use
    apps.textContent = d.applications
    if (sampleLink) sampleLink.href = `contact.html?enquiry=sample&finish=${encodeURIComponent(d.name)}`

    lastFocus = document.activeElement
    modal.classList.add('is-open')
    modal.setAttribute('aria-hidden', 'false')
    stopScroll()
    $('.modal__close', modal).focus()
  }

  const close = () => {
    modal.classList.remove('is-open')
    modal.setAttribute('aria-hidden', 'true')
    startScroll()
    if (lastFocus) lastFocus.focus()
  }

  $$('[data-finish]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-no-modal]')) return
      open(card)
    })
  })

  $$('[data-modal-close]', modal).forEach((el) => el.addEventListener('click', close))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close()
  })

  // Keep focus inside the dialog while it is open.
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return
    const focusables = $$('a[href], button:not([disabled]), input, select, textarea', modal)
      .filter((el) => el.offsetParent !== null)
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  })
}

/* ------------------------------------------------ Project detail overlay */
function initProjectDetail() {
  const overlay = $('#project-detail')
  if (!overlay) return

  const tiles = $$('[data-project]')
  if (!tiles.length) return

  const fields = {
    image: $('[data-pd-image]', overlay),
    title: $('[data-pd-title]', overlay),
    cat: $('[data-pd-category]', overlay),
    location: $('[data-pd-location]', overlay),
    sector: $('[data-pd-sector]', overlay),
    application: $('[data-pd-application]', overlay),
    scope: $('[data-pd-scope]', overlay),
    overview: $('[data-pd-overview]', overlay),
    material: $('[data-pd-material]', overlay),
    detail: $('[data-pd-detail]', overlay),
    gallery: $('[data-pd-gallery]', overlay)
  }

  const prevBtn = $('[data-pd-prev]', overlay)
  const nextBtn = $('[data-pd-next]', overlay)
  let index = 0
  let lastFocus = null

  const render = (i) => {
    const visible = tiles.filter((t) => !t.classList.contains('is-hidden'))
    const list = visible.length ? visible : tiles
    index = (i + list.length) % list.length
    const d = list[index].dataset

    fields.image.src = assetUrl(d.image)
    fields.image.alt = `${d.title} — MarmoFiber project`
    fields.title.textContent = d.title
    fields.cat.textContent = d.category
    fields.location.textContent = d.location
    fields.sector.textContent = d.sector
    fields.application.textContent = d.application
    fields.scope.textContent = d.scope
    fields.overview.textContent = d.overview
    fields.material.textContent = d.material
    fields.detail.textContent = d.detail

    fields.gallery.innerHTML = (d.gallery || '')
      .split(',')
      .filter(Boolean)
      .map((src, n) => `<div><img src="${assetUrl(src)}" alt="${d.title} — material detail ${n + 1}" loading="lazy" decoding="async"></div>`)
      .join('')

    prevBtn.disabled = list.length < 2
    nextBtn.disabled = list.length < 2
    overlay.scrollTop = 0
  }

  const open = (i) => {
    lastFocus = document.activeElement
    render(i)
    overlay.classList.add('is-open')
    overlay.setAttribute('aria-hidden', 'false')
    stopScroll()
    $('.project-detail__close', overlay).focus()
  }

  const close = () => {
    overlay.classList.remove('is-open')
    overlay.setAttribute('aria-hidden', 'true')
    startScroll()
    if (lastFocus) lastFocus.focus()
  }

  tiles.forEach((tile) => {
    tile.addEventListener('click', (e) => {
      e.preventDefault()
      const visible = tiles.filter((t) => !t.classList.contains('is-hidden'))
      const list = visible.length ? visible : tiles
      open(list.indexOf(tile))
    })
  })

  prevBtn.addEventListener('click', () => render(index - 1))
  nextBtn.addEventListener('click', () => render(index + 1))
  $$('[data-pd-close]', overlay).forEach((el) => el.addEventListener('click', close))
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') render(index + 1)
    if (e.key === 'ArrowLeft') render(index - 1)
  })
}

/* ---------------------------------------------------------- Contact form */
/**
 * The site is static, so the form posts to a third-party endpoint.
 *
 *   ▸ Formspree  — set FORM_ENDPOINT to https://formspree.io/f/XXXXXXXX
 *   ▸ Netlify    — delete FORM_ENDPOINT, add `data-netlify="true"` to the
 *                  <form> and remove the fetch() branch below.
 *   ▸ No backend — leave FORM_ENDPOINT empty and the form falls back to a
 *                  prefilled mailto: link (MAIL_FALLBACK).
 */
const FORM_ENDPOINT = '' // ← REPLACE with your Formspree (or similar) endpoint
const MAIL_FALLBACK = 'hello@marmofiber.com'

function initContactForm() {
  const form = $('#enquiry-form')
  if (!form) return

  const status = $('.form-status', form)
  const typeInput = $('#enquiry-type', form)

  // Enquiry-type cards select the matching hidden value.
  const cards = $$('[data-enquiry]')
  const setType = (value) => {
    if (typeInput) typeInput.value = value
    cards.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.enquiry === value)))
  }
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      setType(card.dataset.enquiry)
      form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    })
  })

  // Deep links: contact.html?enquiry=sample&finish=Caramel
  const params = new URLSearchParams(location.search)
  if (params.get('enquiry')) setType(params.get('enquiry'))
  if (params.get('finish')) {
    const collection = $('#collection', form)
    const message = $('#message', form)
    if (collection) collection.value = params.get('finish')
    if (message && !message.value) message.value = `I would like to request a sample of the ${params.get('finish')} finish.`
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.dataset.state = ''
    status.textContent = 'Sending…'

    const data = new FormData(form)

    if (!FORM_ENDPOINT) {
      const lines = []
      data.forEach((value, key) => { if (value && typeof value === 'string') lines.push(`${key}: ${value}`) })
      const href = `mailto:${MAIL_FALLBACK}?subject=${encodeURIComponent('MarmoFiber enquiry — ' + (data.get('enquiry-type') || 'General'))}&body=${encodeURIComponent(lines.join('\n'))}`
      status.dataset.state = 'ok'
      status.textContent = 'Opening your email client…'
      window.location.href = href
      return
    }

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
      if (!res.ok) throw new Error('Request failed')
      status.dataset.state = 'ok'
      status.textContent = 'Thank you. Our team will be in touch shortly.'
      form.reset()
      setType('sample')
    } catch (err) {
      status.dataset.state = 'error'
      status.textContent = `Something went wrong. Please email ${MAIL_FALLBACK}.`
    }
  })
}

/* --------------------------------------------------- Material visualiser */
/**
 * Drop (or tap) a finish onto the building. Drag-and-drop is a desktop
 * nicety — HTML5 DnD does not fire on touch — so tapping a swatch is the
 * primary interaction and works everywhere, keyboard included.
 */
function initVisualiser() {
  const viz = $('[data-viz]')
  if (!viz) return

  const texture = $('[data-viz-texture]', viz)
  const badge = $('[data-viz-badge]')
  const badgeName = $('[data-viz-name]')
  const badgeCollection = $('[data-viz-collection]')
  const status = $('[data-viz-status]')
  const scale = $('[data-viz-scale]')
  const reset = $('[data-viz-reset]')
  const swatches = $$('[data-viz-finish]')
  if (!texture || !swatches.length) return

  let current = null

  const apply = (swatch) => {
    const { tile, name, collection } = swatch.dataset
    current = swatch
    texture.style.backgroundImage = `url("${assetUrl(tile)}")`
    viz.classList.add('is-applied')
    swatches.forEach((s) => s.setAttribute('aria-pressed', String(s === swatch)))

    if (badge) badge.hidden = false
    if (badgeName) badgeName.textContent = name
    if (badgeCollection) badgeCollection.textContent = collection
    if (status) status.textContent = `${name} applied — ${collection} Collection.`
    if (reset) reset.disabled = false
  }

  const clear = () => {
    current = null
    texture.style.backgroundImage = 'none'
    viz.classList.remove('is-applied')
    swatches.forEach((s) => s.setAttribute('aria-pressed', 'false'))
    if (badge) badge.hidden = true
    if (status) status.textContent = 'No finish applied.'
    if (reset) reset.disabled = true
  }

  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => apply(swatch))
    swatch.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'copy'
      // some browsers refuse the drag without payload
      e.dataTransfer.setData('text/plain', swatch.dataset.name)
      viz.dataset.dragging = swatch.dataset.name
    })
    swatch.addEventListener('dragend', () => { delete viz.dataset.dragging })
  })

  const findDragged = () => swatches.find((s) => s.dataset.name === viz.dataset.dragging)

  viz.addEventListener('dragover', (e) => {
    if (!viz.dataset.dragging) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    viz.classList.add('is-dragover')
  })
  viz.addEventListener('dragleave', (e) => {
    if (!viz.contains(e.relatedTarget)) viz.classList.remove('is-dragover')
  })
  viz.addEventListener('drop', (e) => {
    e.preventDefault()
    viz.classList.remove('is-dragover')
    const swatch = findDragged()
    if (swatch) apply(swatch)
  })

  if (scale) {
    scale.addEventListener('input', () => {
      viz.style.setProperty('--viz-tile', `${scale.value}px`)
    })
  }
  if (reset) reset.addEventListener('click', clear)

  void current
}

/* ------------------------------------------------------ Language switcher */
function initLanguage() {
  $$('.lang button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.lang button').forEach((b) => b.classList.remove('is-active'))
      btn.classList.add('is-active')
      // Hook a real i18n route here when the second language is ready.
    })
  })
}

/* -------------------------------------------------------- Page identity */
/**
 * Every page declares itself once, on <body>:
 *   data-page="collections" data-page-number="03" data-page-label="Collections"
 * The shared header and rail pick it up from there.
 */
function initPageState() {
  const { page, pageNumber, pageLabel } = document.body.dataset
  if (!page) return

  $$('a[data-page]').forEach((link) => {
    const active = link.dataset.page === page
    link.classList.toggle('is-active', active)
    if (active) link.setAttribute('aria-current', 'page')
  })

  const num = $('[data-rail-number]')
  const label = $('[data-rail-label]')
  if (num && pageNumber) num.textContent = pageNumber
  if (label && pageLabel) label.textContent = pageLabel
}

/* ------------------------------------------------------------- Misc */
function initMisc() {
  const year = $('[data-year]')
  if (year) year.textContent = new Date().getFullYear()

  // Anchor links inside the page should use Lenis.
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')
      if (id.length < 2) return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target, { offset: -100 })
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    })
  })
}

/* ---------------------------------------------------------------- Boot */
function boot() {
  document.documentElement.dataset.mfReady = 'true'

  initSmoothScroll()
  initPageState()
  initHeader()
  initMobileMenu()
  initCursor()
  initMagnetic()
  initProgress()
  initFilters()
  initFinishModal()
  initProjectDetail()
  initContactForm()
  initVisualiser()
  initLanguage()
  initMisc()

  initSliders({ gsap, reduced })
  initAnimations({ gsap, ScrollTrigger, reduced })
  initPageTransitions({ gsap, reduced })

  // Images that arrive late change layout height; keep triggers honest.
  window.addEventListener('load', () => ScrollTrigger.refresh())
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
