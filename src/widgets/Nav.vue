<template>
	<nav class="flex h-12 items-center gap-1 rounded-2xl border border-white/70 bg-white/70 px-1.5 shadow-[0_8px_30px_rgba(32,52,44,0.06)] backdrop-blur" aria-label="Основна навігація">
		<NuxtLink :to="user ? '/' : '/preview'" class="flex size-11 shrink-0 items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Vitamin — головна сторінка">
			<img src="/favicon-32x32.png" alt="" class="size-7" />
		</NuxtLink>
		<template v-if="user">
			<NuxtLink to="/" class="flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
				<Button as="span" :variant="route.path === '/' ? 'default' : 'ghost'" class="h-11 rounded-xl px-4">Сьогодні</Button>
			</NuxtLink>
			<NuxtLink to="/history" class="flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
				<Button as="span" :variant="route.path === '/history' ? 'default' : 'ghost'" class="h-11 rounded-xl px-4">Журнал</Button>
			</NuxtLink>
			<NuxtLink to="/account" class="flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
				<Button as="span" :variant="route.path === '/account' ? 'default' : 'ghost'" class="h-11 rounded-xl px-4">Акаунт</Button>
			</NuxtLink>
		</template>
		<template v-else>
			<NuxtLink to="/preview" class="flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
				<Button as="span" :variant="route.path === '/preview' ? 'default' : 'ghost'" class="h-11 rounded-xl px-4">Прев’ю</Button>
			</NuxtLink>
			<NuxtLink to="/signin" class="ml-auto flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:ml-1">
				<Button as="span" :variant="route.path === '/signin' ? 'default' : 'ghost'" class="h-11 rounded-xl px-4">Увійти</Button>
			</NuxtLink>
		</template>
	</nav>
</template>

<script lang="ts" setup>
const route = useRoute()
const user = useSupabaseUser()
</script>
