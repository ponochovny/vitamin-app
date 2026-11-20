export default defineNuxtConfig({
	compatibilityDate: '2025-02-03',
	devtools: { enabled: false },
	dir: {
		assets: './src/app/assets',
		pages: './src/pages',
	},
	components: ['~/src/shared/ui', '~/components'],

	modules: [
		'@nuxtjs/supabase',
		'@nuxt/fonts',
		'@nuxtjs/tailwindcss',
		'@nuxtjs/color-mode',
		'shadcn-nuxt',
	],

	shadcn: {
		componentDir: './src/shared/ui',
	},

	supabase: {
		redirectOptions: {
			login: '/signin',
			callback: '/confirm',
			include: undefined,
			exclude: [],
			cookieRedirect: false,
		},
	},
})
