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
	{ id: 'light' as const, title: 'Спокойный', summary: '1800 ккал · 1,8 л воды' },
	{ id: 'balanced' as const, title: 'Сбалансированный', summary: '2000 ккал · 2 л воды' },
	{ id: 'active' as const, title: 'Активный', summary: '2400 ккал · 2,5 л воды' },
]

const fields: Array<{ key: keyof DailyTargets; label: string; unit: string }> = [
	{ key: 'calories', label: 'Энергия', unit: 'ккал' },
	{ key: 'proteins', label: 'Белки', unit: 'г' },
	{ key: 'fats', label: 'Жиры', unit: 'г' },
	{ key: 'carbs', label: 'Углеводы', unit: 'г' },
	{ key: 'beveragesMl', label: 'Цель чистой воды', unit: 'мл' },
]

function choosePreset(preset: Exclude<TargetPreset, 'custom'>) {
	selectedPreset.value = preset
	Object.assign(draft, TARGET_PRESETS[preset])
	error.value = ''
}

function save() {
	const values = Object.values(draft)
	if (values.some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
		error.value = 'Все цели должны быть больше нуля.'
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
				Демо-пресеты для приложения, а не медицинская рекомендация.
			</p>
		</div>

		<div class="grid gap-2 sm:grid-cols-2">
			<button
				v-for="preset in presets"
				:key="preset.id"
				type="button"
				class="rounded-lg border p-3 text-left"
				:class="selectedPreset === preset.id ? 'border-primary bg-muted' : ''"
				:aria-pressed="selectedPreset === preset.id"
				@click="choosePreset(preset.id)"
			>
				<span class="block font-semibold">{{ preset.title }}</span>
				<span class="mt-1 block text-xs text-muted-foreground">{{ preset.summary }}</span>
			</button>
			<button
				type="button"
				class="rounded-lg border p-3 text-left font-semibold"
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
			{{ pending ? 'Сохраняю...' : 'Сохранить цель' }}
		</Button>
	</form>
</template>
