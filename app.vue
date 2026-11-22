<template>
	<div>
		<Transition name="preloader">
			<div
				v-if="preloaderVisible"
				class="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#246B4F] text-white"
				role="status"
				aria-live="polite"
			>
				<div class="relative flex size-20 items-center justify-center">
					<span
						class="absolute inset-0 rounded-full border border-white/20 border-t-secondary animate-spin"
						aria-hidden="true"
					/>
					<img
						src="/favicon-32x32.png"
						alt=""
						class="size-10 rounded-xl shadow-[0_8px_20px_rgba(18,52,39,0.22)]"
					/>
				</div>
				<p class="mt-5 text-sm font-semibold tracking-wide">
					Перевіряємо сесію
				</p>
			</div>
		</Transition>

		<div
			v-if="authReady"
			class="auth-app mx-auto min-h-dvh max-w-6xl px-3 pt-3 sm:px-6 sm:pt-5"
			:class="{ 'auth-app--ready': authContentVisible }"
		>
			<Nav />

			<NuxtPage
				:transition="{ name: 'route', mode: 'out-in' }"
			/>
			<Sonner />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { Sonner } from './src/shared/ui/sonner'
import Nav from './src/widgets/Nav.vue'

const supabase = useSupabaseClient()
const authReady = shallowRef(false)
const authContentVisible = shallowRef(false)
const preloaderVisible = shallowRef(true)
let authSubscription: { unsubscribe: () => void } | null = null
let authFallbackTimer: ReturnType<typeof setTimeout> | null = null
let authFinishTimer: ReturnType<typeof setTimeout> | null = null
let authContentFrame: number | null = null

function finishAuthCheck() {
	if (authReady.value) return

	authReady.value = true
	if (authFallbackTimer) clearTimeout(authFallbackTimer)
	authFallbackTimer = null

	authFinishTimer = setTimeout(() => {
		preloaderVisible.value = false
	}, 120)

	authContentFrame = requestAnimationFrame(() => {
		authContentVisible.value = true
	})
}

onMounted(() => {
	const authListener = supabase.auth.onAuthStateChange(() => {
		finishAuthCheck()
	})
	authSubscription = authListener.data.subscription
	authFallbackTimer = setTimeout(() => {
		finishAuthCheck()
	}, 5000)

	void supabase.auth.getSession().finally(() => {
		finishAuthCheck()
	})
})

onUnmounted(() => {
	authSubscription?.unsubscribe()
	if (authFallbackTimer) clearTimeout(authFallbackTimer)
	if (authFinishTimer) clearTimeout(authFinishTimer)
	if (authContentFrame !== null) cancelAnimationFrame(authContentFrame)
})

const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = String(
	config.public.siteUrl || 'http://localhost:3000',
).replace(/\/$/, '')
const canonicalUrl = computed(
	() => `${siteUrl}${route.path === '/' ? '/' : route.path}`,
)
const isPrivateRoute = computed(() =>
	['/signin', '/history', '/products/add', '/auth/callback'].includes(
		route.path,
	),
)
const robotsDirective = computed(() =>
	isPrivateRoute.value ? 'noindex, nofollow' : 'index, follow',
)

useHead({
	titleTemplate: (titleChunk) =>
		titleChunk
			? `${titleChunk} | Vitamin`
			: 'Vitamin — щоденник їжі, води та самопочуття',
	link: [
		{ rel: 'manifest', href: '/manifest.webmanifest' },
		{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicon-16x16.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicon-32x32.png',
		},
		{
			rel: 'apple-touch-icon',
			sizes: '180x180',
			href: '/apple-touch-icon.png',
		},
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
	description:
		'Vitamin — щоденник їжі, води та самопочуття. Ведіть цілі, записуйте продукти та відстежуйте прогрес дня.',
	ogTitle: 'Vitamin — щоденник їжі, води та самопочуття',
	ogDescription:
		'Ведіть цілі, записуйте їжу та напої й стежте за самопочуттям у щоденнику Vitamin.',
	ogType: 'website',
	ogLocale: 'uk_UA',
	ogUrl: canonicalUrl,
	ogImage: `${siteUrl}/og-image.png`,
	ogImageAlt: 'Vitamin — щоденник турботи про себе',
	ogImageWidth: 1200,
	ogImageHeight: 630,
	ogImageType: 'image/png',
	twitterCard: 'summary_large_image',
	twitterTitle: 'Vitamin — щоденник їжі, води та самопочуття',
	twitterDescription: 'Щоденник їжі, цілей і самопочуття.',
	twitterImage: `${siteUrl}/og-image.png`,
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

<style scoped>
.auth-app {
	opacity: 0;
	transform: translateY(6px);
	transition:
		opacity 420ms ease,
		transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.auth-app--ready {
	opacity: 1;
	transform: translateY(0);
}

.preloader-enter-active,
.preloader-leave-active {
	transition:
		opacity 420ms ease,
		transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.preloader-enter-from,
.preloader-leave-to {
	opacity: 0;
}

.preloader-enter-from {
	/* transform: scale(1); */
}

.preloader-leave-to {
	/* transform: scale(0.985); */
}

@media (prefers-reduced-motion: reduce) {
	.auth-app,
	.preloader-enter-active,
	.preloader-leave-active {
		transition-duration: 1ms;
	}
}

:global(.route-enter-active),
:global(.route-leave-active) {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}

:global(.route-enter-from) {
	opacity: 0;
	transform: translateY(5px);
}

:global(.route-leave-to) {
	opacity: 0;
	transform: translateY(-3px);
}

@media (prefers-reduced-motion: reduce) {
	:global(.route-enter-active),
	:global(.route-leave-active) {
		transition-duration: 1ms;
	}
}
</style>
