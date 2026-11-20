<template>
	<main class="mx-auto max-w-5xl space-y-5 px-2 pb-20 sm:px-0">
		<section class="rounded-xl border bg-card p-4 sm:p-5">
			<div class="mb-3 flex items-start justify-between gap-3">
				<div>
					<p class="text-sm text-muted-foreground">Сегодня</p>
					<h1 class="text-2xl font-bold">Итог дня</h1>
				</div>
				<NuxtLink to="/products/add">
					<Button type="button" aria-label="Добавить продукт">+</Button>
				</NuxtLink>
			</div>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
				<div class="rounded-lg bg-muted p-3">
					<p class="text-xs text-muted-foreground">Калории</p>
					<p class="font-bold">{{ formatNumber(stats.calories) }} ккал</p>
				</div>
				<div class="rounded-lg bg-muted p-3">
					<p class="text-xs text-muted-foreground">Белки</p>
					<p class="font-bold">{{ formatNumber(stats.proteins) }} г</p>
				</div>
				<div class="rounded-lg bg-muted p-3">
					<p class="text-xs text-muted-foreground">Жиры</p>
					<p class="font-bold">{{ formatNumber(stats.fats) }} г</p>
				</div>
				<div class="rounded-lg bg-muted p-3">
					<p class="text-xs text-muted-foreground">Углеводы</p>
					<p class="font-bold">{{ formatNumber(stats.carbs) }} г</p>
				</div>
			</div>
			<div class="mt-3 flex flex-wrap gap-2">
				<NuxtLink to="/products/add"><Button variant="secondary">Еда</Button></NuxtLink>
				<Button variant="secondary" disabled>Напиток</Button>
				<Button variant="secondary" disabled>Настроение</Button>
				<Button variant="secondary" disabled>Активность</Button>
			</div>
		</section>

		<section class="rounded-xl border bg-card p-4 sm:p-5">
			<h2 class="mb-3 text-lg font-bold">Продукты</h2>
			<Input
				v-model="search"
				type="search"
				placeholder="Поиск по названию"
				class="mb-3"
			/>
			<p v-if="loading" role="status">Загрузка...</p>
			<p v-else-if="error" role="alert" class="text-red-600">{{ error }}</p>
			<div v-else-if="visibleFoods.length > 0" class="space-y-2">
				<article
					v-for="food in visibleFoods"
					:key="food.id"
					class="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<p class="font-semibold">{{ food.name }}</p>
						<p class="text-sm text-muted-foreground">
							{{ formatNumber(food.calories) }} ккал за {{ food.quantity }} г
						</p>
					</div>
					<div class="flex items-center gap-2">
						<select
							v-model="food.approximation"
							class="h-10 rounded-md border bg-background px-2 text-sm"
							:aria-label="`Порция: ${food.name}`"
							@change="applyApproximation(food)"
						>
							<option value="exact">Точно</option>
							<option value="small">Мало</option>
							<option value="medium">Средне</option>
							<option value="large">Много</option>
						</select>
						<Input
							v-model="food.quantityInput"
							type="number"
							required
							step="any"
							class="w-24"
						/>
						<Button
							@click="logFood(food)"
							:disabled="savingId === food.id"
						>
							{{ savingId === food.id ? '...' : 'Съел' }}
						</Button>
					</div>
				</article>
			</div>
			<p v-else>Нет подходящих продуктов</p>
		</section>

		<section v-if="recentEntries.length > 0" class="rounded-xl border bg-card p-4 sm:p-5">
			<h2 class="mb-3 text-lg font-bold">Недавние записи</h2>
			<div class="space-y-2">
				<button
					v-for="entry in recentEntries"
					:key="entry.id"
					type="button"
					class="flex w-full items-center justify-between rounded-lg border p-3 text-left"
					@click="repeatEntry(entry)"
				>
					<span>{{ entry.name }} · {{ formatNumber(entry.quantity) }} г/мл</span>
					<span class="text-sm text-muted-foreground">Повторить</span>
				</button>
			</div>
		</section>
	</main>
</template>

<script setup lang="ts">
import { getLocalDate } from '~/src/shared/date'

interface Food {
	id: string
	name: string
	quantity: number
	chars: {
		calories: number
		proteins: number
		fats: number
		carbs: number
		vitamins: Record<string, number>
	}
	quantityInput: number
	calories: number
	approximation: 'exact' | 'small' | 'medium' | 'large'
}

