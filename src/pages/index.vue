<template>
	<main class="pb-10 pt-6 sm:pt-8">
		<header class="mb-5 flex items-center justify-start gap-4 sm:mb-7">
			<div class="flex shrink-0 items-center gap-2">
				<Button
					type="button"
					class="h-12 shrink-0 rounded-full bg-primary px-4 text-[15px] font-semibold shadow-[0_10px_24px_rgba(36,107,79,0.18)] sm:px-5"
					:aria-haspopup="userId ? 'dialog' : undefined"
					@click="openQuickLog"
				>
					<span class="mr-1 text-xl leading-none">+</span>
					Додати запис
				</Button>
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
					<span :class="{ 'animate-spin': refreshing }" aria-hidden="true"
						>↻</span
					>
				</Button>
			</div>
		</header>

		<Dialog v-model:open="quickLogOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Додати запис</DialogTitle>
					<DialogDescription
						>Оберіть їжу або напій для щоденника.</DialogDescription
					>
				</DialogHeader>
				<QuickLogForm
					v-if="userId"
					:key="quickLogFormVersion"
					:products="products"
					:recent-foods="recentFoods"
					:pending="savePending"
					@food="logFood"
					@create-food="createAndLogFood"
					@drink="logDrink"
				/>
			</DialogContent>
		</Dialog>
		<Dialog v-model:open="targetsOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Мої цілі</DialogTitle>
					<DialogDescription
						>Оберіть готовий пресет або задайте значення
						вручну.</DialogDescription
					>
				</DialogHeader>
				<DailyTargetSettings
					v-if="userId"
					:targets="targets"
					:preset="targetPreset"
					:pending="targetPending"
					@save="saveTargets"
				/>
			</DialogContent>
		</Dialog>
		<ProductInfoDialog
			:open="productInfoOpen"
			:product="selectedFoodRecord?.product ?? null"
			:logged="selectedFoodRecord?.logged ?? null"
			@update:open="productInfoOpen = $event"
		/>
		<Dialog v-model:open="moodDialogOpen">
			<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-md">
				<DialogHeader v-if="selectedWellbeingPeriod">
					<DialogTitle>{{ selectedWellbeingPeriod.question }}</DialogTitle>
					<DialogDescription>
						Обери настрій за період «{{
							selectedWellbeingPeriod.label.toLowerCase()
						}}». Вибір можна змінити пізніше.
					</DialogDescription>
				</DialogHeader>
				<div
					v-if="selectedWellbeingPeriod"
					class="grid grid-cols-5 gap-2"
					role="group"
					aria-label="Варіанти настрою"
				>
					<button
						v-for="option in moodOptions"
						:key="option.mood"
						type="button"
						:aria-label="option.label"
						:aria-pressed="
							wellbeingByPeriod[selectedWellbeingPeriod.key]?.value.mood ===
							option.mood
						"
						:disabled="wellbeingPending"
						class="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
						:class="
							wellbeingByPeriod[selectedWellbeingPeriod.key]?.value.mood ===
							option.mood
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-white hover:border-primary/40 hover:bg-primary/3'
						"
						@click="saveSelectedMood(option)"
					>
						<span class="text-3xl leading-none">{{ option.emoji }}</span>
						<span class="text-xs font-semibold">{{ option.label }}</span>
					</button>
				</div>
			</DialogContent>
		</Dialog>

		<section
			v-if="loading"
			role="status"
			class="rounded-3xl border border-border/80 bg-card p-8 text-sm text-muted-foreground"
		>
			Завантажую щоденник...
		</section>

		<section
			v-else-if="!userId"
			class="space-y-5"
			aria-label="Представлення головного екрану для гостя"
		>
			<div
				class="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-primary p-5 text-primary-foreground shadow-[0_18px_50px_rgba(36,107,79,0.16)] sm:p-7"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-white/70">
							Сьогодні, 21 листопада
						</p>
						<h1
							class="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-[2rem]"
						>
							Мета на сьогодні
						</h1>
					</div>
					<span
						class="flex h-11 items-center rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground"
						>Цілі</span
					>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
					<div
						v-for="preview in guestGoalPreview"
						:key="preview.label"
						class="rounded-2xl bg-white/10 p-3.5 sm:p-4"
					>
						<div class="flex items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/70">
								{{ preview.label }}
							</p>
							<p class="text-xs font-bold text-secondary">
								{{ preview.percent }}%
							</p>
						</div>
						<p class="mt-2 text-lg font-bold leading-none">
							{{ preview.value }}
						</p>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
							<div
								class="h-full rounded-full bg-secondary"
								:style="{ width: `${preview.percent}%` }"
							/>
						</div>
					</div>
				</div>

				<div
					class="absolute inset-0 flex items-center justify-center bg-primary/35 px-5 backdrop-blur-[7px]"
				>
					<div
						class="max-w-sm rounded-2xl border border-white/20 bg-[#20342C]/95 p-5 text-center shadow-2xl"
					>
						<p class="text-lg font-bold">Перегляньте свої показники</p>
						<p class="mt-2 text-sm leading-6 text-white/75">
							Увійдіть, щоб побачити реальні цілі та прогрес вашого дня.
						</p>
						<NuxtLink to="/signin" class="mt-4 inline-flex">
							<Button
								class="h-11 rounded-full bg-secondary px-5 text-secondary-foreground hover:bg-secondary"
								>Увійти</Button
							>
						</NuxtLink>
					</div>
				</div>
			</div>
		</section>

		<div v-else class="space-y-5">
			<section
				class="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-primary p-5 text-primary-foreground shadow-[0_18px_50px_rgba(36,107,79,0.16)] sm:p-7"
				aria-labelledby="goal-heading"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-white/70">{{ todayLabel }}</p>
						<h1
							id="goal-heading"
							class="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-[2rem]"
						>
							Мета на сьогодні
						</h1>
					</div>
					<button
						type="button"
						class="flex h-11 min-w-11 items-center justify-center rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground"
						@click="openTargets"
					>
						Цілі
					</button>
				</div>

				<div
					class="mt-6 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
					aria-label="Калорії та нутрієнти"
				>
					<article
						class="goal-tile flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5"
					>
						<div
							class="goal-ring goal-ring--large"
							:style="
								ringStyle(
									nutrition.nutritionUnknown
										? 0
										: progress(nutrition.calories, targets.calories),
								)
							"
							role="progressbar"
							:aria-valuenow="
								nutrition.nutritionUnknown
									? undefined
									: Math.round(progress(nutrition.calories, targets.calories))
							"
							aria-valuemin="0"
							aria-valuemax="100"
							:aria-label="
								nutrition.nutritionUnknown
									? 'Калорії невідомі'
									: `Калорії: ${formatNumber(nutrition.calories)} з ${formatNumber(targets.calories)} ккал`
							"
						>
							<span class="goal-ring__content">
								<strong>{{
									nutrition.nutritionUnknown
										? '—'
										: formatNumber(nutrition.calories)
								}}</strong>
								<small>ккал</small>
							</span>
						</div>
						<div>
							<p class="text-sm font-semibold text-white/75">Калорії</p>
							<p class="mt-2 text-base font-bold leading-tight">
								{{
									nutrition.nutritionUnknown
										? 'Харчову цінність не зазначено'
										: `з ${formatNumber(targets.calories)} ккал`
								}}
							</p>
							<p class="mt-1 text-xs text-white/65">
								{{
									nutrition.nutritionUnknown
										? 'Невідомо'
										: `${Math.round(progress(nutrition.calories, targets.calories))}% цілі`
								}}
							</p>
						</div>
					</article>

					<div class="grid grid-cols-3 gap-2">
						<article
							v-for="macro in macros"
							:key="macro.key"
							class="goal-tile flex flex-col items-center justify-center rounded-2xl bg-white/10 px-2 py-3 text-center sm:px-3"
						>
							<div class="mb-1.5 flex items-center gap-1.5">
								<span
									class="size-2 rounded-full"
									:style="{ backgroundColor: macro.accent }"
									aria-hidden="true"
								/>
								<p class="text-xs font-semibold text-white/85">
									{{ macro.label }}
								</p>
							</div>
							<div
								class="goal-ring goal-ring--small"
								:style="
									ringStyle(
										nutrition.nutritionUnknown
											? 0
											: progress(nutrition[macro.key], targets[macro.key]),
										undefined,
										macro.accent,
									)
								"
								role="progressbar"
								:aria-valuenow="
									nutrition.nutritionUnknown
										? undefined
										: Math.round(
												progress(nutrition[macro.key], targets[macro.key]),
											)
								"
								aria-valuemin="0"
								aria-valuemax="100"
								:aria-label="
									nutrition.nutritionUnknown
										? `${macro.label}: харчову цінність не зазначено`
										: `${macro.label}: ${formatNumber(nutrition[macro.key])} із ${formatNumber(targets[macro.key])} грамів`
								"
							>
								<span class="goal-ring__content">
									<strong>{{
										nutrition.nutritionUnknown
											? '—'
											: formatNumber(nutrition[macro.key])
									}}</strong>
									<small>г</small>
								</span>
							</div>
							<p class="mt-2 text-xs font-bold">
								з {{ formatNumber(targets[macro.key]) }} г
							</p>
							<p class="mt-1 text-[11px] text-white/65">
								{{
									nutrition.nutritionUnknown
										? 'Невідомо'
										: `${Math.round(
												progress(nutrition[macro.key], targets[macro.key]),
											)}% цілі`
								}}
							</p>
						</article>
					</div>
				</div>

				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<article
						class="goal-tile goal-tile--water flex items-center gap-4 rounded-2xl bg-[#DDF0F0] p-4 text-[#203F43] sm:p-5"
					>
						<div
							class="shrink-0"
							role="progressbar"
							:aria-valuenow="
								Math.round(progress(pureWater, targets.beveragesMl))
							"
							aria-valuemin="0"
							aria-valuemax="100"
							:aria-label="`Вода: ${formatVolume(pureWater)} з ${formatVolume(targets.beveragesMl)} мілілітрів`"
						>
							<svg viewBox="0 0 80 96" class="h-24 w-20" aria-hidden="true">
								<defs>
									<clipPath id="water-drop-mask">
										<path
											d="M40 4C34 15 12 38 12 57c0 16 12.5 29 28 29s28-13 28-29C68 38 46 15 40 4Z"
										/>
									</clipPath>
								</defs>
								<path
									d="M40 4C34 15 12 38 12 57c0 16 12.5 29 28 29s28-13 28-29C68 38 46 15 40 4Z"
									fill="#C4E1E2"
								/>
								<path
									:d="
										waterSurfacePath(progress(pureWater, targets.beveragesMl))
									"
									clip-path="url(#water-drop-mask)"
									fill="#3D858D"
								/>
								<path
									d="M40 4C34 15 12 38 12 57c0 16 12.5 29 28 29s28-13 28-29C68 38 46 15 40 4Z"
									fill="none"
									stroke="#8DBFC2"
									stroke-width="2"
								/>
								<path
									d="M27 48c2-7 6-13 10-19"
									fill="none"
									stroke="#FFFFFF"
									stroke-linecap="round"
									stroke-width="3"
									opacity=".75"
								/>
							</svg>
						</div>
						<div class="min-w-0">
							<p class="text-sm font-bold text-[#2F6F7A]">Вода</p>
							<p class="mt-1 flex items-baseline gap-1">
								<strong class="text-3xl font-bold tracking-[-0.04em]">
									{{ formatVolume(pureWater) }}
								</strong>
								<span class="text-sm font-semibold text-[#52777B]">мл</span>
							</p>
							<p class="mt-2 text-xs text-[#52777B]">
								Ціль {{ formatVolume(targets.beveragesMl) }} мл
							</p>
							<p class="mt-1 text-xs font-bold text-[#2F6F7A]">
								{{ Math.round(progress(pureWater, targets.beveragesMl)) }}%
								виконано
							</p>
						</div>
					</article>

					<article class="goal-tile rounded-2xl bg-white/10 p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm font-semibold text-white/75">
									Самопочуття протягом дня
								</p>
								<p class="mt-1 text-lg font-bold">Як ти почуваєшся?</p>
							</div>
							<span
								class="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground"
								:aria-label="`${completedWellbeingCount} з 3 позначено`"
							>
								{{ completedWellbeingCount }}/3
							</span>
						</div>
						<div class="mt-3 flex gap-1.5" aria-hidden="true">
							<span
								v-for="step in 3"
								:key="step"
								class="h-1 flex-1 rounded-full"
								:class="
									step <= completedWellbeingCount
										? 'bg-secondary'
										: 'bg-white/20'
								"
							/>
						</div>
						<div class="mt-3 grid grid-cols-3 gap-2">
							<button
								v-for="checkIn in wellbeingCheckIns"
								:key="checkIn.key"
								type="button"
								class="mood-checkin flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-wait disabled:opacity-60"
								:class="
									checkIn.mood
										? 'mood-checkin--done'
										: 'mood-checkin--empty'
								"
								:aria-label="`${checkIn.label}: ${checkIn.mood?.label ?? 'не позначено'}. Обрати або змінити настрій`"
								:aria-pressed="Boolean(checkIn.mood)"
								:disabled="wellbeingPending"
								@click="openMoodPicker(checkIn.key)"
							>
								<span
									class="mood-checkin__face flex size-9 items-center justify-center rounded-full text-xl leading-none"
									:class="checkIn.mood ? 'bg-white/55' : 'bg-white/10'"
									aria-hidden="true"
								>
									{{ checkIn.mood?.emoji ?? '+' }}
								</span>
								<span class="text-xs font-bold">{{ checkIn.label }}</span>
								<span
									class="max-w-full truncate text-[11px]"
									:class="
										checkIn.mood
											? 'text-[#246B4F]'
											: 'text-white/65'
									"
								>
									{{ checkIn.mood?.label ?? 'Позначити' }}
								</span>
							</button>
						</div>
					</article>
				</div>
			</section>

			<div class="grid gap-5">
				<section
					class="overflow-hidden rounded-3xl border border-border/80 bg-card"
					aria-labelledby="records-heading"
				>
					<div
						class="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6"
					>
						<div>
							<h2 id="records-heading" class="text-lg font-bold">
								Що вже зроблено
							</h2>
							<p class="mt-0.5 text-sm text-muted-foreground">
								{{ records.length }} {{ recordsCountLabel }}
							</p>
						</div>
						<button
							type="button"
							class="h-10 rounded-full border border-border px-4 text-sm font-bold"
							@click="openQuickLog"
						>
							Додати
						</button>
					</div>
					<p
						v-if="!records.length"
						class="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6"
					>
						Ще нічого не записано. Додайте їжу або напій, коли буде зручно.
					</p>
					<ul v-else class="divide-y divide-border/70">
						<li
							v-for="record in records"
							:key="record.id"
							class="px-5 py-4 sm:px-6"
						>
							<button
								v-if="record.kind === 'food' && record.product"
								type="button"
								class="flex w-full cursor-pointer items-center gap-3 rounded-lg text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
								:aria-label="`Довідка про продукт ${record.title}`"
								@click="openProductInfo(record)"
							>
								<span
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#EDF1DC] text-lg font-bold text-[#5D6B35] select-none"
									aria-hidden="true"
									>Ї</span
								>
								<span class="min-w-0 flex-1">
									<span class="block truncate font-semibold">{{
										record.title
									}}</span>
									<span
										class="mt-0.5 block truncate text-sm text-muted-foreground"
										>{{ record.detail }}</span
									>
								</span>
								<span class="shrink-0 text-right">
									<time
										:datetime="record.createdAt"
										class="block text-xs text-muted-foreground"
										>{{ formatLocalHour(record.createdAt) }}</time
									>
									<span class="mt-1 block text-sm font-bold">
										{{
											record.nutritionKnown
												? `${formatNumber(record.calories)} ккал`
												: 'Состав не указан'
										}}
									</span>
								</span>
							</button>
							<div v-else class="flex items-center gap-3">
								<span
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#E5F2F4] text-lg font-bold text-[#2F6F7A] select-none"
									aria-hidden="true"
									>Н</span
								>
								<div class="min-w-0 flex-1">
									<p class="truncate font-semibold">{{ record.title }}</p>
									<p class="mt-0.5 truncate text-sm text-muted-foreground">
										{{ record.detail }}
									</p>
								</div>
								<div class="shrink-0 text-right">
									<time
										:datetime="record.createdAt"
										class="block text-xs text-muted-foreground"
										>{{ formatLocalHour(record.createdAt) }}</time
									>
									<p class="mt-1 text-sm font-bold">
										{{ formatVolume(record.volumeMl) }} мл
									</p>
								</div>
							</div>
						</li>
					</ul>
				</section>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
