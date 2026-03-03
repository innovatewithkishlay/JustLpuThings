import { Request, Response, NextFunction } from 'express';
import { AdminSubjectsService } from './subjects.service';
import { z } from 'zod';

const createSubjectSchema = z.object({
    name: z.string().min(2, 'Subject name must be at least 2 characters').max(100),
    semesterNumber: z.number().min(1).max(8)
});

export class AdminSubjectsController {

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const subjects = await AdminSubjectsService.getAllSubjects();
            res.json({ success: true, data: subjects });
        } catch (err) {
            next(err);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const data = createSubjectSchema.parse(req.body);

            const result = await AdminSubjectsService.createSubject(adminId, data.name, data.semesterNumber);

            res.status(201).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.userId;
            const subjectId = req.params.id as string;

            await AdminSubjectsService.deleteSubject(adminId, subjectId);

            res.json({ success: true, data: { message: 'Subject and associated materials deleted.' } });
        } catch (err) {
            next(err);
        }
    }
}
