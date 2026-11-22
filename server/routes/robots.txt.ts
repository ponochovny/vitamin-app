export default defineEventHandler((event) => {
	const config = useRuntimeConfig(event)
	const requestUrl = getRequestURL(event)
	const siteUrl = String(config.public.siteUrl || requestUrl.origin).replace(/\/+$/, '')

	setHeader(event, 'content-type', 'text/plain; charset=utf-8')
	setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

	return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
})
