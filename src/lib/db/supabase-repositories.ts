import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewsletterDatabase } from "./repositories";
import type { Delivery, DraftContent, Issue, IssueInput, Subscriber } from "./types";

const issueFromRow = (row: Record<string, unknown>): Issue => ({
  id: row.id as string, topic: row.topic as string, sourceMaterial: row.source_material as string,
  writingInstructions: row.writing_instructions as string, subject: row.subject as string,
  previewText: row.preview_text as string, bodyMarkdown: row.body_markdown as string,
  status: row.status as Issue["status"], confirmedAt: row.confirmed_at as string | null,
  scheduledAt: row.scheduled_at as string | null, sentAt: row.sent_at as string | null,
  createdAt: row.created_at as string, updatedAt: row.updated_at as string,
});

const subscriberFromRow = (row: Record<string, unknown>): Subscriber => ({
  id: row.id as string, email: row.email as string, status: row.status as Subscriber["status"],
  confirmationTokenHash: row.confirmation_token_hash as string, unsubscribeTokenHash: row.unsubscribe_token_hash as string,
  confirmedAt: row.confirmed_at as string | null, unsubscribedAt: row.unsubscribed_at as string | null, createdAt: row.created_at as string,
});

const deliveryFromRow = (row: Record<string, unknown>): Delivery => ({
  id: row.id as string, issueId: row.issue_id as string, subscriberId: row.subscriber_id as string,
  recipientEmail: row.recipient_email as string, status: row.status as Delivery["status"],
  providerMessageId: row.provider_message_id as string | null, attempts: row.attempts as number, error: row.error as string | null,
});

function issuePatch(patch: Partial<Issue>) {
  const map: Record<string, unknown> = {};
  const keys: Array<[keyof Issue, string]> = [["topic", "topic"], ["sourceMaterial", "source_material"], ["writingInstructions", "writing_instructions"], ["subject", "subject"], ["previewText", "preview_text"], ["bodyMarkdown", "body_markdown"], ["status", "status"], ["confirmedAt", "confirmed_at"], ["scheduledAt", "scheduled_at"], ["sentAt", "sent_at"]];
  for (const [from, to] of keys) if (from in patch) map[to] = patch[from];
  map.updated_at = new Date().toISOString();
  return map;
}

export class SupabaseNewsletterDatabase implements NewsletterDatabase {
  generationRuns: NewsletterDatabase["generationRuns"] = [];
  processedEvents = new Set<string>();
  jobRuns = new Set<string>();

  constructor(private client: SupabaseClient) {}

  issues = {
    create: async (input: IssueInput) => {
      const { data, error } = await this.client.from("issues").insert({ topic: input.topic, source_material: input.sourceMaterial, writing_instructions: input.writingInstructions }).select().single();
      if (error) throw error; return issueFromRow(data);
    },
    get: async (id: string) => {
      const { data, error } = await this.client.from("issues").select("*").eq("id", id).maybeSingle();
      if (error) throw error; return data ? issueFromRow(data) : null;
    },
    list: async () => {
      const { data, error } = await this.client.from("issues").select("*").order("created_at", { ascending: false });
      if (error) throw error; return (data ?? []).map(issueFromRow);
    },
    update: async (id: string, patch: Partial<Issue>) => {
      const { data, error } = await this.client.from("issues").update(issuePatch(patch)).eq("id", id).select().single();
      if (error) throw error; return issueFromRow(data);
    },
  };

