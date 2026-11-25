<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, shallowRef } from 'vue'
import {
	DEFAULT_REMINDER_TIMES,
	isValidReminderTimes,
	normalizeReminderTime,
	type MealPeriod,
	type ReminderScheduleMode,
} from './schedule'

const props = defineProps<{ userId: string }>()
const authenticatedUser = useSupabaseUser()

interface ReminderSettingsRow {
	enabled: boolean
	schedule_mode: ReminderScheduleMode
	morning_at: string
	day_at: string
	evening_at: string
}

type ReminderSchedule = Omit<ReminderSettingsRow, 'enabled'>

interface ReminderSettingsCache {
	cachedAt: number
	settings: ReminderSettingsRow | null
}

const REMINDER_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000
const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const settingsCache = useState<Record<string, ReminderSettingsCache>>(
	'meal-reminder-settings-cache',
	() => ({}),
)
let settingsLoadGeneration = 0
let componentUnmounted = false
const loading = shallowRef(true)
const pending = shallowRef(false)
const testPushPending = shallowRef(false)
const enabledForAccount = shallowRef(false)
const subscribedOnDevice = shallowRef(false)
const notificationPermission = shallowRef<NotificationPermission | 'unsupported'>('unsupported')
const scheduleMode = shallowRef<ReminderScheduleMode>('preset')
const times = reactive({ ...DEFAULT_REMINDER_TIMES })
const error = shallowRef('')
const notice = shallowRef('')

const periodLabels: Record<MealPeriod, string> = {
	morning: 'Ранок',
	day: 'День',
	evening: 'Вечір',
}

const canReceivePush = computed(() => notificationPermission.value !== 'unsupported')
const scheduleIsValid = computed(() => isValidReminderTimes(times))

onMounted(() => {
	void loadSettings()
})

onUnmounted(() => {
	componentUnmounted = true
	settingsLoadGeneration += 1
})

async function loadSettings() {
	loading.value = true
	error.value = ''

	const userId = props.userId
	const generation = ++settingsLoadGeneration
	const isCurrentLoad = () =>
		!componentUnmounted
		&& props.userId === userId
		&& generation === settingsLoadGeneration
	const cached = settingsCache.value[userId]
	if (
		cached &&
		Date.now() - cached.cachedAt < REMINDER_SETTINGS_CACHE_TTL_MS
	) {
		applySchedule(cached.settings)

		const { data, error: loadError } = await supabase
			.from('meal_reminder_settings')
			.select('enabled')
			.eq('user_id', userId)
			.maybeSingle()

		if (!isCurrentLoad()) return

		if (loadError) {
			error.value = 'Не вдалося завантажити налаштування нагадувань.'
			loading.value = false
			return
		}

		enabledForAccount.value = data?.enabled ?? false
	} else {
		const { data, error: loadError } = await supabase
			.from('meal_reminder_settings')
			.select('enabled, schedule_mode, morning_at, day_at, evening_at')
			.eq('user_id', userId)
			.maybeSingle()

		if (!isCurrentLoad()) return

		if (loadError) {
			error.value = 'Не вдалося завантажити налаштування нагадувань.'
			loading.value = false
			return
		}

		const settings = data ? (data as ReminderSettingsRow) : null
		applySettings(settings)
		settingsCache.value = {
			...settingsCache.value,
			[userId]: { cachedAt: Date.now(), settings },
		}
	}

	if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
		notificationPermission.value = Notification.permission
		try {
			const registration = await navigator.serviceWorker.getRegistration('/')
			subscribedOnDevice.value = Boolean(await registration?.pushManager.getSubscription())
		} catch (cause) {
			error.value = cause instanceof Error
				? `Не вдалося перевірити підписку на цьому пристрої: ${cause.message}`
				: 'Не вдалося перевірити підписку на цьому пристрої.'
		}
	}

	loading.value = false
}

function applySettings(settings: ReminderSettingsRow | null) {
	if (!settings) return
	enabledForAccount.value = settings.enabled
	applySchedule(settings)
}

function applySchedule(settings: ReminderSchedule | null) {
	if (!settings) return
	scheduleMode.value = settings.schedule_mode
	times.morning = normalizeReminderTime(settings.morning_at)
	times.day = normalizeReminderTime(settings.day_at)
	times.evening = normalizeReminderTime(settings.evening_at)
}

function choosePreset() {
	scheduleMode.value = 'preset'
	Object.assign(times, DEFAULT_REMINDER_TIMES)
}

function chooseCustom() {
	scheduleMode.value = 'custom'
}

