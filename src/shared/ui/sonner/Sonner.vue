<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
	<Toaster
		position="bottom-center"
		richColors
		closeButton
		:visibleToasts="3"
		offset="16px"
	/>
</template>
