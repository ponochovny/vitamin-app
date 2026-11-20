<template>
	<div>
		<h1>Sign In</h1>
		<p>{{ loading ? 'Loading...' : '' }}</p>
		<p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
		<ClientOnly>
			<div
				v-if="!userData"
				class="max-w-[400px] mx-auto flex flex-col items-center gap-2"
			>
				<form
					@submit.prevent="signIn"
					class="flex flex-col items-center w-full gap-2"
				>
					<Input type="text" v-model="email" placeholder="Email" required />
					<Input
						type="password"
						v-model="password"
						placeholder="Password"
						required
					/>
					<Button :disabled="loading">Submit</Button>
				</form>
				<Button type="button" @click="signInGoogle" :disabled="loading">
					Google Auth
				</Button>
			</div>
			<div v-else>
				<div><strong>ID:</strong> {{ userData.id }}</div>
				<div><strong>Email:</strong> {{ userData.email }}</div>
				<Button type="button" @click="signOut" :disabled="loading">
					Sign Out
				</Button>
			</div>
		</ClientOnly>
	</div>
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
	{ immediate: true }
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
			redirectTo: `http://localhost:3000/signin`,
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
	}
}
</script>