async function saveSchedule() {
	error.value = ''
	notice.value = ''
	if (!scheduleIsValid.value) {
		error.value = 'Задайте час у межах відповідної частини дня.'
		return
	}

	pending.value = true
	try {
		const submittedSchedule = captureSubmittedSchedule()
		const saved = await persistSchedule(submittedSchedule)
		if (saved) notice.value = 'Розклад нагадувань збережено.'
	} catch (cause) {
		error.value = cause instanceof Error
			? `Не вдалося зберегти розклад: ${cause.message}`
			: 'Не вдалося зберегти розклад нагадувань.'
	} finally {
		pending.value = false
	}
}

async function enableOnDevice() {
	error.value = ''
	notice.value = ''
	const initiatingUserId = props.userId
	const accountIsCurrent = () =>
		props.userId === initiatingUserId
		&& authenticatedUser.value?.id === initiatingUserId
	if (!accountIsCurrent()) return
	if (!scheduleIsValid.value) {
		error.value = 'Спочатку задайте коректний розклад.'
		return
	}
	if (!canReceivePush.value) {
		error.value = 'Цей браузер не підтримує push-сповіщення. На iPhone відкрийте встановлений на екран «Домівка» застосунок.'
		return
	}
	if (!window.isSecureContext) {
		error.value = 'Для push-сповіщень потрібне захищене HTTPS-з’єднання.'
		return
	}
	if (!config.public.vapidPublicKey) {
		error.value = 'Push-сповіщення ще не налаштовані на сервері.'
		return
	}

	const submittedSettings = captureSubmittedSettings(enabledForAccount.value)
	pending.value = true
	try {
		const permission = notificationPermission.value === 'granted'
			? 'granted'
			: await Notification.requestPermission()
		if (!accountIsCurrent()) return
		notificationPermission.value = permission
		if (permission !== 'granted') {
			error.value = permission === 'denied'
				? 'Дозвіл на сповіщення вимкнено в налаштуваннях браузера.'
				: 'Щоб отримувати нагадування, дозвольте сповіщення.'
			return
		}

		await persistSettings(submittedSettings, initiatingUserId)
		if (!accountIsCurrent()) return
		if (error.value) return

		const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
		if (!accountIsCurrent()) return
		const existingSubscription = await registration.pushManager.getSubscription()
		if (!accountIsCurrent()) return
		const subscription = existingSubscription ?? await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: decodeApplicationServerKey(config.public.vapidPublicKey),
		})
		if (!accountIsCurrent()) return
		const serialized = subscription.toJSON()
		const endpoint = serialized.endpoint
		const auth = serialized.keys?.auth
		const p256dh = serialized.keys?.p256dh
		if (!endpoint || !auth || !p256dh) {
			throw new Error('Браузер повернув неповну push-підписку.')
		}

		if (!accountIsCurrent()) return
		const { error: subscriptionError } = await supabase.functions.invoke(
			'register-push-subscription',
			{ body: { endpoint, auth, p256dh } },
		)
		if (!accountIsCurrent()) return
		if (subscriptionError) throw subscriptionError

		if (!await persistSettings({ ...submittedSettings, enabled: true }, initiatingUserId)) return
		subscribedOnDevice.value = true
		enabledForAccount.value = true
		notice.value = 'Нагадування увімкнено на цьому пристрої.'
	} catch (cause) {
		error.value = cause instanceof Error
			? `Не вдалося увімкнути нагадування: ${cause.message}`
			: 'Не вдалося увімкнути нагадування.'
	} finally {
		pending.value = false
	}
}

async function disableOnDevice() {
	error.value = ''
	notice.value = ''
	const submittedSettings = captureSubmittedSettings(false)
	pending.value = true
	try {
		const registration = await navigator.serviceWorker.getRegistration('/')
		const subscription = await registration?.pushManager.getSubscription()
		if (subscription) {
			const endpoint = subscription.endpoint
			await subscription.unsubscribe()
			subscribedOnDevice.value = false
			const { error: deleteError } = await supabase
				.from('push_subscriptions')
				.delete()
				.eq('user_id', props.userId)
				.eq('endpoint', endpoint)
			if (deleteError) throw deleteError
		}

		const { count, error: countError } = await supabase
			.from('push_subscriptions')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', props.userId)
		if (countError) throw countError

		subscribedOnDevice.value = false
		if (count === 0) {
			const saved = await persistSettings(submittedSettings)
			if (!saved) return
			enabledForAccount.value = false
		}
		notice.value = 'Нагадування вимкнено на цьому пристрої.'
	} catch (cause) {
		error.value = cause instanceof Error
			? `Не вдалося вимкнути нагадування: ${cause.message}`
			: 'Не вдалося вимкнути нагадування.'
	} finally {
		pending.value = false
	}
}

