<template>
	<main class="pb-10 pt-6 sm:pt-8">
		<header class="mb-5 flex items-end justify-between gap-4 sm:mb-7">
			<div>
				<p class="mb-1 text-sm font-medium text-muted-foreground">{{ todayLabel }}</p>
				<h1 class="text-[2rem] leading-none font-bold tracking-[-0.035em] sm:text-[2.5rem]">Мій щоденник</h1>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<Button
					v-if="userId"
					type="button"
					variant="outline"
					class="h-12 w-12 rounded-full px-0"
					:disabled="refreshing"
					:aria-label="refreshing ? 'Оновлення щоденника' : 'Оновити щоденник'"
					:title="refreshing ? 'Оновлення щоденника' : 'Оновити щоденник'"
					@click="refreshDashboard"
				>
					<span :class="{ 'animate-spin': refreshing }" aria-hidden="true">↻</span>
				</Button>
				<Button
					type="button"
					class="h-12 shrink-0 rounded-full bg-primary px-4 text-[15px] font-semibold shadow-[0_10px_24px_rgba(36,107,79,0.18)] sm:px-5"
					:aria-haspopup="userId ? 'dialog' : undefined"
					@click="openQuickLog"
				>
					<span class="mr-1 text-xl leading-none">+</span>
					Додати запис
				</Button>
			</div>
		</header>

		<Dialog v-model:open="quickLogOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Додати запис</DialogTitle>
					<DialogDescription>Оберіть їжу або напій для щоденника.</DialogDescription>
				</DialogHeader>
				<QuickLogForm
					v-if="userId"
					:products="products"
					:pending="savePending"
					:error-message="error"
					:notice="notice"
					@food="logFood"
					@drink="logDrink"
				/>
			</DialogContent>
		</Dialog>
		<Dialog v-model:open="targetsOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Мої цілі</DialogTitle>
					<DialogDescription>Оберіть готовий пресет або задайте значення вручну.</DialogDescription>
				</DialogHeader>
				<DailyTargetSettings
					v-if="userId"
					:targets="targets"
					:preset="targetPreset"
					:pending="targetPending"
					:error-message="error"
					:notice="notice"
					@save="saveTargets"
				/>
			</DialogContent>
		</Dialog>

		<p v-if="error" role="alert" class="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
			{{ error }}
		</p>
		<p v-if="notice" role="status" class="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-primary">
			{{ notice }}
		</p>

		<section v-if="loading" role="status" class="rounded-[1.5rem] border border-border/80 bg-card p-8 text-sm text-muted-foreground">
			Завантажую щоденник...
		</section>

		<section v-else-if="!userId" class="rounded-[1.5rem] border border-border/80 bg-card px-6 py-12 text-center shadow-[0_12px_40px_rgba(32,52,44,0.05)]">
			<h2 class="text-xl font-bold">Увійдіть, щоб вести щоденник</h2>
			<p class="mt-2 text-sm text-muted-foreground">Записи й цілі зберігаються у вашому акаунті.</p>
			<NuxtLink to="/signin" class="mt-5 inline-block">
				<Button class="h-11 rounded-full px-5">Увійти</Button>
			</NuxtLink>
		</section>

		<div v-else class="space-y-5">
			<section class="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-primary p-5 text-primary-foreground shadow-[0_18px_50px_rgba(36,107,79,0.16)] sm:p-7" aria-labelledby="goal-heading">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-white/70">{{ todayLabel }}</p>
						<h2 id="goal-heading" class="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-[2rem]">Мета на сьогодні</h2>
					</div>
					<button
						type="button"
						class="flex h-11 min-w-11 items-center justify-center rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground"
						@click="openTargets"
					>
						Цілі
					</button>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
					<article class="rounded-2xl bg-white/10 p-3.5 sm:p-4">
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">Калорії</p>
							<p class="text-xs font-bold text-secondary">{{ Math.round(progress(nutrition.calories, targets.calories)) }}%</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">{{ formatNumber(nutrition.calories) }} <span class="text-xs font-normal text-white/65">/ {{ formatNumber(targets.calories) }} ккал</span></p>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
							<div class="h-full rounded-full bg-secondary" :style="{ width: `${progress(nutrition.calories, targets.calories)}%` }" />
						</div>
					</article>

					<article class="rounded-2xl bg-white/10 p-3.5 sm:p-4">
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">Білки</p>
							<p class="text-xs font-bold text-secondary">{{ Math.round(progress(nutrition.proteins, targets.proteins)) }}%</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">{{ formatNumber(nutrition.proteins) }} <span class="text-xs font-normal text-white/65">/ {{ formatNumber(targets.proteins) }} г</span></p>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
							<div class="h-full rounded-full bg-secondary" :style="{ width: `${progress(nutrition.proteins, targets.proteins)}%` }" />
						</div>
					</article>

					<article class="rounded-2xl bg-white/10 p-3.5 sm:p-4">
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">Жири</p>
							<p class="text-xs font-bold text-secondary">{{ Math.round(progress(nutrition.fats, targets.fats)) }}%</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">{{ formatNumber(nutrition.fats) }} <span class="text-xs font-normal text-white/65">/ {{ formatNumber(targets.fats) }} г</span></p>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
							<div class="h-full rounded-full bg-secondary" :style="{ width: `${progress(nutrition.fats, targets.fats)}%` }" />
						</div>
					</article>

					<article class="rounded-2xl bg-white/10 p-3.5 sm:p-4">
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">Вуглеводи</p>
							<p class="text-xs font-bold text-secondary">{{ Math.round(progress(nutrition.carbs, targets.carbs)) }}%</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">{{ formatNumber(nutrition.carbs) }} <span class="text-xs font-normal text-white/65">/ {{ formatNumber(targets.carbs) }} г</span></p>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
							<div class="h-full rounded-full bg-secondary" :style="{ width: `${progress(nutrition.carbs, targets.carbs)}%` }" />
						</div>
					</article>

					<article class="rounded-2xl bg-white/10 p-3.5 sm:p-4">
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">Вода</p>
							<p class="text-xs font-bold text-secondary">{{ Math.round(progress(pureWater, targets.beveragesMl)) }}%</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">{{ formatVolume(pureWater) }} <span class="text-xs font-normal text-white/65">/ {{ formatVolume(targets.beveragesMl) }} мл</span></p>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
							<div class="h-full rounded-full bg-secondary" :style="{ width: `${progress(pureWater, targets.beveragesMl)}%` }" />
						</div>
					</article>

					<article class="rounded-2xl bg-white/10 p-3.5 sm:p-4">
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">Настрій</p>
							<p class="text-xs font-bold text-secondary">{{ completedWellbeingCount }}/3</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">
							{{ remainingWellbeingCount ? `Ще ${remainingWellbeingCount}` : 'Усе позначено' }}
						</p>
						<p class="mt-2 text-xs text-white/65">
							Ранок · День · Вечір
						</p>
					</article>
				</div>
			</section>

			<section class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_12px_40px_rgba(32,52,44,0.05)] sm:p-6" aria-labelledby="wellbeing-heading">
				<div class="mb-5 flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Коротка перевірка</p>
						<h2 id="wellbeing-heading" class="mt-1 text-xl font-bold">Як ти себе почуваєш?</h2>
					</div>
					<span class="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
						{{ completedWellbeingCount }}/3
					</span>
				</div>

				<div class="grid gap-3 md:grid-cols-3">
					<article
						v-for="period in wellbeingPeriods"
						:key="period.key"
						class="rounded-2xl border p-4"
						:class="period.key === currentPeriod
							? 'border-primary/35 bg-primary/[0.035]'
							: 'border-border/80 bg-white'"
					>
						<div class="mb-3 flex items-center justify-between">
							<div>
								<p class="font-bold">{{ period.label }}</p>
								<p class="mt-0.5 text-xs text-muted-foreground">{{ period.hint }}</p>
							</div>
							<span
								v-if="period.key === currentPeriod"
								class="rounded-full bg-secondary px-2 py-1 text-[11px] font-bold text-secondary-foreground"
							>
								Зараз
							</span>
						</div>
						<div class="grid grid-cols-5 gap-1.5" role="radiogroup" :aria-label="`Самопочуття ${period.label.toLowerCase()}ом`">
							<button
								v-for="option in moodOptions"
								:key="option.mood"
								type="button"
								role="radio"
								:aria-checked="wellbeingByPeriod[period.key]?.value.mood === option.mood"
								:aria-label="`${option.label}, ${period.label}`"
								:disabled="wellbeingPending"
								class="flex min-h-14 flex-col items-center justify-center rounded-xl border text-center transition-colors"
								:class="wellbeingByPeriod[period.key]?.value.mood === option.mood
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-white hover:border-primary/40'"
								:title="option.label"
								@click="saveMood(period.key, option)"
							>
								<span class="text-xl leading-none">{{ option.emoji }}</span>
							</button>
						</div>
						<p class="mt-2 min-h-5 text-center text-xs text-muted-foreground">
							{{ moodOptions.find((option) => option.mood === wellbeingByPeriod[period.key]?.value.mood)?.label || 'Оберіть стан' }}
						</p>
					</article>
				</div>
			</section>

			<MealReminderSettings :user-id="userId" />

			<div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
				<section class="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card" aria-labelledby="records-heading">
					<div class="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
						<div>
							<h2 id="records-heading" class="text-lg font-bold">Що вже зроблено</h2>
							<p class="mt-0.5 text-sm text-muted-foreground">{{ records.length }} {{ recordsCountLabel }}</p>
						</div>
						<button type="button" class="h-10 rounded-full border border-border px-4 text-sm font-bold" @click="openQuickLog">
							Додати
						</button>
					</div>
					<p v-if="!records.length" class="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
						Ще нічого не записано. Додайте їжу або напій, коли буде зручно.
					</p>
					<ul v-else class="divide-y divide-border/70">
						<li v-for="record in records" :key="record.id" class="flex items-center gap-3 px-5 py-4 sm:px-6">
							<span
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] text-lg font-bold"
								:class="record.kind === 'food' ? 'bg-[#EDF1DC] text-[#5D6B35]' : 'bg-[#E5F2F4] text-[#2F6F7A]'"
								aria-hidden="true"
							>
								{{ record.kind === 'food' ? 'Ї' : 'Н' }}
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{{ record.title }}</p>
								<p class="mt-0.5 truncate text-sm text-muted-foreground">{{ record.detail }}</p>
							</div>
							<div class="shrink-0 text-right">
								<time :datetime="record.createdAt" class="block text-xs text-muted-foreground">{{ formatLocalHour(record.createdAt) }}</time>
								<p class="mt-1 text-sm font-bold">
									{{ record.kind === 'food' ? `${formatNumber(record.calories)} ккал` : `${formatVolume(record.volumeMl)} мл` }}
								</p>
							</div>
						</li>
					</ul>
				</section>

				<aside class="space-y-5">
					<section class="grid grid-cols-2 gap-3" aria-label="Супутній прогрес">
						<article class="rounded-[1.5rem] border border-border/80 bg-card p-4">
							<p class="text-sm font-semibold text-muted-foreground">Напої</p>
							<p class="mt-3 text-[1.7rem] leading-none font-bold">{{ formatVolume(totalBeverages) }}</p>
							<p class="mt-1 text-xs text-muted-foreground">з {{ formatVolume(targets.beveragesMl) }} мл</p>
						</article>
						<article class="rounded-[1.5rem] border border-border/80 bg-card p-4">
							<p class="text-sm font-semibold text-muted-foreground">Енергія</p>
							<p class="mt-3 text-[1.7rem] leading-none font-bold">{{ formatNumber(nutrition.calories) }}</p>
							<p class="mt-1 text-xs text-muted-foreground">з {{ formatNumber(targets.calories) }} ккал</p>
						</article>
					</section>

					<section class="rounded-[1.5rem] border border-border/80 bg-card p-5" aria-label="Нутрієнти за день">
						<h2 class="mb-4 font-bold">Нутрієнти</h2>
						<div class="space-y-4">
							<div v-for="macro in macros" :key="macro.key">
								<div class="mb-1.5 flex items-baseline justify-between gap-3">
									<p class="text-sm text-muted-foreground">{{ macro.label }}</p>
									<p class="text-sm font-bold">{{ formatNumber(nutrition[macro.key]) }} <span class="font-normal text-muted-foreground">/ {{ formatNumber(targets[macro.key]) }} г</span></p>
								</div>
								<div class="h-1.5 overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-primary" :style="{ width: `${progress(nutrition[macro.key], targets[macro.key])}%` }" />
								</div>
							</div>
						</div>
					</section>
				</aside>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { formatLocalHour, getLocalDate } from '~/src/shared/date'
