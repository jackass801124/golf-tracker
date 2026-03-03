import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { courses, holeScores, InsertUser, rounds, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function getCoursesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).where(eq(courses.userId, userId)).orderBy(desc(courses.createdAt));
}

export async function getCourseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.userId, userId))).limit(1);
  return result[0];
}

export async function createCourse(data: typeof courses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courses).values(data);
  return result[0];
}

export async function updateCourse(id: number, userId: number, data: Partial<typeof courses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courses).set(data).where(and(eq(courses.id, id), eq(courses.userId, userId)));
}

export async function deleteCourse(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(courses).where(and(eq(courses.id, id), eq(courses.userId, userId)));
}

// ─── Rounds ─────────────────────────────────────────────────────────────────

export async function getRoundsByUserId(userId: number, filters?: { courseId?: number; fromDate?: Date; toDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(rounds.userId, userId)];
  if (filters?.courseId) conditions.push(eq(rounds.courseId, filters.courseId));
  if (filters?.fromDate) conditions.push(gte(rounds.playedAt, filters.fromDate));
  if (filters?.toDate) conditions.push(lte(rounds.playedAt, filters.toDate));
  return db.select().from(rounds).where(and(...conditions)).orderBy(desc(rounds.playedAt));
}

export async function getRoundById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rounds).where(and(eq(rounds.id, id), eq(rounds.userId, userId))).limit(1);
  return result[0];
}

export async function createRound(data: typeof rounds.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rounds).values(data);
  return result[0];
}

export async function updateRound(id: number, userId: number, data: Partial<typeof rounds.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rounds).set(data).where(and(eq(rounds.id, id), eq(rounds.userId, userId)));
}

export async function deleteRound(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(rounds).where(and(eq(rounds.id, id), eq(rounds.userId, userId)));
}

// ─── Hole Scores ─────────────────────────────────────────────────────────────

export async function getHoleScoresByRoundId(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(holeScores).where(eq(holeScores.roundId, roundId)).orderBy(holeScores.holeNumber);
}

export async function upsertHoleScores(roundId: number, scores: Array<typeof holeScores.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing and re-insert
  await db.delete(holeScores).where(eq(holeScores.roundId, roundId));
  if (scores.length > 0) {
    await db.insert(holeScores).values(scores);
  }
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const allRounds = await db.select().from(rounds).where(eq(rounds.userId, userId)).orderBy(desc(rounds.playedAt));
  if (allRounds.length === 0) return null;

  const totalRounds = allRounds.length;
  const scoredRounds = allRounds.filter(r => r.totalScore !== null);
  const avgScore = scoredRounds.length > 0
    ? scoredRounds.reduce((sum, r) => sum + (r.totalScore ?? 0), 0) / scoredRounds.length
    : null;

  const avgPutts = allRounds.filter(r => r.totalPutts !== null).length > 0
    ? allRounds.filter(r => r.totalPutts !== null).reduce((sum, r) => sum + (r.totalPutts ?? 0), 0) /
      allRounds.filter(r => r.totalPutts !== null).length
    : null;

  const fairwayRounds = allRounds.filter(r => r.fairwaysHit !== null && r.fairwaysTotal !== null && r.fairwaysTotal! > 0);
  const fairwayHitRate = fairwayRounds.length > 0
    ? fairwayRounds.reduce((sum, r) => sum + (r.fairwaysHit! / r.fairwaysTotal!), 0) / fairwayRounds.length
    : null;

  const girRounds = allRounds.filter(r => r.greensInRegulation !== null);
  const avgGir = girRounds.length > 0
    ? girRounds.reduce((sum, r) => sum + (r.greensInRegulation ?? 0), 0) / girRounds.length
    : null;

  // Recent 10 rounds trend
  const recentRounds = allRounds.slice(0, 10).reverse();

  return {
    totalRounds,
    avgScore,
    avgPutts,
    fairwayHitRate,
    avgGir,
    recentRounds,
    bestScore: scoredRounds.length > 0 ? Math.min(...scoredRounds.map(r => r.totalScore!)) : null,
    worstScore: scoredRounds.length > 0 ? Math.max(...scoredRounds.map(r => r.totalScore!)) : null,
  };
}

export async function getHoleStatsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all rounds for user
  const userRounds = await db.select({ id: rounds.id }).from(rounds).where(eq(rounds.userId, userId));
  if (userRounds.length === 0) return [];

  const roundIds = userRounds.map(r => r.id);

  // Get all hole scores
  const allHoles = await db.select().from(holeScores).where(
    sql`${holeScores.roundId} IN (${sql.join(roundIds.map(id => sql`${id}`), sql`, `)})`
  );

  // Aggregate by hole number
  const holeMap = new Map<number, { scores: number[]; putts: number[]; gir: boolean[]; fairway: string[] }>();
  for (const h of allHoles) {
    if (!holeMap.has(h.holeNumber)) {
      holeMap.set(h.holeNumber, { scores: [], putts: [], gir: [], fairway: [] });
    }
    const entry = holeMap.get(h.holeNumber)!;
    entry.scores.push(h.score);
    if (h.putts !== null) entry.putts.push(h.putts);
    if (h.greenInRegulation !== null) entry.gir.push(h.greenInRegulation);
    if (h.fairwayHit) entry.fairway.push(h.fairwayHit);
  }

  const result = [];
  for (const [holeNum, data] of Array.from(holeMap.entries())) {
    const avgScore = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
    const avgPutts = data.putts.length > 0 ? data.putts.reduce((a: number, b: number) => a + b, 0) / data.putts.length : null;
    const girRate = data.gir.length > 0 ? data.gir.filter(Boolean).length / data.gir.length : null;
    result.push({ holeNumber: holeNum, avgScore, avgPutts, girRate, count: data.scores.length });
  }
  return result.sort((a, b) => a.holeNumber - b.holeNumber);
}
