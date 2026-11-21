<template>
	<nav class="flex h-12 items-center gap-1 rounded-2xl border border-white/70 bg-white/70 px-1.5 shadow-[0_8px_30px_rgba(32,52,44,0.06)] backdrop-blur" aria-label="Основная навигация">
			<NuxtLink to="/" class="h-9">
				<Button as="span" :variant="route.path === '/' ? 'default' : 'ghost'" class="h-9 rounded-xl px-4">Дневник</Button>
			</NuxtLink>
			<NuxtLink to="/signin" class="h-9">
				<Button as="span" :variant="route.path === '/signin' ? 'default' : 'ghost'" class="h-9 rounded-xl px-4">Аккаунт</Button>
			</NuxtLink>
	</nav>
</template>

<script lang="ts" setup>
const route = useRoute()
</script>
