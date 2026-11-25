import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
	compatibilityDate: '2025-02-03',
	devtools: { enabled: false },
	css: ['~/src/app/assets/css/tailwind.css'],
	runtimeConfig: {
		googleGeminiApiKey: process.env.NUXT_GOOGLE_GEMINI_API_KEY || '',
		googleGeminiModel:
			process.env.NUXT_GOOGLE_GEMINI_MODEL || 'gemini-3.5-flash-lite',
		public: {
			vapidPublicKey: '',
			siteUrl: '',
		},
	},
	app: {
		head: {
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1',
			htmlAttrs: {
				lang: 'uk',
			},
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
	dir: {
		assets: './src/app/assets',
		pages: './src/pages',
	},
	components: [
		{ path: '~/src/shared/ui', pattern: '**/*.vue' },
		'~/components',
	],

	modules: ['@nuxtjs/supabase', '@nuxt/fonts', '@nuxtjs/color-mode'],

	supabase: {
		redirectOptions: {
			login: '/signin',
			callback: '/auth/callback',
			include: ['/account', '/products/**'],
			exclude: [
				'/',
				'/signin',
				'/auth/callback',
				'/history',
				'/about',
				'/preview',
			],
			cookieRedirect: false,
		},
	},
	routeRules: {
		'/': { prerender: false, swr: 300 },
		'/about': { prerender: false, swr: 3600 },
		'/signin': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
		'/account': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
		'/history': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
		'/auth/callback': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
		'/products/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
	},
})
