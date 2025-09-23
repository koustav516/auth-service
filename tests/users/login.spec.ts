import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../src/app';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';

describe('POST /auth/login', () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return 200 status code', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            await request(app).post('/auth/register').send(userData);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            expect(response.statusCode).toBe(200);
        });

        it('should return valid Json response', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            await request(app).post('/auth/register').send(userData);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            );
        });

        it('should return id of the logged user', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            await request(app).post('/auth/register').send(userData);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            expect(response.body).toHaveProperty('id');
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });

        it('should return 400 if email or password is incorrect', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            await request(app).post('/auth/register').send(userData);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: 'wrong password' });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('Missing fields', () => {});
});
