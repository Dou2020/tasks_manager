// __tests__/registerUser.integration.spec.js
import request from 'supertest';
import app from '../src/server'; // tu instancia de Express

describe('POST /register (integración)', () => {
  it('devuelve 201 y el usuario creado', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: 'dou',
        name: 'Dou Ramirez',
        email: 'dou@example.com',
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
        first_name: 'Dou',
        last_name: 'Ramirez',
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body.user).toMatchObject({ username: 'dou', email: 'dou@example.com' });
  });
});