useSeoMeta({
	title: 'Щоденник їжі, води та самопочуття',
	description:
		'Записуйте їжу та напої, задавайте добові цілі й відстежуйте самопочуття у щоденнику Vitamin.',
	ogTitle: 'Vitamin — ваш щоденник їжі та самопочуття',
	ogDescription:
		'Цілі на день, записи їжі й напоїв, настрій та самопочуття в одному застосунку.',
})
import { computed, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import { formatLocalHour, getLocalDate } from '~/src/shared/date'
import DailyTargetSettings from '~/src/features/dashboard/DailyTargetSettings.vue'
import QuickLogForm from '~/src/features/dashboard/QuickLogForm.vue'
import ProductInfoDialog from '~/src/features/dashboard/ProductInfoDialog.vue'
import { getRecentFoods } from '~/src/features/dashboard/diary'
import type {
	FoodProductInfo,
	LoggedFoodInfo,
} from '~/src/features/dashboard/foodProduct'
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
	idempotencyKey?: string
	chars: {
		calories: number
		proteins: number
		fats: number
		carbs: number
		vitamins?: Record<string, number>
		unit?: 'g' | 'ml' | 'piece'
		nutritionKnown?: boolean
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
	products: FoodProductInfo | null
}

interface DrinkLog {
	id: string
	kind: string
	volume_ml: number
	created_at: string
}

interface RecentFood {
	productId: string
	quantity: number
}

interface DiaryRecord {
	id: string
	kind: 'food' | 'drink'
	title: string
	detail: string
	calories: number
	volumeMl: number
	nutritionKnown: boolean
	createdAt: string
	product: FoodProductInfo | null
	logged: LoggedFoodInfo | null
}

interface NewFoodEntry {
	name: string
	unit: 'g' | 'ml' | 'piece'
	referenceQuantity: number
	quantity: number
	nutrition: {
		calories: number
		proteins: number
		fats: number
		carbs: number
	} | null
	idempotencyKey: string
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
	recentFoods: RecentFood[]
	foodLogs: FoodLog[]
	drinkLogs: DrinkLog[]
	wellbeingEntries: WellbeingEntry[]
	targets: DailyTargets
	targetPreset: TargetPreset
}

type WellbeingPeriodKey = 'morning' | 'day' | 'evening'

const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userId = computed(() => user.value?.id ?? null)
const loading = shallowRef(true)
const refreshing = shallowRef(false)
const savePending = shallowRef(false)
const quickLogFormVersion = shallowRef(0)
const targetPending = shallowRef(false)
const quickLogOpen = shallowRef(false)
let quickLogFormSessionId = 0
const targetsOpen = shallowRef(false)
const moodDialogOpen = shallowRef(false)
const productInfoOpen = shallowRef(false)
const selectedFoodRecord = shallowRef<DiaryRecord | null>(null)
const selectedMoodPeriod = shallowRef<WellbeingPeriodKey | null>(null)
const error = shallowRef('')
const notice = shallowRef('')
const products = shallowRef<Product[]>([])
const recentFoods = shallowRef<RecentFood[]>([])
const foodLogs = shallowRef<FoodLog[]>([])
const drinkLogs = shallowRef<DrinkLog[]>([])
const wellbeingEntries = shallowRef<WellbeingEntry[]>([])
const wellbeingPending = shallowRef(false)
const targets = shallowRef<DailyTargets>({ ...DEFAULT_TARGETS })
const targetPreset = shallowRef<TargetPreset>('balanced')
const dashboardCache = useState<Record<string, DashboardSnapshot>>(
	'dashboard-cache',
	() => ({}),
)
let dashboardLoadGeneration = 0
const historyCache = useState<Record<string, unknown>>(
	'history-cache',
	() => ({}),
)

watch(
	quickLogOpen,
	() => {
		quickLogFormSessionId += 1
	},
	{ flush: 'sync' },
)

watch(error, (message) => {
	if (message) {
		toast.error(message, { duration: 4000 })
	}
})

watch(notice, (message) => {
	if (message) {
		toast.success(message, { duration: 3000 })
	}
})

const macros: Array<{
	key: 'proteins' | 'fats' | 'carbs'
	label: string
	accent: string
}> = [
	{ key: 'proteins', label: 'Білки', accent: '#D7F26A' },
	{ key: 'fats', label: 'Жири', accent: '#F2C879' },
	{ key: 'carbs', label: 'Вуглеводи', accent: '#91D4C1' },
]

const moodOptions = [
	{ mood: 1, emoji: '😞', label: 'Важко' },
	{ mood: 2, emoji: '😕', label: 'Незручно' },
	{ mood: 3, emoji: '😐', label: 'Звичайно' },
	{ mood: 4, emoji: '🙂', label: 'Добре' },
	{ mood: 5, emoji: '😄', label: 'Чудово' },
] as const

const wellbeingPeriods = [
	{ key: 'morning', label: 'Ранок', question: 'Як прокинувся?' },
	{ key: 'day', label: 'День', question: 'Як минає день?' },
	{ key: 'evening', label: 'Вечір', question: 'Як пройшов день?' },
] as const

const guestGoalPreview = [
	{ label: 'Калорії', value: '1 240 / 2 000 ккал', percent: 62 },
	{ label: 'Білки', value: '68 / 100 г', percent: 68 },
	{ label: 'Жири', value: '42 / 70 г', percent: 60 },
	{ label: 'Вуглеводи', value: '158 / 250 г', percent: 63 },
	{ label: 'Вода', value: '1 250 / 2 000 мл', percent: 63 },
	{ label: 'Настрій', value: '2 з 3 позначено', percent: 67 },
] as const

const nutrition = computed(() =>
	foodLogs.value.reduce(
		(total, entry) => {
			if (entry.products?.chars.nutritionKnown === false) {
				return { ...total, nutritionUnknown: true }
			}
			return {
				calories: total.calories + Number(entry.calories || 0),
				proteins: total.proteins + Number(entry.proteins || 0),
				fats: total.fats + Number(entry.fats || 0),
				carbs: total.carbs + Number(entry.carbs || 0),
				nutritionUnknown: total.nutritionUnknown,
			}
		},
		{
			calories: 0,
			proteins: 0,
			fats: 0,
			carbs: 0,
			nutritionUnknown: false,
		},
	),
)
const pureWater = computed(() =>
	drinkLogs.value
		.filter((drink) => drink.kind === 'water')
		.reduce((sum, drink) => sum + Number(drink.volume_ml || 0), 0),
)
const records = computed<DiaryRecord[]>(() =>
	[
		...foodLogs.value.map((entry) => ({
			id: entry.id,
			kind: 'food' as const,
			title: entry.products?.name ?? 'Продукт',
			detail:
				entry.products?.chars.nutritionKnown === false
					? `${formatNumber(Number(entry.quantity))} ${unitLabel(entry.products?.chars.unit)} · Харчову цінність не зазначено`
					: `${formatNumber(Number(entry.quantity))} ${unitLabel(entry.products?.chars.unit)} · ${formatNumber(Number(entry.proteins))} г білка`,
			calories: Number(entry.calories),
			volumeMl: 0,
			nutritionKnown: entry.products?.chars.nutritionKnown !== false,
			createdAt: entry.created_at,
			product: entry.products,
			logged: {
				quantity: Number(entry.quantity),
				nutrition: {
					calories: Number(entry.calories),
					proteins: Number(entry.proteins),
					fats: Number(entry.fats),
					carbs: Number(entry.carbs),
				},
			},
		})),
		...drinkLogs.value.map((drink) => ({
			id: drink.id,
			kind: 'drink' as const,
			title: drinkKindLabel(drink.kind),
			detail: `${formatVolume(Number(drink.volume_ml))} мл`,
			calories: 0,
			volumeMl: Number(drink.volume_ml),
			nutritionKnown: true,
			createdAt: drink.created_at,
			product: null,
			logged: null,
		})),
	].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)
const recordsCountLabel = computed(() => {
	const count = records.value.length
	if (count === 1) return 'запис'
	if (count > 1 && count < 5) return 'записи'
	return 'записів'
})
const completedWellbeingCount = computed(
	() =>
		wellbeingEntries.value.filter((entry) =>
			wellbeingPeriods.some((period) => period.key === entry.value.period),
		).length,
)
const wellbeingByPeriod = computed(
	() =>
		Object.fromEntries(
			wellbeingEntries.value.map((entry) => [entry.value.period, entry]),
		) as Partial<Record<'morning' | 'day' | 'evening', WellbeingEntry>>,
)
const wellbeingCheckIns = computed(() =>
	wellbeingPeriods.map((period) => {
		const moodValue = wellbeingByPeriod.value[period.key]?.value.mood
		const mood = moodOptions.find((option) => option.mood === moodValue)
		return { ...period, mood }
	}),
)
const selectedWellbeingPeriod = computed(() =>
	wellbeingPeriods.find((period) => period.key === selectedMoodPeriod.value),
)
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

function openProductInfo(record: DiaryRecord) {
	if (record.kind !== 'food' || !record.product) return
	selectedFoodRecord.value = record
	productInfoOpen.value = true
}

function openMoodPicker(period: WellbeingPeriodKey) {
	selectedMoodPeriod.value = period
	moodDialogOpen.value = true
}

function saveSelectedMood(option: (typeof moodOptions)[number]) {
	const period = selectedMoodPeriod.value
	if (!period) return
	void saveMood(period, option)
}

watch(
	userId,
	async (id) => {
		if (!id) {
			loading.value = false
			return
		}
		await loadDashboard(id)
	},
	{ immediate: true },
)

async function loadDashboard(id: string, force = false) {
	if (userId.value !== id) return
	const generation = ++dashboardLoadGeneration

	const cacheKey = dashboardCacheKey(id)
	const cached = dashboardCache.value[cacheKey]
	const cacheIsFresh =
		cached && Date.now() - cached.cachedAt < DASHBOARD_CACHE_TTL_MS

	if (!force && cacheIsFresh) {
		if (userId.value !== id || generation !== dashboardLoadGeneration) return
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
		loadRecentFoods(id, generation),
		loadDayEntries(id),
		loadTargets(id),
		loadWellbeing(id),
	])
	if (userId.value !== id || generation !== dashboardLoadGeneration) return

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
	recentFoods.value = cached.recentFoods ?? []
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
			recentFoods: [...recentFoods.value],
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
		.select('id, name, quantity, chars, idempotency_key')
		.eq('user_id', id)
		.order('name')
	if (requestError) return 'Не вдалося завантажити список продуктів.'

	if (!data?.length) {
		const { error: seedError } = await supabase
			.from('products')
			.insert(seedProducts.map((product) => ({ ...product, user_id: id })))
		if (seedError) return 'Не вдалося додати початкові продукти.'

		const refreshed = await supabase
			.from('products')
			.select('id, name, quantity, chars, idempotency_key')
			.eq('user_id', id)
			.order('name')
		data = refreshed.data
		requestError = refreshed.error
		if (requestError) return 'Не вдалося завантажити початкові продукти.'
	}

	products.value = (data ?? []).map((product) => ({
		id: product.id,
		name: product.name,
		quantity: Number(product.quantity),
		idempotencyKey: product.idempotency_key ?? undefined,
		chars: product.chars as Product['chars'],
	}))
	return null
}

