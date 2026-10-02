import assert from "node:assert/strict";
import { test } from "node:test";
import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { authenticate, authorize } from "../src/middleware/authenticate";
import { AuthService } from "../src/services/auth.service";
import type { UserRepository } from "../src/repositories/user.repository";

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters-long";

test("registration hashes passwords, normalizes email, and login returns a token", async () => {
  let saved: { id: string; name: string; email: string; role: "STUDENT"; isActive: boolean; passwordHash: string } | null = null;
  const repository = {
    findByEmail: async (email: string) => saved?.email === email ? saved : null,
    findActiveById: async () => null,
    create: async (data: { name: string; email: string; passwordHash: string }) => {
      saved = { id: "user-1", role: "STUDENT", isActive: true, ...data };
      return { id: saved.id, name: saved.name, email: saved.email, role: saved.role, createdAt: new Date() };
    },
  } as unknown as UserRepository;
  const service = new AuthService(repository);

  const registration = await service.register({
    name: "  Ada Lovelace ",
    email: "ADA@EXAMPLE.COM",
    password: "safe-password",
  });
  assert.equal(registration.user.name, "Ada Lovelace");
  assert.equal(registration.user.email, "ada@example.com");
  assert.ok(saved?.passwordHash);
  assert.notEqual(saved?.passwordHash, "safe-password");
  assert.ok(registration.token);

  const login = await service.login({ email: "Ada@Example.com", password: "safe-password" });
  assert.equal(login.user.id, "user-1");
  assert.ok(login.token);
});

test("invalid login does not disclose whether the account exists", async () => {
  const service = new AuthService({
    findByEmail: async () => null,
    findActiveById: async () => null,
    create: async () => { throw new Error("Not used"); },
  } as unknown as UserRepository);

  await assert.rejects(
    service.login({ email: "missing@example.com", password: "wrong-password" }),
    (error: unknown) => error instanceof Error && error.message === "Email or password is incorrect",
  );
});

test("duplicate registration is rejected", async () => {
  const service = new AuthService({
    findByEmail: async () => ({
      id: "existing-user",
      name: "Existing User",
      email: "ada@example.com",
      role: "STUDENT",
      isActive: true,
      passwordHash: "not-used",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findActiveById: async () => null,
    create: async () => { throw new Error("Should not create"); },
  } as unknown as UserRepository);

  await assert.rejects(
    service.register({ name: "Ada Lovelace", email: "ada@example.com", password: "safe-password" }),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "CONFLICT",
  );
});

test("protected routes reject a request without a session token", async () => {
  let status = 0;
  let responseBody: unknown;
  let nextCalled = false;
  const req = { headers: {}, cookies: {} } as Request;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  await authenticate(req, res, () => { nextCalled = true; });

  assert.equal(status, 401);
  assert.deepEqual(responseBody, {
    success: false,
    message: "Authentication required",
    code: "UNAUTHORIZED",
  });
  assert.equal(nextCalled, false);
});

test("role authorization denies students and allows administrators", () => {
  const makeResponse = () => {
    let status = 0;
    let body: unknown;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json(value: unknown) {
        body = value;
        return this;
      },
    } as unknown as Response;
    return { res, getStatus: () => status, getBody: () => body };
  };

  const studentResponse = makeResponse();
  let studentNextCalled = false;
  authorize(Role.ADMIN)(
    { auth: { userId: "student-1", role: Role.STUDENT } } as Request,
    studentResponse.res,
    (() => { studentNextCalled = true; }) as NextFunction,
  );
  assert.equal(studentResponse.getStatus(), 403);
  assert.equal(studentNextCalled, false);
  assert.deepEqual(studentResponse.getBody(), {
    success: false,
    message: "You are not authorized to do this",
    code: "FORBIDDEN",
  });

  const adminResponse = makeResponse();
  let adminNextCalled = false;
  authorize(Role.ADMIN)(
    { auth: { userId: "admin-1", role: Role.ADMIN } } as Request,
    adminResponse.res,
    (() => { adminNextCalled = true; }) as NextFunction,
  );
  assert.equal(adminNextCalled, true);
  assert.equal(adminResponse.getStatus(), 0);
});
