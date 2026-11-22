<template>
	<div class="mx-auto min-h-dvh max-w-6xl px-3 pt-3 sm:px-6 sm:pt-5">
		<Nav />

		<NuxtPage />
		<Sonner />
	</div>
</template>

<script lang="ts" setup>
import { Sonner } from './src/shared/ui/sonner'
import Nav from './src/widgets/Nav.vue'

const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
const canonicalUrl = computed(() => `${siteUrl}${route.path === '/' ? '/' : route.path}`)
const isPrivateRoute = computed(() =>
	['/signin', '/history', '/products/add', '/auth/callback'].includes(route.path),
)
const robotsDirective = computed(() =>
	isPrivateRoute.value ? 'noindex, nofollow' : 'index, follow',
)

useHead({
	titleTemplate: (titleChunk) =>
		titleChunk ? `${titleChunk} | Vitamin` : 'Vitamin — щоденник їжі, води та самопочуття',
	link: [
		{ rel: 'manifest', href: '/manifest.webmanifest' },
		{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
		{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
		{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
		{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
		{ rel: 'canonical', href: canonicalUrl },
	],
	meta: [
		{ name: 'theme-color', content: '#246B4F' },
		{ name: 'mobile-web-app-capable', content: 'yes' },
		{ name: 'apple-mobile-web-app-title', content: 'Vitamin' },
		{ name: 'application-name', content: 'Vitamin' },
		{ name: 'format-detection', content: 'telephone=no' },
		{ name: 'robots', content: robotsDirective },
	],
})

useSeoMeta({
	description: 'Vitamin — щоденник їжі, води та самопочуття. Ведіть цілі, записуйте продукти та відстежуйте прогрес дня.',
	ogTitle: 'Vitamin — щоденник їжі, води та самопочуття',
	ogDescription: 'Ведіть цілі, записуйте їжу та напої й стежте за самопочуттям у щоденнику Vitamin.',
	ogType: 'website',
	ogLocale: 'uk_UA',
	ogUrl: canonicalUrl,
	ogImage: `${siteUrl}/icon-512.png`,
	ogImageAlt: 'Vitamin — щоденник їжі та самопочуття',
	twitterCard: 'summary',
	twitterTitle: 'Vitamin — щоденник їжі, води та самопочуття',
	twitterDescription: 'Щоденник їжі, цілей і самопочуття.',
	twitterImage: `${siteUrl}/icon-512.png`,
})

useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'WebApplication',
				name: 'Vitamin',
				description: 'Щоденник їжі, води, цілей і самопочуття.',
				url: siteUrl,
				applicationCategory: 'HealthApplication',
				operatingSystem: 'Web',
				inLanguage: 'uk',
			}),
		},
	],
})
</script>
