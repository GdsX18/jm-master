import { z } from 'zod';
import { round2, toNumber } from './money';

export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'O nome do produto é obrigatório').max(160),
  description: z.string().trim().max(2000).optional().default(''),
  price: z.preprocess((v) => round2(toNumber(v)), z.number().min(0, 'O preço não pode ser negativo')).default(0),
  category: z.string().trim().max(80).optional().default(''),
  isRequired: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  recurring: z.boolean().optional().default(true),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// Formato que o painel espera
export function mapProduct(p: {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  category: string | null;
  active: boolean;
  recurring: boolean;
  features: unknown;
}) {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: toNumber(p.price),
    category: p.category || '',
    isRequired: (p.features as { isRequired?: boolean } | null)?.isRequired ?? false,
    active: p.active,
    recurring: p.recurring,
  };
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message || 'Dados inválidos';
}
