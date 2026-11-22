<template>
	<main class="mx-auto max-w-md px-6 py-16 text-center">
		<template v-if="error.statusCode === 404">
			<h1 class="text-3xl font-bold">Сторінку не знайдено</h1>
			<p class="mt-3 text-muted-foreground">Перевірте адресу або поверніться на головну сторінку.</p>
		</template>
		<template v-else>
			<h1 class="text-3xl font-bold">Сталася помилка</h1>
			<p class="mt-3 text-muted-foreground">Спробуйте оновити сторінку або поверніться на головну.</p>
		</template>
		<NuxtLink to="/" class="mt-6 inline-block rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">
			На головну
		</NuxtLink>
	</main>
</template>

<script lang="ts" setup>
const props = defineProps<{
	error: {
		statusCode?: number
	}
}>()

useSeoMeta({
	title: () => props.error.statusCode === 404 ? 'Сторінку не знайдено' : 'Сталася помилка',
	robots: 'noindex,nofollow',
})
</script>
