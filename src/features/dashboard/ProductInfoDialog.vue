<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import { type FoodProductInfo, type LoggedFoodInfo } from './foodProduct'
import { parseDecimalInput } from '~/src/shared/numbers'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	PRODUCT_COMPOSITION_MAX_ITEMS,
	findMatchingIrritantComponents,
	parseProductComposition,
	parseProductIrritant,
} from '~/src/entities/product/irritant'
import {
	getNutritionSuggestionNotice,
	requestNutritionSuggestion,
} from '~/src/entities/product/api/suggestNutrition'

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
const nutritionSuggestionPending = shallowRef(false)
const nutritionSuggestionRequestId = shallowRef(0)
const nutritionSuggestionNotice = shallowRef('')
const editError = shallowRef('')
const editSuccess = shallowRef('')
const nameDraft = shallowRef('')
const irritantMarked = shallowRef(false)
const irritantIngredientDraft = shallowRef('')
const irritantReasonDraft = shallowRef('')
const compositionDraft = shallowRef('')
const draft = reactive<
	Record<'calories' | 'proteins' | 'fats' | 'carbs', string>
>({
	calories: '',
	proteins: '',
	fats: '',
	carbs: '',
})

watch([nameDraft, compositionDraft], () => {
	nutritionSuggestionNotice.value = ''
})

const nutrientLabels = [
	{ key: 'calories', label: 'Енергія', unit: 'ккал' },
	{ key: 'proteins', label: 'Білки', unit: 'г' },
	{ key: 'fats', label: 'Жири', unit: 'г' },
	{ key: 'carbs', label: 'Вуглеводи', unit: 'г' },
] as const

const nutritionInputsRequired = computed(
	() =>
		props.product?.chars.nutritionKnown !== false ||
		nutrientLabels.some(({ key }) => draft[key].trim() !== ''),
)
const matchingIrritantComponents = computed(() =>
	findMatchingIrritantComponents(
		props.product?.composition,
		props.product?.irritant_ingredient,
	),
)

function unitLabel(unit: FoodProductInfo['chars']['unit'] | undefined) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[unit ?? 'g']
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(
		value,
	)
}

function startEditing() {
	if (!props.product || !user.value) return
	nameDraft.value = props.product.name
	irritantMarked.value = Boolean(props.product.irritant_ingredient)
	irritantIngredientDraft.value = props.product.irritant_ingredient ?? ''
	irritantReasonDraft.value = props.product.irritant_reason ?? ''
	compositionDraft.value = (props.product.composition ?? []).join(', ')
	for (const { key } of nutrientLabels) {
		draft[key] =
			props.product.chars.nutritionKnown === false
				? ''
				: String(props.product.chars[key])
	}
	editError.value = ''
	editSuccess.value = ''
	nutritionSuggestionNotice.value = ''
	nutritionSuggestionRequestId.value += 1
	nutritionSuggestionPending.value = false
	editing.value = true
}

function cancelEditing() {
	nutritionSuggestionRequestId.value += 1
	nutritionSuggestionPending.value = false
	editing.value = false
	editError.value = ''
}

function updateOpen(open: boolean) {
	if (!open) {
		nutritionSuggestionRequestId.value += 1
		nutritionSuggestionPending.value = false
		editing.value = false
		editError.value = ''
		editSuccess.value = ''
	}
	emit('update:open', open)
}

async function suggestNutrition() {
	const product = props.product
	const userId = user.value?.id
	const name = nameDraft.value.trim()
	if (!product || !userId || nutritionSuggestionPending.value) return
	if (!name) {
		editError.value = 'Вкажіть назву продукту перед запитом.'
		return
	}

	const compositionInput = compositionDraft.value
	const composition = parseProductComposition(compositionInput)
	if (!composition.valid) {
		editError.value =
			composition.reason === 'too-many'
				? `Укажіть не більше ${PRODUCT_COMPOSITION_MAX_ITEMS} компонентів складу.`
				: 'Перевірте довжину кожного компонента складу.'
		return
	}

	const requestId = nutritionSuggestionRequestId.value + 1
	nutritionSuggestionRequestId.value = requestId
	nutritionSuggestionPending.value = true
	editError.value = ''
	nutritionSuggestionNotice.value = ''
	try {
		const suggestion = await requestNutritionSuggestion({
			name,
			quantity: product.quantity,
			unit: product.chars.unit ?? 'g',
			composition: composition.value,
		})
		if (requestId !== nutritionSuggestionRequestId.value || !editing.value)
			return
		const currentProduct = props.product
		if (
			nameDraft.value.trim() !== name ||
			compositionDraft.value !== compositionInput ||
			!currentProduct ||
			currentProduct.id !== product.id ||
			currentProduct.quantity !== product.quantity ||
			(currentProduct.chars.unit ?? 'g') !== (product.chars.unit ?? 'g')
		) {
			editError.value =
				'Дані змінилися під час запиту. Повторіть запит, щоб отримати актуальну оцінку.'
			return
		}
		draft.calories = String(suggestion.calories)
		draft.proteins = String(suggestion.proteins)
		draft.fats = String(suggestion.fats)
		draft.carbs = String(suggestion.carbs)
		nutritionSuggestionNotice.value = getNutritionSuggestionNotice(
			suggestion.confidence,
		)
	} catch (cause) {
		if (requestId !== nutritionSuggestionRequestId.value) return
		editError.value =
			cause instanceof Error
				? cause.message
				: 'Не вдалося отримати пропозицію ШІ. Можна ввести значення вручну.'
	} finally {
		if (requestId === nutritionSuggestionRequestId.value) {
			nutritionSuggestionPending.value = false
		}
	}
}

