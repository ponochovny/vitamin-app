<template>
	<main class="mx-auto max-w-4xl space-y-5 px-2 pb-10 sm:px-0">
		<section class="rounded-2xl border bg-card p-4 sm:p-6">
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-3xl leading-none text-primary-foreground shadow-sm"
					:aria-haspopup="userId ? 'dialog' : undefined"
					aria-label="Добавить еду или напиток"
					@click="openQuickLog"
				>
					+
				</button>
				<div class="min-w-0 flex-1">
					<p class="text-sm text-muted-foreground">{{ todayLabel }}</p>
					<h1 class="text-2xl font-bold">Мой дневник</h1>
				</div>
				<Button
					type="button"
					variant="outline"
					:aria-haspopup="userId ? 'dialog' : undefined"
					@click="openTargets"
				>
					Мои цели
				</Button>
			</div>
		</section>

		<Dialog v-model:open="quickLogOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Добавить запись</DialogTitle>
					<DialogDescription>Выбери еду или напиток для дневника.</DialogDescription>
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
					<DialogTitle>Мои цели</DialogTitle>
					<DialogDescription>Выбери готовый пресет или задай значения вручную.</DialogDescription>
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

		<p v-if="error" role="alert" class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
			{{ error }}
		</p>
		<p v-if="notice" role="status" class="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800">
			{{ notice }}
		</p>

		<section v-if="loading" role="status" class="rounded-xl border bg-card p-6">
			Загружаю дневник...
		</section>

		<section v-else-if="!userId" class="rounded-xl border bg-card p-6 text-center">
			<h2 class="text-lg font-semibold">Войди, чтобы вести дневник</h2>
			<p class="mt-1 text-sm text-muted-foreground">Записи и цели сохраняются в твоём аккаунте.</p>
			<NuxtLink to="/signin" class="mt-4 inline-block">
				<Button>Войти</Button>
			</NuxtLink>
		</section>

		<template v-else>
			<section class="grid gap-3 sm:grid-cols-2" aria-label="Прогресс за день">
				<article class="flex items-center gap-4 rounded-2xl border bg-card p-4 sm:p-5">
					<div
						class="progress-dial"
						:style="dialStyle(nutrition.calories, targets.calories)"
						role="progressbar"
						:aria-valuenow="Math.round(progress(nutrition.calories, targets.calories))"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-label="Калории за день"
					>
						<div class="progress-dial__center">
							<strong>{{ formatNumber(nutrition.calories) }}</strong>
							<span>ккал</span>
						</div>
					</div>
					<div>
						<h2 class="font-semibold">Энергия</h2>
						<p class="text-sm text-muted-foreground">
							из {{ formatNumber(targets.calories) }} ккал
						</p>
						<p class="mt-1 text-sm">{{ balanceLabel(nutrition.calories, targets.calories, 'ккал') }}</p>
					</div>
				</article>

				<article class="flex items-center gap-4 rounded-2xl border bg-card p-4 sm:p-5">
					<div
						class="progress-dial progress-dial--blue"
						:style="dialStyle(totalBeverages, targets.beveragesMl, true)"
						role="progressbar"
						:aria-valuenow="Math.round(progress(totalBeverages, targets.beveragesMl))"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-label="Объём напитков за день"
					>
						<div class="progress-dial__center">
							<strong>{{ formatVolume(totalBeverages) }}</strong>
							<span>мл</span>
						</div>
					</div>
					<div>
						<h2 class="font-semibold">Напитки</h2>
						<p class="text-sm text-muted-foreground">
							из {{ formatVolume(targets.beveragesMl) }} мл цели
						</p>
						<p class="mt-1 text-sm">Чистая вода: {{ formatVolume(pureWater) }} мл</p>
					</div>
				</article>
			</section>

			<section class="grid grid-cols-3 gap-2" aria-label="Нутриенты за день">
				<div v-for="macro in macros" :key="macro.key" class="rounded-xl border bg-card p-3">
					<p class="text-xs text-muted-foreground">{{ macro.label }}</p>
					<p class="mt-1 font-semibold">
						{{ formatNumber(nutrition[macro.key]) }} / {{ formatNumber(targets[macro.key]) }} г
					</p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary"
							:style="{ width: `${progress(nutrition[macro.key], targets[macro.key])}%` }"
						/>
					</div>
				</div>
			</section>

			<section class="rounded-xl border bg-card p-4 sm:p-5">
				<div class="mb-3 flex items-center justify-between gap-3">
					<button
						type="button"
						class="flex w-full items-center justify-between gap-3 text-left"
						:aria-expanded="recordsOpen"
						aria-controls="diary-records"
						@click="recordsOpen = !recordsOpen"
					>
						<span>
							<span class="block text-lg font-bold">Сегодня в дневнике</span>
							<span class="block text-sm font-normal text-muted-foreground">
								{{ records.length }} записей
							</span>
						</span>
						<span class="shrink-0 text-sm text-primary">
							{{ recordsOpen ? 'Скрыть' : 'Показать' }}
						</span>
					</button>
				</div>
				<div v-show="recordsOpen" id="diary-records" class="mt-3">
					<p v-if="!records.length" class="text-sm text-muted-foreground">
						Пока пусто. Нажми «+», чтобы записать еду или напиток.
					</p>
					<ul v-else class="divide-y">
						<li
							v-for="record in records"
							:key="record.id"
							class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
						>
							<div class="min-w-0">
								<p class="truncate font-medium">{{ record.title }}</p>
								<p class="text-sm text-muted-foreground">{{ record.detail }}</p>
							</div>
							<div class="shrink-0 text-right">
								<time :datetime="record.createdAt" class="block text-xs text-muted-foreground">
									{{ formatLocalHour(record.createdAt) }}
								</time>
								<p class="text-sm">
									{{ record.kind === 'food' ? `${formatNumber(record.calories)} ккал` : `${formatVolume(record.volumeMl)} мл` }}
								</p>
							</div>
						</li>
					</ul>
				</div>
			</section>
			<p class="px-1 text-xs text-muted-foreground">
				Цели — выбранные пользователем ориентиры. Объём напитков — это сумма записанных напитков,
				а не медицинская норма или «эквивалент воды».
			</p>
		</template>
	</main>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { formatLocalHour, getLocalDate } from '~/src/shared/date'
