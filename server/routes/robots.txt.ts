export default defineEventHandler((event) => {
	const config = useRuntimeConfig(event)
	const siteUrl = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')

	setHeader(event, 'content-type', 'text/plain; charset=utf-8')
	setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

	return `User-agent: *
Allow: /

Disallow: /signin
Disallow: /history
Disallow: /auth/callback
Disallow: /products/

Sitemap: ${siteUrl}/sitemap.xml
`
})
