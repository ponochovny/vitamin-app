<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'
import {
	filterProducts,
	getApproximatePortionQuantities,
	parseOptionalNutrition,
} from './diary'
import {
	normalizeDrinkTypeName,
	type DrinkKind,
	type DrinkTypeProfile,
} from './drinkType'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	parseProductIrritant,
} from '~/src/entities/product/irritant'

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
	irritant_ingredient?: string | null
	irritant_reason?: string | null
	composition?: string[]
}

type ProductUnit = 'g' | 'ml' | 'piece'

const props = defineProps<{
	products: Product[]
	recentFoods: Array<{ productId: string; quantity: number }>
	drinkTypes: DrinkTypeProfile[]
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
	drink: [
		entry: {
			kind: DrinkKind
			volumeMl: number
			drinkTypeId: string | null
			name: string | null
			irritant: { ingredient: string; reason: string } | null
		},
		onTypeSaved?: (id: string) => void,
	]
	editProduct: [product: Product]
}>()

const mode = shallowRef<'food' | 'drink'>('food')
const creatingProduct = shallowRef(false)
const productId = shallowRef('')
const productSearch = shallowRef('')
const quantity = shallowRef<number | ''>('')
const newProductName = shallowRef('')
const newProductUnit = shallowRef<ProductUnit>('piece')
const newProductQuantity = shallowRef<number | ''>(1)
const newProductCalories = shallowRef('')
const newProductProteins = shallowRef('')
const newProductFats = shallowRef('')
const newProductCarbs = shallowRef('')
const newProductRequestId = shallowRef('')
const formError = shallowRef('')
const newProductForm = useTemplateRef<HTMLFormElement>('newProductForm')
const addProductButtonContainer = useTemplateRef<HTMLDivElement>('addProductButtonContainer')
const drinkKind = shallowRef<'water' | 'coffee' | 'tea' | 'other'>('water')
const drinkTypeId = shallowRef('')
const drinkTypeName = shallowRef('')
const irritantMarked = shallowRef(false)
const irritantIngredient = shallowRef('')
const irritantReason = shallowRef('')
const drinkError = shallowRef('')
const volumePreset = shallowRef('300')
const volumeMl = shallowRef<number | ''>(300)

const selectedProduct = computed(() =>
	props.products.find((product) => product.id === productId.value)
)
const selectedProductPortions = computed(() => {
	const product = selectedProduct.value
	return product
		? getApproximatePortionQuantities(
			product.quantity,
			product.chars.unit ?? 'g',
		)
		: []
})
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
const newProductPortions = computed(() =>
	getApproximatePortionQuantities(
		newProductReferenceQuantity.value,
		newProductUnit.value,
	)
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
	coffee: 'каву',
	tea: 'чай',
	other: 'напій',
})[drinkKind.value])
const drinkTypesForKind = computed(() =>
	props.drinkTypes.filter((type) => type.kind === drinkKind.value),
)
const selectedDrinkType = computed(() =>
	props.drinkTypes.find(
		(type) => type.id === drinkTypeId.value && type.kind === drinkKind.value,
	),
)

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

watch(
	() => {
		const type = selectedDrinkType.value
		return {
			id: type?.id ?? null,
			irritantIngredient: type?.irritant_ingredient ?? '',
			irritantReason: type?.irritant_reason ?? '',
		}
	},
	(type, previousType) => {
		const hasDirtyDraft =
			irritantMarked.value !== Boolean(previousType.irritantIngredient)
			|| irritantIngredient.value !== previousType.irritantIngredient
			|| irritantReason.value !== previousType.irritantReason

		if (type.id !== previousType.id || !hasDirtyDraft) {
			irritantMarked.value = Boolean(type.irritantIngredient)
			irritantIngredient.value = type.irritantIngredient
			irritantReason.value = type.irritantReason
		}
		drinkError.value = ''
	}
)

function unitLabel(product: Product) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[product.chars.unit ?? 'g']
}

function selectProduct(id: string, recentQuantity?: number) {
	const product = props.products.find((item) => item.id === id)
	if (!product) return
	productId.value = id
	quantity.value = recentQuantity ?? product.quantity
	productSearch.value = ''
}