async function loadRecentFoods(
	id: string,
	generation: number,
): Promise<string | null> {
	const activeAccountId = userId.value
	if (activeAccountId !== id) return null

	const { data, error: requestError } = await supabase
		.from('logs')
		.select('product_id, quantity')
		.eq('user_id', id)
		.not('product_id', 'is', null)
		.order('created_at', { ascending: false })
	if (requestError) return 'Не вдалося завантажити нещодавні продукти.'
	if (
		activeAccountId !== userId.value ||
		activeAccountId !== id ||
		generation !== dashboardLoadGeneration
	) {
		return null
	}

	recentFoods.value = getRecentFoods(
		(data ?? []).map((entry) => ({
			productId: entry.product_id,
			quantity: Number(entry.quantity),
		})),
	).flatMap((entry) =>
		entry.productId
			? [{ productId: entry.productId, quantity: entry.quantity }]
			: [],
	)
	return null
}

async function loadDayEntries(id: string): Promise<string | null> {
	const today = getLocalDate()
	const [foods, drinks] = await Promise.all([
		supabase
			.from('logs')
			.select(
				'id, product_id, quantity, calories, proteins, fats, carbs, created_at, products(name, quantity, chars)',
			)
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

	if (foods.error || drinks.error)
		return 'Не вдалося завантажити записи за сьогодні.'
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
	wellbeingEntries.value = (data ?? [])
		.map((entry) => {
			const value = entry.value as WellbeingEntry['value']
			return { id: entry.id, value }
		})
		.filter((entry) =>
			wellbeingPeriods.some((period) => period.key === entry.value.period),
		)
	return null
}

async function loadTargets(id: string): Promise<string | null> {
	const { data, error: readError } = await supabase
		.from('profiles')
		.select('daily_targets, plan_preset')
		.eq('id', id)
		.maybeSingle()
	if (readError) return 'Не вдалося завантажити денні цілі.'

	if (!data) {
		const { error: insertError } = await supabase.from('profiles').upsert({
			id,
			daily_targets: DEFAULT_TARGETS,
			plan_preset: 'balanced',
		})
		if (insertError) return 'Не вдалося створити налаштування денних цілей.'
		targets.value = { ...DEFAULT_TARGETS }
		targetPreset.value = 'balanced'
		return null
	}

	targets.value = normalizeTargets(data.daily_targets)
	targetPreset.value = isTargetPreset(data.plan_preset)
		? data.plan_preset
		: 'custom'
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
		vitamins: scaleVitamins(
			product.chars.vitamins,
			entry.quantity,
			product.quantity,
		),
		idempotency_key: globalThis.crypto?.randomUUID?.() ?? `${id}-${Date.now()}`,
	})
	savePending.value = false
	if (saveError) {
		error.value =
			'Не вдалося записати їжу. Перевір з’єднання та спробуй ще раз.'
		return
	}

	invalidateHistoryCache(id)
	notice.value = `${product.name} додано до щоденника.`
	await refreshDay(id)
}