import DailyTargetSettings from '~/src/features/dashboard/DailyTargetSettings.vue'
import QuickLogForm from '~/src/features/dashboard/QuickLogForm.vue'
import MealReminderSettings from '~/src/features/reminders/MealReminderSettings.vue'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import {
	DEFAULT_TARGETS,
	getProgressPercent,
	scaleNutrition,
	type DailyTargets,
	type TargetPreset,
} from '~/src/features/dashboard/targets'

interface Product {
	id: string
	name: string
	quantity: number
	chars: {
		calories: number
		proteins: number
		fats: number
		carbs: number
		vitamins?: Record<string, number>
		unit?: 'g' | 'ml' | 'piece'
	}
}

interface FoodLog {
	id: string
	product_id: string | null
	quantity: number
	calories: number
	proteins: number
	fats: number
	carbs: number
	created_at: string
	products: { name: string; chars: { unit?: 'g' | 'ml' | 'piece' } } | null
}

interface DrinkLog {
	id: string
	kind: string
	volume_ml: number
	created_at: string
}

interface DiaryRecord {
	id: string
	kind: 'food' | 'drink'
	title: string
	detail: string
	calories: number
	volumeMl: number
	createdAt: string
}

interface WellbeingEntry {
	id: string
	value: {
		period: 'morning' | 'day' | 'evening'
		mood: number
		label: string
	}
}

