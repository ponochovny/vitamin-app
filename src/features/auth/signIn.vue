<template>
	<main class="auth-page mx-auto max-w-4xl pb-12 pt-6 sm:pt-10">
		<section
			class="auth-layout overflow-hidden rounded-[1.75rem] border border-border/80 bg-white shadow-[0_24px_70px_rgba(32,52,44,0.10)]"
		>
			<aside class="auth-story relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground md:flex lg:p-10">
				<div class="auth-story__glow" aria-hidden="true" />
				<div class="relative z-10">
					<NuxtLink
						to="/"
						class="inline-flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary"
						aria-label="Vitamin — на головну"
					>
						<img
							src="/favicon-32x32.png"
							alt=""
							class="size-9 rounded-xl bg-white p-1"
						/>
						<span class="text-lg font-bold tracking-[-0.03em]">Vitamin</span>
					</NuxtLink>

					<h1 class="mt-16 max-w-sm text-4xl font-bold leading-[1.12] tracking-[-0.045em] lg:text-[2.75rem]">
						Турбота про себе — у простих щоденних кроках
					</h1>
					<p class="mt-4 max-w-sm text-[15px] leading-7 text-white/75">
						Відстежуй їжу, воду та самопочуття без тиску й складних підрахунків.
					</p>
				</div>

				<div class="relative z-10 mt-12 space-y-3">
					<div class="auth-benefit">
						<span class="auth-benefit__icon"><Utensils :size="18" /></span>
						<span>
							<strong>Записуй їжу</strong>
							<small>і бач свій щоденний баланс</small>
						</span>
					</div>
					<div class="auth-benefit">
						<span class="auth-benefit__icon"><Droplets :size="18" /></span>
						<span>
							<strong>Пам’ятай про воду</strong>
							<small>та відстежуй свою ціль</small>
						</span>
					</div>
					<div class="auth-benefit">
						<span class="auth-benefit__icon"><Smile :size="18" /></span>
						<span>
							<strong>Помічай свій стан</strong>
							<small>вранці, вдень і ввечері</small>
						</span>
					</div>
				</div>

				<p class="relative z-10 mt-10 text-xs text-white/55">
					Ритм, який підходить саме тобі.
				</p>
			</aside>

			<div class="auth-form-panel p-5 sm:p-8 lg:p-10">
				<div class="mb-8 flex items-center gap-2 md:hidden">
					<img src="/favicon-32x32.png" alt="" class="size-8 rounded-lg" />
					<span class="font-bold tracking-[-0.03em]">Vitamin</span>
				</div>

				<div v-if="confirmationSent" class="py-4 sm:py-8">
					<span class="auth-confirm-icon" aria-hidden="true">
						<MailCheck :size="26" />
					</span>
					<h2 class="mt-6 text-2xl font-bold tracking-[-0.035em]">
						Перевір пошту
					</h2>
					<p class="mt-3 text-sm leading-6 text-muted-foreground">
						Ми надіслали лист для підтвердження на
						<strong class="break-all text-foreground">{{ email }}</strong>.
						Перейди за посиланням у листі, щоб завершити реєстрацію.
					</p>
					<Button
						type="button"
						variant="outline"
						class="mt-7 h-12 w-full rounded-xl"
						@click="returnToSignIn"
					>
						Повернутися до входу
					</Button>
				</div>

				<template v-else>
					<div class="mb-6">
						<p class="text-sm font-semibold text-primary">
							{{ isSignUp ? 'Новий акаунт' : 'Твій простір Vitamin' }}
						</p>
						<h2 class="mt-2 text-[1.8rem] font-bold leading-tight tracking-[-0.04em] sm:text-[2rem]">
							{{ isSignUp ? 'Почни з малого' : 'Раді знову бачити' }}
						</h2>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">
							{{
								isSignUp
									? 'Створи акаунт, щоб зберігати свої цілі та щоденні записи.'
									: 'Увійди, щоб продовжити свій ритм турботи про себе.'
							}}
						</p>
					</div>

					<div
						class="auth-mode-switch mb-6 grid grid-cols-2 rounded-xl bg-muted p-1"
						role="group"
						aria-label="Режим авторизації"
					>
						<button
							type="button"
							class="rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:class="!isSignUp ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
							:aria-pressed="!isSignUp"
							@click="setMode('signin')"
						>
							Увійти
						</button>
						<button
							type="button"
							class="rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:class="isSignUp ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
							:aria-pressed="isSignUp"
							@click="setMode('signup')"
						>
							Реєстрація
						</button>
					</div>

					<p
						v-if="error"
						role="alert"
						class="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm leading-5 text-destructive"
					>
						{{ error }}
					</p>

					<form class="space-y-4" @submit.prevent="submitForm">
						<label for="auth-email" class="block space-y-1.5 text-sm font-semibold">
							<span>Електронна пошта</span>
							<Input
								id="auth-email"
								v-model="email"
								type="email"
								autocomplete="email"
								inputmode="email"
								placeholder="name@example.com"
								required
								class="h-12 rounded-xl bg-white"
								:disabled="loading"
							/>
						</label>

						<label for="auth-password" class="block space-y-1.5 text-sm font-semibold">
							<span>Пароль</span>
							<span class="relative block">
								<Input
									id="auth-password"
									v-model="password"
									:type="passwordVisible ? 'text' : 'password'"
									:autocomplete="isSignUp ? 'new-password' : 'current-password'"
									:placeholder="isSignUp ? 'Щонайменше 8 символів' : 'Введи пароль'"
									:minlength="isSignUp ? 8 : undefined"
									required
									class="h-12 rounded-xl bg-white pr-12"
									:disabled="loading"
								/>
								<button
									type="button"
									class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
									:aria-label="passwordVisible ? 'Приховати пароль' : 'Показати пароль'"
									:aria-pressed="passwordVisible"
									@click="passwordVisible = !passwordVisible"
								>
									<EyeOff v-if="passwordVisible" :size="18" aria-hidden="true" />
									<Eye v-else :size="18" aria-hidden="true" />
								</button>
							</span>
						</label>

						<label
							v-if="isSignUp"
							for="auth-password-confirm"
							class="block space-y-1.5 text-sm font-semibold"
						>
							<span>Повтори пароль</span>
							<Input
								id="auth-password-confirm"
								v-model="passwordConfirmation"
								:type="passwordVisible ? 'text' : 'password'"
								autocomplete="new-password"
								placeholder="Введи пароль ще раз"
								minlength="8"
								required
								class="h-12 rounded-xl bg-white"
								:disabled="loading"
							/>
						</label>

						<Button
							type="submit"
							class="h-12 w-full rounded-xl text-[15px] font-bold shadow-[0_8px_18px_rgba(36,107,79,0.15)]"
							:disabled="loading"
						>
							<LoaderCircle v-if="loading" :size="18" class="mr-2 animate-spin" aria-hidden="true" />
							{{
								loading
									? isSignUp
										? 'Створюємо акаунт…'
										: 'Входимо…'
									: isSignUp
										? 'Створити акаунт'
										: 'Увійти'
							}}
						</Button>
					</form>

					<div class="my-5 flex items-center gap-3 text-xs text-muted-foreground">
						<span class="h-px flex-1 bg-border" />
						або продовжити з
						<span class="h-px flex-1 bg-border" />
					</div>

					<Button
						type="button"
						variant="outline"
						class="h-12 w-full gap-2.5 rounded-xl border-border bg-white text-sm font-semibold hover:bg-muted/50"
						:disabled="loading"
						@click="signInGoogle"
					>
						<svg
							viewBox="0 0 48 48"
							class="size-[18px] shrink-0"
							aria-hidden="true"
						>
							<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
							<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.63 5.91c4.45-4.11 7.13-10.17 7.13-17.56Z" transform="translate(0 0)" />
							<path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
							<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.63-5.91c-2.12 1.42-4.84 2.26-8.27 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 0)" />
						</svg>
						Продовжити через Google
					</Button>

					<p class="mt-5 text-center text-xs leading-5 text-muted-foreground">
						{{ isSignUp ? 'Вже маєш акаунт?' : 'Ще не маєш акаунта?' }}
						<button
							type="button"
							class="ml-1 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							@click="setMode(isSignUp ? 'signin' : 'signup')"
						>
							{{ isSignUp ? 'Увійти' : 'Зареєструватися' }}
						</button>
					</p>
				</template>
			</div>
		</section>

	</main>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import {
	Droplets,
	Eye,
	EyeOff,
	LoaderCircle,
	MailCheck,
	Smile,
	Utensils,
} from 'lucide-vue-next'
import type { AuthError } from '@supabase/supabase-js'

