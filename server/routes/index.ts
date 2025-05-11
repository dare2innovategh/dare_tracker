import { Router } from 'express';
import trainingProgramsRouter from './training/programs';
import makerspaceResourcesRouter from './makerspace-resources';

const router = Router();

// Register all API routes
router.use('/training/programs', trainingProgramsRouter);
router.use('/makerspace-resources', makerspaceResourcesRouter);

export default router;