async function createAndLogFood(entry: NewFoodEntry) {
	const id = userId.value
	if (!id || savePending.value) return
	const submittedFormSessionId = quickLogFormSessionId

	const normalizedName = entry.name.trim().toLocaleLowerCase('uk-UA')
	const existingProduct = products.value.find(
		(product) =>
			product.name.trim().toLocaleLowerCase('uk-UA') === normalizedName,
	)
	if (
		existingProduct &&
		existingProduct.idempotencyKey !== entry.idempotencyKey
	) {
		error.value =
			'Продукт із такою назвою вже є у списку. Знайдіть його та виберіть для запису.'
		return
	}

	savePending.value = true
	error.value = ''
	notice.value = ''
	const productNutrition = entry.nutrition ?? {
		calories: 0,
		proteins: 0,
		fats: 0,
		carbs: 0,
	}
	const chars: Product['chars'] = {
		...productNutrition,
		unit: entry.unit,
		nutritionKnown: entry.nutrition !== null,
	}
	let { data: createdProduct, error: productError } = await supabase
		.from('products')
		.upsert(
			{
				user_id: id,
				name: entry.name.trim(),
				quantity: entry.referenceQuantity,
				chars,
				idempotency_key: entry.idempotencyKey,
			},
			{ onConflict: 'idempotency_key' },
		)
		.select('id, name, quantity, chars, idempotency_key')
		.single()

	if (productError || !createdProduct) {
		const recovered = await supabase
			.from('products')
			.select('id, name, quantity, chars, idempotency_key')
			.eq('user_id', id)
			.eq('idempotency_key', entry.idempotencyKey)
			.maybeSingle()
		if (recovered.error || !recovered.data) {
			savePending.value = false
			error.value =
				'Не вдалося зберегти страву у списку. Перевірте з’єднання та спробуйте ще раз.'
			return
		}
		createdProduct = recovered.data
	}

	if (!createdProduct) {
		savePending.value = false
		error.value =
			'Не вдалося зберегти страву у списку. Перевірте з’єднання та спробуйте ще раз.'
		return
	}

	const product: Product = {
		id: createdProduct.id,
		name: createdProduct.name,
		quantity: Number(createdProduct.quantity),
		idempotencyKey: createdProduct.idempotency_key ?? entry.idempotencyKey,
		chars: createdProduct.chars as Product['chars'],
	}
	products.value = [
		...products.value.filter((item) => item.id !== product.id),
		product,
	].sort((a, b) => a.name.localeCompare(b.name, 'uk-UA'))
	invalidateDashboardCache(id)

	const values = entry.nutrition
		? scaleNutrition(entry.nutrition, entry.quantity, entry.referenceQuantity)
		: { calories: 0, proteins: 0, fats: 0, carbs: 0 }
	const { error: logError } = await supabase.from('logs').upsert(
		{
			user_id: id,
			product_id: product.id,
			date: getLocalDate(),
			quantity: entry.quantity,
			calories: values.calories,
			proteins: values.proteins,
			fats: values.fats,
			carbs: values.carbs,
			vitamins: {},
			idempotency_key: entry.idempotencyKey,
		},
		{ onConflict: 'idempotency_key' },
	)
	savePending.value = false
	if (logError) {
		error.value =
			'Страву збережено у списку, але порцію не записано. Знайдіть страву у списку та повторіть спробу.'
		return
	}

	invalidateHistoryCache(id)
	notice.value = `${formatFoodQuantity(entry.quantity, entry.unit)} «${product.name}» записано до щоденника.`
	if (
		quickLogOpen.value
		&& userId.value === id
		&& quickLogFormSessionId === submittedFormSessionId
	) {
		quickLogFormVersion.value += 1
	}
	await refreshDay(id)
}