interface DashboardSnapshot {
	cachedAt: number
	products: Product[]
	foodLogs: FoodLog[]
	drinkLogs: DrinkLog[]
	wellbeingEntries: WellbeingEntry[]
	targets: DailyTargets
	targetPreset: TargetPreset
}

const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userId = computed(() => user.value?.id ?? null)
const loading = shallowRef(true)
const refreshing = shallowRef(false)
const savePending = shallowRef(false)
const targetPending = shallowRef(false)
const quickLogOpen = shallowRef(false)
const targetsOpen = shallowRef(false)
const error = shallowRef('')
const notice = shallowRef('')
const products = shallowRef<Product[]>([])
const foodLogs = shallowRef<FoodLog[]>([])
const drinkLogs = shallowRef<DrinkLog[]>([])
const wellbeingEntries = shallowRef<WellbeingEntry[]>([])
const wellbeingPending = shallowRef(false)
const targets = shallowRef<DailyTargets>({ ...DEFAULT_TARGETS })
const targetPreset = shallowRef<TargetPreset>('balanced')
const dashboardCache = useState<Record<string, DashboardSnapshot>>('dashboard-cache', () => ({}))

const macros: Array<{ key: 'proteins' | 'fats' | 'carbs'; label: string }> = [
	{ key: 'proteins', label: 'Білки' },
	{ key: 'fats', label: 'Жири' },
	{ key: 'carbs', label: 'Вуглеводи' },
]

