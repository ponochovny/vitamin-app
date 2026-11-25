import type { IProduct } from '~/src/app/types/chars'
import type { SupabaseClient } from '@supabase/supabase-js'

const addProduct = async (
	supabase: SupabaseClient,
	userId: string,
	{
		name,
		quantity,
		composition,
		irritant,
		chars: {
			calories,
			fats,
			proteins,
			carbs,
			unit,
			portion,
			vitamins: { vitaminA, vitaminB, vitaminC },
		},
	}: IProduct
) => {
	return supabase.from('products').insert([
		{
			name,
			quantity: Number(quantity) || 1,
			chars: {
				calories: Number(calories),
				fats: Number(fats),
				proteins: Number(proteins),
				carbs: Number(carbs),
				unit,
				portion,
				vitamins: {
					vitaminA: Number(vitaminA),
					vitaminB: Number(vitaminB),
					vitaminC: Number(vitaminC),
				},
			},
			user_id: userId,
			composition: composition ?? [],
			irritant_ingredient: irritant?.ingredient ?? null,
			irritant_reason: irritant?.reason ?? null,
		} as never,
	])
}

export default addProduct
