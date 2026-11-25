<script setup lang="ts">
import { reactive, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { DailyTargets, TargetPreset } from './targets'
import { TARGET_PRESETS } from './targets'

const props = defineProps<{
	targets: DailyTargets
	preset: TargetPreset
	pending: boolean
}>()

const emit = defineEmits<{
	save: [payload: { targets: DailyTargets; preset: TargetPreset }]
}>()

const selectedPreset = shallowRef<TargetPreset>(props.preset)
const draft = reactive<DailyTargets>({ ...props.targets })
const error = shallowRef('')

watch(error, (message) => {
	if (message) toast.error(message, { duration: 4000 })
})

const presets = [
	{ id: 'light' as const, title: 'Спокійний', summary: '1800 ккал · 1,8 л води' },
	{ id: 'balanced' as const, title: 'Збалансований', summary: '2000 ккал · 2 л води' },
	{ id: 'active' as const, title: 'Активний', summary: '2400 ккал · 2,5 л води' },
]

const fields: Array<{ key: keyof DailyTargets; label: string; unit: string }> = [
	{ key: 'calories', label: 'Енергія', unit: 'ккал' },
	{ key: 'proteins', label: 'Білки', unit: 'г' },
	{ key: 'fats', label: 'Жири', unit: 'г' },
	{ key: 'carbs', label: 'Вуглеводи', unit: 'г' },
	{ key: 'beveragesMl', label: 'Ціль чистої води', unit: 'мл' },
]

function choosePreset(preset: Exclude<TargetPreset, 'custom'>) {
	selectedPreset.value = preset
	Object.assign(draft, TARGET_PRESETS[preset])
	error.value = ''
}

function save() {
	const values = Object.values(draft)
	if (values.some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
		error.value = 'Усі цілі мають бути більшими за нуль.'
		return
	}

	emit('save', {
		targets: {
			calories: Number(draft.calories),
			proteins: Number(draft.proteins),
			fats: Number(draft.fats),
			carbs: Number(draft.carbs),
			beveragesMl: Number(draft.beveragesMl),
		},
		preset: selectedPreset.value,
	})
}
</script>

<template>
	<form class="space-y-4" @submit.prevent="save">
		<div>
			<p class="mt-1 text-sm text-muted-foreground">
				Демо-пресети для застосунку, а не медична рекомендація.
			</p>
		</div>

		<div class="grid gap-2 sm:grid-cols-2">
			<button
				v-for="preset in presets"
				:key="preset.id"
				type="button"
				class="min-h-11 rounded-lg border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				:class="selectedPreset === preset.id ? 'border-primary bg-muted' : ''"
				:aria-pressed="selectedPreset === preset.id"
				@click="choosePreset(preset.id)"
			>
				<span class="block font-semibold">{{ preset.title }}</span>
				<span class="mt-1 block text-xs text-muted-foreground">{{ preset.summary }}</span>
			</button>
			<button
				type="button"
				class="min-h-11 rounded-lg border p-3 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				:class="selectedPreset === 'custom' ? 'border-primary bg-muted' : ''"
				:aria-pressed="selectedPreset === 'custom'"
				@click="selectedPreset = 'custom'"
			>
				Ввести вручную
			</button>
		</div>

		<div v-if="selectedPreset === 'custom'" class="grid gap-3 sm:grid-cols-2">
			<label v-for="field in fields" :key="field.key" class="space-y-1 text-sm">
				<span class="block font-medium">{{ field.label }}</span>
				<div class="flex items-center gap-2">
					<Input v-model="draft[field.key]" type="number" min="1" step="any" required />
					<span class="shrink-0 text-muted-foreground">{{ field.unit }}</span>
				</div>
			</label>
		</div>

		<Button type="submit" :disabled="pending">
			{{ pending ? 'Зберігаю...' : 'Зберегти ціль' }}
		</Button>
	</form>
</template>
