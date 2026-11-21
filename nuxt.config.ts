import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
	compatibilityDate: '2025-02-03',
	devtools: { enabled: false },
	css: ['~/src/app/assets/css/tailwind.css'],
	runtimeConfig: {
		public: {
			vapidPublicKey: '',
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

	modules: [
		'@nuxtjs/supabase',
		'@nuxt/fonts',
		'@nuxtjs/color-mode',
	],

	supabase: {
		redirectOptions: {
			login: '/signin',
			callback: '/auth/callback',
			include: undefined,
			exclude: ['/', '/signin', '/auth/callback', '/history', '/about'],
			cookieRedirect: false,
		},
	},
})
