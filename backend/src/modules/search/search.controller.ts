import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';

export class SearchController {
    static async search(req: Request, res: Response, next: NextFunction) {
        try {
            const query = (req.query.q as string) || '';
            const results = await SearchService.searchMaterials(query);

            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }
}