async function logDrink(entry: {
	kind: 'water' | 'coffee' | 'tea' | 'other'
	volumeMl: number
}) {
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
		error.value =
			'Не вдалося записати напій. Перевір з’єднання та спробуй ще раз.'
		return
	}

	invalidateHistoryCache(id)
	notice.value = `${drinkKindLabel(entry.kind)} додано до щоденника.`
	await refreshDay(id)
}

async function saveMood(
	period: 'morning' | 'day' | 'evening',
	option: (typeof moodOptions)[number],
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
		? supabase
				.from('wellbeing_entries')
				.update(payload)
				.eq('id', existing.id)
				.eq('user_id', id)
		: supabase.from('wellbeing_entries').insert(payload)
	const { error: saveError } = await request
	wellbeingPending.value = false

	if (saveError) {
		error.value = 'Не вдалося зберегти самопочуття. Спробуйте ще раз.'
		return
	}

	invalidateHistoryCache(id)
	moodDialogOpen.value = false
	selectedMoodPeriod.value = null
	await loadWellbeing(id)
	cacheDashboardSnapshot(id)
	notice.value = `${wellbeingPeriods.find((item) => item.key === period)?.label}: обрано «${option.label}».`
}

async function saveTargets(payload: {
	targets: DailyTargets
	preset: TargetPreset
}) {
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
		error.value = 'Не вдалося зберегти ціль. Спробуй ще раз.'
		return
	}

	targets.value = { ...payload.targets }
	targetPreset.value = payload.preset
	cacheDashboardSnapshot(id)
	notice.value = 'Денні цілі збережено.'
}

