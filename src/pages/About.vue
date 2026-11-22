<template>
	<main class="py-8">
		<h1 class="text-3xl font-bold">{{ title }}</h1>
		<p class="mt-4 max-w-2xl leading-7">
			Vitamin допомагає планувати харчування та відстежувати самопочуття щодня.
		</p>
	</main>
</template>
<script lang="ts" setup>
const title = ref('Про Vitamin')

useSeoMeta({
	title: 'Про Vitamin',
	description: 'Дізнайтеся про Vitamin — щоденник їжі, води, цілей і самопочуття.',
	ogTitle: 'Про застосунок Vitamin',
	ogDescription: 'Персональний щоденник для цілей і звичок харчування.',
})
</script>
