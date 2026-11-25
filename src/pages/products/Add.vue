<template>
	<main>
		<h1 class="mb-4 text-2xl font-bold">Додати продукт</h1>
		<AddProduct />
	</main>
</template>

<script lang="ts" setup>
import AddProduct from '~/src/features/products/addProduct.vue'

useSeoMeta({
	title: 'Додати продукт',
	description: 'Додайте продукт або напій до щоденника Vitamin.',
	robots: 'noindex,follow',
})
</script>