async function refreshDay(id: string) {
	if (userId.value !== id) return
	const generation = ++dashboardLoadGeneration

	const results = await Promise.all([
		loadDayEntries(id),
		loadRecentFoods(id, generation),
	])
	if (userId.value !== id || generation !== dashboardLoadGeneration) return

	const loadError = results.find((result) => result)
	if (loadError) error.value = loadError
	else cacheDashboardSnapshot(id)
}

function invalidateHistoryCache(id: string) {
	delete historyCache.value[id]
}

function invalidateDashboardCache(id: string) {
	delete dashboardCache.value[dashboardCacheKey(id)]
}

function scaleVitamins(
	vitamins: Record<string, number> | undefined,
	quantity: number,
	referenceQuantity: number,
) {
	return Object.fromEntries(
		Object.entries(vitamins ?? {}).map(([name, value]) => [
			name,
			(Number(value) * quantity) / referenceQuantity,
		]),
	)
}

function normalizeTargets(value: unknown): DailyTargets {
	if (!value || typeof value !== 'object') return { ...DEFAULT_TARGETS }
	const candidate = value as Partial<DailyTargets>
	return Object.fromEntries(
		Object.entries(DEFAULT_TARGETS).map(([key, defaultValue]) => {
			const amount = Number(candidate[key as keyof DailyTargets])
			return [
				key,
				Number.isFinite(amount) && amount > 0 ? amount : defaultValue,
			]
		}),
	) as DailyTargets
}

