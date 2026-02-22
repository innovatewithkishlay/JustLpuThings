import { Request, Response, NextFunction } from 'express';
import { MaterialsService } from './materials.service';
import { materialQuerySchema } from './materials.schema';

export class MaterialsController {

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const query = materialQuerySchema.parse(req.query);

            const result = await MaterialsService.getMaterials(query);

            res.setHeader('Cache-Control', 'private, max-age=60');
            res.json({ success: true, ...result });

        } catch (err) {
            next(err);
        }
    }

    static async getBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const slug = req.params.slug as string;
            const userId = req.user!.userId;

            const material = await MaterialsService.getMaterialBySlug(slug, userId);

            res.setHeader('Cache-Control', 'private, max-age=60');
            res.json({ success: true, data: material });
        } catch (err) {
            next(err);
        }
    }
}
