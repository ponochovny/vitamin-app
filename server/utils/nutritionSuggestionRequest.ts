import { z } from 'zod'
import {
	PRODUCT_COMPOSITION_MAX_ITEMS,
	PRODUCT_COMPOSITION_MAX_LENGTH,
} from '../../src/entities/product/irritant'

export const nutritionSuggestionRequestSchema = z.object({
	name: z.string().trim().min(1).max(120),
	quantity: z.coerce.number().finite().positive(),
	unit: z.enum(['g', 'ml', 'piece']),
	composition: z
		.array(z.string().max(PRODUCT_COMPOSITION_MAX_LENGTH))
		.max(PRODUCT_COMPOSITION_MAX_ITEMS)
		.optional(),
})
