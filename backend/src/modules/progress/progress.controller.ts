import { Request, Response, NextFunction } from 'express';
import { ProgressService } from './progress.service';
import { progressSchema } from '../materials/materials.schema';

export class ProgressController {

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const slug = req.params.slug as string;
            const userId = req.user!.userId;
            const data = progressSchema.parse(req.body);

            await ProgressService.upsertProgress(slug, userId, data);

            res.json({ success: true, data: { message: 'Progress saved' } });
        } catch (err) {
            next(err);
        }
    }
}
