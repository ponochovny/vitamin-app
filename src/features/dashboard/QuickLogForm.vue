<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { filterProducts, parseOptionalNutrition } from './diary'

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
		nutritionKnown?: boolean
	}
}

type ProductUnit = 'g' | 'ml' | 'piece'

const props = defineProps<{
	products: Product[]
	recentFoods: Array<{ productId: string; quantity: number }>
	pending: boolean
}>()

const emit = defineEmits<{
	food: [entry: { productId: string; quantity: number }]
	createFood: [entry: {
		name: string
		unit: ProductUnit
		referenceQuantity: number
		quantity: number
		nutrition: { calories: number; proteins: number; fats: number; carbs: number } | null
		idempotencyKey: string
	}]
	drink: [entry: { kind: 'water' | 'coffee' | 'tea' | 'other'; volumeMl: number }]
}>()

const mode = shallowRef<'food' | 'drink'>('food')
const creatingProduct = shallowRef(false)
const productId = shallowRef('')
const productSearch = shallowRef('')
const quantity = shallowRef<number | ''>('')
const newProductName = shallowRef('')
const newProductUnit = shallowRef<ProductUnit>('piece')
const newProductQuantity = shallowRef<number | ''>(1)
const newProductCalories = shallowRef<number | ''>('')
const newProductProteins = shallowRef<number | ''>('')
const newProductFats = shallowRef<number | ''>('')
const newProductCarbs = shallowRef<number | ''>('')
const newProductRequestId = shallowRef('')
const formError = shallowRef('')
const drinkKind = shallowRef<'water' | 'coffee' | 'tea' | 'other'>('water')
const volumePreset = shallowRef('300')
const volumeMl = shallowRef<number | ''>(300)

const selectedProduct = computed(() =>
	props.products.find((product) => product.id === productId.value)
)
const matchingProducts = computed(() => {
	return filterProducts(props.products, productSearch.value)
})
const recentProducts = computed(() =>
	props.recentFoods.flatMap((entry) => {
		const product = props.products.find((item) => item.id === entry.productId)
		return product ? [{ product, quantity: entry.quantity }] : []
	})
)
const newProductReferenceQuantity = computed(() =>
	newProductUnit.value === 'piece' ? 1 : 100
)
const newProductUnitLabel = computed(() =>
	({ g: 'г', ml: 'мл', piece: 'шт.' })[newProductUnit.value]
)
const preview = computed(() => {
	if (!selectedProduct.value || selectedProduct.value.chars.nutritionKnown === false || !Number(quantity.value)) return null
	return {
		calories: selectedProduct.value.chars.calories * Number(quantity.value) / selectedProduct.value.quantity,
		proteins: selectedProduct.value.chars.proteins * Number(quantity.value) / selectedProduct.value.quantity,
	}
})
const drinkLabel = computed(() => ({
	water: 'воду',
	coffee: 'кофе',
	tea: 'чай',
	other: 'напиток',
})[drinkKind.value])

watch(
	() => props.products,
	(products) => {
		if (!products.length) return
		if (!products.some((product) => product.id === productId.value)) {
			productId.value = products[0].id
			quantity.value = products[0].quantity
		}
	},
	{ immediate: true }
)

watch(matchingProducts, (matches) => {
	if (productId.value && !matches.some((product) => product.id === productId.value)) {
		productId.value = ''
		quantity.value = ''
	}
})

function unitLabel(product: Product) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[product.chars.unit ?? 'g']
}

function selectProduct(id: string, recentQuantity?: number) {
	const product = props.products.find((item) => item.id === id)
	if (!product) return
	productId.value = id
	quantity.value = recentQuantity ?? product.quantity
}

function startNewProduct() {
	newProductName.value = productSearch.value.trim()
	formError.value = ''
	newProductRequestId.value = globalThis.crypto?.randomUUID?.()
		?? `product-${Date.now()}-${Math.random().toString(36).slice(2)}`
	creatingProduct.value = true
}

function cancelNewProduct() {
	creatingProduct.value = false
	formError.value = ''
	newProductRequestId.value = ''
}

