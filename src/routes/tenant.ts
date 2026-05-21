import express, { NextFunction, RequestHandler, Response } from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';
import authenticate from '../middlewares/authenticate';
import { canAccess } from '../middlewares/canAccess';
import { Roles } from '../constants';
import tenantValidator from '../validators/tenant-validator';
import { CreateTenantRequest } from '../types';

const router = express.Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

router.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    (req: CreateTenantRequest, res: Response, next: NextFunction) =>
        void tenantController.create(req, res, next),
);

router.get('/', authenticate, canAccess([Roles.ADMIN]), (req, res, next) => {
    void tenantController.getAll(req, res, next);
});

export default router;
