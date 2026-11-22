<template>
	<main class="mx-auto max-w-md p-6 text-center">
		<p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
		<p v-else role="status">Завершуємо вхід...</p>
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
		error.value = 'Вхід через Google не завершено. Спробуйте ще раз.'
		return
	}

	const { data, error: sessionError } = await supabase.auth.getSession()
	if (sessionError) {
		error.value = 'Не вдалося перевірити сесію. Спробуйте увійти ще раз.'
		return
	}

	if (!data.session) {
		error.value = 'Не вдалося завершити вхід через Google. Спробуйте ще раз.'
		return
	}

	await navigateTo('/')
})
</script>
