<template>
	<main class="pb-12 pt-6 sm:pt-8">
		<header class="mb-6 flex items-end justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-muted-foreground">Записи за всі дати</p>
				<h1 class="mt-1 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Журнал</h1>
			</div>
		</header>

		<section v-if="loading" role="status" class="rounded-[1.5rem] border border-border/80 bg-card p-8 text-sm text-muted-foreground">
			Завантажуємо журнал...
		</section>

		<section v-else-if="!userId" class="relative space-y-5 overflow-hidden" aria-label="Представлення журналу для гостя">
			<article v-for="day in guestPreviewDays" :key="day.date" class="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card">
				<header class="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
					<div>
						<p class="text-xs font-medium text-muted-foreground">{{ day.relativeLabel }}</p>
						<h2 class="mt-0.5 text-lg font-bold">{{ day.label }}</h2>
					</div>
					<span class="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">Приклад</span>
				</header>
				<div class="grid md:grid-cols-[minmax(0,1fr)_18rem]">
					<ul class="divide-y divide-border/70">
						<li v-for="entry in day.entries" :key="entry.title" class="flex items-center gap-3 px-5 py-4 sm:px-6">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold">{{ entry.icon }}</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{{ entry.title }}</p>
								<p class="mt-0.5 text-sm text-muted-foreground">{{ entry.detail }}</p>
							</div>
						</li>
					</ul>
					<div class="border-t border-border/70 p-5 md:border-t-0 md:border-l md:p-6">
						<p class="text-sm font-bold">Самопочуття</p>
						<div class="mt-3 space-y-2">
							<div v-for="mood in day.moods" :key="mood.label" class="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2.5">
								<span class="text-sm text-muted-foreground">{{ mood.period }}</span>
								<span class="text-sm">{{ mood.emoji }} {{ mood.label }}</span>
							</div>
						</div>
					</div>
				</div>
			</article>

			<div class="pointer-events-none absolute inset-0 rounded-[1.75rem] backdrop-blur-[8px]" aria-hidden="true" />
			<div class="absolute inset-0 z-10 flex items-center justify-center px-5">
				<div class="max-w-sm rounded-2xl border border-white/30 bg-[#20342C]/95 p-5 text-center text-primary-foreground shadow-2xl">
					<p class="text-lg font-bold">Це вигляд вашого журналу</p>
					<p class="mt-2 text-sm leading-6 text-white/75">Увійдіть, щоб побачити реальні записи та позначки за датами.</p>
					<NuxtLink to="/signin" class="mt-4 inline-flex">
						<Button class="h-11 rounded-full bg-secondary px-5 text-secondary-foreground hover:bg-secondary">Увійти до журналу</Button>
					</NuxtLink>
				</div>
			</div>
		</section>

		<section v-else class="space-y-5">
			<div v-if="error" role="alert" class="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
				{{ error }}
			</div>

			<div v-if="!days.length" class="rounded-[1.5rem] border border-border/80 bg-card px-6 py-12 text-center">
				<p class="text-lg font-bold">Записів ще немає</p>
				<p class="mt-2 text-sm text-muted-foreground">Перша позначка або запис їжі з’явиться тут.</p>
				<NuxtLink to="/" class="mt-5 inline-block">
					<Button class="h-11 rounded-full px-5">Додати сьогодні</Button>
				</NuxtLink>
			</div>

			<article v-for="day in days" :key="day.date" class="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card">
				<header class="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
					<div>
						<p class="text-xs font-medium text-muted-foreground">{{ day.relativeLabel }}</p>
						<h2 class="mt-0.5 text-lg font-bold">{{ day.label }}</h2>
					</div>
					<span class="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
						{{ day.entries.length }} {{ day.entries.length === 1 ? 'запис' : 'записи' }}
					</span>
				</header>

				<div class="grid md:grid-cols-[minmax(0,1fr)_18rem]">
					<ul v-if="day.entries.length" class="divide-y divide-border/70">
						<li v-for="entry in day.entries" :key="entry.id" class="flex items-center gap-3 px-5 py-4 sm:px-6">
							<span
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
								:class="entry.kind === 'food' ? 'bg-[#EDF1DC] text-[#5D6B35]' : 'bg-[#E5F2F4] text-[#2F6F7A]'"
								aria-hidden="true"
							>
								{{ entry.kind === 'food' ? 'Ї' : 'Н' }}
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{{ entry.title }}</p>
								<p class="mt-0.5 truncate text-sm text-muted-foreground">{{ entry.detail }}</p>
							</div>
							<p class="shrink-0 text-sm font-bold">{{ entry.amount }}</p>
						</li>
					</ul>
					<div v-else class="px-5 py-7 text-sm text-muted-foreground sm:px-6">
						Записів їжі або води немає.
					</div>

					<div class="border-t border-border/70 p-5 md:border-t-0 md:border-l md:p-6">
						<p class="text-sm font-bold">Самопочуття</p>
						<div class="mt-3 space-y-2">
							<div
								v-for="period in moodPeriods"
								:key="period.key"
								class="flex items-center justify-between rounded-xl border px-3 py-2.5"
								:class="day.moods[period.key] ? 'border-border/80 bg-white' : 'border-dashed border-border/80 bg-muted/40'"
							>
								<span class="text-sm text-muted-foreground">{{ period.label }}</span>
								<span v-if="day.moods[period.key]" class="flex items-center gap-2 text-sm font-bold">
									<span class="text-lg">{{ day.moods[period.key]!.emoji }}</span>
									{{ day.moods[period.key]!.label }}
								</span>
								<span v-else class="text-xs text-muted-foreground">Не позначено</span>
							</div>
						</div>
					</div>
				</div>
			</article>
		</section>
	</main>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

