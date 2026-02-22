import { z } from 'zod';

export const adminMaterialUploadSchema = z.object({
    subject_id: z.string().uuid('Invalid subject ID format'),
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: z.string().max(1000).optional(),
});

export const adminMaterialUpdateSchema = z.object({
    title: z.string().min(5).max(150).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const adminUserBlockSchema = z.object({
    reason: z.string().min(5).max(1000),
});

export type AdminMaterialUploadInput = z.infer<typeof adminMaterialUploadSchema>;
export type AdminMaterialUpdateInput = z.infer<typeof adminMaterialUpdateSchema>;
export type AdminUserBlockInput = z.infer<typeof adminUserBlockSchema>;
