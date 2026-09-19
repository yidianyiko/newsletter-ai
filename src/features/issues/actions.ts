"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { memoryDb } from "@/lib/db/repositories";
import { IssueService } from "./service";
import { generateIssueDraft } from "./generate";
import { DemoDraftGenerator } from "@/lib/ai/provider";
import { OpenAIDraftGenerator } from "@/lib/ai/openai";
import { env } from "@/lib/env";

const text = z.string().max(100_000);

export async function createIssue(formData: FormData) {
  await requireAdmin();
  const issue = await memoryDb.issues.create({
    topic: text.parse(formData.get("topic") ?? ""),
    sourceMaterial: text.parse(formData.get("sourceMaterial") ?? ""),
    writingInstructions: text.parse(formData.get("writingInstructions") ?? ""),
  });
  redirect(`/admin/issues/${issue.id}`);
}

export async function saveIssue(id: string, formData: FormData) {
  await requireAdmin();
  await new IssueService(memoryDb.issues).updateDraft(id, {
    topic: text.parse(formData.get("topic") ?? ""),
    sourceMaterial: text.parse(formData.get("sourceMaterial") ?? ""),
    writingInstructions: text.parse(formData.get("writingInstructions") ?? ""),
    subject: text.parse(formData.get("subject") ?? ""),
    previewText: text.parse(formData.get("previewText") ?? ""),
    bodyMarkdown: text.parse(formData.get("bodyMarkdown") ?? ""),
  });
  revalidatePath(`/admin/issues/${id}`);
}

export async function confirmIssue(id: string) {
  await requireAdmin();
  await new IssueService(memoryDb.issues).confirm(id);
  revalidatePath(`/admin/issues/${id}`);
}

export async function scheduleIssue(id: string, formData: FormData) {
  await requireAdmin();
  const date = z.coerce.date().parse(formData.get("scheduledAt"));
  await new IssueService(memoryDb.issues).schedule(id, date);
  revalidatePath(`/admin/issues/${id}`);
}

export async function generateDraft(id: string) {
  await requireAdmin();
  const generator = env.OPENAI_API_KEY ? new OpenAIDraftGenerator(env.OPENAI_API_KEY) : new DemoDraftGenerator();
  await generateIssueDraft(id, memoryDb, generator);
  revalidatePath(`/admin/issues/${id}`);
}