import DailyTargetSettings from '~/src/features/dashboard/DailyTargetSettings.vue'
import QuickLogForm from '~/src/features/dashboard/QuickLogForm.vue'
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

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userId = computed(() => user.value?.id ?? null)
const loading = shallowRef(true)
const savePending = shallowRef(false)
const targetPending = shallowRef(false)
const quickLogOpen = shallowRef(false)
const targetsOpen = shallowRef(false)
const recordsOpen = shallowRef(false)
const error = shallowRef('')
const notice = shallowRef('')
const products = shallowRef<Product[]>([])
const foodLogs = shallowRef<FoodLog[]>([])
const drinkLogs = shallowRef<DrinkLog[]>([])
const targets = shallowRef<DailyTargets>({ ...DEFAULT_TARGETS })
const targetPreset = shallowRef<TargetPreset>('balanced')

const macros: Array<{ key: 'proteins' | 'fats' | 'carbs'; label: string }> = [
	{ key: 'proteins', label: 'Белки' },
	{ key: 'fats', label: 'Жиры' },
	{ key: 'carbs', label: 'Углеводы' },
]

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
const todayLabel = new Intl.DateTimeFormat('ru-RU', {
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

async function loadDashboard(id: string) {
	loading.value = true
	error.value = ''
	notice.value = ''

	const results = await Promise.all([
		loadProducts(id),
		loadDayEntries(id),
		loadTargets(id),
	])
	const failure = results.find((result) => result)
	if (failure) error.value = failure
	loading.value = false
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
	notice.value = 'Дневные цели сохранены.'
}

async function refreshDay(id: string) {
	const loadError = await loadDayEntries(id)
	if (loadError) error.value = loadError
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

function dialStyle(value: number, target: number, blue = false) {
	const amount = progress(value, target)
	const color = blue ? '#0284c7' : 'hsl(var(--primary))'
	return {
		background: `conic-gradient(${color} ${amount}%, hsl(var(--muted)) ${amount}% 100%)`,
	}
}

function balanceLabel(value: number, target: number, unit: string) {
	const difference = target - value
	return difference > 0
		? `Осталось ${formatNumber(difference)} ${unit}`
		: `Цель выполнена · +${formatNumber(Math.abs(difference))} ${unit}`
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
}

function formatVolume(value: number) {
	return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)
}

function drinkKindLabel(kind: string) {
	return { water: 'Вода', coffee: 'Кофе', tea: 'Чай', other: 'Напиток' }[kind] ?? 'Напиток'
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

<style scoped>
.progress-dial {
	display: grid;
	width: 5.75rem;
	height: 5.75rem;
	flex: 0 0 auto;
	place-items: center;
	border-radius: 9999px;
	background: conic-gradient(hsl(var(--primary)) 0%, hsl(var(--muted)) 0% 100%);
}

.progress-dial--blue {
	background: conic-gradient(#0284c7 0%, hsl(var(--muted)) 0% 100%);
}

.progress-dial__center {
	display: flex;
	width: 4.65rem;
	height: 4.65rem;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
	background: hsl(var(--card));
}

.progress-dial__center strong {
	font-size: 1rem;
	line-height: 1.2;
}

.progress-dial__center span {
	font-size: 0.7rem;
	color: hsl(var(--muted-foreground));
}
</style>