async function sendTestNotification() {
	error.value = ''
	notice.value = ''
	testPushPending.value = true
	try {
		const { data, error: testError } = await supabase.functions.invoke<{
			sent: number
			failed: number
		}>('send-test-push')

		if (testError) {
			let message = testError.message
			if ('context' in testError && testError.context instanceof Response) {
				const body = await testError.context.clone().json() as { error?: unknown }
				if (typeof body.error === 'string') message = body.error
			}
			throw new Error(message)
		}
		if (!data || !Number.isInteger(data.sent) || !Number.isInteger(data.failed) || data.sent < 1) {
			throw new Error('Push-сервіс не прийняв тестове сповіщення.')
		}

		notice.value = data.failed > 0
			? `Push-сервіс прийняв ${data.sent} тестових сповіщень; пристроїв із помилкою: ${data.failed}.`
			: `Push-сервіс прийняв ${data.sent} тестових сповіщень. Це ще не гарантує показ на екрані.`
	} catch (cause) {
		error.value = cause instanceof Error
			? `Не вдалося надіслати тестове сповіщення: ${cause.message}`
			: 'Не вдалося надіслати тестове сповіщення.'
	} finally {
		testPushPending.value = false
	}
}

function captureSubmittedSettings(enabled: boolean): ReminderSettingsRow {
	return {
		enabled,
		...captureSubmittedSchedule(),
	}
}

function captureSubmittedSchedule(): ReminderSchedule {
	return {
		schedule_mode: scheduleMode.value,
		morning_at: times.morning,
		day_at: times.day,
		evening_at: times.evening,
	}
}

async function persistSchedule(schedule: ReminderSchedule): Promise<boolean> {
	const userId = props.userId
	if (authenticatedUser.value?.id !== userId) return false
	settingsLoadGeneration += 1

	const { data, error: updateError } = await supabase
		.from('meal_reminder_settings')
		.update({
			schedule_mode: schedule.schedule_mode,
			morning_at: schedule.morning_at,
			day_at: schedule.day_at,
			evening_at: schedule.evening_at,
			updated_at: new Date().toISOString(),
		})
		.eq('user_id', userId)
		.select('user_id')
		.maybeSingle()

	if (props.userId !== userId || authenticatedUser.value?.id !== userId) return false
	if (updateError) {
		error.value = 'Не вдалося зберегти розклад нагадувань.'
		return false
	}

	if (!data) {
		const { error: insertError } = await supabase
			.from('meal_reminder_settings')
			.insert({
				user_id: userId,
				enabled: false,
				...schedule,
			})

		if (props.userId !== userId || authenticatedUser.value?.id !== userId) return false

		if (insertError) {
			const { data: retried, error: retryError } = await supabase
				.from('meal_reminder_settings')
				.update({
					schedule_mode: schedule.schedule_mode,
					morning_at: schedule.morning_at,
					day_at: schedule.day_at,
					evening_at: schedule.evening_at,
					updated_at: new Date().toISOString(),
				})
				.eq('user_id', userId)
				.select('user_id')
				.maybeSingle()

			if (props.userId !== userId || authenticatedUser.value?.id !== userId) return false

			if (retryError || !retried) {
				error.value = 'Не вдалося зберегти розклад нагадувань.'
				return false
			}
		}
	}

	const settings: ReminderSettingsRow = {
		enabled: enabledForAccount.value,
		...schedule,
	}
	settingsCache.value = {
		...settingsCache.value,
		[userId]: { cachedAt: Date.now(), settings },
	}
	return true
}

async function persistSettings(
	settings: ReminderSettingsRow,
	expectedUserId = props.userId,
): Promise<boolean> {
	const userId = props.userId
	if (
		userId !== expectedUserId
		|| authenticatedUser.value?.id !== expectedUserId
	) return false
	settingsLoadGeneration += 1

	const { error: saveError } = await supabase
		.from('meal_reminder_settings')
		.upsert({
			user_id: userId,
			enabled: settings.enabled,
			schedule_mode: settings.schedule_mode,
			morning_at: settings.morning_at,
			day_at: settings.day_at,
			evening_at: settings.evening_at,
			updated_at: new Date().toISOString(),
		}, { onConflict: 'user_id' })

	if (
		props.userId !== userId
		|| props.userId !== expectedUserId
		|| authenticatedUser.value?.id !== expectedUserId
	) return false

	if (saveError) {
		error.value = 'Не вдалося зберегти розклад нагадувань.'
		return false
	}

	enabledForAccount.value = settings.enabled
	settingsCache.value = {
		...settingsCache.value,
		[userId]: {
			cachedAt: Date.now(),
			settings,
		},
	}
	return true
}

function decodeApplicationServerKey(value: string): Uint8Array {
	const padding = '='.repeat((4 - value.length % 4) % 4)
	const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding)
	return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}
