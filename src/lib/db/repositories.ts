import { randomUUID } from "node:crypto";
import { normalizeEmail } from "@/lib/domain/subscribers";
import type { Delivery, DraftContent, Issue, IssueInput, Subscriber } from "./types";

export interface IssueRepository {
  create(input: IssueInput): Promise<Issue>;
  get(id: string): Promise<Issue | null>;
  list(): Promise<Issue[]>;
  update(id: string, patch: Partial<Issue>): Promise<Issue>;
}

export interface SubscriberRepository {
  upsertPending(email: string, confirmationTokenHash: string, unsubscribeTokenHash: string): Promise<Subscriber>;
  getByConfirmationHash(hash: string): Promise<Subscriber | null>;
  getByUnsubscribeHash(hash: string): Promise<Subscriber | null>;
  get(id: string): Promise<Subscriber | null>;
  update(id: string, patch: Partial<Subscriber>): Promise<Subscriber>;
  list(): Promise<Subscriber[]>;
}

export interface DeliveryRepository {
  create(issueId: string, subscriberId: string, recipientEmail: string): Promise<Delivery>;
  listForIssue(issueId: string): Promise<Delivery[]>;
  getByProviderMessageId(messageId: string): Promise<Delivery | null>;
  update(id: string, patch: Partial<Delivery>): Promise<Delivery>;
}

export interface NewsletterDatabase {
  issues: IssueRepository;
  subscribers: SubscriberRepository;
  deliveries: DeliveryRepository;
  generationRuns: Array<{ issueId: string; status: "completed" | "failed"; output?: DraftContent; error?: string }>;
  processedEvents: Set<string>;
  jobRuns: Set<string>;
  recordGenerationRun(run: { issueId: string; status: "completed" | "failed"; output?: DraftContent; error?: string }): Promise<void>;
  hasProcessedEvent(id: string): Promise<boolean>;
  markProcessedEvent(id: string, type: string, payload?: unknown): Promise<void>;
  claimJob(key: string, type: string): Promise<boolean>;
}

function now() { return new Date().toISOString(); }

export class MemoryDatabase implements NewsletterDatabase {
  private issueRows = new Map<string, Issue>();
  private subscriberRows = new Map<string, Subscriber>();
  private deliveryRows = new Map<string, Delivery>();
  generationRuns: NewsletterDatabase["generationRuns"] = [];
  processedEvents = new Set<string>();
  jobRuns = new Set<string>();

  async recordGenerationRun(run: NewsletterDatabase["generationRuns"][number]) { this.generationRuns.push(run); }
  async hasProcessedEvent(id: string) { return this.processedEvents.has(id); }
  async markProcessedEvent(id: string) { this.processedEvents.add(id); }
  async claimJob(key: string) {
    if (this.jobRuns.has(key)) return false;
    this.jobRuns.add(key);
    return true;
  }

  issues: IssueRepository = {
    create: async (input) => {
      const timestamp = now();
      const row: Issue = { id: randomUUID(), ...input, subject: "", previewText: "", bodyMarkdown: "", status: "draft", confirmedAt: null, scheduledAt: null, sentAt: null, createdAt: timestamp, updatedAt: timestamp };
      this.issueRows.set(row.id, row);
      return structuredClone(row);
    },
    get: async (id) => structuredClone(this.issueRows.get(id) ?? null),
    list: async () => [...this.issueRows.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => structuredClone(row)),
    update: async (id, patch) => {
      const current = this.issueRows.get(id);
      if (!current) throw new Error("Issue not found");
      const row = { ...current, ...patch, id, updatedAt: now() };
      this.issueRows.set(id, row);
      return structuredClone(row);
    },
  };

  subscribers: SubscriberRepository = {
    upsertPending: async (email, confirmationTokenHash, unsubscribeTokenHash) => {
      const normalized = normalizeEmail(email);
      const existing = [...this.subscriberRows.values()].find((row) => row.email === normalized);
      if (existing) {
        const row = existing.status === "active" ? existing : { ...existing, status: "pending" as const, confirmationTokenHash, unsubscribeTokenHash, unsubscribedAt: null };
        this.subscriberRows.set(row.id, row);
        return structuredClone(row);
      }
      const row: Subscriber = { id: randomUUID(), email: normalized, status: "pending", confirmationTokenHash, unsubscribeTokenHash, confirmedAt: null, unsubscribedAt: null, createdAt: now() };
      this.subscriberRows.set(row.id, row);
      return structuredClone(row);
    },
    getByConfirmationHash: async (hash) => structuredClone([...this.subscriberRows.values()].find((row) => row.confirmationTokenHash === hash) ?? null),
    getByUnsubscribeHash: async (hash) => structuredClone([...this.subscriberRows.values()].find((row) => row.unsubscribeTokenHash === hash) ?? null),
    get: async (id) => structuredClone(this.subscriberRows.get(id) ?? null),
    update: async (id, patch) => {
      const current = this.subscriberRows.get(id);
      if (!current) throw new Error("Subscriber not found");
      const row = { ...current, ...patch, id };
      this.subscriberRows.set(id, row);
      return structuredClone(row);
    },
    list: async () => [...this.subscriberRows.values()].map((row) => structuredClone(row)),
  };

  deliveries: DeliveryRepository = {
    create: async (issueId, subscriberId, recipientEmail) => {
      const key = `${issueId}:${subscriberId}`;
      const existing = this.deliveryRows.get(key);
      if (existing) return structuredClone(existing);
      const row: Delivery = { id: randomUUID(), issueId, subscriberId, recipientEmail, status: "queued", providerMessageId: null, attempts: 0, error: null };
      this.deliveryRows.set(key, row);
      return structuredClone(row);
    },
    listForIssue: async (issueId) => [...this.deliveryRows.values()].filter((row) => row.issueId === issueId).map((row) => structuredClone(row)),
    getByProviderMessageId: async (messageId) => structuredClone([...this.deliveryRows.values()].find((row) => row.providerMessageId === messageId) ?? null),
    update: async (id, patch) => {
      const entry = [...this.deliveryRows.entries()].find(([, row]) => row.id === id);
      if (!entry) throw new Error("Delivery not found");
      const row = { ...entry[1], ...patch, id };
      this.deliveryRows.set(entry[0], row);
      return structuredClone(row);
    },
  };
}

const globalForDb = globalThis as unknown as { newsletterDb?: MemoryDatabase };
export const memoryDb = globalForDb.newsletterDb ?? new MemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.newsletterDb = memoryDb;
