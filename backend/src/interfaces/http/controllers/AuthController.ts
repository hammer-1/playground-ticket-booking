import { RequestHandler } from 'express';
import { RegisterUser } from '../../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../../application/use-cases/auth/LoginUser';
import { asyncHandler } from '../middleware/asyncHandler';
import { loginSchema, registerSchema } from '../validation';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
  ) {}

  register: RequestHandler = asyncHandler(async (req, res) => {
    const dto = registerSchema.parse(req.body);
    const result = await this.registerUser.execute(dto);
    res.status(201).json(result);
  });

  login: RequestHandler = asyncHandler(async (req, res) => {
    const dto = loginSchema.parse(req.body);
    const result = await this.loginUser.execute(dto);
    res.status(200).json(result);
  });

  // Stateless JWT: logout is a client-side token discard. Endpoint exists so the
  // client has a clear action and we could add a denylist later without API changes.
  logout: RequestHandler = (_req, res) => {
    res.status(204).send();
  };
}
