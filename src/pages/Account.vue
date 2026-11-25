<script setup lang="ts">
import { shallowRef } from 'vue'
import MealReminderSettings from '~/src/features/reminders/MealReminderSettings.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loading = shallowRef(false)
const error = shallowRef('')

async function signOut() {
	if (loading.value) return
	loading.value = true
	error.value = ''

	try {
		const { error: authError } = await supabase.auth.signOut()
		if (authError) {
			error.value = 'Не вдалося вийти з акаунта. Перевір з’єднання та спробуй ще раз.'
			return
		}
		await navigateTo('/')
	} catch {
		error.value = 'Не вдалося вийти з акаунта через помилку з’єднання. Спробуй ще раз.'
	} finally {
		loading.value = false
	}
}

useSeoMeta({
	title: 'Акаунт Vitamin',
	description: 'Налаштування акаунта Vitamin.',
	robots: 'noindex,follow',
})
</script>

<template>
	<main class="auth-page mx-auto max-w-4xl pb-12 pt-6 sm:pt-10">
		<section
			v-if="user"
			class="mx-auto max-w-2xl rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_16px_50px_rgba(32,52,44,0.08)] sm:p-8"
		>
			<p class="text-sm font-semibold text-primary">Твій Vitamin</p>
			<h1 class="mt-2 text-2xl font-bold tracking-[-0.035em]">Акаунт</h1>
			<p class="mt-4 break-all rounded-xl bg-muted p-3.5 text-sm text-muted-foreground">
				{{ user.email }}
			</p>

			<MealReminderSettings
				v-if="user.id"
				:key="user.id"
				class="mt-5"
				:user-id="user.id"
			/>

			<p
				v-if="error"
				role="alert"
				class="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
			>
				{{ error }}
			</p>

			<Button
				type="button"
				variant="outline"
				class="mt-5 h-12 w-full rounded-xl"
				:disabled="loading"
				@click="signOut"
			>
				{{ loading ? 'Виходимо…' : 'Вийти з акаунта' }}
			</Button>
		</section>
	</main>
</template>
