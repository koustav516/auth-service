import request from 'supertest';
import createJWKSMock from 'mock-jwks';
import { DataSource } from 'typeorm';
import app from '../../src/app';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';

describe('GET /auth/self', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501');
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });

        it('should return the user data', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            const userRepository = connection.getRepository(User);
            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            });

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();

            expect((response.body as Record<string, string>).id).toBe(user.id);
        });
    });

    describe('Missing fields', () => {});
});
