/* ==========================================================================
   MarmoFiber — animations.js
   Scroll-driven motion. Everything is opt-in through data-attributes so new
   sections can be authored in HTML without touching this file:

     data-reveal            fade + rise into view
     data-reveal-group      stagger the direct children
     data-split             animate .line > span (lines are written in HTML)
     data-parallax="0.18"   slow vertical drift on scroll
     data-mask              clip-path image reveal
     data-draw              hairline that draws itself
     data-count="1995"      number that counts up once
   ========================================================================== */

const $ = (s, c = document) => c.querySelector(s)
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s))

export function initAnimations({ gsap, ScrollTrigger, reduced }) {
  if (reduced) {
    // Nothing moves, but nothing may stay invisible either.
    $$('[data-reveal]').forEach((el) => { el.style.opacity = '1' })
    return
  }

  const EASE = 'power3.out'

  /* ------------------------------------------------------------ Reveals */
  $$('[data-reveal]').forEach((el) => {
    const delay = Number(el.dataset.revealDelay || 0)
    gsap.fromTo(el,
      { opacity: 0, y: Number(el.dataset.revealY || 34) },
      {
        opacity: 1, y: 0, duration: 1, delay, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    )
  })

  $$('[data-reveal-group]').forEach((group) => {
    const children = Array.from(group.children)
    gsap.fromTo(children,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: EASE,
        scrollTrigger: { trigger: group, start: 'top 85%', once: true }
      }
    )
  })

  /* ------------------------------------------------- Split-line headlines */
  $$('[data-split]').forEach((el) => {
    const lines = $$('.line > span', el)
    if (!lines.length) return
    const isHero = el.closest('.hero__slide, .page-hero')

    gsap.fromTo(lines,
      { yPercent: 116 },
      {
        yPercent: 0,
        duration: 1.15,
        stagger: 0.085,
        ease: 'power3.out',
        delay: isHero ? 0.25 : 0,
        scrollTrigger: isHero ? undefined : { trigger: el, start: 'top 86%', once: true }
      }
    )
  })

  /* ----------------------------------------------------------- Parallax */
  $$('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax || 0.15)
    gsap.fromTo(el,
      { yPercent: -amount * 50 },
      {
        yPercent: amount * 50,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    )
  })

  /* ------------------------------------------------- Image mask reveals */
  $$('[data-mask]').forEach((el) => {
    const from = el.dataset.mask === 'left' ? 'inset(0 100% 0 0)' : 'inset(100% 0 0 0)'
    gsap.fromTo(el,
      { clipPath: from, webkitClipPath: from },
      {
        clipPath: 'inset(0% 0% 0% 0%)', webkitClipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.4, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    )
  })

  /* ------------------------------------------------ Hairlines that draw */
  $$('[data-draw]').forEach((el) => {
    const vertical = el.dataset.draw === 'v'
    gsap.fromTo(el,
      { scaleX: vertical ? 1 : 0, scaleY: vertical ? 0 : 1 },
      {
        scaleX: 1, scaleY: 1, duration: 1.2, ease: 'power3.inOut',
        transformOrigin: vertical ? 'top center' : 'left center',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      }
    )
  })

  /* ------------------------------------------------------ Counting numbers */
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count)
    const obj = { v: Number(el.dataset.countFrom || 0) }
    gsap.to(obj, {
      v: target, duration: 2.2, ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(obj.v) },
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    })
  })

  /* -------------------------------------------- Section numbers on scroll */
  $$('.benefit').forEach((row) => {
    const num = $('.benefit__num', row)
    if (!num) return
    gsap.fromTo(num,
      { color: '#343434' },
      {
        color: '#d6242c', duration: 0.6, ease: 'none',
        scrollTrigger: { trigger: row, start: 'top 72%', end: 'bottom 55%', toggleActions: 'play reverse play reverse' }
      }
    )
  })

  /* ------------------------------ Material composition: layers separate */
  const layers = $$('.composition__diagram .layer')
  if (layers.length) {
    gsap.from(layers, {
      y: -46, opacity: 0, duration: 1.1, stagger: 0.13, ease: EASE,
      scrollTrigger: { trigger: '.composition__diagram', start: 'top 78%', once: true }
    })

    // Hovering a legend row lifts the matching layer.
    $$('.composition__row').forEach((row, i) => {
      const layer = layers[i]
      if (!layer) return
      row.addEventListener('mouseenter', () => {
        $$('.composition__row').forEach((r) => r.classList.remove('is-active'))
        row.classList.add('is-active')
        gsap.to(layer, { y: -14, duration: 0.5, ease: EASE, overwrite: true })
      })
      row.addEventListener('mouseleave', () => {
        gsap.to(layer, { y: 0, duration: 0.6, ease: EASE, overwrite: true })
      })
    })
  }

  /* -------------------------------------- Statement: slow texture drift */
  const statementBg = $('.statement__bg')
  if (statementBg) {
    gsap.fromTo(statementBg,
      { yPercent: -6, scale: 1.06 },
      {
        yPercent: 6, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true }
      }
    )
  }

  /* --------------------------------------------- Vertical progress fills */
  $$('[data-fill]').forEach((el) => {
    const trigger = el.closest('[data-fill-track]') || el.parentElement
    gsap.fromTo(el,
      { height: '0%' },
      {
        height: '100%', ease: 'none',
        scrollTrigger: { trigger, start: 'top 72%', end: 'bottom 78%', scrub: 0.6 }
      }
    )
  })

  /* ------------------------------------------------- Process step states */
  const processSteps = $$('.process__step')
  processSteps.forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      end: 'bottom 48%',
      onToggle: (self) => step.classList.toggle('is-active', self.isActive)
    })
  })

  /* =============================================== Pinned experiences ==== */
  const mm = gsap.matchMedia()

  mm.add('(min-width: 1081px)', () => {
    initPinnedStages({ gsap, ScrollTrigger })
    initPinnedApplications({ gsap, ScrollTrigger })
    initHorizontalProjects({ gsap, ScrollTrigger })
  })

  // Below the desktop breakpoint the same content plays as a plain sequence.
  mm.add('(max-width: 1080px)', () => {
    initStackedStages({ gsap, ScrollTrigger })
    initStackedApplications({ gsap, ScrollTrigger })
  })

  ScrollTrigger.refresh()
}

