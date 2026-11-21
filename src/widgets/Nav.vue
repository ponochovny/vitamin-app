<template>
	<nav class="flex h-12 items-center gap-1 rounded-2xl border border-white/70 bg-white/70 px-1.5 shadow-[0_8px_30px_rgba(32,52,44,0.06)] backdrop-blur" aria-label="Основная навигация">
		<NuxtLink to="/" class="h-9">
			<Button as="span" :variant="route.path === '/' ? 'default' : 'ghost'" class="h-9 rounded-xl px-4">Сьогодні</Button>
		</NuxtLink>
		<NuxtLink to="/history" class="h-9">
			<Button as="span" :variant="route.path === '/history' ? 'default' : 'ghost'" class="h-9 rounded-xl px-4">Журнал</Button>
		</NuxtLink>
		<NuxtLink v-if="user" to="/signin" class="h-9">
			<Button as="span" :variant="route.path === '/signin' ? 'default' : 'ghost'" class="h-9 rounded-xl px-4">Акаунт</Button>
		</NuxtLink>
		<NuxtLink v-else to="/signin" class="ml-auto h-9 sm:ml-1">
			<Button as="span" class="h-9 rounded-xl px-4">Увійти</Button>
		</NuxtLink>
	</nav>
</template>

<script lang="ts" setup>
const route = useRoute()
const user = useSupabaseUser()
</script>
