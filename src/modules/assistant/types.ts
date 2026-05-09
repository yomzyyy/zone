export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
}

export interface AssistantContext {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }>;
  todayMinutes: number;
  todaySessions: number;
  streakDays: number;
}

export interface SendMessageBody {
  message: string;
  history: AssistantMessage[];
  context: AssistantContext;
}

export interface SendMessageResponse {
  reply: string;
  remaining: number;
}
