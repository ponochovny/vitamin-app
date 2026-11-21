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

useHead({
	link: [
		{ rel: 'manifest', href: '/manifest.webmanifest' },
		{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
		{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
		{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
		{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
	],
	meta: [
		{ name: 'theme-color', content: '#246B4F' },
		{ name: 'mobile-web-app-capable', content: 'yes' },
		{ name: 'apple-mobile-web-app-title', content: 'Vitamin' },
	],
})
</script>
