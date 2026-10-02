import { UnauthorizedError } from "../errors/app-error";
import type { UserRepository } from "../repositories/user.repository";

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async getCurrentUser(id: string) {
    const user = await this.users.findActiveById(id);
    if (!user) throw new UnauthorizedError("Account is unavailable");
    return user;
  }
}
