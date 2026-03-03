import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB functions
vi.mock("./db", () => ({
  getCoursesByUserId: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "林口球場", location: "台灣台北", par: 72, holes: 18, holePars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5], notes: null, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getCourseById: vi.fn().mockResolvedValue(
    { id: 1, userId: 1, name: "林口球場", location: "台灣台北", par: 72, holes: 18, holePars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5], notes: null, createdAt: new Date(), updatedAt: new Date() }
  ),
  createCourse: vi.fn().mockResolvedValue({ id: 2 }),
  updateCourse: vi.fn().mockResolvedValue(undefined),
  deleteCourse: vi.fn().mockResolvedValue(undefined),
  getRoundsByUserId: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, courseId: 1, playedAt: new Date(), totalScore: 85, totalPutts: 34, fairwaysHit: 8, fairwaysTotal: 14, greensInRegulation: 6, aiAnalysis: null, scorecardImageUrl: null, weatherData: null, notes: null, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getRoundById: vi.fn().mockResolvedValue(
    { id: 1, userId: 1, courseId: 1, playedAt: new Date(), totalScore: 85, totalPutts: 34, fairwaysHit: 8, fairwaysTotal: 14, greensInRegulation: 6, aiAnalysis: null, scorecardImageUrl: null, weatherData: null, notes: null, createdAt: new Date(), updatedAt: new Date() }
  ),
  createRound: vi.fn().mockResolvedValue({ id: 2 }),
  updateRound: vi.fn().mockResolvedValue(undefined),
  deleteRound: vi.fn().mockResolvedValue(undefined),
  getHoleScoresByRoundId: vi.fn().mockResolvedValue([
    { id: 1, roundId: 1, holeNumber: 1, par: 4, score: 5, putts: 2, fairwayHit: "hit", greenInRegulation: false, penalties: 0, notes: null }
  ]),
  upsertHoleScores: vi.fn().mockResolvedValue(undefined),
  getUserStats: vi.fn().mockResolvedValue({
    totalRounds: 5,
    avgScore: 85.4,
    bestScore: 82,
    worstScore: 90,
    avgPutts: 33.2,
    fairwayHitRate: 0.57,
    avgGir: 7.8,
  }),
  getHoleStatsForUser: vi.fn().mockResolvedValue([
    { holeNumber: 1, avgScore: 4.8, avgPutts: 2.1, girRate: 0.4, count: 5 },
    { holeNumber: 2, avgScore: 5.2, avgPutts: 2.3, girRate: 0.2, count: 5 },
  ]),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI 分析結果：您的推桿需要改善。" } }]
  }),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/scorecard.png" }),
}));

function createMockContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user",
      email: "test@example.com",
      name: "測試球員",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Golf Tracker - Courses Router", () => {
  it("should list courses for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("林口球場");
  });

  it("should create a new course", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.create({
      name: "新竹球場",
      location: "台灣新竹",
      par: 72,
      holes: 18,
      holePars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5],
    });
    expect(result.success).toBe(true);
  });

  it("should update an existing course", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.update({ id: 1, name: "林口高爾夫球場" });
    expect(result.success).toBe(true);
  });

  it("should delete a course", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("Golf Tracker - Rounds Router", () => {
  it("should list rounds for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rounds.list();
    expect(result).toHaveLength(1);
    expect(result[0].totalScore).toBe(85);
  });

  it("should filter rounds by courseId", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rounds.list({ courseId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get round by id", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rounds.getById({ id: 1 });
    expect(result).not.toBeNull();
    expect(result?.totalScore).toBe(85);
  });

  it("should create a new round", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rounds.create({
      courseId: 1,
      playedAt: new Date(),
      notes: "天氣晴朗",
    });
    expect(result).not.toBeNull();
  });

  it("should delete a round", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rounds.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("Golf Tracker - Stats Router", () => {
  it("should return summary stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stats.summary();
    expect(result).not.toBeNull();
    expect(result?.totalRounds).toBe(5);
    expect(result?.avgScore).toBeCloseTo(85.4, 1);
  });

  it("should return hole stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stats.holeStats();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Golf Tracker - AI Router", () => {
  it("should generate AI analysis for a round", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.analyze({ roundId: 1 });
    expect(result.analysis).toBeTruthy();
    expect(typeof result.analysis).toBe("string");
  });

  it("should handle AI chat", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.chat({
      messages: [{ role: "user", content: "如何改善推桿？" }],
    });
    expect(result.reply).toBeTruthy();
  });

  it("should generate full analysis", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.fullAnalysis();
    expect(result.analysis).toBeTruthy();
  });
});

describe("Golf Tracker - Auth Router", () => {
  it("should return current user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.name).toBe("測試球員");
  });

  it("should logout successfully", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
