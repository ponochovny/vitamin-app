export interface DailyTargets {
	calories: number
	proteins: number
	fats: number
	carbs: number
	beveragesMl: number
}

export type TargetPreset = 'light' | 'balanced' | 'active' | 'custom'

export const DEFAULT_TARGETS: DailyTargets = {
	calories: 2000,
	proteins: 100,
	fats: 70,
	carbs: 250,
	beveragesMl: 2000,
}

export const TARGET_PRESETS: Record<Exclude<TargetPreset, 'custom'>, DailyTargets> = {
	light: {
		calories: 1800,
		proteins: 90,
		fats: 60,
		carbs: 220,
		beveragesMl: 1800,
	},
	balanced: DEFAULT_TARGETS,
	active: {
		calories: 2400,
		proteins: 120,
		fats: 80,
		carbs: 300,
		beveragesMl: 2500,
	},
}

export function getProgressPercent(value: number, target: number): number {
	if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return 0
	return Math.min(100, Math.max(0, (value / target) * 100))
}

export function scaleNutrition(
	chars: Omit<DailyTargets, 'beveragesMl'>,
	quantity: number,
	referenceQuantity: number
): Omit<DailyTargets, 'beveragesMl'> {
	const factor = quantity / referenceQuantity
	return {
		calories: chars.calories * factor,
		proteins: chars.proteins * factor,
		fats: chars.fats * factor,
		carbs: chars.carbs * factor,
	}
}