const moodOptions = [
	{ mood: 1, emoji: '😞', label: 'Важко' },
	{ mood: 2, emoji: '😕', label: 'Незручно' },
	{ mood: 3, emoji: '😐', label: 'Звичайно' },
	{ mood: 4, emoji: '🙂', label: 'Добре' },
	{ mood: 5, emoji: '😄', label: 'Чудово' },
] as const

const wellbeingPeriods = [
	{ key: 'morning', label: 'Ранок', hint: 'Як прокинувся?' },
	{ key: 'day', label: 'День', hint: 'Як ти зараз?' },
	{ key: 'evening', label: 'Вечір', hint: 'Як пройшов день?' },
] as const

const nutrition = computed(() => foodLogs.value.reduce(
	(total, entry) => ({
		calories: total.calories + Number(entry.calories || 0),
		proteins: total.proteins + Number(entry.proteins || 0),
		fats: total.fats + Number(entry.fats || 0),
		carbs: total.carbs + Number(entry.carbs || 0),
	}),
	{ calories: 0, proteins: 0, fats: 0, carbs: 0 }
))
const totalBeverages = computed(() =>
	drinkLogs.value.reduce((sum, drink) => sum + Number(drink.volume_ml || 0), 0)
)
const pureWater = computed(() =>
	drinkLogs.value
		.filter((drink) => drink.kind === 'water')
		.reduce((sum, drink) => sum + Number(drink.volume_ml || 0), 0)
)
const records = computed<DiaryRecord[]>(() => [
	...foodLogs.value.map((entry) => ({
		id: entry.id,
		kind: 'food' as const,
		title: entry.products?.name ?? 'Продукт',
		detail: `${formatNumber(Number(entry.quantity))} ${unitLabel(entry.products?.chars.unit)} · ${formatNumber(Number(entry.proteins))} г белка`,
		calories: Number(entry.calories),
		volumeMl: 0,
		createdAt: entry.created_at,
	})),
	...drinkLogs.value.map((drink) => ({
		id: drink.id,
		kind: 'drink' as const,
		title: drinkKindLabel(drink.kind),
		detail: `${formatVolume(Number(drink.volume_ml))} мл`,
		calories: 0,
		volumeMl: Number(drink.volume_ml),
		createdAt: drink.created_at,
	})),
].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
const recordsCountLabel = computed(() => {
	const count = records.value.length
	if (count === 1) return 'запис'
	if (count > 1 && count < 5) return 'записи'
	return 'записів'
})
const currentPeriod = computed<'morning' | 'day' | 'evening'>(() => {
	const hour = Number(new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/Kyiv',
		hour: '2-digit',
		hourCycle: 'h23',
	}).format(new Date()))
	if (hour < 12) return 'morning'
	if (hour < 18) return 'day'
	return 'evening'
})
const completedWellbeingCount = computed(() =>
	wellbeingEntries.value.filter((entry) =>
		wellbeingPeriods.some((period) => period.key === entry.value.period)
	).length
)
const remainingWellbeingCount = computed(() =>
	Math.max(0, 3 - completedWellbeingCount.value)
)
const wellbeingByPeriod = computed(() => Object.fromEntries(
	wellbeingEntries.value.map((entry) => [entry.value.period, entry])
) as Partial<Record<'morning' | 'day' | 'evening', WellbeingEntry>>)
const todayLabel = new Intl.DateTimeFormat('uk-UA', {
	timeZone: 'Europe/Kyiv',
	weekday: 'long',
	day: 'numeric',
	month: 'long',
}).format(new Date())