async function startNewProduct() {
	newProductName.value = productSearch.value.trim()
	newProductUnit.value = 'piece'
	newProductQuantity.value = 1
	newProductCalories.value = ''
	newProductProteins.value = ''
	newProductFats.value = ''
	newProductCarbs.value = ''
	formError.value = ''
	newProductRequestId.value = globalThis.crypto?.randomUUID?.()
		?? `product-${Date.now()}-${Math.random().toString(36).slice(2)}`
	creatingProduct.value = true
	await nextTick()
	newProductForm.value?.querySelector<HTMLInputElement>('input')?.focus()
}

async function cancelNewProduct() {
	creatingProduct.value = false
	formError.value = ''
	newProductRequestId.value = ''
	await nextTick()
	addProductButtonContainer.value?.querySelector('button')?.focus()
}

function applyVolumePreset() {
	if (volumePreset.value !== 'custom') volumeMl.value = Number(volumePreset.value)
}

function resetDrinkType() {
	drinkTypeId.value = ''
	drinkTypeName.value =
		drinkKind.value === 'coffee'
			? 'Кава'
			: drinkKind.value === 'tea'
				? 'Чай'
				: ''
	irritantMarked.value = false
	irritantIngredient.value = ''
	irritantReason.value = ''
	drinkError.value = ''
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

function submitFood() {
	const selectedQuantity = Number(quantity.value)
	if (
		!selectedProduct.value
		|| !props.products.some((product) => product.id === selectedProduct.value?.id)
		|| !Number.isFinite(selectedQuantity)
		|| selectedQuantity <= 0
	) return
	emit('food', { productId: selectedProduct.value.id, quantity: selectedQuantity })
}

function submitNewProduct() {
	const name = newProductName.value.trim()
	const selectedQuantity = Number(newProductQuantity.value)
	if (!name || !Number.isFinite(selectedQuantity) || selectedQuantity <= 0) {
		formError.value = 'Вкажіть назву та кількість, більшу за нуль.'
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
			? 'Укажіть усі чотири значення харчової цінності або залиште поля порожніми.'
			: 'Значення харчової цінності мають бути невід’ємними числами.'
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
	if (!Number.isFinite(selectedVolume) || selectedVolume <= 0) {
		drinkError.value = 'Вкажіть об’єм, більший за нуль.'
		return
	}

	if (drinkKind.value === 'water') {
		emit('drink', {
			kind: 'water',
			volumeMl: selectedVolume,
			drinkTypeId: null,
			name: null,
			irritant: null,
		})
		return
	}

	const normalizedName = normalizeDrinkTypeName(
		selectedDrinkType.value?.name ?? drinkTypeName.value,
	)
	if (!normalizedName.name) {
		drinkError.value = 'Вкажіть назву виду напою.'
		return
	}
	if (
		!selectedDrinkType.value
		&& props.drinkTypes.some(
			(type) => normalizeDrinkTypeName(type.name).nameKey === normalizedName.nameKey,
		)
	) {
		drinkError.value = 'Цей вид уже є у списку. Оберіть його вище.'
		return
	}

	const irritantResult = parseProductIrritant(
		irritantMarked.value ? irritantIngredient.value : '',
		irritantMarked.value ? irritantReason.value : '',
	)
	if (!irritantResult.valid) {
		drinkError.value =
			irritantResult.reason === 'incomplete'
				? 'Укажіть інгредієнт і причину помітки.'
				: 'Перевірте довжину полів помітки про подразник.'
		return
	}

	drinkError.value = ''
	emit('drink', {
		kind: drinkKind.value,
		volumeMl: selectedVolume,
		drinkTypeId: selectedDrinkType.value?.id ?? null,
		name: normalizedName.name,
		irritant: irritantResult.value,
	}, (id) => {
		drinkTypeId.value = id
	})
}
</script>

<template>
	<section class="space-y-4" aria-label="Швидкий запис">
		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				class="rounded-lg border p-3 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				:class="mode === 'food' ? 'border-primary bg-muted' : ''"
				:aria-pressed="mode === 'food'"
				@click="mode = 'food'"
			>
				Їжа
				<span class="mt-1 block text-xs font-normal text-muted-foreground">Записати продукт</span>
			</button>
			<button
				type="button"
				class="rounded-lg border p-3 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				:class="mode === 'drink' ? 'border-primary bg-muted' : ''"
				:aria-pressed="mode === 'drink'"
				@click="mode = 'drink'"
			>
				Напій
				<span class="mt-1 block text-xs font-normal text-muted-foreground">Вода, кава, чай та інші напої</span>
			</button>
		</div>

		<div v-if="mode === 'food' && creatingProduct" class="space-y-4">
			<button
				type="button"
				class="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				:disabled="pending"
				@click="cancelNewProduct"
			>
				Назад до списку продуктів
			</button>
			<div>
				<h3 class="font-semibold">Додати страву та записати порцію</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Назва, одиниця виміру та кількість обов’язкові. Нову страву буде збережено для наступних записів.
				</p>
			</div>
			<form ref="newProductForm" class="space-y-3" @submit.prevent="submitNewProduct">
				<label class="block space-y-1 text-sm font-medium">
					<span>Назва страви</span>
					<Input v-model="newProductName" maxlength="120" placeholder="Наприклад, млинці з сиром" required />
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block space-y-1 text-sm font-medium">
						<span>Одиниця виміру</span>
						<select
							v-model="newProductUnit"
							class="h-10 min-h-11 w-full rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						>
							<option value="piece">Штуках</option>
							<option value="g">Грамах</option>
							<option value="ml">Мілілітрах</option>
						</select>
					</label>
					<label class="block space-y-1 text-sm font-medium">
						<span>З’їдено</span>
						<Input v-model="newProductQuantity" type="number" min="0.1" step="any" required />
					</label>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium">Швидкий вибір порції · приблизно</p>
					<div class="flex flex-wrap gap-2" role="group" aria-label="Приблизний розмір порції">
						<button
							v-for="portion in newProductPortions"
							:key="portion"
							type="button"
							class="min-h-11 rounded-full border border-border px-3 py-2 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:aria-pressed="Number(newProductQuantity) === portion"
							@click="newProductQuantity = portion"
						>
							{{ formatNumber(portion) }} {{ newProductUnitLabel }}
						</button>
					</div>
					<p class="text-xs text-muted-foreground">
						{{
							newProductUnit === 'piece'
								? 'Оберіть 1 або 2 штуки.'
								: `Варіанти розраховано від довідкових 100 ${newProductUnitLabel}.`
						}}
						Кількість можна змінити вручну.
					</p>
				</div>
				<details class="rounded-lg border border-border px-3 py-2.5">
					<summary class="flex min-h-11 cursor-pointer items-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
						Додати харчову цінність, якщо вона відома
					</summary>
					<p class="mt-2 text-xs text-muted-foreground">
						На {{ newProductReferenceQuantity }} {{ newProductUnitLabel }}.
						Якщо значення невідомі, залиште всі поля порожніми — ми не вважатимемо калорійність страви нульовою.
					</p>
					<div class="mt-3 grid grid-cols-2 gap-3">
						<label class="space-y-1 text-sm">
							<span class="block">Калорії, ккал</span>
							<Input v-model="newProductCalories" type="text" inputmode="decimal" placeholder="Наприклад, 6,7" />
						</label>
						<label class="space-y-1 text-sm">
							<span class="block">Білки, г</span>
							<Input v-model="newProductProteins" type="text" inputmode="decimal" placeholder="Наприклад, 6,7" />
						</label>
						<label class="space-y-1 text-sm">
							<span class="block">Жири, г</span>
							<Input v-model="newProductFats" type="text" inputmode="decimal" placeholder="Наприклад, 6,7" />
						</label>
						<label class="space-y-1 text-sm">
							<span class="block">Вуглеводи, г</span>
							<Input v-model="newProductCarbs" type="text" inputmode="decimal" placeholder="Наприклад, 6,7" />
						</label>
					</div>
				</details>
				<p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
				<Button type="submit" class="min-h-11 w-full" :disabled="pending">
					{{ pending ? 'Зберігаю…' : 'Зберегти страву та запис' }}
				</Button>
			</form>
		</div>

		<form v-else-if="mode === 'food'" class="space-y-3" @submit.prevent="submitFood">
			<div v-if="recentProducts.length" class="space-y-2">
				<p class="text-sm font-medium">Нещодавно записували</p>
				<div class="flex flex-wrap gap-2">
					<div
						v-for="entry in recentProducts"
						:key="entry.product.id"
						class="flex items-center gap-1"
					>
						<button
							type="button"
							class="min-h-11 rounded-full border border-border px-3 py-2 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:class="productId === entry.product.id ? 'border-primary bg-muted' : ''"
							:aria-pressed="productId === entry.product.id"
							@click="selectProduct(entry.product.id, entry.quantity)"
						>
							{{ entry.product.name }} · {{ formatNumber(entry.quantity) }} {{ unitLabel(entry.product) }}
							<span
								v-if="entry.product.irritant_ingredient"
								class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950"
							>
								Можливий подразник
							</span>
						</button>
						<button
							v-if="entry.product.irritant_ingredient"
							type="button"
							class="min-h-11 min-w-11 rounded-full border border-amber-300 text-sm font-bold text-amber-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							:aria-label="`Пояснення помітки про подразник у продукті ${entry.product.name}: ${entry.product.irritant_ingredient}`"
							@click="emit('editProduct', entry.product)"
						>
							<span aria-hidden="true">i</span>
						</button>
					</div>
				</div>
			</div>
			<label class="block space-y-1 text-sm font-medium">
				<span>Знайти продукт</span>
				<Input v-model="productSearch" type="search" placeholder="Наприклад, яблуко" />
			</label>
			<div class="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-1" role="group" aria-label="Продукти">
				<div
					v-for="product in matchingProducts"
					:key="product.id"
					class="flex gap-1"
				>
					<button
						type="button"
						:aria-pressed="productId === product.id"
						class="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						:class="productId === product.id ? 'bg-muted font-semibold' : ''"
						@click="selectProduct(product.id)"
					>
						<span class="truncate">{{ product.name }}</span>
						<span
							v-if="product.irritant_ingredient"
							class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950"
						>
							Можливий подразник
						</span>
					</button>
					<button
						v-if="product.irritant_ingredient"
						type="button"
						class="min-h-11 min-w-11 rounded border border-amber-300 text-sm font-bold text-amber-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						:aria-label="`Пояснення помітки про подразник у продукті ${product.name}: ${product.irritant_ingredient}`"
						@click="emit('editProduct', product)"
					>
						<span aria-hidden="true">i</span>
					</button>
				</div>
				<p v-if="!matchingProducts.length" role="status" class="px-3 py-2 text-sm text-muted-foreground">
					Нічого не знайдено.
				</p>
			</div>
			<div ref="addProductButtonContainer">
				<Button
					type="button"
					variant="outline"
					class="min-h-11 w-full"
					:disabled="pending"
					@click="startNewProduct"
				>
					Додати страву, якої немає у списку
				</Button>
			</div>
			<p v-if="selectedProduct" class="text-sm text-muted-foreground">
				<template v-if="selectedProduct.chars.nutritionKnown === false">
					Харчову цінність поки не зазначено.
				</template>
				<template v-else>
					Довідкове значення:
					{{ formatNumber(selectedProduct.chars.calories) }} ккал
					за {{ selectedProduct.quantity }} {{ unitLabel(selectedProduct) }} · орієнтовне значення
				</template>
			</p>
			<Button
				v-if="selectedProduct"
				type="button"
				variant="outline"
				class="min-h-11 w-full"
				:disabled="pending"
				@click="emit('editProduct', selectedProduct)"
			>
				Довідка та редагування продукту
			</Button>
			<label class="block space-y-1 text-sm font-medium">
				<span>Кількість, {{ selectedProduct ? unitLabel(selectedProduct) : 'г' }}</span>
				<Input v-model="quantity" type="number" min="0.1" step="any" required />
			</label>
			<div v-if="selectedProductPortions.length" class="space-y-2">
				<p class="text-sm font-medium">Швидкий вибір порції · приблизно</p>
				<div class="flex flex-wrap gap-2" role="group" aria-label="Приблизний розмір порції">
					<button
						v-for="portion in selectedProductPortions"
						:key="portion"
						type="button"
						class="min-h-11 rounded-full border border-border px-3 py-2 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						:aria-pressed="Number(quantity) === portion"
						@click="quantity = portion"
					>
						{{ formatNumber(portion) }} {{ selectedProduct ? unitLabel(selectedProduct) : '' }}
					</button>
				</div>
				<p
					v-if="selectedProduct && selectedProduct.chars.unit !== 'piece'"
					class="text-xs text-muted-foreground"
				>
					Варіанти розраховано від довідкової кількості
					{{ formatNumber(selectedProduct.quantity) }} {{ unitLabel(selectedProduct) }}.
					Кількість можна змінити вручну.
				</p>
				<p v-else class="text-xs text-muted-foreground">
					Оберіть приблизну кількість або введіть її вручну.
				</p>
			</div>
			<p v-if="preview" class="text-sm">
				До щоденника буде записано приблизно <strong>{{ formatNumber(preview.calories) }} ккал</strong>
				і {{ formatNumber(preview.proteins) }} г білка.
			</p>
			<Button type="submit" class="min-h-11 w-full" :disabled="pending || !selectedProduct">
				{{ pending ? 'Зберігаю...' : 'Записати їжу' }}
			</Button>
		</form>

		<form v-else class="space-y-3" @submit.prevent="submitDrink">
			<label class="block space-y-1 text-sm font-medium">
				<span>Тип напою</span>
				<select
					v-model="drinkKind"
					class="h-10 min-h-11 w-full rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
					@change="resetDrinkType"
				>
					<option value="water">Вода</option>
					<option value="coffee">Кава</option>
					<option value="tea">Чай</option>
					<option value="other">Інший напій</option>
				</select>
			</label>
			<template v-if="drinkKind !== 'water'">
				<label class="block space-y-1 text-sm font-medium">
					<span>Вид напою</span>
					<select
						v-model="drinkTypeId"
						class="h-10 min-h-11 w-full rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
					>
						<option value="">Додати новий вид</option>
						<option
							v-for="type in drinkTypesForKind"
							:key="type.id"
							:value="type.id"
						>
							{{ type.name }}
						</option>
					</select>
				</label>
				<label v-if="!drinkTypeId" class="block space-y-1 text-sm font-medium">
					<span>Назва виду</span>
					<Input
						v-model="drinkTypeName"
						type="text"
						maxlength="120"
						placeholder="Наприклад, зелений чай або молоко"
						required
					/>
				</label>
				<fieldset class="space-y-3 rounded-xl border border-border p-3">
					<legend class="px-1 text-sm font-semibold">Особиста помітка</legend>
					<label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
						<input
							v-model="irritantMarked"
							type="checkbox"
							class="size-4 accent-primary"
						/>
						Позначити можливим подразником
					</label>
					<p class="text-sm text-muted-foreground">
						Помітка стосується цього виду напою. Вона не є медичним висновком.
					</p>
					<template v-if="irritantMarked">
						<label class="block space-y-1 text-sm font-medium">
							<span>Інгредієнт або компонент</span>
							<Input
								v-model="irritantIngredient"
								type="text"
								:maxlength="IRRITANT_INGREDIENT_MAX_LENGTH"
								required
							/>
						</label>
						<label class="block space-y-1 text-sm font-medium">
							<span>Чому позначено</span>
							<textarea
								v-model="irritantReason"
								class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
								:maxlength="IRRITANT_REASON_MAX_LENGTH"
								rows="3"
								required
							/>
						</label>
					</template>
				</fieldset>
			</template>
			<label class="block space-y-1 text-sm font-medium">
				<span>Об’єм</span>
				<select
					v-model="volumePreset"
					class="h-10 min-h-11 w-full rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
					@change="applyVolumePreset"
				>
					<option value="300">Склянка — 300 мл</option>
					<option value="500">Пляшка — 500 мл</option>
					<option value="1000">Пляшка — 1 л</option>
					<option value="1500">Пляшка — 1,5 л</option>
					<option value="custom">Власний об’єм</option>
				</select>
			</label>
			<label v-if="volumePreset === 'custom'" class="block space-y-1 text-sm font-medium">
				<span>Об’єм, мл</span>
				<Input v-model="volumeMl" type="number" min="1" step="1" required />
			</label>
			<p class="text-sm text-muted-foreground">
				До цілі зараховується лише вода. Чай, кава та інші напої залишаться у щоденнику, але не збільшать лічильник води.
			</p>
			<p v-if="drinkError" role="alert" class="text-sm text-destructive">
				{{ drinkError }}
			</p>
			<Button type="submit" class="min-h-11 w-full" :disabled="pending">
				{{ pending ? 'Зберігаю...' : `Записати ${drinkKind === 'water' ? drinkLabel : drinkTypeName || selectedDrinkType?.name || drinkLabel}` }}
			</Button>
		</form>
	</section>
</template>
