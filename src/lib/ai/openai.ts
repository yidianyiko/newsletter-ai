import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import type { DraftGenerator, DraftInput } from "./provider";

const draftSchema = z.object({
  subject: z.string().min(1).max(120),
  previewText: z.string().min(1).max(180),
  bodyMarkdown: z.string().min(1),
});

export class OpenAIDraftGenerator implements DraftGenerator {
  private client: OpenAI;
  constructor(apiKey: string, private model = process.env.OPENAI_MODEL ?? "gpt-5-mini") {
    this.client = new OpenAI({ apiKey });
  }

  async generate(input: DraftInput) {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: "你是一位克制、清晰的 Newsletter 编辑。只使用用户提供的素材，不虚构事实。输出自然的中文 Markdown 正文。",
      input: `本期主题：${input.topic}\n\n写作要求：${input.writingInstructions}\n\n素材：\n${input.sourceMaterial}`,
      text: {
        format: {
          type: "json_schema",
          name: "newsletter_draft",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["subject", "previewText", "bodyMarkdown"],
            properties: {
              subject: { type: "string" },
              previewText: { type: "string" },
              bodyMarkdown: { type: "string" },
            },
          },
        },
      },
    });
    return draftSchema.parse(JSON.parse(response.output_text));
  }
}
