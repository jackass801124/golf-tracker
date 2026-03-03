import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 球場資料表
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  par: int("par").notNull().default(72),
  holes: int("holes").notNull().default(18),
  // 每洞標準桿，JSON 陣列 [4,3,5,...] 18個元素
  holePars: json("holePars").$type<number[]>(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// 下場紀錄資料表
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  playedAt: timestamp("playedAt").notNull(),
  totalScore: int("totalScore"),
  totalPutts: int("totalPutts"),
  fairwaysHit: int("fairwaysHit"),
  fairwaysTotal: int("fairwaysTotal"),
  greensInRegulation: int("greensInRegulation"),
  notes: text("notes"),
  // 天氣資料（JSON）
  weatherData: json("weatherData").$type<{
    temperature?: number;
    windSpeed?: number;
    windDirection?: string;
    precipitation?: number;
    humidity?: number;
    condition?: string;
    description?: string;
  }>(),
  // AI 分析結果（快取）
  aiAnalysis: text("aiAnalysis"),
  // 成績卡圖片 URL
  scorecardImageUrl: text("scorecardImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = typeof rounds.$inferInsert;

// 每洞成績資料表
export const holeScores = mysqlTable("holeScores", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  holeNumber: int("holeNumber").notNull(), // 1-18
  par: int("par").notNull(),
  score: int("score").notNull(),
  putts: int("putts"),
  fairwayHit: mysqlEnum("fairwayHit", ["hit", "left", "right", "na"]).default("na"),
  greenInRegulation: boolean("greenInRegulation").default(false),
  penalties: int("penalties").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HoleScore = typeof holeScores.$inferSelect;
export type InsertHoleScore = typeof holeScores.$inferInsert;
