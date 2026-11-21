<template>
	<main class="mx-auto max-w-md pb-12 pt-8 sm:pt-14">
		<section
			v-if="!userData"
			class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_16px_50px_rgba(32,52,44,0.08)] sm:p-7"
		>
			<p class="text-sm font-medium text-primary">Vitamin</p>
			<h1 class="mt-2 text-[2rem] leading-tight font-bold tracking-[-0.04em]">
				Продовжимо турботу про себе
			</h1>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				Увійдіть, щоб зберігати цілі, записи їжі, води та самопочуття.
			</p>

			<p
				v-if="error"
				role="alert"
				class="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
			>
				{{ error }}
			</p>

			<form class="mt-6 space-y-3" @submit.prevent="signIn">
				<label class="block space-y-1.5 text-sm font-medium">
					<span>Email</span>
					<Input
						v-model="email"
						type="email"
						autocomplete="email"
						placeholder="name@example.com"
						required
						class="h-12 rounded-xl"
					/>
				</label>
				<label class="block space-y-1.5 text-sm font-medium">
					<span>Пароль</span>
					<Input
						v-model="password"
						type="password"
						autocomplete="current-password"
						placeholder="Введіть пароль"
						required
						class="h-12 rounded-xl"
					/>
				</label>
				<Button
					type="submit"
					class="h-12 w-full rounded-xl"
					:disabled="loading"
				>
					{{ loading ? 'Входимо...' : 'Увійти' }}
				</Button>
			</form>

			<div class="my-5 flex items-center gap-3 text-xs text-muted-foreground">
				<span class="h-px flex-1 bg-border" />
				або
				<span class="h-px flex-1 bg-border" />
			</div>

			<Button
				type="button"
				variant="outline"
				class="h-12 w-full rounded-xl"
				:disabled="loading"
				@click="signInGoogle"
			>
				Продовжити через Google
			</Button>
		</section>

		<section
			v-else
			class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_16px_50px_rgba(32,52,44,0.08)] sm:p-7"
		>
			<p class="text-sm font-medium text-primary">Ваш акаунт</p>
			<h1 class="mt-2 text-2xl font-bold">Профіль Vitamin</h1>
			<p
				class="mt-3 break-all rounded-xl bg-muted p-3 text-sm text-muted-foreground"
			>
				{{ userData.email }}
			</p>

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
				{{ loading ? 'Виходимо...' : 'Вийти з акаунта' }}
			</Button>
		</section>
	</main>
</template>

<script lang="ts" setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const userData = ref<any>(null)

watch(
	user,
	() => {
		userData.value = user.value
	},
	{ immediate: true },
)

const loading = ref(false)
const setLoading = (value: boolean) => (loading.value = value)

const email = ref('')
const password = ref('')
const error = ref('')

const clearForm = () => {
	email.value = ''
	password.value = ''
}

const signIn = async () => {
	if (loading.value) return
	setLoading(true)
	error.value = ''

	const { data, error: authError } = await supabase.auth.signInWithPassword({
		email: email.value,
		password: password.value,
	})
	if (data.user) {
		clearForm()
		await navigateTo('/')
	}
	setLoading(false)
	if (authError) {
		error.value = 'Не удалось войти. Проверьте данные или соединение.'
	}
}

const signInGoogle = async () => {
	if (loading.value) return
	setLoading(true)
	error.value = ''

	const { error: authError } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${window.location.origin}/auth/callback`,
		},
	})
	setLoading(false)
	if (authError) {
		error.value = 'Не удалось начать вход через Google.'
	}
}

const signOut = async () => {
	if (loading.value) return
	setLoading(true)
	error.value = ''

	const { error: authError } = await supabase.auth.signOut()
	setLoading(false)
	if (authError) {
		error.value = 'Не удалось выйти из аккаунта.'
		return
	}
	await navigateTo('/')
}
</script>