function openQuickLog() {
	if (!userId.value) return
	targetsOpen.value = false
	quickLogOpen.value = true
}

function openTargets() {
	if (!userId.value) return
	quickLogOpen.value = false
	targetsOpen.value = true
}

watch(userId, async (id) => {
	if (!id) {
		loading.value = false
		return
	}
	await loadDashboard(id)
}, { immediate: true })

async function loadDashboard(id: string, force = false) {
	const cacheKey = dashboardCacheKey(id)
	const cached = dashboardCache.value[cacheKey]
	const cacheIsFresh = cached && Date.now() - cached.cachedAt < DASHBOARD_CACHE_TTL_MS

	if (!force && cacheIsFresh) {
		restoreDashboardSnapshot(cached)
		loading.value = false
		return
	}

	if (loading.value) loading.value = true
	else refreshing.value = true
	error.value = ''
	notice.value = ''

	const results = await Promise.all([
		loadProducts(id),
		loadDayEntries(id),
		loadTargets(id),
		loadWellbeing(id),
	])
	const failure = results.find((result) => result)
	if (failure) error.value = failure
	else cacheDashboardSnapshot(id)
	loading.value = false
	refreshing.value = false
}

function refreshDashboard() {
	const id = userId.value
	if (!id || refreshing.value) return
	void loadDashboard(id, true)
}

