<template>
	<form @submit.prevent="addFood" class="flex flex-col gap-2 max-w-100 mx-auto">
		<Input v-model="name" placeholder="Назва" required />
		<div class="grid grid-cols-[1fr_120px] gap-2">
			<Input
				v-model="quantity"
				type="number"
				:placeholder="quantityPlaceholder"
			/>
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
		<Input v-model="calories" type="text" inputmode="decimal" placeholder="Calories" />
		<Input v-model="fats" type="text" inputmode="decimal" placeholder="Fats" />
		<Input v-model="proteins" type="text" inputmode="decimal" placeholder="Proteins" />
		<Input v-model="carbs" type="text" inputmode="decimal" placeholder="Carbs" />
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
import { parseDecimalInput } from '~/src/shared/numbers'
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const name = shallowRef('')
const quantity = shallowRef('')
const unit = shallowRef<'g' | 'ml' | 'piece'>('g')
const portion = shallowRef<'exact' | 'small' | 'medium' | 'large'>('exact')
const calories = shallowRef('')
const fats = shallowRef('')
const proteins = shallowRef('')
const carbs = shallowRef('')
const vitaminA = shallowRef<number | null>(null)
const vitaminB = shallowRef<number | null>(null)
const vitaminC = shallowRef<number | null>(null)
const pending = shallowRef(false)
const error = shallowRef('')
const success = shallowRef('')
const dashboardCache = useState<Record<string, unknown>>(
	'dashboard-cache',
	() => ({}),
)
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
	const nutritionValues = [calories.value, fats.value, proteins.value, carbs.value]
		.map((value) => value.trim() ? parseDecimalInput(value) : 0)
	if (nutritionValues.some((value) => !Number.isFinite(value) || value < 0)) {
		error.value = 'Вкажіть невід’ємні числа для калорій і БЖУ.'
		return
	}

	pending.value = true
	error.value = ''
	success.value = ''

	const { error: saveError } = await addProduct(supabase, id, {
		name: name.value,
		quantity: Number(quantity.value),
		chars: {
			calories: nutritionValues[0],
			fats: nutritionValues[1],
			proteins: nutritionValues[2],
			carbs: nutritionValues[3],
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
		error.value =
			'Не вдалося зберегти продукт. Перевірте з’єднання та спробуйте ще раз.'
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
