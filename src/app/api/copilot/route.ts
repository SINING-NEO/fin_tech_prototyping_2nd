import { NextRequest, NextResponse } from "next/server";
import { generateCopilotAssist } from "@/lib/llm";
import type { ChatMessage } from "@/lib/types";

interface CopilotRequest {
  messages: ChatMessage[];
  agentQuery?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CopilotRequest;

    if (!body.messages?.length) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const response = await generateCopilotAssist(body.messages, body.agentQuery);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Copilot API error:", error);
    return NextResponse.json(
      { error: "Failed to generate copilot suggestions" },
      { status: 500 }
    );
  }
}