interface RecentEntry {
	id: string
	name: string
	quantity: number
	productId: string | null
	calories: number
	proteins: number
	fats: number
	carbs: number
	vitamins: Record<string, number>
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loading = shallowRef(true)
const error = shallowRef('')
const foods = shallowRef<Food[]>([])
const stats = shallowRef({ calories: 0, proteins: 0, fats: 0, carbs: 0 })
const savingId = shallowRef<string | null>(null)
const search = shallowRef('')
const recentEntries = shallowRef<RecentEntry[]>([])

const visibleFoods = computed(() =>
	foods.value.filter((food) =>
		food.name.toLocaleLowerCase('uk-UA').includes(search.value.toLocaleLowerCase('uk-UA'))
	)
)

onMounted(async () => {
	await fetchFoods()
	await fetchStats()
	await fetchRecentEntries()

	loading.value = false
})

async function fetchFoods() {
	if (!user.value) return

	const { data, error: requestError } = await supabase
		.from('products')
		.select('*')
		.eq('user_id', user.value.id)
	if (requestError) {
		error.value = 'Не удалось загрузить продукты'
		return
	}
	foods.value = (data ?? []).map((product: any) => ({
		...product,
		calories: product.chars?.calories ?? 0,
		quantityInput: product.quantity,
		approximation: 'exact',
	}))
}

async function fetchStats() {
	if (!user.value) return

	const today = getLocalDate()
	const { data, error: requestError } = await supabase
		.from('logs')
		.select('calories, proteins, fats, carbs')
		.eq('user_id', user.value.id)
		.eq('date', today)

	if (requestError) {
		error.value = 'Не удалось загрузить статистику'
		return
	}

	if ((data?.length ?? 0) > 0) {
		stats.value = data.reduce(
			(acc, curr) => {
				acc.calories += curr.calories
				acc.proteins += curr.proteins
				acc.fats += curr.fats
				acc.carbs += curr.carbs
				return acc
			},
			{ calories: 0, proteins: 0, fats: 0, carbs: 0 }
		)
	}
}

async function fetchRecentEntries() {
	if (!user.value) return

	const { data, error: requestError } = await supabase
		.from('logs')
		.select('id, product_id, quantity, calories, proteins, fats, carbs, vitamins, products(name)')
		.eq('user_id', user.value.id)
		.order('created_at', { ascending: false })
		.limit(5)

	if (requestError) return

	recentEntries.value = (data ?? []).map((entry: any) => ({
		id: entry.id,
		name: entry.products?.name ?? 'Продукт',
		quantity: Number(entry.quantity ?? 0),
		productId: entry.product_id,
		calories: Number(entry.calories ?? 0),
		proteins: Number(entry.proteins ?? 0),
		fats: Number(entry.fats ?? 0),
		carbs: Number(entry.carbs ?? 0),
		vitamins: entry.vitamins ?? {},
	}))
}

function applyApproximation(food: Food) {
	const factors = { exact: 1, small: 0.7, medium: 1, large: 1.3 }
	food.quantityInput = Math.round(food.quantity * factors[food.approximation])
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

async function logFood(food) {
	if (savingId.value === food.id || !user.value) return
	savingId.value = food.id
	error.value = ''

	const today = getLocalDate()
	const quantity = Number(food.quantityInput)
	if (!Number.isFinite(quantity) || quantity <= 0) {
		error.value = 'Введите положительное количество'
		savingId.value = null
		return
	}

	const factor = quantity / food.quantity
	const chars = food.chars
	const idempotencyKey = globalThis.crypto?.randomUUID?.()
		?? `${user.value.id}-${food.id}-${Date.now()}`

	const { error: saveError } = await supabase.from('logs').upsert([
		{
			user_id: user.value.id,
			date: today,
			calories: chars.calories * factor,
			proteins: chars.proteins * factor,
			fats: chars.fats * factor,
			carbs: chars.carbs * factor,
			vitamins: {
				vitaminA: (chars.vitamins?.vitaminA ?? 0) * factor,
				vitaminB: (chars.vitamins?.vitaminB ?? 0) * factor,
				vitaminC: (chars.vitamins?.vitaminC ?? 0) * factor,
			},
			idempotency_key: idempotencyKey,
			product_id: food.id,
			quantity,
		},
	], { onConflict: 'idempotency_key' })

	savingId.value = null
	if (saveError) {
		error.value = 'Не удалось сохранить запись'
		return
	}

	await fetchStats()
}

async function repeatEntry(entry: RecentEntry) {
	const food = foods.value.find((item) => item.id === entry.productId)
	if (food) {
		food.quantityInput = entry.quantity
		await logFood(food)
	}
}
</script>
