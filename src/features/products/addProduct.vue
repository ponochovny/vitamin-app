<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import addProduct from '~/src/entities/product/api/addProduct'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	PRODUCT_COMPOSITION_MAX_ITEMS,
	parseProductComposition,
	parseProductIrritant,
} from '~/src/entities/product/irritant'
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
const irritantMarked = shallowRef(false)
const irritantIngredient = shallowRef('')
const irritantReason = shallowRef('')
const composition = shallowRef('')
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

	const irritantResult = parseProductIrritant(
		irritantMarked.value ? irritantIngredient.value : '',
		irritantMarked.value ? irritantReason.value : '',
	)
	if (!irritantResult.valid) {
		error.value =
			irritantResult.reason === 'incomplete'
				? 'Укажіть інгредієнт і причину помітки.'
				: 'Перевірте довжину полів помітки про подразник.'
		return
	}
	const compositionResult = parseProductComposition(composition.value)
	if (!compositionResult.valid) {
		error.value =
			compositionResult.reason === 'too-many'
				? `Укажіть не більше ${PRODUCT_COMPOSITION_MAX_ITEMS} компонентів складу.`
				: 'Перевірте довжину кожного компонента складу.'
		return
	}

	pending.value = true
	error.value = ''
	success.value = ''

	const { error: saveError } = await addProduct(supabase, id, {
		name: name.value,
		quantity: Number(quantity.value),
		composition: compositionResult.value,
		irritant: irritantResult.value,
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
	calories.value = ''
	fats.value = ''
	proteins.value = ''
	carbs.value = ''
	vitaminA.value = null
	vitaminB.value = null
	vitaminC.value = null
	irritantMarked.value = false
	irritantIngredient.value = ''
	irritantReason.value = ''
	composition.value = ''
	for (const key of Object.keys(dashboardCache.value)) {
		if (key.startsWith(`${id}:`)) delete dashboardCache.value[key]
	}
	success.value = 'Продукт збережено'
}
</script>

<template>
	<form @submit.prevent="addFood" class="mx-auto flex max-w-100 flex-col gap-3">
		<label class="space-y-1 text-sm font-medium">
			<span class="block">Назва продукту</span>
			<Input v-model="name" required class="min-h-11" />
		</label>
		<div class="grid grid-cols-[1fr_120px] items-end gap-2">
			<label class="space-y-1 text-sm font-medium">
				<span class="block">{{ quantityPlaceholder }}</span>
				<Input
					v-model="quantity"
					type="number"
					class="min-h-11"
				/>
			</label>
			<label class="space-y-1 text-sm font-medium">
				<span class="sr-only">Одиниця порції</span>
				<select
					v-model="unit"
					class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					<option value="g">грами</option>
					<option value="ml">мілілітри</option>
					<option value="piece">штуки</option>
				</select>
			</label>
		</div>
		<label class="space-y-1 text-sm font-medium">
			<span class="block">Приблизна порція</span>
			<select
				v-model="portion"
				class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				<option value="exact">Точна порція</option>
				<option value="small">Невелика порція — приблизно</option>
				<option value="medium">Середня порція — приблизно</option>
				<option value="large">Велика порція — приблизно</option>
			</select>
		</label>
		<fieldset class="grid gap-2 sm:grid-cols-2">
			<legend class="col-span-full font-bold">Харчова цінність</legend>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Енергія, ккал</span>
				<Input v-model="calories" type="text" inputmode="decimal" class="min-h-11" />
			</label>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Білки, г</span>
				<Input v-model="proteins" type="text" inputmode="decimal" class="min-h-11" />
			</label>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Жири, г</span>
				<Input v-model="fats" type="text" inputmode="decimal" class="min-h-11" />
			</label>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Вуглеводи, г</span>
				<Input v-model="carbs" type="text" inputmode="decimal" class="min-h-11" />
			</label>
		</fieldset>
		<fieldset class="grid gap-2 sm:grid-cols-2">
			<legend class="col-span-full font-bold">Вітаміни</legend>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Вітамін A</span>
				<Input v-model="vitaminA" type="number" step="any" class="min-h-11" />
			</label>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Вітамін B</span>
				<Input v-model="vitaminB" type="number" step="any" class="min-h-11" />
			</label>
			<label class="space-y-1 text-sm font-medium">
				<span class="block">Вітамін C</span>
				<Input v-model="vitaminC" type="number" step="any" class="min-h-11" />
			</label>
		</fieldset>
		<label class="space-y-1 text-sm font-medium">
			<span class="block">Склад продукту</span>
			<textarea
				v-model="composition"
				class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				placeholder="Наприклад: молоко, овес, сіль"
				rows="3"
			/>
			<span class="block text-xs font-normal text-muted-foreground">
				Необов’язково. Перерахуйте компоненти через кому.
			</span>
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
				Помітку бачите лише ви. Вона не є медичним висновком.
			</p>
			<template v-if="irritantMarked">
				<label class="space-y-1 text-sm font-medium">
					<span class="block">Інгредієнт</span>
					<Input
						v-model="irritantIngredient"
						type="text"
						:maxlength="IRRITANT_INGREDIENT_MAX_LENGTH"
						required
						class="min-h-11"
					/>
				</label>
				<label class="space-y-1 text-sm font-medium">
					<span class="block">Чому позначено</span>
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
		<p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
		<p v-if="success" role="status" class="text-green-700">{{ success }}</p>
		<Button type="submit" class="min-h-11" :disabled="pending">
			{{ pending ? 'Зберігаємо...' : 'Додати' }}
		</Button>
	</form>
</template>
