import { defineConfig } from 'vite'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

/**
 * Every page of the site. Add a new page here AND create the matching
 * .html file in the project root — nothing else needs to change.
 */
const PAGES = [
  'index',
  'material',
  'collections',
  'applications',
  'projects',
  'story',
  'technical',
  'contact'
]

/**
 * Tiny build-time include system so the header, footer and left rail live in
 * ONE file instead of eight. Use it in any .html page like this:
 *
 *   <!-- @include partials/header.html -->
 *
 * Includes are resolved at request time in dev (just reload after editing a
 * partial) and at build time for production, so there is zero runtime cost.
 */
function htmlPartials() {
  const INCLUDE = /<!--\s*@include\s+([^\s]+?)\s*-->/g
  const render = (html, depth = 0) => {
    if (depth > 5) return html
    return html.replace(INCLUDE, (match, file) => {
      const path = resolve(root, file)
      if (!existsSync(path)) {
        console.warn(`[partials] missing include: ${file}`)
        return `<!-- missing include: ${file} -->`
      }
      return render(readFileSync(path, 'utf8'), depth + 1)
    })
  }
  return {
    name: 'marmofiber-html-partials',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => render(html)
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/partials/')) {
        server.ws.send({ type: 'full-reload' })
      }
    }
  }
}

export default defineConfig({
  root,
  base: './',
  plugins: [htmlPartials()],
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: Object.fromEntries(
        PAGES.map((name) => [name, resolve(root, `${name}.html`)])
      )
    }
  }
})
