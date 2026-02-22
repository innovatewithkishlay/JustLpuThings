import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from './discovery.service';

export class DiscoveryController {

    static async trending(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await DiscoveryService.getTrending();

            // Set brief cache control identical to TTL
            res.setHeader('Cache-Control', 'private, max-age=60');
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async continueReading(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const data = await DiscoveryService.getContinueReading(userId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async recommendations(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const data = await DiscoveryService.getRecommendations(userId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async engagement(req: Request, res: Response, next: NextFunction) {
        try {
            const slug = req.params.slug as string;
            const data = await DiscoveryService.getEngagement(slug);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
