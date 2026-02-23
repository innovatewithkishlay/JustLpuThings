import { z } from 'zod';

export const adminMaterialUploadSchema = z.object({
    subject: z.string().min(1, 'Subject is required'),
    semester: z.string().optional(),
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: z.string().max(1000).optional(),
    category: z.enum(['notes', 'ppt', 'pyqs', 'midterm', 'ca']).default('notes'),
    unit: z.string().max(10).optional(),
    youtube_url: z.string().url('Invalid YouTube URL').max(255).optional(),
});

export const adminMaterialUpdateSchema = z.object({
    title: z.string().min(5).max(150).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    category: z.enum(['notes', 'ppt', 'pyqs', 'midterm', 'ca']).optional(),
    unit: z.string().max(10).optional(),
    youtube_url: z.string().url('Invalid YouTube URL').max(255).optional(),
});

export const adminUserBlockSchema = z.object({
    reason: z.string().min(5).max(1000),
});

export type AdminMaterialUploadInput = z.infer<typeof adminMaterialUploadSchema>;
export type AdminMaterialUpdateInput = z.infer<typeof adminMaterialUpdateSchema>;
export type AdminUserBlockInput = z.infer<typeof adminUserBlockSchema>;
