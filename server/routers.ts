import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getCoursesByUserId, getCourseById, createCourse, updateCourse, deleteCourse,
  getRoundsByUserId, getRoundById, createRound, updateRound, deleteRound,
  getHoleScoresByRoundId, upsertHoleScores, getUserStats, getHoleStatsForUser,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Courses ──────────────────────────────────────────────────────────────
  courses: router({
    list: protectedProcedure.query(({ ctx }) => getCoursesByUserId(ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getCourseById(input.id, ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        location: z.string().optional(),
        par: z.number().min(1).default(72),
        holes: z.number().min(9).max(18).default(18),
        holePars: z.array(z.number()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createCourse({ ...input, userId: ctx.user.id });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        location: z.string().optional(),
        par: z.number().min(1).optional(),
        holes: z.number().min(9).max(18).optional(),
        holePars: z.array(z.number()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCourse(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCourse(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Rounds ───────────────────────────────────────────────────────────────
  rounds: router({
    list: protectedProcedure
      .input(z.object({
        courseId: z.number().optional(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) => getRoundsByUserId(ctx.user.id, input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const round = await getRoundById(input.id, ctx.user.id);
        if (!round) return null;
        const holes = await getHoleScoresByRoundId(input.id);
        return { ...round, holes };
      }),

    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        playedAt: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createRound({ ...input, userId: ctx.user.id });
        const rounds = await getRoundsByUserId(ctx.user.id);
        return rounds[0];
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
        totalScore: z.number().optional(),
        totalPutts: z.number().optional(),
          fairwaysHit: z.number().optional(),
          fairwaysTotal: z.number().optional(),
          greensInRegulation: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateRound(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteRound(input.id, ctx.user.id);
        return { success: true };
      }),

    saveHoles: protectedProcedure
      .input(z.object({
        roundId: z.number(),
        holes: z.array(z.object({
          holeNumber: z.number().min(1).max(18),
          par: z.number().min(1).max(6),
          score: z.number().min(1).max(15),
          putts: z.number().min(0).max(10).optional(),
          fairwayHit: z.enum(["hit", "left", "right", "na"]).optional(),
          greenInRegulation: z.boolean().optional(),
          penalties: z.number().min(0).default(0).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify round belongs to user
        const round = await getRoundById(input.roundId, ctx.user.id);
        if (!round) throw new Error("Round not found");

        const holeData = input.holes.map(h => ({
          ...h,
          roundId: input.roundId,
          fairwayHit: h.fairwayHit ?? "na" as const,
          greenInRegulation: h.greenInRegulation ?? false,
          penalties: h.penalties ?? 0,
        }));

        await upsertHoleScores(input.roundId, holeData);

        // Recalculate totals
        const totalScore = input.holes.reduce((sum, h) => sum + h.score, 0);
        const totalPutts = input.holes.filter(h => h.putts !== undefined).reduce((sum, h) => sum + (h.putts ?? 0), 0);
        const fairwayHoles = input.holes.filter(h => h.fairwayHit !== "na" && h.par !== 3);
        const fairwaysHit = fairwayHoles.filter(h => h.fairwayHit === "hit").length;
        const greensInRegulation = input.holes.filter(h => h.greenInRegulation).length;

        await updateRound(input.roundId, ctx.user.id, {
          totalScore,
          totalPutts: totalPutts > 0 ? totalPutts : undefined,
          fairwaysHit,
          fairwaysTotal: fairwayHoles.length,
          greensInRegulation,
        });

        return { success: true, totalScore };
      }),
  }),

  // ─── Statistics ───────────────────────────────────────────────────────────
  stats: router({
    summary: protectedProcedure.query(({ ctx }) => getUserStats(ctx.user.id)),
    holeStats: protectedProcedure.query(({ ctx }) => getHoleStatsForUser(ctx.user.id)),
    trends: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ ctx, input }) => {
        const rounds = await getRoundsByUserId(ctx.user.id);
        return rounds.slice(0, input?.limit ?? 20).reverse().map(r => ({
          id: r.id,
          playedAt: r.playedAt,
          totalScore: r.totalScore,
          totalPutts: r.totalPutts,
          fairwaysHit: r.fairwaysHit,
          fairwaysTotal: r.fairwaysTotal,
          greensInRegulation: r.greensInRegulation,
          courseId: r.courseId,
        }));
      }),
  }),

  // ─── AI Analysis ──────────────────────────────────────────────────────────
  ai: router({
    analyze: protectedProcedure
      .input(z.object({ roundId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const stats = await getUserStats(ctx.user.id);
        const holeStats = await getHoleStatsForUser(ctx.user.id);
        const recentRounds = await getRoundsByUserId(ctx.user.id);
        const last5 = recentRounds.slice(0, 5);

        let roundDetail = "";
        if (input.roundId) {
          const round = await getRoundById(input.roundId, ctx.user.id);
          const holes = await getHoleScoresByRoundId(input.roundId);
          if (round && holes.length > 0) {
            roundDetail = `\n最近一場下場詳情（${new Date(round.playedAt).toLocaleDateString('zh-TW')}）：\n` +
              holes.map(h => `洞${h.holeNumber}: 標準桿${h.par}, 打了${h.score}桿, ${h.putts ?? 'N/A'}推桿, ${h.fairwayHit === 'hit' ? '球道命中' : h.fairwayHit === 'na' ? '' : '球道未中'}, ${h.greenInRegulation ? 'GIR達成' : 'GIR未達'}`).join('\n');
          }
        }

        const prompt = `你是一位專業的高爾夫教練，請根據以下球員的歷史數據，用繁體中文提供詳細的個人化分析與改善建議。

球員整體統計：
- 總下場次數：${stats?.totalRounds ?? 0} 次
- 平均桿數：${stats?.avgScore?.toFixed(1) ?? 'N/A'}
- 最佳成績：${stats?.bestScore ?? 'N/A'}
- 平均推桿數：${stats?.avgPutts?.toFixed(1) ?? 'N/A'}
- 球道命中率：${stats?.fairwayHitRate ? (stats.fairwayHitRate * 100).toFixed(1) + '%' : 'N/A'}
- 平均上果嶺率(GIR)：${stats?.avgGir ? (stats.avgGir / 18 * 100).toFixed(1) + '%' : 'N/A'}

最近5場成績：${last5.map(r => `${r.totalScore ?? 'N/A'}桿`).join(', ')}

各洞平均表現（最弱的幾洞）：
${holeStats.sort((a, b) => (b.avgScore - b.holeNumber) - (a.avgScore - a.holeNumber)).slice(0, 5).map(h => `第${h.holeNumber}洞：平均${h.avgScore.toFixed(1)}桿`).join('\n')}
${roundDetail}

請提供：
1. **整體表現評估**（2-3句話）
2. **主要弱點分析**（列出2-3個具體問題）
3. **推桿改善建議**（具體練習方法）
4. **球道命中率改善建議**（技術與策略）
5. **重點練習計畫**（每週練習建議）
6. **心理與策略建議**（上場策略）

請用結構化的方式回答，每個部分都要有具體可執行的建議。`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位擁有20年教學經驗的專業高爾夫教練，擅長數據分析與個人化訓練計畫。請用繁體中文回答。" },
            { role: "user", content: prompt },
          ],
        });

        const rawAnalysis = response.choices[0]?.message?.content;
        const analysis = typeof rawAnalysis === 'string' ? rawAnalysis : "無法生成分析";

        // Cache analysis if roundId provided
        if (input.roundId) {
          await updateRound(input.roundId, ctx.user.id, { aiAnalysis: analysis });
        }

        return { analysis };
      }),

    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const stats = await getUserStats(ctx.user.id);
        const systemPrompt = `你是一位專業的高爾夫教練助理，正在協助一位高爾夫球員改善技術。
球員資料：平均桿數 ${stats?.avgScore?.toFixed(1) ?? 'N/A'}，推桿平均 ${stats?.avgPutts?.toFixed(1) ?? 'N/A'}，球道命中率 ${stats?.fairwayHitRate ? (stats.fairwayHitRate * 100).toFixed(1) + '%' : 'N/A'}。
請用繁體中文回答，提供專業、具體且鼓勵性的建議。`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });

        const rawContent2 = response.choices[0]?.message?.content;
        return { reply: typeof rawContent2 === 'string' ? rawContent2 : "抱歉，無法生成回應" };
      }),

    fullAnalysis: protectedProcedure
      .mutation(async ({ ctx }) => {
        const stats = await getUserStats(ctx.user.id);
        const holeStats = await getHoleStatsForUser(ctx.user.id);
        const recentRounds = await getRoundsByUserId(ctx.user.id);
        const last10 = recentRounds.slice(0, 10);

        const prompt = `你是一位專業的高爾夫教練，請根據以下球員的完整歷史數據，用繁體中文提供全面的分析報告。

球員整體統計：
- 總下場次數：${stats?.totalRounds ?? 0} 次
- 平均桿數：${stats?.avgScore?.toFixed(1) ?? 'N/A'}
- 最佳成績：${stats?.bestScore ?? 'N/A'}
- 最差成績：${stats?.worstScore ?? 'N/A'}
- 平均推桿數：${stats?.avgPutts?.toFixed(1) ?? 'N/A'}
- 球道命中率：${stats?.fairwayHitRate ? (stats.fairwayHitRate * 100).toFixed(1) + '%' : 'N/A'}
- 平均上果嶺率(GIR)：${stats?.avgGir ? (stats.avgGir / 18 * 100).toFixed(1) + '%' : 'N/A'}

最近10場成績：${last10.map(r => r.totalScore ?? 'N/A').join(', ')}

最難的洞（平均桿數最高）：
${holeStats.sort((a, b) => b.avgScore - a.avgScore).slice(0, 5).map(h => `第${h.holeNumber}洞：平均${h.avgScore.toFixed(1)}桿`).join('\n')}

請提供完整的分析報告，包含：
1. **整體水平評估**
2. **優勢項目**
3. **改善重點**（推桿、球道命中、GIR）
4. **各洞弱點分析**
5. **8週訓練計畫**
6. **比賽策略建議**
7. **裝備建議**（如適用）`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位擁有20年教學經驗的專業高爾夫教練。請用繁體中文提供詳細、結構化的分析報告。" },
            { role: "user", content: prompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        return { analysis: typeof rawContent === 'string' ? rawContent : "無法生成分析" };
      }),
  }),

  // ─── Weather ──────────────────────────────────────────────────────────────
  weather: router({
    getForRound: protectedProcedure
      .input(z.object({
        roundId: z.number(),
        lat: z.number().optional(),
        lon: z.number().optional(),
        date: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const round = await getRoundById(input.roundId, ctx.user.id);
        if (!round) throw new Error("Round not found");

        // Use Open-Meteo free API (no key required)
        const lat = input.lat ?? 25.0330; // Default: Taipei
        const lon = input.lon ?? 121.5654;
        const dateStr = (input.date ?? round.playedAt).toISOString().split('T')[0];

        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Asia/Taipei&start_date=${dateStr}&end_date=${dateStr}`;
          const response = await fetch(url);
          const data = await response.json() as {
            daily?: {
              temperature_2m_max?: number[];
              temperature_2m_min?: number[];
              precipitation_sum?: number[];
              windspeed_10m_max?: number[];
            }
          };

          const weatherData = {
            temperature: data.daily?.temperature_2m_max?.[0] ?? undefined,
            windSpeed: data.daily?.windspeed_10m_max?.[0] ?? undefined,
            precipitation: data.daily?.precipitation_sum?.[0] ?? undefined,
            condition: (data.daily?.precipitation_sum?.[0] ?? 0) > 5 ? "雨天" :
              (data.daily?.windspeed_10m_max?.[0] ?? 0) > 30 ? "強風" : "晴朗",
            description: `氣溫 ${data.daily?.temperature_2m_max?.[0] ?? 'N/A'}°C, 風速 ${data.daily?.windspeed_10m_max?.[0] ?? 'N/A'} km/h`,
          };

          await updateRound(input.roundId, ctx.user.id, { weatherData });
          return weatherData;
        } catch (e) {
          console.error("Weather API error:", e);
          return null;
        }
      }),
  }),

  // ─── Scorecard Image Generation ───────────────────────────────────────────
  scorecard: router({
    generateImage: protectedProcedure
      .input(z.object({ roundId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const round = await getRoundById(input.roundId, ctx.user.id);
        if (!round) throw new Error("Round not found");
        const holes = await getHoleScoresByRoundId(input.roundId);

        const scoreDiff = round.totalScore ? round.totalScore - 72 : 0;
        const scoreStr = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;

        const prompt = `A professional golf scorecard design for social media sharing. 
Clean, modern Swiss International Typographic Style design with:
- Pure white background with bold red accent squares
- Black sans-serif typography (Helvetica/Arial style)
- Course name prominently displayed
- Score: ${round.totalScore ?? 'N/A'} (${scoreStr} vs par)
- Date: ${new Date(round.playedAt).toLocaleDateString('zh-TW')}
- Grid layout showing hole-by-hole scores
- Minimalist, professional golf aesthetic
- Red and black color scheme on white
- No text overlay needed, just the visual design`;

        const { url } = await generateImage({ prompt });
        await updateRound(input.roundId, ctx.user.id, { scorecardImageUrl: url });
        return { imageUrl: url };
      }),
  }),

  // ─── Voice Transcription ──────────────────────────────────────────────────
  voice: router({
    transcribeScore: protectedProcedure
      .input(z.object({
        audioUrl: z.string().url(),
        holeCount: z.number().default(18),
      }))
      .mutation(async ({ input }) => {
        const { transcribeAudio } = await import("./_core/voiceTranscription");
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "zh",
          prompt: "高爾夫球成績紀錄，包含洞號、桿數、推桿數",
        });

        if ('error' in result) {
          throw new Error(result.error);
        }
        const transcriptText = result.text;

        // Parse the transcription with LLM
        const parseResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一個高爾夫成績解析助手。從語音轉文字的結果中提取每洞成績數據，返回JSON格式。",
            },
            {
              role: "user",
              content: `請從以下語音紀錄中提取高爾夫成績，返回JSON陣列格式：
語音內容：${transcriptText}

返回格式：
[{"holeNumber": 1, "score": 4, "putts": 2, "fairwayHit": "hit", "greenInRegulation": true}, ...]

只返回JSON，不要其他文字。fairwayHit只能是"hit"、"left"、"right"或"na"。`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "golf_scores",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  holes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        holeNumber: { type: "integer" },
                        score: { type: "integer" },
                        putts: { type: "integer" },
                        fairwayHit: { type: "string", enum: ["hit", "left", "right", "na"] },
                        greenInRegulation: { type: "boolean" },
                      },
                      required: ["holeNumber", "score"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["holes"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = parseResponse.choices[0]?.message?.content;
        const contentStr = typeof rawContent === 'string' ? rawContent : '{}';
        const parsed = JSON.parse(contentStr) as { holes?: unknown[] };
        return {
          transcription: transcriptText,
          holes: parsed.holes ?? [],
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