/* -------------------------------------------------- Pinned material story */
function initPinnedStages({ gsap, ScrollTrigger }) {
  const section = $('.stages')
  if (!section) return

  const panels = $$('.stage-panel', section)
  const figures = $$('.stages__media figure', section)
  const count = $('.stages__count b', section)
  const fill = $('.stages__fill', section)
  const tone = $('.stages__tone', section)
  const texture = $('.stages__texture', section)
  const tones = ['#090909', '#131211', '#1b1917', '#201d1a']

  let current = -1
  const show = (i) => {
    if (i === current) return
    current = i
    panels.forEach((p, n) => p.classList.toggle('is-active', n === i))
    figures.forEach((f, n) => f.classList.toggle('is-active', n === i))
    if (count) count.textContent = String(i + 1).padStart(2, '0')
    if (tone) tone.style.backgroundColor = tones[i] || tones[0]

    const panel = panels[i]
    if (panel) {
      gsap.fromTo(panel.children,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.07, ease: 'power3.out', overwrite: true }
      )
    }
  }
  show(0)

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${window.innerHeight * (panels.length - 0.15)}`,
    pin: '.stages__viewport',
    scrub: 0.5,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: { snapTo: 1 / (panels.length - 1), duration: 0.35, delay: 0.06, ease: 'power2.inOut' },
    onUpdate: (self) => {
      const i = Math.min(panels.length - 1, Math.floor(self.progress * panels.length * 0.999))
      show(i)
      if (fill) fill.style.height = `${self.progress * 100}%`
      if (texture) gsap.set(texture, { yPercent: -8 + self.progress * 16 })
    }
  })

  return () => st.kill()
}

function initStackedStages({ gsap, ScrollTrigger }) {
  const section = $('.stages')
  if (!section) return
  const panels = $$('.stage-panel', section)
  const figures = $$('.stages__media figure', section)
  const count = $('.stages__count b', section)
  const fill = $('.stages__fill', section)

  const show = (i) => {
    panels.forEach((p, n) => p.classList.toggle('is-active', n === i))
    figures.forEach((f, n) => f.classList.toggle('is-active', n === i))
    if (count) count.textContent = String(i + 1).padStart(2, '0')
    if (fill) fill.style.height = `${((i + 1) / panels.length) * 100}%`
  }
  show(0)

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    end: 'bottom 40%',
    onUpdate: (self) => show(Math.min(panels.length - 1, Math.floor(self.progress * panels.length * 0.999)))
  })
  return () => st.kill()
}

/* ------------------------------------------------- Pinned applications */
function initPinnedApplications({ gsap, ScrollTrigger }) {
  const section = $('.apps-pin')
  if (!section) return

  const items = $$('.apps-pin__item', section)
  const figures = $$('.apps-pin__media figure', section)
  const caption = $('.apps-pin__caption', section)

  let current = -1
  const show = (i) => {
    if (i === current) return
    current = i
    items.forEach((it, n) => it.classList.toggle('is-active', n === i))
    figures.forEach((f, n) => f.classList.toggle('is-active', n === i))
    if (caption && figures[i]) caption.textContent = figures[i].dataset.caption || ''
  }
  show(0)

  items.forEach((item, i) => item.addEventListener('click', () => show(i)))

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${window.innerHeight * (items.length * 0.7)}`,
    pin: '.apps-pin__viewport',
    scrub: 0.4,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => show(Math.min(items.length - 1, Math.floor(self.progress * items.length * 0.999)))
  })

  return () => st.kill()
}

function initStackedApplications({ ScrollTrigger }) {
  const section = $('.apps-pin')
  if (!section) return
  const items = $$('.apps-pin__item', section)
  const figures = $$('.apps-pin__media figure', section)
  const caption = $('.apps-pin__caption', section)

  const show = (i) => {
    items.forEach((it, n) => it.classList.toggle('is-active', n === i))
    figures.forEach((f, n) => f.classList.toggle('is-active', n === i))
    if (caption && figures[i]) caption.textContent = figures[i].dataset.caption || ''
  }
  show(0)
  items.forEach((item, i) => item.addEventListener('click', () => show(i)))

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    end: 'bottom 40%',
    onUpdate: (self) => show(Math.min(items.length - 1, Math.floor(self.progress * items.length * 0.999)))
  })
  return () => st.kill()
}

/* --------------------------------------------- Horizontal project gallery */
function initHorizontalProjects({ gsap, ScrollTrigger }) {
  const section = $('.projects-h')
  if (!section) return

  const track = $('.projects-h__track', section)
  const cards = $$('.project-card', track)
  const counterNow = $('[data-projects-now]', section)
  const counterAll = $('[data-projects-all]', section)
  const bar = $('.projects-h__bar i', section)
  if (!track || !cards.length) return

  if (counterAll) counterAll.textContent = String(cards.length).padStart(2, '0')

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 40)

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true, // pins the whole section so the header and progress bar travel with it
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1)
        if (counterNow) counterNow.textContent = String(i).padStart(2, '0')
        if (bar) bar.style.width = `${Math.max(8, self.progress * 100)}%`
      }
    }
  })

  return () => { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill() }
}
