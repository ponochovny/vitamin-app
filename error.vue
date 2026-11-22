<template>
	<main class="mx-auto max-w-md px-6 py-16 text-center">
		<h1 class="text-3xl font-bold">Сторінку не знайдено</h1>
		<p class="mt-3 text-muted-foreground">Перевірте адресу або поверніться на головну сторінку.</p>
		<NuxtLink to="/" class="mt-6 inline-block rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">
			На головну
		</NuxtLink>
	</main>
</template>

<script lang="ts" setup>
defineProps(['error'])

useSeoMeta({
	title: 'Сторінку не знайдено',
	robots: 'noindex,nofollow',
})
</script>
