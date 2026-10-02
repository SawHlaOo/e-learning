import { ConflictError, UnauthorizedError } from "../errors/app-error";
import type { UserRepository } from "../repositories/user.repository";
import { UserService } from "./user.service";
import { signAccessToken, verifyAccessToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

export class AuthService {
  private readonly userService: UserService;

  constructor(private readonly users: UserRepository) {
    this.userService = new UserService(users);
  }

  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new ConflictError("An account with this email already exists");
    }
    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash: await hashPassword(input.password),
    });
    return { user, token: signAccessToken(user.id) };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError("Email or password is incorrect");
    }
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: signAccessToken(user.id),
    };
  }

  async currentUser(token: string) {
    const payload = verifyAccessToken(token);
    const user = await this.currentUserFromId(payload.sub!);
    return user;
  }

  async currentUserFromId(id: string) {
    return this.userService.getCurrentUser(id);
  }
}
