import { Request, Response, NextFunction } from 'express';
import { AdminMaterialsService } from './admin.materials.service';
import { AdminUsersService } from './admin.users.service';
import { AdminDashboardService } from './admin.dashboard.service';
import { AdminAnalyticsService } from './admin.analytics.service';
import { adminMaterialUploadSchema, adminMaterialUpdateSchema, adminUserBlockSchema } from './admin.schema';

export class AdminController {

    // --- Dashboard ---
    static async getDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await AdminDashboardService.getOverview();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    // --- Deep Analytics ---
    static async getMaterialStats(req: Request, res: Response, next: NextFunction) {
        try {
            const materialId = req.params.id as string;
            const data = await AdminAnalyticsService.getMaterialStats(materialId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async getAbuseEvents(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await AdminAnalyticsService.getAbuseEvents();
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    // --- Materials ---
    static async uploadMaterial(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const data = adminMaterialUploadSchema.parse(req.body);

            const file = req.file as any;
            if (!file && !data.youtube_url) {
                throw { statusCode: 400, message: 'Either a PDF file or a valid YouTube URL is required' };
            }

            const result = await AdminMaterialsService.uploadMaterial(adminId, data, file);

            res.status(201).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    static async updateMaterial(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const materialId = req.params.id as string;
            const data = adminMaterialUpdateSchema.parse(req.body);

            await AdminMaterialsService.updateMaterial(adminId, materialId, data);

            res.json({ success: true, data: { message: 'Material updated' } });
        } catch (err) {
            next(err);
        }
    }

    static async deleteMaterial(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const materialId = req.params.id as string;

            await AdminMaterialsService.deleteMaterial(adminId, materialId);

            res.json({ success: true, data: { message: 'Material deleted securely' } });
        } catch (err) {
            next(err);
        }
    }

    // --- Users Moderation & Analytics ---
    static async getUsersAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const searchTerm = req.query.search as string | undefined;
            const data = await AdminUsersService.getUsersAnalytics(searchTerm);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async getUserDetailAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id as string;
            const data = await AdminUsersService.getUserDetailAnalytics(userId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    static async blockUser(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const userId = req.params.id as string;
            const data = adminUserBlockSchema.parse(req.body);

            await AdminUsersService.blockUser(adminId, userId, data.reason);

            res.json({ success: true, data: { message: 'User blocked and sessions revoked' } });
        } catch (err) {
            next(err);
        }
    }

    static async unblockUser(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const userId = req.params.id as string;

            await AdminUsersService.unblockUser(adminId, userId);

            res.json({ success: true, data: { message: 'User unblocked' } });
        } catch (err) {
            next(err);
        }
    }

    static async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const userId = req.params.id as string;

            await AdminUsersService.deleteUser(adminId, userId);

            res.json({ success: true, data: { message: 'User permanently deleted' } });
        } catch (err) {
            next(err);
        }
    }
}
