<template>
	<main class="pb-12 pt-6 sm:pt-8">
		<header class="mb-6 flex items-end justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-muted-foreground">
					Записи за всі дати
				</p>
				<h1 class="mt-1 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
					Журнал
				</h1>
			</div>
			<Button
				v-if="userId"
				type="button"
				variant="outline"
				class="h-12 w-12 shrink-0 rounded-full px-0"
				:disabled="refreshing"
				:aria-label="refreshing ? 'Оновлення журналу' : 'Оновити журнал'"
				:title="refreshing ? 'Оновлення журналу' : 'Оновити журнал'"
				@click="refreshHistory"
			>
				<span :class="{ 'animate-spin': refreshing }" aria-hidden="true"
					>↻</span
				>
			</Button>
		</header>

		<Dialog v-model:open="editDialogOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Виправити запис</DialogTitle>
					<DialogDescription>
						Змініть кількість — показники їжі перерахуються за карткою
						продукту.
					</DialogDescription>
				</DialogHeader>
				<form v-if="editingEntry" class="space-y-4" @submit.prevent="saveEntry">
					<p class="font-semibold">{{ editingEntry.title }}</p>
					<label class="block space-y-1.5 text-sm font-medium">
						<span>{{
							editingEntry.kind === 'food'
								? `Кількість, ${editingEntry.unit}`
								: 'Об’єм, мл'
						}}</span>
						<Input
							v-if="editingEntry.kind === 'food'"
							v-model="editQuantity"
							type="number"
							min="0.1"
							step="any"
							required
						/>
						<Input
							v-else
							v-model="editVolume"
							type="number"
							min="1"
							step="1"
							required
						/>
					</label>
					<p v-if="editError" role="alert" class="text-sm text-destructive">
						{{ editError }}
					</p>
					<Button type="submit" :disabled="entryPending">
						{{ entryPending ? 'Зберігаю…' : 'Зберегти зміни' }}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
		<ProductInfoDialog
			:open="productInfoOpen"
			:product="selectedFoodEntry?.product ?? null"
			:logged="selectedFoodEntry?.logged ?? null"
			@update:open="productInfoOpen = $event"
			@saved="updateProductInfo"
		/>
		<DrinkIrritantDialog
			:open="drinkInfoOpen"
			:drink="selectedDrinkTypeInfo"
			:editable="true"
			:pending="entryPending"
			:request-error="error"
			@update:open="drinkInfoOpen = $event"
			@save="saveDrinkIrritant"
		/>

		<section
			v-if="loading"
			role="status"
			class="rounded-3xl border border-border/80 bg-card p-8 text-sm text-muted-foreground"
		>
			Завантажуємо журнал...
		</section>

		<section
			v-else-if="!userId"
			class="relative space-y-5 overflow-hidden"
			aria-label="Представлення журналу для гостя"
		>
			<article
				v-for="day in guestPreviewDays"
				:key="day.date"
				class="overflow-hidden rounded-3xl border border-border/80 bg-card"
			>
				<header
					class="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6"
				>
					<div>
						<p class="text-xs font-medium text-muted-foreground">
							{{ day.relativeLabel }}
						</p>
						<h2 class="mt-0.5 text-lg font-bold">{{ day.label }}</h2>
					</div>
					<span
						class="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
						>Приклад</span
					>
				</header>
				<div class="grid md:grid-cols-[minmax(0,1fr)_18rem] overflow-x-auto">
					<ul class="divide-y divide-border/70">
						<li
							v-for="entry in day.entries"
							:key="entry.title"
							class="flex items-center gap-3 px-5 py-4 sm:px-6"
						>
							<span
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold"
								>{{ entry.icon }}</span
							>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{{ entry.title }}</p>
								<p class="mt-0.5 text-sm text-muted-foreground">
									<time>{{ entry.time }}</time>
									<span aria-hidden="true"> · </span>{{ entry.detail }}
								</p>
							</div>
						</li>
					</ul>
					<div
						class="border-t border-border/70 p-5 md:border-t-0 md:border-l md:p-6"
					>
						<p class="text-sm font-bold">Самопочуття</p>
						<div class="mt-3 space-y-2">
							<div
								v-for="mood in day.moods"
								:key="mood.label"
								class="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2.5"
							>
								<span class="text-sm text-muted-foreground">{{
									mood.period
								}}</span>
								<span class="flex items-center gap-2 text-sm">
									{{ mood.emoji }} {{ mood.label }}
									<time
										v-if="mood.time"
										class="text-xs text-muted-foreground"
										>{{ mood.time }}</time
									>
								</span>
							</div>
						</div>
					</div>
				</div>
			</article>

			<div
				class="pointer-events-none absolute inset-0 rounded-[1.75rem] backdrop-blur-[8px]"
				aria-hidden="true"
			/>
			<div class="absolute inset-0 z-10 flex items-center justify-center px-5">
				<div
					class="max-w-sm rounded-2xl border border-white/30 bg-[#20342C]/95 p-5 text-center text-primary-foreground shadow-2xl"
				>
					<p class="text-lg font-bold">Це вигляд вашого журналу</p>
					<p class="mt-2 text-sm leading-6 text-white/75">
						Увійдіть, щоб побачити реальні записи та позначки за датами.
					</p>
					<NuxtLink
						to="/signin"
						class="mt-4 inline-flex min-h-11 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
					>
						<Button
							as="span"
							class="h-11 rounded-full bg-secondary px-5 text-secondary-foreground hover:bg-secondary"
							>Увійти до журналу</Button
						>
					</NuxtLink>
				</div>
			</div>
		</section>

		<section v-else class="space-y-5">
			<div
				v-if="error"
				role="alert"
				class="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
			>
				{{ error }}
			</div>

			<div
				v-if="!days.length"
				class="rounded-[1.5rem] border border-border/80 bg-card px-6 py-12 text-center"
			>
				<p class="text-lg font-bold">Записів ще немає</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Перша позначка або запис їжі з’явиться тут.
				</p>
				<NuxtLink
					to="/"
					class="mt-5 inline-flex min-h-11 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					<Button as="span" class="h-11 rounded-full px-5">Додати сьогодні</Button>
				</NuxtLink>
			</div>

			<article
				v-for="day in days"
				:key="day.date"
				class="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card"
			>
				<button
					type="button"
					class="flex min-h-11 w-full items-center justify-between gap-4 border-b border-border/70 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-6"
					:aria-expanded="expandedDates.has(day.date)"
					:aria-controls="`history-day-${day.date}`"
					@click="toggleDay(day.date)"
				>
					<div>
						<p class="text-xs font-medium text-muted-foreground">
							{{ day.relativeLabel }}
						</p>
						<h2 class="mt-0.5 text-lg font-bold">{{ day.label }}</h2>
					</div>
					<span class="flex shrink-0 items-center gap-3">
						<span
							class="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
						>
							{{ day.entries.length }}
							{{ day.entries.length === 1 ? 'запис' : 'записи' }}
						</span>
						<span
							class="text-sm text-muted-foreground transition-transform"
							:class="{ 'rotate-180': expandedDates.has(day.date) }"
							aria-hidden="true"
							>⌄</span
						>
					</span>
				</button>

				<div
					v-if="expandedDates.has(day.date)"
					:id="`history-day-${day.date}`"
					class="grid md:grid-cols-[minmax(0,1fr)_18rem] overflow-x-auto"
				>
					<ul v-if="day.entries.length" class="divide-y divide-border/70">
						<li
							v-for="entry in day.entries"
							:key="entry.id"
							class="flex items-center gap-3 px-5 py-4 sm:px-6"
						>
							<button
								v-if="entry.kind === 'food' && entry.product"
								type="button"
								class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
								:aria-label="
									entry.product.irritant_ingredient
										? `У продукті ${entry.title} позначено можливий подразник ${entry.product.irritant_ingredient}. Відкрити пояснення.`
										: `Довідка про продукт ${entry.title}`
								"
								@click="openProductInfo(entry)"
							>
								<span
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF1DC] text-sm font-bold text-[#5D6B35]"
									aria-hidden="true"
									>Ї</span
								>
								<span class="min-w-0 flex-1">
									<span class="block truncate font-semibold">{{
										entry.title
									}}</span>
									<span
										v-if="entry.product.irritant_ingredient"
										class="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950"
									>
										<span aria-hidden="true">!</span>
										Можливий подразник:
										{{ entry.product.irritant_ingredient }}
									</span>
									<span
										class="mt-0.5 block truncate text-sm text-muted-foreground"
										>{{ entry.detail }} · {{ entry.amount }}</span
									>
								</span>
							</button>
							<div v-else class="flex min-w-0 flex-1 items-center gap-3">
								<span
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F2F4] text-sm font-bold text-[#2F6F7A]"
									aria-hidden="true"
									>Н</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate font-semibold">{{ entry.title }}</p>
									<span
										v-if="entry.drinkType?.irritant_ingredient"
										class="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950"
									>
										<span aria-hidden="true">!</span>
										Можливий подразник:
										{{ entry.drinkType.irritant_ingredient }}
									</span>
									<p class="mt-0.5 truncate text-sm text-muted-foreground">
										{{ entry.detail }} · {{ entry.amount }}
									</p>
								</div>
							</div>
							<div class="shrink-0 text-right">
								<p class="text-sm font-bold">
									<time :datetime="entry.createdAt">{{
										formatLocalTime(entry.createdAt)
									}}</time>
								</p>
								<div class="mt-1 flex justify-end gap-3">
									<button
										v-if="
											entry.kind === 'drink'
											&& isMarkableDrinkKind(entry.drinkKind ?? '')
										"
										type="button"
										class="min-h-11 rounded-sm px-2 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										:disabled="entryPending"
										:aria-label="
											entry.drinkType?.irritant_ingredient
												? `Редагувати помітку для напою ${entry.title}`
												: `Додати помітку для напою ${entry.title}`
										"
										@click="openDrinkEditor(entry)"
									>
										Помітка
									</button>
									<button
										v-if="entry.editable"
										type="button"
										class="min-h-11 rounded-sm px-2 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										:disabled="entryPending"
										@click="openEdit(entry)"
									>
										Виправити
									</button>
									<button
										type="button"
										class="min-h-11 rounded-sm px-2 text-xs font-semibold text-destructive underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										:disabled="entryPending"
										@click="deleteEntry(entry)"
									>
										Видалити
									</button>
								</div>
							</div>
						</li>
					</ul>
					<div v-else class="px-5 py-7 text-sm text-muted-foreground sm:px-6">
						Записів їжі або води немає.
					</div>

					<div
						class="border-t border-border/70 p-5 md:border-t-0 md:border-l md:p-6"
					>
						<p class="text-sm font-bold">Самопочуття</p>
						<div class="mt-3 space-y-2">
							<div
								v-for="period in moodPeriods"
								:key="period.key"
								class="flex items-center justify-between rounded-xl border px-3 py-2.5"
								:class="
									day.moods[period.key]
										? 'border-border/80 bg-white'
										: 'border-dashed border-border/80 bg-muted/40'
								"
							>
								<span class="text-sm text-muted-foreground">
									{{ period.label }}
								</span>
								<span
									v-if="day.moods[period.key]"
									class="flex items-center gap-2 text-sm font-bold"
								>
									<span class="text-lg">{{
										day.moods[period.key]!.emoji
									}}</span>
									{{ day.moods[period.key]!.label }}
								</span>
								<span v-else class="text-xs text-muted-foreground"
									>Не позначено</span
								>
							</div>
						</div>
					</div>
				</div>
			</article>
		</section>
	</main>
</template>

<script setup lang="ts">
useSeoMeta({
	title: 'Журнал',
	description: 'Переглядайте записи їжі, води та самопочуття в журналі Vitamin.',
	robots: 'noindex,follow',
})
import { computed, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import { formatLocalTime } from '~/src/shared/date'
import { scaleNutrition } from '~/src/features/dashboard/targets'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import ProductInfoDialog from '~/src/features/dashboard/ProductInfoDialog.vue'
import DrinkIrritantDialog from '~/src/features/dashboard/DrinkIrritantDialog.vue'
import type {
	FoodProductInfo,
	LoggedFoodInfo,
} from '~/src/features/dashboard/foodProduct'
import {
	isMarkableDrinkKind,
	normalizeDrinkTypeName,
} from '~/src/features/dashboard/drinkType'
import type {
	DrinkKind,
	DrinkTypeDetails,
	DrinkTypeProfile,
} from '~/src/features/dashboard/drinkType'
import type { ProductIrritant } from '~/src/entities/product/irritant'

type PeriodKey = 'morning' | 'day' | 'evening'

interface FoodLog {
	id: string
	product_id: string | null
	quantity: number
	calories: number
	proteins: number
	fats: number
	carbs: number
	vitamins: Record<string, number> | null
	date: string
	created_at: string
	products: FoodProductInfo | null
}

interface HistoryEntry {
	id: string
	kind: 'food' | 'drink'
	title: string
	detail: string
	amount: string
	createdAt: string
	editable: boolean
	unit?: string
	quantity?: number
	volumeMl?: number
	product?: FoodProductInfo | null
	drinkKind?: string
	drinkTypeId?: string | null
	drinkName?: string | null
	drinkType?: DrinkTypeProfile | null
	logged?: LoggedFoodInfo | null
}

interface MoodValue {
	period: PeriodKey
	mood: number
	label: string
}

interface MoodEntry {
	id: string
	value: MoodValue
	recorded_at: string
}

interface DrinkLog {
	id: string
	kind: DrinkKind
	volume_ml: number
	recorded_at: string
	entry_date: string | null
	drink_type_id: string | null
	drink_name: string | null
	drink_type: DrinkTypeProfile | null
}

interface HistorySnapshot {
	cachedAt: number
	foodLogs: FoodLog[]
	drinkLogs: DrinkLog[]
	moodEntries: MoodEntry[]
}

interface HistoryDay {
	date: string
	label: string
	relativeLabel: string
	entries: HistoryEntry[]
	moods: Partial<
		Record<PeriodKey, { emoji: string; label: string; recordedAt: string }>
	>
}

const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userId = computed(() => user.value?.id ?? null)
const loading = shallowRef(true)
const refreshing = shallowRef(false)
const error = shallowRef('')
const entryPending = shallowRef(false)
const editDialogOpen = shallowRef(false)
const productInfoOpen = shallowRef(false)
const drinkInfoOpen = shallowRef(false)
const editingEntry = shallowRef<HistoryEntry | null>(null)
const selectedFoodEntry = shallowRef<HistoryEntry | null>(null)
const selectedDrinkEntry = shallowRef<HistoryEntry | null>(null)
const selectedDrinkTypeInfo = shallowRef<(DrinkTypeDetails & { id?: string }) | null>(null)
const editQuantity = shallowRef<number | ''>('')
const editVolume = shallowRef<number | ''>('')
const editError = shallowRef('')
const foodLogs = shallowRef<FoodLog[]>([])
const drinkLogs = shallowRef<DrinkLog[]>([])
const moodEntries = shallowRef<MoodEntry[]>([])
const expandedDates = shallowRef<Set<string>>(new Set())
let historyLoadGeneration = 0
const historyCache = useState<Record<string, HistorySnapshot>>(
	'history-cache',
	() => ({}),
)
const dashboardCache = useState<Record<string, unknown>>(
	'dashboard-cache',
	() => ({}),
)

const moodPeriods: Array<{ key: PeriodKey; label: string }> = [
	{ key: 'morning', label: 'Ранок' },
	{ key: 'day', label: 'День' },
	{ key: 'evening', label: 'Вечір' },
]

const moodEmojis: Record<number, string> = {
	1: '😞',
	2: '😕',
	3: '😐',
	4: '🙂',
	5: '😄',
}

const guestPreviewDays = [
	{
		date: '2026-11-21',
		relativeLabel: 'Сьогодні',
		label: 'пʼятниця, 21 листопада',
		entries: [
			{
				icon: 'Ї',
				title: 'Вівсянка та банан',
				detail: 'Приклад запису їжі',
				amount: '320 ккал',
				time: '08:15',
			},
			{
				icon: 'Н',
				title: 'Вода',
				detail: 'Приклад запису напою',
				amount: '300 мл',
				time: '09:40',
			},
		],
		moods: [
			{ period: 'Ранок', emoji: '🙂', label: 'Добре', time: '08:20' },
			{ period: 'День', emoji: '😐', label: 'Звичайно', time: '13:10' },
			{ period: 'Вечір', emoji: '', label: 'Не позначено', time: '' },
		],
	},
] as const

const days = computed<HistoryDay[]>(() => {
	const grouped = new Map<string, HistoryEntry[]>()

	for (const log of foodLogs.value) {
		const date = String(log.date)
		const entries = grouped.get(date) ?? []
		const quantity = formatNumber(Number(log.quantity))
		const unit =
			log.products?.chars?.unit === 'ml'
				? 'мл'
				: log.products?.chars?.unit === 'piece'
					? 'шт.'
					: 'г'
		const nutritionKnown = log.products?.chars?.nutritionKnown !== false
		entries.push({
			id: log.id,
			kind: 'food',
			title: log.products?.name ?? 'Продукт',
			detail: nutritionKnown
				? `${quantity} ${unit} · ${formatNumber(Number(log.proteins))} г білка`
				: `${quantity} ${unit} · Харчова цінність не вказана`,
			amount: nutritionKnown
				? `${formatNumber(Number(log.calories))} ккал`
				: 'Склад не вказано',
			createdAt: log.created_at,
			editable: Boolean(log.product_id && log.products),
			unit,
			quantity: Number(log.quantity),
			product: log.products,
			logged: {
				quantity: Number(log.quantity),
				nutrition: {
					calories: Number(log.calories),
					proteins: Number(log.proteins),
					fats: Number(log.fats),
					carbs: Number(log.carbs),
				},
			},
		})
		grouped.set(date, entries)
	}

	for (const drink of drinkLogs.value) {
		const date = drink.entry_date ?? localDateFromTimestamp(drink.recorded_at)
		if (!date) continue
		const entries = grouped.get(date) ?? []
		entries.push({
			id: drink.id,
			kind: 'drink',
			title: drink.drink_name ?? drinkKindLabel(drink.kind),
			detail: `${formatVolume(Number(drink.volume_ml))} мл`,
			amount: `${formatVolume(Number(drink.volume_ml))} мл`,
			createdAt: drink.recorded_at,
			editable: true,
			volumeMl: Number(drink.volume_ml),
			drinkKind: drink.kind,
			drinkTypeId: drink.drink_type_id,
			drinkName: drink.drink_name,
			drinkType: drink.drink_type,
		})
		grouped.set(date, entries)
	}

	const moodGrouped = new Map<
		string,
		Partial<
			Record<PeriodKey, { emoji: string; label: string; recordedAt: string }>
		>
	>()
	for (const entry of moodEntries.value) {
		const value = entry.value as MoodValue
		const date = localDateFromTimestamp(entry.recorded_at)
		if (!date || !value?.period) continue
		const moods = moodGrouped.get(date) ?? {}
		moods[value.period] = {
			emoji: moodEmojis[value.mood] ?? '😐',
			label: value.label,
			recordedAt: entry.recorded_at,
		}
		moodGrouped.set(date, moods)
	}

	const dates = new Set([...grouped.keys(), ...moodGrouped.keys()])

	return [...dates]
		.sort((a, b) => b.localeCompare(a))
		.map((date) => ({
			date,
			label: formatDayLabel(date),
			relativeLabel: relativeDayLabel(date),
			entries: (grouped.get(date) ?? []).sort((a, b) =>
				b.createdAt.localeCompare(a.createdAt),
			),
			moods: moodGrouped.get(date) ?? {},
		}))
})

watch(
	userId,
	async (id) => {
		historyLoadGeneration++
		loading.value = true
		refreshing.value = false
		error.value = ''
		expandedDates.value = new Set()
		clearHistoryRecords()
		editDialogOpen.value = false
		editingEntry.value = null
		editQuantity.value = ''
		editVolume.value = ''
		editError.value = ''
		drinkInfoOpen.value = false
		selectedDrinkEntry.value = null
		selectedDrinkTypeInfo.value = null
		if (!id) {
			loading.value = false
			return
		}
		await loadHistory(id)
	},
	{ immediate: true },
)

async function loadHistory(id: string, force = false) {
	if (userId.value !== id) return
	historyLoadGeneration++
	const loadGeneration = historyLoadGeneration

	const cached = historyCache.value[id]
	if (!force && cached && Date.now() - cached.cachedAt < HISTORY_CACHE_TTL_MS) {
		if (userId.value !== id || historyLoadGeneration !== loadGeneration) return
		restoreHistorySnapshot(cached)
		loading.value = false
		return
	}

	if (force) refreshing.value = true
	else loading.value = true
	error.value = ''

	const [foods, drinks, moods] = await Promise.all([
		supabase
			.from('logs')
			.select(
				'id, product_id, date, quantity, calories, proteins, fats, carbs, vitamins, created_at, products(id, name, quantity, chars, irritant_ingredient, irritant_reason)',
			)
			.eq('user_id', id)
			.order('date', { ascending: false }),
		supabase
			.from('drinks')
			.select('id, kind, volume_ml, recorded_at, entry_date, drink_type_id, drink_name, drink_type:user_drink_types(id, kind, name, irritant_ingredient, irritant_reason)')
			.eq('user_id', id)
			.order('recorded_at', { ascending: false }),
		supabase
			.from('wellbeing_entries')
			.select('id, kind, value, recorded_at')
			.eq('user_id', id)
			.eq('kind', 'mood')
			.order('recorded_at', { ascending: false }),
	])

	if (userId.value !== id || historyLoadGeneration !== loadGeneration) return

	if (foods.error || drinks.error || moods.error) {
		error.value = 'Не вдалося завантажити журнал. Спробуйте оновити сторінку.'
		clearHistoryRecords()
		loading.value = false
		refreshing.value = false
		return
	}

	foodLogs.value = foods.data ?? []
	drinkLogs.value = (drinks.data ?? []).map((drink) => ({
		...drink,
		entry_date: drink.entry_date ?? null,
	}))
	moodEntries.value = moods.data ?? []
	historyCache.value = {
		...historyCache.value,
		[id]: {
			cachedAt: Date.now(),
			foodLogs: [...foodLogs.value],
			drinkLogs: [...drinkLogs.value],
			moodEntries: [...moodEntries.value],
		},
	}
	loading.value = false
	refreshing.value = false
}

function clearHistoryRecords() {
	foodLogs.value = []
	drinkLogs.value = []
	moodEntries.value = []
}

function restoreHistorySnapshot(snapshot: HistorySnapshot) {
	foodLogs.value = snapshot.foodLogs
	drinkLogs.value = snapshot.drinkLogs
	moodEntries.value = snapshot.moodEntries
}

function refreshHistory() {
	const id = userId.value
	if (!id || refreshing.value) return
	void loadHistory(id, true)
}

function toggleDay(date: string) {
	const next = new Set(expandedDates.value)
	if (next.has(date)) next.delete(date)
	else next.add(date)
	expandedDates.value = next
}

function openEdit(entry: HistoryEntry) {
	editingEntry.value = entry
	editQuantity.value = entry.quantity ?? ''
	editVolume.value = entry.volumeMl ?? ''
	editError.value = ''
	editDialogOpen.value = true
}

function openProductInfo(entry: HistoryEntry) {
	if (entry.kind !== 'food' || !entry.product) return
	selectedFoodEntry.value = entry
	productInfoOpen.value = true
}

function openDrinkEditor(entry: HistoryEntry) {
	const kind = entry.drinkKind
	if (entry.kind !== 'drink' || !kind || !isMarkableDrinkKind(kind)) return
	error.value = ''
	selectedDrinkEntry.value = entry
	selectedDrinkTypeInfo.value = entry.drinkType ?? {
		kind,
		name: entry.drinkName ?? drinkKindLabel(kind),
		irritant_ingredient: null,
		irritant_reason: null,
	}
	drinkInfoOpen.value = true
}

async function saveDrinkIrritant(annotation: ProductIrritant | null) {
	const id = userId.value
	const entry = selectedDrinkEntry.value
	const kind = entry?.drinkKind
	if (
		!id
		|| !entry
		|| !kind
		|| !isMarkableDrinkKind(kind)
		|| entryPending.value
	) {
		return
	}

	if (
		!annotation
		&& !entry.drinkTypeId
		&& !selectedDrinkTypeInfo.value?.id
	) {
		drinkInfoOpen.value = false
		selectedDrinkEntry.value = null
		selectedDrinkTypeInfo.value = null
		return
	}

	entryPending.value = true
	error.value = ''
	let savedType: DrinkTypeProfile
	const drinkName = entry.drinkName?.trim() || null
	const committedTypeId = entry.drinkTypeId ?? selectedDrinkTypeInfo.value?.id
	if (committedTypeId) {
		const { data, error: updateError } = await supabase
			.from('user_drink_types')
			.update({
				irritant_ingredient: annotation?.ingredient ?? null,
				irritant_reason: annotation?.reason ?? null,
			})
			.eq('id', committedTypeId)
			.eq('user_id', id)
			.eq('kind', kind)
			.select('id, kind, name, irritant_ingredient, irritant_reason')
			.maybeSingle()
		if (updateError || !data) {
			entryPending.value = false
			error.value = 'Не вдалося зберегти помітку для напою.'
			return
		}
		savedType = data as DrinkTypeProfile
	} else {
		const normalizedName = normalizeDrinkTypeName(
			drinkName ?? drinkKindLabel(kind),
		)
		const { data: existingType, error: lookupError } = await supabase
			.from('user_drink_types')
			.select('id, kind, name, irritant_ingredient, irritant_reason')
			.eq('user_id', id)
			.eq('name_key', normalizedName.nameKey)
			.maybeSingle()
		if (lookupError) {
			entryPending.value = false
			error.value = 'Не вдалося перевірити збережені види напоїв.'
			return
		}
		if (existingType && existingType.kind !== kind) {
			entryPending.value = false
			error.value = 'Такий вид уже збережено в іншій категорії напоїв.'
			return
		}

		if (existingType) {
			const { data, error: updateError } = await supabase
				.from('user_drink_types')
				.update({
					irritant_ingredient: annotation?.ingredient ?? null,
					irritant_reason: annotation?.reason ?? null,
				})
				.eq('id', existingType.id)
				.eq('user_id', id)
				.select('id, kind, name, irritant_ingredient, irritant_reason')
				.maybeSingle()
			if (updateError || !data) {
				entryPending.value = false
				error.value = 'Не вдалося зберегти помітку для напою.'
				return
			}
			savedType = data as DrinkTypeProfile
		} else {
			const { data, error: insertError } = await supabase
				.from('user_drink_types')
				.insert({
					user_id: id,
					kind,
					name: normalizedName.name,
					irritant_ingredient: annotation?.ingredient ?? null,
					irritant_reason: annotation?.reason ?? null,
				})
				.select('id, kind, name, irritant_ingredient, irritant_reason')
				.single()
			if (insertError || !data) {
				entryPending.value = false
				error.value = 'Не вдалося зберегти вид напою. Спробуйте ще раз.'
				return
			}
			savedType = data as DrinkTypeProfile
		}
	}

	if (!entry.drinkTypeId) {
		selectedDrinkEntry.value = { ...entry, drinkType: savedType }
		selectedDrinkTypeInfo.value = savedType

		let unlinkedDrinks = supabase
			.from('drinks')
			.update({ drink_type_id: savedType.id, drink_name: savedType.name })
			.eq('user_id', id)
			.eq('kind', kind)
			.is('drink_type_id', null)
		if (drinkName) {
			unlinkedDrinks = unlinkedDrinks.eq('drink_name', drinkName)
		} else {
			unlinkedDrinks = unlinkedDrinks.is('drink_name', null)
		}
		const { error: linkError } = await unlinkedDrinks
		if (linkError) {
			invalidateDashboardCache(id)
			entryPending.value = false
			error.value =
				'Помітку збережено, але записи напою не вдалося пов’язати з нею. Спробуйте ще раз.'
			return
		}
	}

	entryPending.value = false
	drinkInfoOpen.value = false
	selectedDrinkEntry.value = null
	selectedDrinkTypeInfo.value = null
	invalidateDashboardCache(id)
	if (userId.value !== id) return
	await loadHistory(id, true)
	if (userId.value !== id) return
	toast.success(
		annotation ? 'Помітку напою збережено.' : 'Помітку напою видалено.',
	)
}

function updateProductInfo(updatedProduct: FoodProductInfo) {
	foodLogs.value = foodLogs.value.map((log) =>
		log.products?.id === updatedProduct.id
			? {
					...log,
					...scaleNutrition(
						updatedProduct.chars,
						Number(log.quantity),
						updatedProduct.quantity,
					),
					products: updatedProduct,
				}
			: log,
	)
	if (selectedFoodEntry.value?.product?.id === updatedProduct.id) {
		const selected = selectedFoodEntry.value
		selectedFoodEntry.value = {
			...selected,
			product: updatedProduct,
			logged: selected.logged
				? {
						...selected.logged,
						nutrition: scaleNutrition(
							updatedProduct.chars,
							selected.logged.quantity,
							updatedProduct.quantity,
						),
					}
				: null,
		}
	}
	const id = userId.value
	if (id) invalidateDashboardCache(id)
}

async function saveEntry() {
	const entry = editingEntry.value
	const id = userId.value
	if (!entry || !id || entryPending.value) return

	entryPending.value = true
	editError.value = ''
	let saveError: { message: string } | null = null

	if (entry.kind === 'food') {
		const quantity = Number(editQuantity.value)
		const product = entry.product
		if (!product || !Number.isFinite(quantity) || quantity <= 0) {
			editError.value = 'Кількість має бути більшою за нуль.'
			entryPending.value = false
			return
		}
		const nutrition = scaleNutrition(
			product.chars,
			quantity,
			Number(product.quantity),
		)
		const vitamins = Object.fromEntries(
			Object.entries(product.chars.vitamins ?? {}).map(([name, value]) => [
				name,
				(Number(value) * quantity) / Number(product.quantity),
			]),
		)
		const result = await supabase
			.from('logs')
			.update({ quantity, ...nutrition, vitamins })
			.eq('id', entry.id)
			.eq('user_id', id)
		saveError = result.error
	} else {
		const volume = Number(editVolume.value)
		if (!Number.isFinite(volume) || volume <= 0) {
			editError.value = 'Об’єм має бути більшим за нуль.'
			entryPending.value = false
			return
		}
		const result = await supabase
			.from('drinks')
			.update({ volume_ml: volume })
			.eq('id', entry.id)
			.eq('user_id', id)
		saveError = result.error
	}

	entryPending.value = false
	if (saveError) {
		if (userId.value === id) {
			editError.value = 'Не вдалося зберегти зміни. Спробуйте ще раз.'
		}
		return
	}

	invalidateDashboardCache(id)
	if (userId.value !== id) return

	editDialogOpen.value = false
	editingEntry.value = null
	await loadHistory(id, true)
	if (userId.value !== id) return
	toast.success('Запис оновлено.')
}

async function deleteEntry(entry: HistoryEntry) {
	const id = userId.value
	if (!id || entryPending.value) return
	if (
		!window.confirm(
			`Видалити запис «${entry.title}»? Цю дію не можна скасувати.`,
		)
	)
		return

	entryPending.value = true
	error.value = ''
	const table = entry.kind === 'food' ? 'logs' : 'drinks'
	const { error: deleteError } = await supabase
		.from(table)
		.delete()
		.eq('id', entry.id)
		.eq('user_id', id)
	entryPending.value = false

	if (deleteError) {
		if (userId.value === id) {
			error.value = 'Не вдалося видалити запис. Спробуйте ще раз.'
		}
		return
	}

	invalidateDashboardCache(id)
	if (userId.value !== id) return

	await loadHistory(id, true)
	if (userId.value !== id) return
	toast.success('Запис видалено.')
}

function invalidateDashboardCache(id: string) {
	for (const key of Object.keys(dashboardCache.value)) {
		if (key.startsWith(`${id}:`)) delete dashboardCache.value[key]
	}
	delete historyCache.value[id]
}

function localDateFromTimestamp(timestamp: string) {
	if (!timestamp) return null
	const date = new Date(timestamp)
	if (Number.isNaN(date.getTime())) return null
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Kyiv',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date)
	const values = Object.fromEntries(
		parts.map((part) => [part.type, part.value]),
	)
	return `${values.year}-${values.month}-${values.day}`
}

function formatDayLabel(date: string) {
	return new Intl.DateTimeFormat('uk-UA', {
		timeZone: 'Europe/Kyiv',
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(new Date(`${date}T12:00:00+02:00`))
}

function relativeDayLabel(date: string) {
	const today = localDateFromTimestamp(new Date().toISOString())
	if (date === today) return 'Сьогодні'
	if (!today) return ''
	const todayDate = new Date(`${today}T12:00:00+02:00`)
	const targetDate = new Date(`${date}T12:00:00+02:00`)
	const difference = Math.round(
		(todayDate.getTime() - targetDate.getTime()) / 86400000,
	)
	return difference === 1 ? 'Вчора' : ''
}

function drinkKindLabel(kind: string) {
	return (
		{ water: 'Вода', coffee: 'Кава', tea: 'Чай', other: 'Напій' }[kind] ??
		'Напій'
	)
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(
		value,
	)
}

function formatVolume(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(
		value,
	)
}
</script>