function dashboardCacheKey(id: string) {
	return `${id}:${getLocalDate()}`
}

function restoreDashboardSnapshot(cached: DashboardSnapshot) {
	products.value = cached.products
	foodLogs.value = cached.foodLogs
	drinkLogs.value = cached.drinkLogs
	wellbeingEntries.value = cached.wellbeingEntries ?? []
	targets.value = { ...cached.targets }
	targetPreset.value = cached.targetPreset
}

function cacheDashboardSnapshot(id: string) {
	dashboardCache.value = {
		...dashboardCache.value,
		[dashboardCacheKey(id)]: {
			cachedAt: Date.now(),
			products: [...products.value],
			foodLogs: [...foodLogs.value],
			drinkLogs: [...drinkLogs.value],
			wellbeingEntries: [...wellbeingEntries.value],
			targets: { ...targets.value },
			targetPreset: targetPreset.value,
		},
	}
}

async function loadProducts(id: string): Promise<string | null> {
	let { data, error: requestError } = await supabase
		.from('products')
		.select('id, name, quantity, chars')
		.eq('user_id', id)
		.order('name')
	if (requestError) return 'Не удалось загрузить список продуктов.'

	if (!data?.length) {
		const { error: seedError } = await supabase.from('products').insert(
			seedProducts.map((product) => ({ ...product, user_id: id }))
		)
		if (seedError) return 'Не удалось добавить стартовые продукты.'

		const refreshed = await supabase
			.from('products')
			.select('id, name, quantity, chars')
			.eq('user_id', id)
			.order('name')
		data = refreshed.data
		requestError = refreshed.error
		if (requestError) return 'Не удалось загрузить стартовые продукты.'
	}

	products.value = (data ?? []).map((product) => ({
		id: product.id,
		name: product.name,
		quantity: Number(product.quantity),
		chars: product.chars as Product['chars'],
	}))
	return null
}

async function loadDayEntries(id: string): Promise<string | null> {
	const today = getLocalDate()
	const [foods, drinks] = await Promise.all([
		supabase
			.from('logs')
			.select('id, product_id, quantity, calories, proteins, fats, carbs, created_at, products(name, chars)')
			.eq('user_id', id)
			.eq('date', today)
			.order('created_at', { ascending: false }),
		supabase
			.from('drinks')
			.select('id, kind, volume_ml, created_at')
			.eq('user_id', id)
			.eq('entry_date', today)
			.order('created_at', { ascending: false }),
	])

	if (foods.error || drinks.error) return 'Не удалось загрузить записи за сегодня.'
	foodLogs.value = (foods.data ?? []) as unknown as FoodLog[]
	drinkLogs.value = (drinks.data ?? []) as DrinkLog[]
	return null
}

