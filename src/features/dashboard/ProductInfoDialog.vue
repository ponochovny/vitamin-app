<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import {
	type FoodProductInfo,
	type LoggedFoodInfo,
} from './foodProduct'
import { parseDecimalInput } from '~/src/shared/numbers'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	parseProductIrritant,
} from '~/src/entities/product/irritant'

const props = defineProps<{
	open: boolean
	product: FoodProductInfo | null
	logged: LoggedFoodInfo | null
}>()

const emit = defineEmits<{
	'update:open': [open: boolean]
	saved: [product: FoodProductInfo]
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const editing = shallowRef(false)
const pending = shallowRef(false)
const editError = shallowRef('')
const editSuccess = shallowRef('')
const nameDraft = shallowRef('')
const irritantMarked = shallowRef(false)
const irritantIngredientDraft = shallowRef('')
const irritantReasonDraft = shallowRef('')
const draft = reactive<Record<'calories' | 'proteins' | 'fats' | 'carbs', string>>({
	calories: '',
	proteins: '',
	fats: '',
	carbs: '',
})

const nutrientLabels = [
	{ key: 'calories', label: 'Енергія', unit: 'ккал' },
	{ key: 'proteins', label: 'Білки', unit: 'г' },
	{ key: 'fats', label: 'Жири', unit: 'г' },
	{ key: 'carbs', label: 'Вуглеводи', unit: 'г' },
] as const

function unitLabel(unit: FoodProductInfo['chars']['unit'] | undefined) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[unit ?? 'g']
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}

function startEditing() {
	if (!props.product || !user.value) return
	nameDraft.value = props.product.name
	irritantMarked.value = Boolean(props.product.irritant_ingredient)
	irritantIngredientDraft.value = props.product.irritant_ingredient ?? ''
	irritantReasonDraft.value = props.product.irritant_reason ?? ''
	for (const { key } of nutrientLabels) {
		draft[key] =
			props.product.chars.nutritionKnown === false
				? ''
				: String(props.product.chars[key])
	}
	editError.value = ''
	editSuccess.value = ''
	editing.value = true
}

function cancelEditing() {
	editing.value = false
	editError.value = ''
}

function updateOpen(open: boolean) {
	if (!open) {
		editing.value = false
		editError.value = ''
		editSuccess.value = ''
	}
	emit('update:open', open)
}

async function saveNutrition() {
	const product = props.product
	const userId = user.value?.id
	if (!product || !userId || pending.value) return
	const name = nameDraft.value.trim()
	if (!name) {
		editError.value = 'Вкажіть назву продукту.'
		return
	}

	const values = {
		calories: parseDecimalInput(draft.calories),
		proteins: parseDecimalInput(draft.proteins),
		fats: parseDecimalInput(draft.fats),
		carbs: parseDecimalInput(draft.carbs),
	}
	if (
		nutrientLabels.some(
			({ key }) =>
				!String(draft[key]).trim() ||
				!Number.isFinite(values[key]) ||
				values[key] < 0,
		)
	) {
		editError.value = 'Вкажіть невід’ємні числові значення для всіх полів.'
		return
	}

	const irritantResult = parseProductIrritant(
		irritantMarked.value ? irritantIngredientDraft.value : '',
		irritantMarked.value ? irritantReasonDraft.value : '',
	)
	if (!irritantResult.valid) {
		editError.value =
			irritantResult.reason === 'incomplete'
				? 'Укажіть інгредієнт і причину помітки.'
				: 'Перевірте довжину полів помітки про подразник.'
		return
	}

	pending.value = true
	editError.value = ''
	editSuccess.value = ''
	const chars = {
		...product.chars,
		...values,
		nutritionKnown: true,
	}
	const { data, error } = await supabase
		.from('products')
		.update({
			name,
			chars,
			irritant_ingredient: irritantResult.value?.ingredient ?? null,
			irritant_reason: irritantResult.value?.reason ?? null,
		})
		.eq('id', product.id)
		.eq('user_id', userId)
		.select('id, name, quantity, chars, irritant_ingredient, irritant_reason')
		.maybeSingle()
	pending.value = false

	if (error || !data) {
		editError.value = 'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.'
		return
	}

	emit('saved', {
		id: data.id,
		name: data.name,
		quantity: Number(data.quantity),
		chars: { ...chars, ...data.chars },
		irritant_ingredient: data.irritant_ingredient,
		irritant_reason: data.irritant_reason,
	})
	editing.value = false
	editSuccess.value =
		'Зміни збережено. Записи цього продукту в журналі перераховано.'
}
</script>

