import { NextRequest, NextResponse } from "next/server";
import { generateCustomerChat } from "@/lib/llm";
import type { ChatRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.messages?.length) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const response = await generateCustomerChat(body.messages, body.sessionContext, body.variant ?? "general");

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
