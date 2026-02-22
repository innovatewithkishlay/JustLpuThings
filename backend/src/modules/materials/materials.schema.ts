import { z } from 'zod';

export const materialQuerySchema = z.object({
    page: z.preprocess((val) => (val ? Number(val) : 1), z.number().min(1)),
    limit: z.preprocess((val) => (val ? Number(val) : 20), z.number().min(1).max(50)),
    college: z.string().optional(),
    semester: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
});

export const progressSchema = z.object({
    last_page: z.number().int().min(1),
    total_pages: z.number().int().min(1).optional()
});

export type MaterialQueryInput = z.infer<typeof materialQuerySchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
