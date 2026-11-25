// export type TVersion = {
// 	value: number
// 	origin: string
// }

// export type TItem = {
// 	name: string
// 	versions: TVersion[]
// 	avg_value: number
// }
export type TVersion = number
export type TItem = Record<string, number>

export interface IChars {
	vitamins: TItem
	calories: number
	proteins: number
	fats: number
	carbs: number
	unit?: 'g' | 'ml' | 'piece'
	portion?: 'exact' | 'small' | 'medium' | 'large'
}

export interface IProduct {
	name: string
	quantity: number
	chars: IChars
	composition?: string[]
	irritant?: {
		ingredient: string
		reason: string
	} | null
}