function isTargetPreset(value: string): value is TargetPreset {
	return ['light', 'balanced', 'active', 'custom'].includes(value)
}

function progress(value: number, target: number) {
	return getProgressPercent(value, target)
}

function ringStyle(
	value: number,
	track = 'rgba(255, 255, 255, 0.18)',
	fill = '#D7F26A',
) {
	return {
		background: `conic-gradient(${fill} ${value}%, ${track} ${value}% 100%)`,
	}
}

function waterSurfacePath(percent: number) {
	const level = 88 - Math.min(100, Math.max(0, percent)) * 0.78
	return `M0 ${level} C12 ${level - 4} 22 ${level + 4} 36 ${level} S58 ${level - 4} 80 ${level} V96 H0Z`
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

function drinkKindLabel(kind: string) {
	return (
		{ water: 'Вода', coffee: 'Кава', tea: 'Чай', other: 'Напій' }[kind] ??
		'Напій'
	)
}

function unitLabel(unit: 'g' | 'ml' | 'piece' | undefined) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[unit ?? 'g']
}

function formatFoodQuantity(quantity: number, unit: 'g' | 'ml' | 'piece') {
	return `${formatNumber(quantity)} ${{ g: 'г', ml: 'мл', piece: 'шт.' }[unit]}`
}

