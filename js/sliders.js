/* ==========================================================================
   MarmoFiber — sliders.js
   Swiper instances with custom GSAP transitions. No default Swiper chrome is
   used: navigation, counters and progress are our own markup.
   ========================================================================== */

import Swiper from 'swiper'
import { A11y, Autoplay, Keyboard, EffectFade } from 'swiper/modules'

const $ = (s, c = document) => c.querySelector(s)
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s))

export function initSliders({ gsap, reduced }) {
  initHero({ gsap, reduced })
  initProjectsMobile({ gsap })
}

/* --------------------------------------------------------- Hero slider */
function initHero({ gsap, reduced }) {
  const root = $('.hero__swiper')
  if (!root) return

  const slides = $$('.hero__slide', root)
  const numberEl = $('[data-hero-num]')
  const totalEl = $('[data-hero-total]')
  const bar = $('.hero__bar')
  const barFill = bar && $('i', bar)
  const bullets = $$('.hero__bullet')
  const prevBtn = $('[data-hero-prev]')
  const nextBtn = $('[data-hero-next]')
  const AUTOPLAY = 6800

  if (totalEl) totalEl.textContent = String(slides.length).padStart(2, '0')

  /** Animate the incoming slide: mask reveal + staggered headline. */
  const enter = (slide, direction = 1) => {
    if (reduced) return
    const media = $('.hero__media', slide)
    const img = media && $('img', media)
    const grid = $('.hero__grid', slide)
    const lines = $$('.hero__title .line > span', slide)
    const bits = [$('.hero__eyebrow', slide), $('.hero__desc', slide), $('.hero__cta', slide)].filter(Boolean)

    // In loop mode Swiper reuses the same slide elements, so undo whatever the
    // previous exit() left behind before animating this slide back in.
    if (grid) gsap.set(grid, { x: 0, opacity: 1, clearProps: 'transform' })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    if (media) {
      tl.fromTo(media,
        { clipPath: direction > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0 0 0%)', duration: 1.15, ease: 'power3.inOut' }, 0)
    }
    if (img) {
      tl.fromTo(img, { scale: 1.18 }, { scale: 1.06, duration: 2, ease: 'power2.out' }, 0)
    }
    if (lines.length) {
      tl.fromTo(lines, { yPercent: 118 }, { yPercent: 0, duration: 1.05, stagger: 0.075 }, 0.2)
    }
    if (bits.length) {
      tl.fromTo(bits, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 }, 0.35)
    }
    return tl
  }

  /** Push the outgoing slide the other way. */
  const exit = (slide, direction = 1) => {
    if (reduced) return
    const img = $('.hero__media img', slide)
    const content = $('.hero__grid', slide)
    if (img) gsap.to(img, { scale: 1.16, duration: 1.3, ease: 'power2.out', overwrite: true })
    if (content) {
      gsap.fromTo(content,
        { x: 0, opacity: 1 },
        { x: direction > 0 ? -50 : 50, opacity: 0, duration: 0.65, ease: 'power2.in', overwrite: true }
      )
    }
  }

  const setNumber = (index) => {
    if (!numberEl) return
    const next = String(index + 1).padStart(2, '0')
    if (reduced) { numberEl.textContent = next; return }
    gsap.to(numberEl, {
      yPercent: -100, opacity: 0, duration: 0.28, ease: 'power2.in',
      onComplete: () => {
        numberEl.textContent = next
        gsap.fromTo(numberEl, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
      }
    })
  }

  const swiper = new Swiper(root, {
    modules: [A11y, Autoplay, Keyboard, EffectFade],
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: reduced ? 0 : 1100,
    loop: true,
    grabCursor: false,
    keyboard: { enabled: true, onlyInViewport: true },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide',
      containerMessage: 'MarmoFiber featured stories'
    },
    autoplay: reduced ? false : { delay: AUTOPLAY, disableOnInteraction: false, pauseOnMouseEnter: true },
    on: {
      init(sw) {
        setNumber(sw.realIndex)
        updateBullets(sw.realIndex)
        enter(sw.slides[sw.activeIndex], 1)
      },
      slideChangeTransitionStart(sw) {
        const dir = sw.swipeDirection === 'prev' ? -1 : 1
        setNumber(sw.realIndex)
        updateBullets(sw.realIndex)
        enter(sw.slides[sw.activeIndex], dir)
        if (sw.previousIndex != null && sw.slides[sw.previousIndex]) {
          exit(sw.slides[sw.previousIndex], dir)
        }
        if (barFill) gsap.set(barFill, { scaleX: 0 })
      },
      autoplayTimeLeft(sw, time, progress) {
        if (barFill) gsap.set(barFill, { scaleX: 1 - progress })
      }
    }
  })

  function updateBullets(realIndex) {
    bullets.forEach((b, i) => b.setAttribute('aria-current', String(i === realIndex)))
  }

  bullets.forEach((b, i) => b.addEventListener('click', () => swiper.slideToLoop(i)))
  if (prevBtn) prevBtn.addEventListener('click', () => swiper.slidePrev())
  if (nextBtn) nextBtn.addEventListener('click', () => swiper.slideNext())

  // Pause while the tab is hidden so the progress bar never lies.
  document.addEventListener('visibilitychange', () => {
    if (!swiper.autoplay) return
    document.hidden ? swiper.autoplay.stop() : swiper.autoplay.start()
  })
}

/* ------------------------------- Horizontal projects → swipe on small screens */
function initProjectsMobile({ gsap }) {
  const viewport = $('.projects-h__viewport')
  if (!viewport) return

  const track = $('.projects-h__track', viewport)
  const counterNow = $('[data-projects-now]')
  const counterAll = $('[data-projects-all]')
  const bar = $('.projects-h__bar i')
  const cards = $$('.project-card', viewport)
  if (counterAll) counterAll.textContent = String(cards.length).padStart(2, '0')

  const mq = window.matchMedia('(max-width: 1080px)')
  let instance = null

  const build = () => {
    if (instance) return
    gsap.set(track, { clearProps: 'transform' })
    instance = new Swiper(viewport, {
      modules: [A11y, Keyboard],
      slidesPerView: 'auto',
      spaceBetween: 16,
      grabCursor: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { enabled: true, containerMessage: 'MarmoFiber selected projects' },
      on: {
        slideChange(sw) {
          if (counterNow) counterNow.textContent = String(sw.activeIndex + 1).padStart(2, '0')
          if (bar) bar.style.width = `${((sw.activeIndex + 1) / cards.length) * 100}%`
        }
      }
    })
  }

  const teardown = () => {
    if (!instance) return
    instance.destroy(true, true)
    instance = null
    gsap.set(track, { x: 0 })
  }

  const sync = () => (mq.matches ? build() : teardown())
  sync()
  mq.addEventListener('change', sync)
}