type AuthMode = 'signin' | 'signup'

const supabase = useSupabaseClient()
const mode = shallowRef<AuthMode>('signin')
const loading = shallowRef(false)
const passwordVisible = shallowRef(false)
const email = shallowRef('')
const password = shallowRef('')
const passwordConfirmation = shallowRef('')
const error = shallowRef('')
const confirmationSent = shallowRef(false)
const isSignUp = computed(() => mode.value === 'signup')

function setMode(nextMode: AuthMode) {
	if (loading.value || confirmationSent.value) return
	mode.value = nextMode
	error.value = ''
	password.value = ''
	passwordConfirmation.value = ''
	passwordVisible.value = false
}

function returnToSignIn() {
	confirmationSent.value = false
	setMode('signin')
}

async function submitForm() {
	if (loading.value) return
	error.value = ''
	const normalizedEmail = email.value.trim()

	if (isSignUp.value) {
		if (password.value.length < 8) {
			error.value = 'Пароль має містити щонайменше 8 символів.'
			return
		}
		if (password.value !== passwordConfirmation.value) {
			error.value = 'Паролі не збігаються. Перевір обидва поля.'
			return
		}
		await signUp(normalizedEmail)
		return
	}

	await signIn(normalizedEmail)
}

async function signIn(normalizedEmail: string) {
	loading.value = true
	try {
		const { data, error: authError } = await supabase.auth.signInWithPassword({
			email: normalizedEmail,
			password: password.value,
		})

		if (authError) {
			error.value = authErrorMessage(authError, 'signin')
			return
		}
		if (!data.user) {
			error.value = 'Не вдалося увійти. Перевір дані та спробуй ще раз.'
			return
		}

		password.value = ''
		await navigateTo('/')
	} catch {
		error.value = 'Не вдалося увійти через помилку з’єднання. Спробуй ще раз.'
	} finally {
		loading.value = false
	}
}

