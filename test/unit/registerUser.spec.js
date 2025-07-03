// __tests__/registerUser.spec.js
import { registerUser } from '../../src/controllers/authController'; // ⇠ ajusta el path

describe('registerUser (unit test)', () => {
  let req;
  let res;

  beforeEach(() => {
    // Mock de req y res de Express
    req = {
      body: {
        username: 'dou',
        name: 'Dou Ramirez',
        email: 'dou@example.com',
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
        first_name: 'Dou',
        last_name: 'Ramirez',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(), // permite encadenar .json()
      json: jest.fn(),
    };
  });

  it('crea usuario y responde 201 cuando todo es válido', async () => {
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/creado/i),
        user: expect.objectContaining({ username: 'dou' }),
      }),
    );
  });

  it('rechaza cuando las contraseñas no coinciden', async () => {
    req.body.confirmPassword = 'otraClave';

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/contraseña/i) }),
    );
  });
});
