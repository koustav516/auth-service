import { NextFunction, Request, Response } from 'express';
import { TenantService } from '../services/TenantService';
import { CreateTenantRequest } from '../types';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import createHttpError from 'http-errors';

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { name, address } = req.body;

        this.logger.debug('Request for creating a tenant', req.body);

        try {
            const tenant = await this.tenantService.create({ name, address });
            this.logger.info('Tenant has been created', { id: tenant.id });
            res.status(201).json({ id: tenant.id });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const tenants = await this.tenantService.getAll();
            this.logger.info('All tenant have been fetched');
            res.json(tenants);
        } catch (error) {
            next(error);
        }
    }

    async getTenantById(req: Request, res: Response, next: NextFunction) {
        const tenantId = Number(req.params.id);

        if (isNaN(tenantId)) {
            next(createHttpError(400, 'Invalid url param.'));
            return;
        }

        try {
            const tenant = await this.tenantService.getTenantById(tenantId);
            if (!tenant) {
                next(createHttpError(404, 'Tenant not found!'));
                return;
            }
            this.logger.info(`Tenant with id ${tenantId} has been fetched`);
            res.json(tenant);
        } catch (error) {
            next(error);
        }
    }
}
