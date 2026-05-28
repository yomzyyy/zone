import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/shared/lib/supabase/server";
import {
  appendMessage,
  getOrCreateUsage,
  incrementUsage,
} from "@/shared/lib/supabase/queries/assistant";
import {
  ASSISTANT_DAILY_LIMIT,
  ASSISTANT_MODEL,
  ASSISTANT_SYSTEM_PROMPT,
} from "@/modules/assistant/constants";
import type {
  AssistantContext,
  AssistantMessage,
  SendMessageBody,
} from "@/modules/assistant/types";

export const runtime = "nodejs";

function buildContextBlock(context: AssistantContext): string {
  const taskLines =
    context.tasks.length === 0
      ? "(no tasks yet)"
      : context.tasks
          .slice(0, 50)
          .map(
            (t) =>
              `- "${t.title}" — status: ${t.status}, priority: ${t.priority}${t.dueDate ? `, due: ${t.dueDate}` : ""}`,
          )
          .join("\n");

  return `User context (today, ${new Date().toISOString().slice(0, 10)}):
- Today's focus time: ${context.todayMinutes} minutes across ${context.todaySessions} sessions
- Current streak: ${context.streakDays} days
- Tasks (${context.tasks.length} total):
${taskLines}`;
}

export async function POST(request: Request) {
  const enabledRaw = (process.env.ASSISTANT_ENABLED ?? "").toLowerCase();
  if (enabledRaw !== "true" && enabledRaw !== "1") {
    return NextResponse.json(
      { error: "Zone Assistant is not available yet." },
      { status: 503 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Zone Assistant is not configured. Set ANTHROPIC_API_KEY in .env.local to enable.",
      },
      { status: 503 },
    );
  }

  let body: SendMessageBody;
  try {
    body = (await request.json()) as SendMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Auth not configured" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const usage = await getOrCreateUsage(supabase, userId);
  if (usage.count >= ASSISTANT_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `You've used your ${ASSISTANT_DAILY_LIMIT} messages today. Come back tomorrow.`,
        remaining: 0,
      },
      { status: 429 },
    );
  }
  const remaining = ASSISTANT_DAILY_LIMIT - usage.count - 1;

  const client = new Anthropic({ apiKey });
  const history: AssistantMessage[] = (body.history ?? []).slice(-12);
  const messages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: body.message },
  ];

  const contextBlock = buildContextBlock(body.context);

  let reply: string;
  try {
    const result = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: ASSISTANT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: contextBlock },
      ],
      messages,
    });

    const textBlocks = result.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    reply =
      textBlocks.map((b) => b.text).join("\n").trim() ||
      "(no response)";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Assistant API error:", message);
    return NextResponse.json(
      { error: `Assistant failed: ${message}` },
      { status: 500 },
    );
  }

  try {
    await Promise.all([
      appendMessage(supabase, userId, "user", body.message),
      appendMessage(supabase, userId, "assistant", reply),
      incrementUsage(supabase, userId),
    ]);
  } catch (err) {
    console.warn(
      "Failed to persist assistant message:",
      err instanceof Error ? err.message : String(err),
    );
  }

  return NextResponse.json({ reply, remaining });
}