type PeriodKey = 'morning' | 'day' | 'evening'

interface HistoryEntry {
	id: string
	kind: 'food' | 'drink'
	title: string
	detail: string
	amount: string
	createdAt: string
}

interface MoodValue {
	period: PeriodKey
	mood: number
	label: string
}

interface HistoryDay {
	date: string
	label: string
	relativeLabel: string
	entries: HistoryEntry[]
	moods: Partial<Record<PeriodKey, { emoji: string; label: string }>>
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userId = computed(() => user.value?.id ?? null)
const loading = shallowRef(true)
const error = shallowRef('')
const foodLogs = shallowRef<any[]>([])
const drinkLogs = shallowRef<any[]>([])
const moodEntries = shallowRef<any[]>([])

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
			{ icon: 'Ї', title: 'Вівсянка та банан', detail: 'Приклад запису їжі', amount: '320 ккал' },
			{ icon: 'Н', title: 'Вода', detail: 'Приклад запису напою', amount: '300 мл' },
		],
		moods: [
			{ period: 'Ранок', emoji: '🙂', label: 'Добре' },
			{ period: 'День', emoji: '😐', label: 'Звичайно' },
			{ period: 'Вечір', emoji: '', label: 'Не позначено' },
		],
	},
] as const

const days = computed<HistoryDay[]>(() => {
	const grouped = new Map<string, HistoryEntry[]>()

	for (const log of foodLogs.value) {
		const date = String(log.date)
		const entries = grouped.get(date) ?? []
		const quantity = formatNumber(Number(log.quantity))
		const unit = log.products?.chars?.unit === 'ml' ? 'мл' : log.products?.chars?.unit === 'piece' ? 'шт.' : 'г'
		entries.push({
			id: log.id,
			kind: 'food',
			title: log.products?.name ?? 'Продукт',
			detail: `${quantity} ${unit} · ${formatNumber(Number(log.proteins))} г білка`,
			amount: `${formatNumber(Number(log.calories))} ккал`,
			createdAt: log.created_at,
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
			title: drinkKindLabel(drink.kind),
			detail: `${formatVolume(Number(drink.volume_ml))} мл`,
			amount: `${formatVolume(Number(drink.volume_ml))} мл`,
			createdAt: drink.recorded_at,
		})
		grouped.set(date, entries)
	}

	const moodGrouped = new Map<string, Partial<Record<PeriodKey, { emoji: string; label: string }>>>()
	for (const entry of moodEntries.value) {
		const value = entry.value as MoodValue
		const date = localDateFromTimestamp(entry.recorded_at)
		if (!date || !value?.period) continue
		const moods = moodGrouped.get(date) ?? {}
		moods[value.period] = {
			emoji: moodEmojis[value.mood] ?? '😐',
			label: value.label,
		}
		moodGrouped.set(date, moods)
	}

	const dates = new Set([
		...grouped.keys(),
		...moodGrouped.keys(),
	])

	return [...dates]
		.sort((a, b) => b.localeCompare(a))
		.map((date) => ({
			date,
			label: formatDayLabel(date),
			relativeLabel: relativeDayLabel(date),
			entries: (grouped.get(date) ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
			moods: moodGrouped.get(date) ?? {},
		}))
})

watch(userId, async (id) => {
	loading.value = true
	error.value = ''
	if (!id) {
		loading.value = false
		foodLogs.value = []
		drinkLogs.value = []
		moodEntries.value = []
		return
	}
	await loadHistory(id)
	loading.value = false
}, { immediate: true })

async function loadHistory(id: string) {
	const [foods, drinks, moods] = await Promise.all([
		supabase
			.from('logs')
			.select('id, date, quantity, calories, proteins, fats, carbs, created_at, products(name, chars)')
			.eq('user_id', id)
			.order('date', { ascending: false }),
		supabase
			.from('drinks')
			.select('id, kind, volume_ml, recorded_at')
			.eq('user_id', id)
			.order('recorded_at', { ascending: false }),
		supabase
			.from('wellbeing_entries')
			.select('id, kind, value, recorded_at')
			.eq('user_id', id)
			.eq('kind', 'mood')
			.order('recorded_at', { ascending: false }),
	])

	if (foods.error || drinks.error || moods.error) {
		error.value = 'Не вдалося завантажити журнал. Спробуйте оновити сторінку.'
		return
	}

	foodLogs.value = foods.data ?? []
	drinkLogs.value = drinks.data ?? []
	moodEntries.value = moods.data ?? []
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
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
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
	const difference = Math.round((todayDate.getTime() - targetDate.getTime()) / 86400000)
	return difference === 1 ? 'Вчора' : ''
}

function drinkKindLabel(kind: string) {
	return { water: 'Вода', coffee: 'Кава', tea: 'Чай', other: 'Напій' }[kind] ?? 'Напій'
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

function formatVolume(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value)
}
</script>
