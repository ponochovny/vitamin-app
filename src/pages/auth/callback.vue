<template>
	<main class="mx-auto max-w-md p-6 text-center">
		<p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
		<p v-else role="status">Завершаем вход...</p>
	</main>
</template>

<script lang="ts" setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const error = shallowRef('')

onMounted(async () => {
	const code = new URLSearchParams(window.location.search).get('code')

	if (code) {
		const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
		if (exchangeError) {
			error.value = 'Не удалось завершить вход через Google.'
			return
		}
	}

	await navigateTo(user.value ? '/' : '/signin')
})
</script>
