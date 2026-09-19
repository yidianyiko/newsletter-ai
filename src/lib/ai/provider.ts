import type { DraftContent } from "@/lib/db/types";

export interface DraftInput {
  topic: string;
  sourceMaterial: string;
  writingInstructions: string;
}

export interface DraftGenerator {
  generate(input: DraftInput): Promise<DraftContent>;
}

export class DemoDraftGenerator implements DraftGenerator {
  async generate(input: DraftInput): Promise<DraftContent> {
    const topic = input.topic.trim() || "本周来信";
    return {
      subject: topic,
      previewText: "从本周素材中整理出的想法与发现",
      bodyMarkdown: `# ${topic}\n\n你好，\n\n这是根据本期素材整理的草稿。配置 OpenAI API Key 后，系统会在这里生成完整内容。\n\n## 本期素材\n\n${input.sourceMaterial || "请先补充素材。"}\n\n---\n\n感谢阅读。`,
    };
  }
}