async function loadWellbeing(id: string): Promise<string | null> {
	const localDate = getLocalDate()
	const dayStart = new Date(`${localDate}T00:00:00+02:00`)
	const dayEnd = new Date(dayStart)
	dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

	const { data, error: requestError } = await supabase
		.from('wellbeing_entries')
		.select('id, kind, value, recorded_at')
		.eq('user_id', id)
		.eq('kind', 'mood')
		.gte('recorded_at', dayStart.toISOString())
		.lt('recorded_at', dayEnd.toISOString())

	if (requestError) return 'Не вдалося завантажити самопочуття.'
	wellbeingEntries.value = (data ?? []).map((entry) => {
		const value = entry.value as WellbeingEntry['value']
		return { id: entry.id, value }
	}).filter((entry) => wellbeingPeriods.some((period) => period.key === entry.value.period))
	return null
}

async function loadTargets(id: string): Promise<string | null> {
	const { data, error: readError } = await supabase
		.from('profiles')
		.select('daily_targets, plan_preset')
		.eq('id', id)
		.maybeSingle()
	if (readError) return 'Не удалось загрузить дневные цели.'

	if (!data) {
		const { error: insertError } = await supabase.from('profiles').upsert({
			id,
			daily_targets: DEFAULT_TARGETS,
			plan_preset: 'balanced',
		})
		if (insertError) return 'Не удалось создать настройки дневных целей.'
		targets.value = { ...DEFAULT_TARGETS }
		targetPreset.value = 'balanced'
		return null
	}

	targets.value = normalizeTargets(data.daily_targets)
	targetPreset.value = isTargetPreset(data.plan_preset) ? data.plan_preset : 'custom'
	return null
}

async function logFood(entry: { productId: string; quantity: number }) {
	const product = products.value.find((item) => item.id === entry.productId)
	const id = userId.value
	if (!product || !id || savePending.value) return

	savePending.value = true
	error.value = ''
	notice.value = ''
	const values = scaleNutrition(product.chars, entry.quantity, product.quantity)
	const { error: saveError } = await supabase.from('logs').insert({
		user_id: id,
		product_id: product.id,
		date: getLocalDate(),
		quantity: entry.quantity,
		calories: values.calories,
		proteins: values.proteins,
		fats: values.fats,
		carbs: values.carbs,
		vitamins: scaleVitamins(product.chars.vitamins, entry.quantity, product.quantity),
		idempotency_key: globalThis.crypto?.randomUUID?.() ?? `${id}-${Date.now()}`,
	})
	savePending.value = false
	if (saveError) {
		error.value = 'Не удалось записать еду. Проверь соединение и попробуй ещё раз.'
		return
	}

	notice.value = `${product.name} добавлен в дневник.`
	await refreshDay(id)
}

async function logDrink(entry: { kind: 'water' | 'coffee' | 'tea' | 'other'; volumeMl: number }) {
	const id = userId.value
	if (!id || savePending.value) return

	savePending.value = true
	error.value = ''
	notice.value = ''
	const { error: saveError } = await supabase.from('drinks').insert({
		user_id: id,
		kind: entry.kind,
		volume_ml: entry.volumeMl,
		recorded_at: new Date().toISOString(),
		entry_date: getLocalDate(),
	})
	savePending.value = false
	if (saveError) {
		error.value = 'Не удалось записать напиток. Проверь соединение и попробуй ещё раз.'
		return
	}

	notice.value = `${drinkKindLabel(entry.kind)} добавлен в дневник.`
	await refreshDay(id)
}

async function saveMood(
	period: 'morning' | 'day' | 'evening',
	option: (typeof moodOptions)[number]
) {
	const id = userId.value
	if (!id || wellbeingPending.value) return

	wellbeingPending.value = true
	error.value = ''
	notice.value = ''
	const existing = wellbeingByPeriod.value[period]
	const payload = {
		user_id: id,
		kind: 'mood',
		entry_date: getLocalDate(),
		value: {
			period,
			mood: option.mood,
			label: option.label,
		},
		recorded_at: new Date().toISOString(),
	}

	const request = existing
		? supabase.from('wellbeing_entries').update(payload).eq('id', existing.id).eq('user_id', id)
		: supabase.from('wellbeing_entries').insert(payload)
	const { error: saveError } = await request
	wellbeingPending.value = false

	if (saveError) {
		error.value = 'Не вдалося зберегти самопочуття. Спробуйте ще раз.'
		return
	}

	await loadWellbeing(id)
	cacheDashboardSnapshot(id)
	notice.value = `${wellbeingPeriods.find((item) => item.key === period)?.label}: обрано «${option.label}».`
}

