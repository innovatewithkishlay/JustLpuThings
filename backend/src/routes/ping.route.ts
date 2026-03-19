import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Backend is LIVE and REFRESHED',
        timestamp: new Date().toISOString(),
        version: 'DEBUG_V1'
    });
});

export default router;
