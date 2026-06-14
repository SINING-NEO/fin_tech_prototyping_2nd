import { NextRequest, NextResponse } from "next/server";
import { generateCopilotAssist } from "@/lib/llm";
import type { ChatMessage } from "@/lib/types";
import type { FrHandoffDocument } from "@/lib/navigator/types";

interface CopilotRequest {
  messages: ChatMessage[];
  agentQuery?: string;
  handoff?: FrHandoffDocument;
  sessionContext?: { handoff?: FrHandoffDocument; status?: string };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CopilotRequest;

    if (!body.messages?.length && !body.agentQuery) {
      return NextResponse.json({ error: "Messages or agentQuery required" }, { status: 400 });
    }

    const handoff = body.handoff ?? body.sessionContext?.handoff;
    const response = await generateCopilotAssist(body.messages ?? [], body.agentQuery, handoff);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Copilot API error:", error);
    return NextResponse.json(
      { error: "Failed to generate copilot suggestions" },
      { status: 500 }
    );
  }
}
