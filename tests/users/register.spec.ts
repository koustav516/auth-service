import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import { isJwt } from '../utils';

describe('POST /auth/register', () => {
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
        it('should return the 201 status code', async () => {
            //Arrange
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };
            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            //Assert
            expect(response.statusCode).toBe(201);
        });

        it('should return valid json response', async () => {
            //Arrange
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123',
                password: 'secret@123',
            };
            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            //Assert
            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            );
        });
        it('should persist the user in the database', async () => {
            //Arrange
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };
            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });
        it('should return id of the created user', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.body).toHaveProperty('id');
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });
        it('should assign a customer role', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty('role');
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it('should store hashed password in database', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/); //It matches hashed password starts with '$2b$somenumber$' eg: '$2b$10$'
        });

        it('should return 400 status code if email id already exists', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });

        it('should return the access token and refresh token inside a cookie', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            interface Headers {
                ['set-cookie']: string[];
            }

            let accessToken = null;
            let refreshToken = null;
            const cookies =
                (response.headers as unknown as Headers)['set-cookie'] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1];
                }
            });
            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });
    });

    describe('Missing fields', () => {
        it('should return 400 status code if email field is missing', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: '',
                password: 'secret',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if firstName is missing', async () => {
            const userData = {
                firstName: '',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret@123',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if lastName is missing', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: '',
                email: 'code@123.com',
                password: 'secret@123',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: '',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });

    describe('Fields are not in proper format', () => {
        it('should trim the email field', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com ',
                password: 'secret@123',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];
            expect(user.email).toBe('code@123.com');
        });
        it('should return 400 status code if password length is less than 8 characters', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code@123.com',
                password: 'secret',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it('should return 400 if the email is not valid', async () => {
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: 'code',
                password: 'secret@123',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
        it('shoud return an array of error messages if email is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Koustav',
                lastName: 'Majumder',
                email: '',
                password: 'password',
            };
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            // Assert
            expect(response.body).toHaveProperty('errors');
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});
