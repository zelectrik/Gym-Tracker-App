import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { getUserToken } from "./helpers/database";

describe("gym workout flow", () => {
  it("creates exercises, a template, a duo session, sets and progress", async () => {
    const token = await getUserToken();
    const friendToken = await getUserToken("friend@test.dev");
    const friend = await request(app).get("/auth/me").set("Authorization", `Bearer ${friendToken}`);

    const squat = await request(app).post("/exercises").set("Authorization", `Bearer ${token}`).send({ name: "Squat", muscleGroup: "LEGS", description: "Back squat" });
    expect(squat.status).toBe(201);

    const template = await request(app).post("/workouts/templates").set("Authorization", `Bearer ${token}`).send({
      name: "Séance jambes reprise",
      exercises: [{ exerciseId: squat.body.id, position: 1, targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });
    expect(template.status).toBe(201);

    const session = await request(app).post("/workouts/sessions").set("Authorization", `Bearer ${token}`).send({
      title: "Jambes avec une amie",
      participantIds: [friend.body.id],
      exercises: [{ exerciseId: squat.body.id, position: 1, sets: [{ setNumber: 1, reps: 10, weightKg: 60, completed: true }] }],
    });
    expect(session.status).toBe(201);
    expect(session.body.participants).toHaveLength(2);

    const sessionExerciseId = session.body.exercises[0].id;
    const set = await request(app).post(`/workouts/session-exercises/${sessionExerciseId}/sets`).set("Authorization", `Bearer ${token}`).send({ setNumber: 2, reps: 8, weightKg: 65, completed: true });
    expect(set.status).toBe(201);

    await request(app).patch(`/workouts/sessions/${session.body.id}/status`).set("Authorization", `Bearer ${token}`).send({ status: "COMPLETED" }).expect(200);

    const progress = await request(app).get("/progress").set("Authorization", `Bearer ${token}`);
    expect(progress.status).toBe(200);
    expect(progress.body).toMatchObject({ totalSessions: 1, totalSets: 2, totalVolumeKg: 1120 });
  });
});
