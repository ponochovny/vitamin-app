<template>
	<main class="mx-auto max-w-md p-6 text-center">
		<p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
		<p v-else role="status">Завершаем вход...</p>
	</main>
</template>

<script lang="ts" setup>
useSeoMeta({
	title: 'Завершення входу',
	robots: 'noindex,nofollow',
})

const supabase = useSupabaseClient()
const error = shallowRef('')

onMounted(async () => {
	const query = new URLSearchParams(window.location.search)
	const authError = query.get('error_description') ?? query.get('error')

	if (authError) {
		error.value = 'Вход через Google не завершён. Попробуйте ещё раз.'
		return
	}

	const { data, error: sessionError } = await supabase.auth.getSession()
	if (sessionError) {
		error.value = 'Не удалось проверить сессию. Попробуйте войти ещё раз.'
		return
	}

	if (!data.session) {
		error.value = 'Не удалось завершить вход через Google. Попробуйте ещё раз.'
		return
	}

	await navigateTo('/')
})
</script>
