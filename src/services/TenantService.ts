import { Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import { ITenant } from '../types';

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create(tenantData: ITenant) {
        return await this.tenantRepository.save(tenantData);
    }

    async getAll() {
        return await this.tenantRepository.find();
    }

    async getTenantById(tenantId: number) {
        return await this.tenantRepository.findOne({ where: { id: tenantId } });
    }

    async update(id: number, tenantData: ITenant) {
        return await this.tenantRepository.update(id, tenantData);
    }
}