const seedProducts = [
	{
		name: 'Банан',
		quantity: 100,
		chars: {
			calories: 89,
			proteins: 1.1,
			fats: 0.3,
			carbs: 22.8,
			vitamins: {},
			unit: 'g',
			estimate: true,
		},
	},
	{
		name: 'Гречка варена',
		quantity: 100,
		chars: {
			calories: 110,
			proteins: 3.6,
			fats: 1.1,
			carbs: 21.3,
			vitamins: {},
			unit: 'g',
			estimate: true,
		},
	},
	{
		name: 'Йогурт натуральний',
		quantity: 100,
		chars: {
			calories: 63,
			proteins: 5.3,
			fats: 1.6,
			carbs: 7,
			vitamins: {},
			unit: 'g',
			estimate: true,
		},
	},
	{
		name: 'Куряча грудка',
		quantity: 100,
		chars: {
			calories: 165,
			proteins: 31,
			fats: 3.6,
			carbs: 0,
			vitamins: {},
			unit: 'g',
			estimate: true,
		},
	},
	{
		name: 'Вівсяна каша на воді',
		quantity: 100,
		chars: {
			calories: 71,
			proteins: 2.5,
			fats: 1.5,
			carbs: 12,
			vitamins: {},
			unit: 'g',
			estimate: true,
		},
	},
	{
		name: 'Яблуко',
		quantity: 100,
		chars: {
			calories: 52,
			proteins: 0.3,
			fats: 0.2,
			carbs: 13.8,
			vitamins: {},
			unit: 'g',
			estimate: true,
		},
	},
]
</script>

<style scoped>
.mood-checkin {
	border: 1px solid transparent;
}

.mood-checkin--done {
	border-color: rgb(215 242 106 / 72%);
	background: linear-gradient(155deg, #e5f2a9, #d7f26a);
	color: #20342c;
	box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
}

.mood-checkin--empty {
	border-color: rgb(255 255 255 / 14%);
	background: rgb(255 255 255 / 7%);
	color: white;
}

.mood-checkin--empty:hover {
	border-color: rgb(255 255 255 / 32%);
	background: rgb(255 255 255 / 12%);
}

.goal-tile {
	position: relative;
	border: 1px solid transparent;
}

.goal-tile::before {
	position: absolute;
	inset: 0;
	padding: 1px;
	border-radius: inherit;
	background: linear-gradient(
		135deg,
		rgb(255 255 255 / 62%),
		rgb(255 255 255 / 12%) 48%,
		rgb(12 56 41 / 38%)
	);
	content: '';
	pointer-events: none;
	-webkit-mask:
		linear-gradient(#fff 0 0) content-box,
		linear-gradient(#fff 0 0);
	-webkit-mask-composite: xor;
	mask:
		linear-gradient(#fff 0 0) content-box,
		linear-gradient(#fff 0 0);
	mask-composite: exclude;
}

.goal-tile--water::before {
	background: linear-gradient(
		135deg,
		rgb(255 255 255 / 94%),
		rgb(255 255 255 / 28%) 48%,
		rgb(61 133 141 / 48%)
	);
}

.goal-ring {
	position: relative;
	display: grid;
	flex: 0 0 auto;
	place-items: center;
	border-radius: 9999px;
}

.goal-ring::before {
	position: absolute;
	inset: 10px;
	border-radius: 9999px;
	background: #246b4f;
	content: '';
}

.goal-ring__content {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
}

.goal-ring__content strong {
	max-width: 4.5rem;
	overflow: hidden;
	font-size: 0.9rem;
	font-weight: 700;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goal-ring__content small {
	margin-top: 2px;
	font-size: 0.6rem;
	opacity: 0.75;
}

.goal-ring--large {
	width: 7rem;
	height: 7rem;
}

.goal-ring--large .goal-ring__content strong {
	font-size: 1rem;
}

.goal-ring--small {
	width: 4.75rem;
	height: 4.75rem;
}

.goal-ring--small::before {
	inset: 8px;
}

.goal-ring--small .goal-ring__content strong {
	max-width: 3.25rem;
	font-size: 0.8rem;
}

.goal-ring--water::before {
	background: #e5f2f4;
}

.goal-ring--water .goal-ring__content {
	color: white;
}

@media (min-width: 640px) {
	.goal-ring--large {
		width: 7.75rem;
		height: 7.75rem;
	}
}
</style>
