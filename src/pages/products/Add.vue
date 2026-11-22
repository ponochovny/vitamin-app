<template>
	<div>
		<h2>App Product</h2>
		<AddProduct />
	</div>
</template>

<script lang="ts" setup>
import AddProduct from '~/src/features/products/addProduct.vue'

useSeoMeta({
	title: 'Додати продукт',
	description: 'Додайте продукт або напій до щоденника Vitamin.',
	robots: 'noindex,follow',
})
</script>
