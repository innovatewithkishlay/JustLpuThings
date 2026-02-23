import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';
import { AdminController } from './admin.controller';

const router = Router();

// Multer Memory config (Max 20MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB strictly enforced
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are permitted.'));
        }
    }
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_ADMIN,
    message: { success: false, error: { message: 'Too many admin operations, please try again later.' } }
});

// All routes here strictly mandate Auth + Admin + AdminRateLimit
router.use(requireAuth, requireAdmin, adminLimiter);

// --- Analytics & Intelligence ---
router.get('/telemetry', AdminController.getDashboard);
router.get('/dashboard', AdminController.getDashboard);
router.get('/materials/:id/stats', AdminController.getMaterialStats);
router.get('/abuse', AdminController.getAbuseEvents);

// --- Materials ---
router.post('/materials', upload.single('file'), AdminController.uploadMaterial);
router.patch('/materials/:id', AdminController.updateMaterial);
router.delete('/materials/:id', AdminController.deleteMaterial);

// --- Users Policy ---
router.patch('/users/:id/block', AdminController.blockUser);
router.patch('/users/:id/unblock', AdminController.unblockUser);
router.delete('/users/:id', AdminController.deleteUser);

export default router;