async function signUp(normalizedEmail: string) {
	loading.value = true
	try {
		const { data, error: authError } = await supabase.auth.signUp({
			email: normalizedEmail,
			password: password.value,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`,
			},
		})

		if (authError) {
			error.value = authErrorMessage(authError, 'signup')
			return
		}
		if (!data.user) {
			error.value = 'Не вдалося створити акаунт. Спробуй ще раз.'
			return
		}

		password.value = ''
		passwordConfirmation.value = ''
		if (data.session) {
			await navigateTo('/')
			return
		}

		confirmationSent.value = true
	} catch {
		error.value = 'Не вдалося створити акаунт через помилку з’єднання. Спробуй ще раз.'
	} finally {
		loading.value = false
	}
}

async function signInGoogle() {
	if (loading.value) return
	error.value = ''
	loading.value = true

	try {
		const { error: authError } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		})

		if (authError) {
			loading.value = false
			error.value = authErrorMessage(authError, 'google')
		}
	} catch {
		loading.value = false
		error.value = 'Не вдалося розпочати вхід через Google через помилку з’єднання. Спробуй ще раз.'
	}
}

function authErrorMessage(authError: AuthError, action: 'signin' | 'signup' | 'google') {
	const message = authError.message.toLowerCase()
	if (message.includes('invalid login credentials')) {
		return 'Неправильна пошта або пароль. Перевір дані та спробуй ще раз.'
	}
	if (message.includes('email not confirmed')) {
		return 'Підтверди електронну пошту за посиланням у листі, перш ніж увійти.'
	}
	if (message.includes('already registered') || message.includes('user already exists')) {
		return 'Ця пошта вже зареєстрована. Увійди або використай іншу адресу.'
	}
	if (message.includes('password should be')) {
		return 'Пароль не відповідає вимогам. Використай щонайменше 8 символів.'
	}
	if (message.includes('rate limit') || message.includes('too many requests')) {
		return 'Забагато спроб за короткий час. Зачекай трохи й повтори.'
	}

	return {
		signin: 'Не вдалося увійти. Перевір пошту, пароль і з’єднання.',
		signup: 'Не вдалося створити акаунт. Перевір пошту та спробуй ще раз.',
		google: 'Не вдалося розпочати вхід через Google. Спробуй ще раз.',
	}[action]
}
</script>

<style scoped>
.auth-layout {
	display: grid;
}

.auth-story {
	min-height: 36rem;
}

.auth-story__glow {
	position: absolute;
	top: 8rem;
	right: -7rem;
	width: 22rem;
	height: 22rem;
	border: 1px solid rgb(255 255 255 / 13%);
	border-radius: 50%;
	box-shadow:
		0 0 0 2.5rem rgb(255 255 255 / 4%),
		0 0 0 5rem rgb(255 255 255 / 3%);
	pointer-events: none;
}

.auth-benefit {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}

.auth-benefit__icon {
	display: grid;
	width: 2.65rem;
	height: 2.65rem;
	flex: 0 0 auto;
	place-items: center;
	border: 1px solid rgb(255 255 255 / 17%);
	border-radius: 0.9rem;
	background: rgb(255 255 255 / 9%);
	color: #d7f26a;
}

.auth-benefit strong,
.auth-benefit small {
	display: block;
}

.auth-benefit strong {
	font-size: 0.875rem;
	font-weight: 700;
}

.auth-benefit small {
	margin-top: 0.15rem;
	color: rgb(255 255 255 / 65%);
	font-size: 0.75rem;
}

.auth-confirm-icon {
	display: grid;
	width: 3.5rem;
	height: 3.5rem;
	place-items: center;
	border-radius: 1.15rem;
	background: #e8f4d0;
	color: #246b4f;
}

@media (min-width: 768px) {
	.auth-layout {
		grid-template-columns: minmax(0, 0.92fr) minmax(0, 1fr);
	}
}
</style>