async function saveNutrition() {
	const product = props.product
	const userId = user.value?.id
	if (!product || !userId || pending.value || nutritionSuggestionPending.value)
		return
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
	const hasNutritionDraft = nutrientLabels.some(
		({ key }) => draft[key].trim() !== '',
	)
	if (
		(product.chars.nutritionKnown !== false || hasNutritionDraft) &&
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
	const compositionResult = parseProductComposition(compositionDraft.value)
	if (!compositionResult.valid) {
		editError.value =
			compositionResult.reason === 'too-many'
				? `Укажіть не більше ${PRODUCT_COMPOSITION_MAX_ITEMS} компонентів складу.`
				: 'Перевірте довжину кожного компонента складу.'
		return
	}

	pending.value = true
	editError.value = ''
	editSuccess.value = ''
	const chars = hasNutritionDraft
		? { ...product.chars, ...values, nutritionKnown: true }
		: product.chars
	const { data, error } = await supabase
		.from('products')
		.update({
			name,
			chars,
			composition: compositionResult.value,
			irritant_ingredient: irritantResult.value?.ingredient ?? null,
			irritant_reason: irritantResult.value?.reason ?? null,
		})
		.eq('id', product.id)
		.eq('user_id', userId)
		.select(
			'id, name, quantity, chars, composition, irritant_ingredient, irritant_reason',
		)
		.maybeSingle()
	pending.value = false

	if (error || !data) {
		editError.value =
			'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.'
		return
	}

	emit('saved', {
		id: data.id,
		name: data.name,
		quantity: Number(data.quantity),
		chars: { ...chars, ...data.chars },
		composition: data.composition ?? compositionResult.value,
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
					<p class="mt-1 text-sm">Особиста помітка, а не медична оцінка.</p>
					<dl class="mt-3 space-y-2 text-sm">
						<div>
							<dt class="font-semibold">Інгредієнт</dt>
							<dd>{{ product.irritant_ingredient }}</dd>
						</div>
						<div v-if="matchingIrritantComponents.length">
							<dt class="font-semibold">Знайдено у складі</dt>
							<dd>{{ matchingIrritantComponents.join(', ') }}</dd>
						</div>
						<div>
							<dt class="font-semibold">Чому позначено</dt>
							<dd>{{ product.irritant_reason }}</dd>
						</div>
					</dl>
				</section>

				<section
					v-if="product.composition?.length"
					aria-labelledby="composition-heading"
				>
					<h3 id="composition-heading" class="text-sm font-semibold">Склад</h3>
					<ul class="mt-2 flex flex-wrap gap-2">
						<li
							v-for="component in product.composition"
							:key="component"
							class="rounded-full border px-2.5 py-1 text-xs"
							:class="
								matchingIrritantComponents.includes(component)
									? 'border-amber-300 bg-amber-100 font-semibold text-amber-950'
									: 'border-border bg-muted/50 text-muted-foreground'
							"
						>
							{{ component }}
						</li>
					</ul>
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
					<form
						v-if="editing"
						class="mt-3 space-y-3"
						@submit.prevent="saveNutrition"
					>
						<div class="space-y-2">
							<Button
								type="button"
								variant="outline"
								class="min-h-11 w-full"
								:disabled="pending || nutritionSuggestionPending"
								@click="suggestNutrition"
							>
								{{
									nutritionSuggestionPending
										? 'Запитуємо ШІ…'
										: 'Запропонувати харчову цінність з ШІ'
								}}
							</Button>
							<p class="text-xs text-muted-foreground">
								Пропозиція розраховується для довідкової кількості та одиниці
								виміру цього продукту. Перевірте значення перед збереженням.
							</p>
							<p
								v-if="nutritionSuggestionNotice"
								role="status"
								class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
							>
								{{ nutritionSuggestionNotice }}
							</p>
						</div>
						<label class="block space-y-1 text-sm font-medium">
							<span>Назва продукту</span>
							<Input v-model="nameDraft" type="text" required />
						</label>
						<label class="block space-y-1 text-sm font-medium">
							<span>Склад продукту</span>
							<textarea
								v-model="compositionDraft"
								class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
								placeholder="Наприклад: молоко, овес, сіль"
								rows="3"
							/>
							<span class="block text-xs font-normal text-muted-foreground">
								Необов’язково. Перерахуйте компоненти через кому.
							</span>
						</label>
						<p class="text-sm text-muted-foreground">
							Вкажіть значення для {{ formatNumber(product.quantity) }}
							{{ unitLabel(product.chars.unit) }} — саме така кількість є
							довідковою для цього продукту. Дробові значення вводьте через кому
							або крапку.
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
								:required="nutritionInputsRequired"
							/>
						</label>
						<fieldset class="space-y-3 rounded-xl border border-border p-3">
							<legend class="px-1 text-sm font-semibold">
								Особиста помітка
							</legend>
							<label
								class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium"
							>
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
							<Button
								type="submit"
								:disabled="pending || nutritionSuggestionPending"
							>
								{{ pending ? 'Зберігаємо…' : 'Зберегти' }}
							</Button>
							<Button
								type="button"
								variant="outline"
								:disabled="pending || nutritionSuggestionPending"
								@click="cancelEditing"
							>
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
					<h3 class="text-sm font-semibold">У збереженому записі</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						{{ formatNumber(logged.quantity) }}
						{{ unitLabel(product.chars.unit) }}
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
							<dt class="text-xs text-muted-foreground">
								{{ nutrient.label }}
							</dt>
							<dd class="mt-1 font-semibold">
								{{ formatNumber(logged.nutrition[nutrient.key]) }}
								{{ nutrient.unit }}
							</dd>
						</div>
					</dl>
				</section>
			</div>
		</DialogContent>
	</Dialog>
</template>
