import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { getUserToken } from "./helpers/database";

describe("auth", () => {
  it("registers a user", async () => {
    const response = await request(app).post("/auth/register").send({ email: "user@test.dev", password: "password123", displayName: "User Demo" });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ email: "user@test.dev", displayName: "User Demo", role: "USER" });
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("logs in and returns /me", async () => {
    const token = await getUserToken();
    const response = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ email: "thibault@test.dev", displayName: "Thibault" });
  });
});
