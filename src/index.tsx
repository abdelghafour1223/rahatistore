import { Hono } from 'hono'

const app = new Hono()

/**
 * Hono يتولّى:
 *  - مسارات /api/*
 *  - تطبيع /admin و /thankyou (إعادة توجيه إلى الإصدار بـ trailing slash)
 * كل شيء آخر يُخدّم من الملفات الثابتة (Cloudflare Pages)
 */

app.get('/admin', (c) => {
  return c.redirect('/admin/', 301)
})

app.get('/thankyou', (c) => {
  const qs = new URL(c.req.url).search
  return c.redirect('/thankyou/' + qs, 301)
})

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'rahati-store',
    time: new Date().toISOString()
  })
})

app.get('/api/info', (c) => {
  return c.json({
    ok: true,
    pages: ['/', '/admin/', '/thankyou/'],
    notes: 'صفحات HTML تُخدّم مباشرة من Cloudflare Pages. Webhook يُحفظ في localStorage الخاص بمتصفح الإدارة.'
  })
})

export default app