async function saveTargets(payload: { targets: DailyTargets; preset: TargetPreset }) {
	const id = userId.value
	if (!id || targetPending.value) return

	targetPending.value = true
	error.value = ''
	notice.value = ''
	const { error: saveError } = await supabase.from('profiles').upsert({
		id,
		daily_targets: payload.targets,
		plan_preset: payload.preset,
	})
	targetPending.value = false
	if (saveError) {
		error.value = 'Не удалось сохранить цель. Попробуй ещё раз.'
		return
	}

	targets.value = { ...payload.targets }
	targetPreset.value = payload.preset
	cacheDashboardSnapshot(id)
	notice.value = 'Дневные цели сохранены.'
}

async function refreshDay(id: string) {
	const loadError = await loadDayEntries(id)
	if (loadError) error.value = loadError
	else cacheDashboardSnapshot(id)
}

function scaleVitamins(
	vitamins: Record<string, number> | undefined,
	quantity: number,
	referenceQuantity: number
) {
	return Object.fromEntries(
		Object.entries(vitamins ?? {}).map(([name, value]) => [
			name,
			Number(value) * quantity / referenceQuantity,
		])
	)
}

function normalizeTargets(value: unknown): DailyTargets {
	if (!value || typeof value !== 'object') return { ...DEFAULT_TARGETS }
	const candidate = value as Partial<DailyTargets>
	return Object.fromEntries(
		Object.entries(DEFAULT_TARGETS).map(([key, defaultValue]) => {
			const amount = Number(candidate[key as keyof DailyTargets])
			return [key, Number.isFinite(amount) && amount > 0 ? amount : defaultValue]
		})
	) as DailyTargets
}

function isTargetPreset(value: string): value is TargetPreset {
	return ['light', 'balanced', 'active', 'custom'].includes(value)
}

function progress(value: number, target: number) {
	return getProgressPercent(value, target)
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

function formatVolume(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value)
}

function drinkKindLabel(kind: string) {
	return { water: 'Вода', coffee: 'Кава', tea: 'Чай', other: 'Напій' }[kind] ?? 'Напій'
}

function unitLabel(unit: 'g' | 'ml' | 'piece' | undefined) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[unit ?? 'g']
}

const seedProducts = [
	{ name: 'Банан', quantity: 100, chars: { calories: 89, proteins: 1.1, fats: 0.3, carbs: 22.8, vitamins: {}, unit: 'g', estimate: true } },
	{ name: 'Гречка варёная', quantity: 100, chars: { calories: 110, proteins: 3.6, fats: 1.1, carbs: 21.3, vitamins: {}, unit: 'g', estimate: true } },
	{ name: 'Йогурт натуральный', quantity: 100, chars: { calories: 63, proteins: 5.3, fats: 1.6, carbs: 7, vitamins: {}, unit: 'g', estimate: true } },
	{ name: 'Куриная грудка', quantity: 100, chars: { calories: 165, proteins: 31, fats: 3.6, carbs: 0, vitamins: {}, unit: 'g', estimate: true } },
	{ name: 'Овсяная каша на воде', quantity: 100, chars: { calories: 71, proteins: 2.5, fats: 1.5, carbs: 12, vitamins: {}, unit: 'g', estimate: true } },
	{ name: 'Яблоко', quantity: 100, chars: { calories: 52, proteins: 0.3, fats: 0.2, carbs: 13.8, vitamins: {}, unit: 'g', estimate: true } },
]
</script>