<template>
	<Dialog :open="open" @update:open="updateOpen">
		<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
			<DialogHeader v-if="product">
				<DialogTitle>{{ product.name }}</DialogTitle>
				<DialogDescription>
					Довідкові значення на {{ formatNumber(product.quantity) }}
					{{ unitLabel(product.chars.unit) }}. Вони можуть бути приблизними.
				</DialogDescription>
			</DialogHeader>

			<div v-if="product" class="space-y-5">
				<section
					v-if="product.irritant_ingredient && product.irritant_reason"
					aria-labelledby="irritant-note-heading"
					class="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
				>
					<h3 id="irritant-note-heading" class="font-semibold">
						Можливий подразник
					</h3>
					<p class="mt-1 text-sm">
						Особиста помітка, а не медична оцінка.
					</p>
					<dl class="mt-3 space-y-2 text-sm">
						<div>
							<dt class="font-semibold">Інгредієнт</dt>
							<dd>{{ product.irritant_ingredient }}</dd>
						</div>
						<div>
							<dt class="font-semibold">Чому позначено</dt>
							<dd>{{ product.irritant_reason }}</dd>
						</div>
					</dl>
				</section>

				<section>
					<div class="flex items-center justify-between gap-3">
						<h3 class="text-sm font-semibold">Харчова цінність</h3>
						<Button
							v-if="user && product.id"
							type="button"
							variant="outline"
							size="sm"
							:disabled="pending"
							@click="startEditing"
						>
							Редагувати
						</Button>
					</div>
					<form v-if="editing" class="mt-3 space-y-3" @submit.prevent="saveNutrition">
						<label class="block space-y-1 text-sm font-medium">
							<span>Назва продукту</span>
							<Input v-model="nameDraft" type="text" required />
						</label>
						<p class="text-sm text-muted-foreground">
							Вкажіть значення для {{ formatNumber(product.quantity) }}
							{{ unitLabel(product.chars.unit) }} — саме така кількість є довідковою для цього продукту.
							Дробові значення вводьте через кому або крапку.
						</p>
						<label
							v-for="nutrient in nutrientLabels"
							:key="nutrient.key"
							class="block space-y-1 text-sm font-medium"
						>
							<span>{{ nutrient.label }}, {{ nutrient.unit }}</span>
							<Input
								v-model="draft[nutrient.key]"
								type="text"
								inputmode="decimal"
								placeholder="Наприклад, 6,7"
								required
							/>
						</label>
						<fieldset class="space-y-3 rounded-xl border border-border p-3">
							<legend class="px-1 text-sm font-semibold">
								Особиста помітка
							</legend>
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
								<label class="block space-y-1 text-sm font-medium">
									<span>Інгредієнт</span>
									<Input
										v-model="irritantIngredientDraft"
										type="text"
										:maxlength="IRRITANT_INGREDIENT_MAX_LENGTH"
										required
									/>
								</label>
								<label class="block space-y-1 text-sm font-medium">
									<span>Чому позначено</span>
									<textarea
										v-model="irritantReasonDraft"
										class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										:maxlength="IRRITANT_REASON_MAX_LENGTH"
										rows="3"
										required
									/>
								</label>
							</template>
						</fieldset>
						<p v-if="editError" role="alert" class="text-sm text-destructive">
							{{ editError }}
						</p>
						<div class="flex gap-2">
							<Button type="submit" :disabled="pending">
								{{ pending ? 'Зберігаємо…' : 'Зберегти' }}
							</Button>
							<Button type="button" variant="outline" :disabled="pending" @click="cancelEditing">
								Скасувати
							</Button>
						</div>
					</form>
					<dl class="mt-2 grid grid-cols-2 gap-2">
						<template v-if="!editing && product.chars.nutritionKnown !== false">
							<div
								v-for="nutrient in nutrientLabels"
								:key="nutrient.key"
								class="rounded-xl border border-border/80 px-3 py-2.5"
							>
								<dt class="text-xs text-muted-foreground">
									{{ nutrient.label }}
								</dt>
								<dd class="mt-1 font-semibold">
									{{ formatNumber(product.chars[nutrient.key]) }}
									{{ nutrient.unit }}
								</dd>
							</div>
						</template>
					</dl>
					<p
						v-if="!editing && product.chars.nutritionKnown === false"
						class="mt-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground"
					>
						Харчову цінність цього продукту ще не зазначено.
					</p>
				</section>
				<p v-if="editSuccess" role="status" class="text-sm text-green-700">
					{{ editSuccess }}
				</p>

				<section v-if="logged">
					<h3 class="text-sm font-semibold">
						У збереженому записі
					</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						{{ formatNumber(logged.quantity) }} {{ unitLabel(product.chars.unit) }}
					</p>
					<dl
						v-if="product.chars.nutritionKnown !== false"
						class="mt-2 grid grid-cols-2 gap-2"
					>
						<div
							v-for="nutrient in nutrientLabels"
							:key="nutrient.key"
							class="rounded-xl bg-muted/60 px-3 py-2.5"
						>
							<dt class="text-xs text-muted-foreground">{{ nutrient.label }}</dt>
							<dd class="mt-1 font-semibold">
								{{ formatNumber(logged.nutrition[nutrient.key]) }} {{ nutrient.unit }}
							</dd>
						</div>
					</dl>
				</section>
			</div>
		</DialogContent>
	</Dialog>
</template>