function applyVolumePreset() {
	if (volumePreset.value !== 'custom') volumeMl.value = Number(volumePreset.value)
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

function submitFood() {
	const selectedQuantity = Number(quantity.value)
	if (
		!selectedProduct.value
		|| !matchingProducts.value.some((product) => product.id === selectedProduct.value?.id)
		|| !Number.isFinite(selectedQuantity)
		|| selectedQuantity <= 0
	) return
	emit('food', { productId: selectedProduct.value.id, quantity: selectedQuantity })
}

function submitNewProduct() {
	const name = newProductName.value.trim()
	const selectedQuantity = Number(newProductQuantity.value)
	if (!name || !Number.isFinite(selectedQuantity) || selectedQuantity <= 0) {
		formError.value = 'Введите название и количество больше нуля.'
		return
	}

	const parsedNutrition = parseOptionalNutrition({
		calories: newProductCalories.value,
		proteins: newProductProteins.value,
		fats: newProductFats.value,
		carbs: newProductCarbs.value,
	})
	if (!parsedNutrition.valid) {
		formError.value = parsedNutrition.reason === 'partial'
			? 'Укажите все четыре значения пищевой ценности или оставьте их пустыми.'
			: 'Пищевая ценность должна содержать только числа от нуля.'
		return
	}

	formError.value = ''
	emit('createFood', {
		name,
		unit: newProductUnit.value,
		referenceQuantity: newProductReferenceQuantity.value,
		quantity: selectedQuantity,
		nutrition: parsedNutrition.nutrition,
		idempotencyKey: newProductRequestId.value,
	})
}

function submitDrink() {
	const selectedVolume = Number(volumeMl.value)
	if (!Number.isFinite(selectedVolume) || selectedVolume <= 0) return
	emit('drink', { kind: drinkKind.value, volumeMl: selectedVolume })
}
</script>

<template>
	<section class="space-y-4" aria-label="Быстрая запись">
		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				class="rounded-lg border p-3 text-left font-semibold"
				:class="mode === 'food' ? 'border-primary bg-muted' : ''"
				:aria-pressed="mode === 'food'"
				@click="mode = 'food'"
			>
				Еда
				<span class="mt-1 block text-xs font-normal text-muted-foreground">Записать продукт</span>
			</button>
			<button
				type="button"
				class="rounded-lg border p-3 text-left font-semibold"
				:class="mode === 'drink' ? 'border-primary bg-muted' : ''"
				:aria-pressed="mode === 'drink'"
				@click="mode = 'drink'"
			>
				Напиток
				<span class="mt-1 block text-xs font-normal text-muted-foreground">Вода, кофе, чай и другое</span>
			</button>
		</div>

		<div v-if="mode === 'food' && creatingProduct" class="space-y-4">
			<button
				type="button"
				class="text-sm font-semibold text-primary underline-offset-2 hover:underline"
				:disabled="pending"
				@click="cancelNewProduct"
			>
				Назад к списку продуктов
			</button>
			<div>
				<h3 class="font-semibold">Добавить блюдо и записать порцию</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Название, единица и количество обязательны. Новое блюдо сохранится для следующих записей.
				</p>
			</div>
			<form class="space-y-3" @submit.prevent="submitNewProduct">
				<label class="block space-y-1 text-sm font-medium">
					<span>Название блюда</span>
					<Input v-model="newProductName" maxlength="120" placeholder="Например, блины с творогом" required />
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block space-y-1 text-sm font-medium">
						<span>Считать в</span>
						<select
							v-model="newProductUnit"
							class="h-10 w-full rounded-md border border-input bg-background px-3"
						>
							<option value="piece">Штуках</option>
							<option value="g">Граммах</option>
							<option value="ml">Миллилитрах</option>
						</select>
					</label>
					<label class="block space-y-1 text-sm font-medium">
						<span>Съедено</span>
						<Input v-model="newProductQuantity" type="number" min="0.1" step="any" required />
					</label>
				</div>
				<details class="rounded-lg border border-border px-3 py-2.5">
					<summary class="cursor-pointer text-sm font-semibold">
						Добавить пищевую ценность, если известна
					</summary>
					<p class="mt-2 text-xs text-muted-foreground">
						На {{ newProductReferenceQuantity }} {{ newProductUnitLabel }}.
						Если не знаете значения, оставьте все поля пустыми — мы не будем приписывать блюду нулевые калории.
					</p>
					<div class="mt-3 grid grid-cols-2 gap-3">
						<label class="space-y-1 text-sm">
							<span class="block">Калории, ккал</span>
							<Input v-model="newProductCalories" type="number" min="0" step="any" />
						</label>
						<label class="space-y-1 text-sm">
							<span class="block">Белки, г</span>
							<Input v-model="newProductProteins" type="number" min="0" step="any" />
						</label>
						<label class="space-y-1 text-sm">
							<span class="block">Жиры, г</span>
							<Input v-model="newProductFats" type="number" min="0" step="any" />
						</label>
						<label class="space-y-1 text-sm">
							<span class="block">Углеводы, г</span>
							<Input v-model="newProductCarbs" type="number" min="0" step="any" />
						</label>
					</div>
				</details>
				<p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
				<Button type="submit" class="w-full" :disabled="pending">
					{{ pending ? 'Сохраняю…' : 'Сохранить блюдо и запись' }}
				</Button>
			</form>
		</div>

		<form v-else-if="mode === 'food'" class="space-y-3" @submit.prevent="submitFood">
			<div v-if="recentProducts.length" class="space-y-2">
				<p class="text-sm font-medium">Недавно записывали</p>
				<div class="flex flex-wrap gap-2">
					<button
						v-for="entry in recentProducts"
						:key="entry.product.id"
						type="button"
						class="rounded-full border border-border px-3 py-2 text-sm hover:border-primary"
						:class="productId === entry.product.id ? 'border-primary bg-muted' : ''"
						:aria-pressed="productId === entry.product.id"
						@click="selectProduct(entry.product.id, entry.quantity)"
					>
						{{ entry.product.name }} · {{ formatNumber(entry.quantity) }} {{ unitLabel(entry.product) }}
					</button>
				</div>
			</div>
			<label class="block space-y-1 text-sm font-medium">
				<span>Найти продукт</span>
				<Input v-model="productSearch" type="search" placeholder="Например, яблоко" />
			</label>
			<div class="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-1" role="listbox" aria-label="Продукты">
				<button
					v-for="product in matchingProducts"
					:key="product.id"
					type="button"
					role="option"
					:aria-selected="productId === product.id"
					class="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
					:class="productId === product.id ? 'bg-muted font-semibold' : ''"
					@click="selectProduct(product.id)"
				>
					{{ product.name }}
				</button>
				<p v-if="!matchingProducts.length" class="px-3 py-2 text-sm text-muted-foreground">
					Ничего не найдено.
				</p>
			</div>
			<Button type="button" variant="outline" class="w-full" :disabled="pending" @click="startNewProduct">
				Добавить блюдо, которого нет в списке
			</Button>
			<p v-if="selectedProduct" class="text-sm text-muted-foreground">
				<template v-if="selectedProduct.chars.nutritionKnown === false">
					Пищевая ценность пока не указана.
				</template>
				<template v-else>
					Справочное значение:
					{{ formatNumber(selectedProduct.chars.calories) }} ккал
					за {{ selectedProduct.quantity }} {{ unitLabel(selectedProduct) }} · оценка
				</template>
			</p>
			<label class="block space-y-1 text-sm font-medium">
				<span>Количество, {{ selectedProduct ? unitLabel(selectedProduct) : 'г' }}</span>
				<Input v-model="quantity" type="number" min="0.1" step="any" required />
			</label>
			<p v-if="preview" class="text-sm">
				В дневник добавится примерно <strong>{{ formatNumber(preview.calories) }} ккал</strong>
				и {{ formatNumber(preview.proteins) }} г белка.
			</p>
			<Button type="submit" class="w-full" :disabled="pending || !selectedProduct">
				{{ pending ? 'Сохраняю...' : 'Записать еду' }}
			</Button>
		</form>

		<form v-else class="space-y-3" @submit.prevent="submitDrink">
			<label class="block space-y-1 text-sm font-medium">
				<span>Тип напитка</span>
				<select
					v-model="drinkKind"
					class="h-10 w-full rounded-md border border-input bg-background px-3"
				>
					<option value="water">Вода</option>
					<option value="coffee">Кофе</option>
					<option value="tea">Чай</option>
					<option value="other">Другой напиток</option>
				</select>
			</label>
			<label class="block space-y-1 text-sm font-medium">
				<span>Объём</span>
				<select
					v-model="volumePreset"
					class="h-10 w-full rounded-md border border-input bg-background px-3"
					@change="applyVolumePreset"
				>
					<option value="300">Стакан — 300 мл</option>
					<option value="500">Бутылка — 500 мл</option>
					<option value="1000">Бутылка — 1 л</option>
					<option value="1500">Бутылка — 1,5 л</option>
					<option value="custom">Свой объём</option>
				</select>
			</label>
			<label v-if="volumePreset === 'custom'" class="block space-y-1 text-sm font-medium">
				<span>Объём, мл</span>
				<Input v-model="volumeMl" type="number" min="1" step="1" required />
			</label>
			<p class="text-sm text-muted-foreground">
				В цель засчитывается только вода. Чай, кофе и другие напитки останутся в дневнике, но не увеличат счётчик воды.
			</p>
			<Button type="submit" class="w-full" :disabled="pending">
				{{ pending ? 'Сохраняю...' : `Записать ${drinkLabel}` }}
			</Button>
		</form>
	</section>
</template>
