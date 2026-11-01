import { createChatHandler } from "@/features/chat/server/http";
import { getAiServices } from "@/lib/ai/services";

export const POST = createChatHandler(getAiServices);
