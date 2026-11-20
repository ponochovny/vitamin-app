<template>
	<nav class="flex gap-1" aria-label="Основная навигация">
		<NuxtLink to="/">
			<Button as="span" :variant="route.path === '/' ? 'default' : 'ghost'">Дневник</Button>
		</NuxtLink>
		<NuxtLink to="/signin">
			<Button as="span" :variant="route.path === '/signin' ? 'default' : 'ghost'">Аккаунт</Button>
		</NuxtLink>
	</nav>
</template>

<script lang="ts" setup>
const route = useRoute()
</script>