</script>

<template>
	<section class="rounded-[1.5rem] border border-border/80 bg-card px-5 py-4 shadow-[0_12px_40px_rgba(32,52,44,0.05)] sm:px-6">
		<details>
			<summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
				<span>
					<span class="block font-bold">Нагадування про їжу та настрій</span>
					<span class="mt-1 block text-sm text-muted-foreground">
						{{ subscribedOnDevice ? 'Увімкнені на цьому пристрої' : 'Налаштуйте час і дозвольте сповіщення' }}
					</span>
				</span>
				<span class="shrink-0 text-sm font-semibold text-primary">Налаштувати</span>
			</summary>

			<div v-if="loading" role="status" class="mt-4 text-sm text-muted-foreground">
				Завантажую налаштування…
			</div>
			<div v-else class="mt-5 space-y-5">
				<p class="text-sm text-muted-foreground">
					Сповіщення нагадає записати їжу та настрій вранці, вдень або ввечері.
					Воно не надійде, якщо обидві позначки за цей період уже збережені.
				</p>
				<p class="-mt-3 text-xs text-muted-foreground">Час вказано за Києвом.</p>

				<fieldset class="space-y-3">
					<legend class="mb-2 text-sm font-semibold">Час нагадувань</legend>
					<div
						role="group"
						aria-label="Режим нагадувань"
						class="grid gap-2 sm:grid-cols-2"
					>
						<button
							type="button"
							:aria-pressed="scheduleMode === 'preset'"
							class="min-h-11 rounded-xl border px-3 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:class="scheduleMode === 'preset' ? 'border-primary bg-primary/5' : 'border-border'"
							@click="choosePreset"
						>
							<span class="block font-semibold">За розкладом</span>
							<span class="mt-1 block text-muted-foreground">09:00 · 14:00 · 18:00</span>
						</button>
						<button
							type="button"
							:aria-pressed="scheduleMode === 'custom'"
							class="min-h-11 rounded-xl border px-3 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:class="scheduleMode === 'custom' ? 'border-primary bg-primary/5' : 'border-border'"
							@click="chooseCustom"
						>
							<span class="block font-semibold">Власний розклад</span>
							<span class="mt-1 block text-muted-foreground">Вкажіть час для кожної частини дня</span>
						</button>
					</div>
				</fieldset>

				<div class="grid gap-3 sm:grid-cols-3">
					<label v-for="period in (['morning', 'day', 'evening'] as const)" :key="period" class="space-y-1.5 text-sm">
						<span class="block font-medium">{{ periodLabels[period] }}</span>
						<input
							v-model="times[period]"
							type="time"
							:min="period === 'morning' ? '00:00' : period === 'day' ? '12:00' : '18:00'"
							:max="period === 'morning' ? '11:59' : period === 'day' ? '17:59' : '23:59'"
							:disabled="scheduleMode === 'preset'"
							class="h-11 w-full rounded-xl border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70"
						>
					</label>
				</div>

				<div class="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						:disabled="pending || !scheduleIsValid"
						@click="saveSchedule"
					>
						Зберегти розклад
					</Button>
					<Button
						v-if="!subscribedOnDevice"
						type="button"
						:disabled="pending || !scheduleIsValid"
						@click="enableOnDevice"
					>
						{{ pending ? 'Увімкнення…' : 'Дозволити сповіщення' }}
					</Button>
					<Button
						v-else
						type="button"
						variant="outline"
						:disabled="pending"
						@click="disableOnDevice"
					>
						{{ pending ? 'Вимкнення…' : 'Вимкнути на цьому пристрої' }}
					</Button>
				</div>

				<div v-if="enabledForAccount" class="space-y-2">
					<Button
						type="button"
						variant="outline"
						:disabled="pending || testPushPending"
						@click="sendTestNotification"
					>
						{{ testPushPending ? 'Надсилаю тест…' : 'Надіслати тестове сповіщення' }}
					</Button>
					<p class="text-xs text-muted-foreground">
						Тест надійде на всі пристрої з підпискою, навіть якщо застосунок закритий.
					</p>
				</div>

				<p v-if="!canReceivePush" class="text-sm text-muted-foreground">
					Цей браузер не підтримує push-сповіщення. На iPhone додайте застосунок на екран «Домівка».
				</p>
				<p v-else-if="notificationPermission === 'denied'" class="text-sm text-destructive">
					Доступ заборонено в браузері. Дозвольте сповіщення в налаштуваннях сайту.
				</p>
				<p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
				<p v-if="notice" role="status" class="text-sm text-primary">{{ notice }}</p>
			</div>
		</details>
	</section>
</template>
