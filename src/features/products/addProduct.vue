<template>
	<form
		@submit.prevent="addFood"
		class="flex flex-col gap-2 max-w-[400px] mx-auto"
	>
		<Input v-model="name" placeholder="Назва" required />
		<div class="grid grid-cols-[1fr_120px] gap-2">
			<Input v-model="quantity" type="number" :placeholder="quantityPlaceholder" />
			<select
				v-model="unit"
				class="h-10 rounded-md border border-input bg-background px-3 text-sm"
				aria-label="Одиниця порції"
			>
				<option value="g">грами</option>
				<option value="ml">мілілітри</option>
				<option value="piece">штуки</option>
			</select>
		</div>
		<select
			v-model="portion"
			class="h-10 rounded-md border border-input bg-background px-3 text-sm"
			aria-label="Приблизна порція"
		>
			<option value="exact">Точна порція</option>
			<option value="small">Невелика порція — приблизно</option>
			<option value="medium">Середня порція — приблизно</option>
			<option value="large">Велика порція — приблизно</option>
		</select>
		<p class="font-bold">Characteristics</p>
		<Input v-model="calories" type="number" placeholder="Calories" />
		<Input v-model="fats" type="number" step="any" placeholder="Fats" />
		<Input v-model="proteins" type="number" step="any" placeholder="Proteins" />
		<Input v-model="carbs" type="number" step="any" placeholder="Carbs" />
		<p>Vitamins</p>
		<Input
			v-model="vitaminA"
			type="number"
			step="any"
			placeholder="Vitamin A"
		/>
		<Input
			v-model="vitaminB"
			type="number"
			step="any"
			placeholder="Vitamin B"
		/>
		<Input
			v-model="vitaminC"
			type="number"
			step="any"
			placeholder="Vitamin C"
		/>
		<p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
		<p v-if="success" role="status" class="text-green-700">{{ success }}</p>
		<Button type="submit" :disabled="pending">
			{{ pending ? 'Зберігаємо...' : 'Додати' }}
		</Button>
	</form>
</template>

<script lang="ts" setup>
import addProduct from '~/src/entities/product/api/addProduct'
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const name = shallowRef('')
const quantity = shallowRef('')
const unit = shallowRef<'g' | 'ml' | 'piece'>('g')
const portion = shallowRef<'exact' | 'small' | 'medium' | 'large'>('exact')
const calories = shallowRef<number | null>(null)
const fats = shallowRef<number | null>(null)
const proteins = shallowRef<number | null>(null)
const carbs = shallowRef<number | null>(null)
const vitaminA = shallowRef<number | null>(null)
const vitaminB = shallowRef<number | null>(null)
const vitaminC = shallowRef<number | null>(null)
const pending = shallowRef(false)
const error = shallowRef('')
const success = shallowRef('')
const dashboardCache = useState<Record<string, unknown>>('dashboard-cache', () => ({}))
const quantityPlaceholder = computed(() => {
	if (unit.value === 'ml') return 'Об’єм, мл'
	if (unit.value === 'piece') return 'Кількість, шт.'
	return 'Вага, г'
})

async function addFood() {
	if (pending.value) return
	if (!user.value) {
		error.value = 'Потрібно увійти в акаунт'
		return
	}
	const id = user.value.id

	pending.value = true
	error.value = ''
	success.value = ''

	const { error: saveError } = await addProduct(supabase, id, {
		name: name.value,
		quantity: Number(quantity.value),
		chars: {
			calories: calories.value ?? 0,
			fats: fats.value ?? 0,
			proteins: proteins.value ?? 0,
			carbs: carbs.value ?? 0,
			unit: unit.value,
			portion: portion.value,
			vitamins: {
				vitaminA: vitaminA.value ?? 0,
				vitaminB: vitaminB.value ?? 0,
				vitaminC: vitaminC.value ?? 0,
			},
		},
	})

	pending.value = false
	if (saveError) {
		error.value = 'Не вдалося зберегти продукт. Перевірте з’єднання та спробуйте ще раз.'
		return
	}

	name.value = ''
	quantity.value = ''
	calories.value = null
	fats.value = null
	proteins.value = null
	carbs.value = null
	vitaminA.value = null
	vitaminB.value = null
	vitaminC.value = null
	for (const key of Object.keys(dashboardCache.value)) {
		if (key.startsWith(`${id}:`)) delete dashboardCache.value[key]
	}
	success.value = 'Продукт збережено'
}
</script>