  subscribers = {
    upsertPending: async (email: string, confirmationTokenHash: string, unsubscribeTokenHash: string) => {
      const normalized = email.trim().toLowerCase();
      const { data: existing, error: readError } = await this.client.from("subscribers").select("*").eq("normalized_email", normalized).maybeSingle();
      if (readError) throw readError;
      if (existing?.status === "active") return subscriberFromRow(existing);
      const query = existing
        ? this.client.from("subscribers").update({ email: normalized, status: "pending", confirmation_token_hash: confirmationTokenHash, unsubscribe_token_hash: unsubscribeTokenHash, unsubscribed_at: null }).eq("id", existing.id)
        : this.client.from("subscribers").insert({ email: normalized, confirmation_token_hash: confirmationTokenHash, unsubscribe_token_hash: unsubscribeTokenHash });
      const { data, error } = await query.select().single();
      if (error) throw error; return subscriberFromRow(data);
    },
    getByConfirmationHash: async (hash: string) => this.findSubscriber("confirmation_token_hash", hash),
    getByUnsubscribeHash: async (hash: string) => this.findSubscriber("unsubscribe_token_hash", hash),
    get: async (id: string) => this.findSubscriber("id", id),
    update: async (id: string, patch: Partial<Subscriber>) => {
      const values: Record<string, unknown> = {};
      if ("status" in patch) values.status = patch.status;
      if ("confirmedAt" in patch) values.confirmed_at = patch.confirmedAt;
      if ("unsubscribedAt" in patch) values.unsubscribed_at = patch.unsubscribedAt;
      const { data, error } = await this.client.from("subscribers").update(values).eq("id", id).select().single();
      if (error) throw error; return subscriberFromRow(data);
    },
    list: async () => {
      const { data, error } = await this.client.from("subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error; return (data ?? []).map(subscriberFromRow);
    },
  };

  deliveries = {
    create: async (issueId: string, subscriberId: string, recipientEmail: string) => {
      const { data: existing } = await this.client.from("deliveries").select("*").eq("issue_id", issueId).eq("subscriber_id", subscriberId).maybeSingle();
      if (existing) return deliveryFromRow(existing);
      const { data, error } = await this.client.from("deliveries").insert({ issue_id: issueId, subscriber_id: subscriberId, recipient_email: recipientEmail }).select().single();
      if (error) throw error; return deliveryFromRow(data);
    },
    listForIssue: async (issueId: string) => {
      const { data, error } = await this.client.from("deliveries").select("*").eq("issue_id", issueId);
      if (error) throw error; return (data ?? []).map(deliveryFromRow);
    },
    getByProviderMessageId: async (messageId: string) => {
      const { data, error } = await this.client.from("deliveries").select("*").eq("provider_message_id", messageId).maybeSingle();
      if (error) throw error; return data ? deliveryFromRow(data) : null;
    },
    update: async (id: string, patch: Partial<Delivery>) => {
      const values: Record<string, unknown> = {};
      const keys: Array<[keyof Delivery, string]> = [["status", "status"], ["providerMessageId", "provider_message_id"], ["attempts", "attempts"], ["error", "error"]];
      for (const [from, to] of keys) if (from in patch) values[to] = patch[from];
      const { data, error } = await this.client.from("deliveries").update(values).eq("id", id).select().single();
      if (error) throw error; return deliveryFromRow(data);
    },
  };

  async recordGenerationRun(run: { issueId: string; status: "completed" | "failed"; output?: DraftContent; error?: string }) {
    const { error } = await this.client.from("generation_runs").insert({ issue_id: run.issueId, status: run.status, output: run.output ?? null, error: run.error ?? null });
    if (error) throw error;
  }
  async hasProcessedEvent(id: string) { const { data, error } = await this.client.from("email_events").select("provider_event_id").eq("provider_event_id", id).maybeSingle(); if (error) throw error; return Boolean(data); }
  async markProcessedEvent(id: string, type: string, payload?: unknown) { const { error } = await this.client.from("email_events").insert({ provider_event_id: id, event_type: type, payload: payload ?? {} }); if (error?.code !== "23505" && error) throw error; }
  async claimJob(key: string, type: string) { const { error } = await this.client.from("job_runs").insert({ job_key: key, job_type: type, status: "started" }); if (error?.code === "23505") return false; if (error) throw error; return true; }

  private async findSubscriber(column: string, value: string) { const { data, error } = await this.client.from("subscribers").select("*").eq(column, value).maybeSingle(); if (error) throw error; return data ? subscriberFromRow(data) : null; }
}
