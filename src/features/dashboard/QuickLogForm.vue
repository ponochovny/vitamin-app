<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

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

const props = defineProps<{
	products: Product[]
	pending: boolean
	errorMessage: string
	notice: string
}>()

const emit = defineEmits<{
	food: [entry: { productId: string; quantity: number }]
	drink: [entry: { kind: 'water' | 'coffee' | 'tea' | 'other'; volumeMl: number }]
}>()

const mode = shallowRef<'food' | 'drink'>('food')
const productId = shallowRef('')
const quantity = shallowRef<number | ''>('')
const drinkKind = shallowRef<'water' | 'coffee' | 'tea' | 'other'>('water')
const volumePreset = shallowRef('300')
const volumeMl = shallowRef<number | ''>(300)

const selectedProduct = computed(() =>
	props.products.find((product) => product.id === productId.value)
)
const preview = computed(() => {
	if (!selectedProduct.value || !Number(quantity.value)) return null
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
		}
	},
	{ immediate: true }
)

watch(selectedProduct, (product) => {
	if (product) quantity.value = product.quantity
})

function unitLabel(product: Product) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[product.chars.unit ?? 'g']
}

function applyVolumePreset() {
	if (volumePreset.value !== 'custom') volumeMl.value = Number(volumePreset.value)
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

function submitFood() {
	const selectedQuantity = Number(quantity.value)
	if (!selectedProduct.value || !Number.isFinite(selectedQuantity) || selectedQuantity <= 0) return
	emit('food', { productId: selectedProduct.value.id, quantity: selectedQuantity })
}

function submitDrink() {
	const selectedVolume = Number(volumeMl.value)
	if (!Number.isFinite(selectedVolume) || selectedVolume <= 0) return
	emit('drink', { kind: drinkKind.value, volumeMl: selectedVolume })
}
</script>

<template>
	<section class="space-y-4" aria-label="Быстрая запись">
		<div class="space-y-2">
			<p v-if="errorMessage" role="alert" class="text-sm text-red-600">{{ errorMessage }}</p>
			<p v-if="notice" role="status" class="text-sm text-green-700">{{ notice }}</p>
		</div>
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

		<form v-if="mode === 'food'" class="space-y-3" @submit.prevent="submitFood">
			<label class="block space-y-1 text-sm font-medium">
				<span>Выбери продукт</span>
				<select
					v-model="productId"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3"
				>
					<option v-for="product in products" :key="product.id" :value="product.id">
						{{ product.name }}
					</option>
				</select>
			</label>
			<p v-if="selectedProduct" class="text-sm text-muted-foreground">
				Справочное значение: {{ formatNumber(selectedProduct.chars.calories) }} ккал
				за {{ selectedProduct.quantity }} {{ unitLabel(selectedProduct) }} · оценка
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
				В общий объём напитков записываются вода, кофе и чай. Чистая вода учитывается отдельно.
			</p>
			<Button type="submit" class="w-full" :disabled="pending">
				{{ pending ? 'Сохраняю...' : `Записать ${drinkLabel}` }}
			</Button>
		</form>
	</section>
</template>
