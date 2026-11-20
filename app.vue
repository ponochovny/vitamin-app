<template>
	<div class="container pt-4">
		<Nav />

		<NuxtPage />
	</div>
</template>

<script lang="ts" setup>
import Nav from './src/widgets/Nav.vue'
</script>

<style>
:root {
	font-family: Montserrat;
	font-weight: 400;
}
</style>
