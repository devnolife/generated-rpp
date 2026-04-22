import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  LLM_PROFILES,
  LlmEndpoint,
  LlmProfile,
  resolveProfile,
} from './llm.config';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatOptions {
  /** Profile model: 'main' | 'fast' | 'creative' | 'reason' (default 'fast'). */
  profile?: LlmProfile;
  /** Atau langsung mapping dari label `AiModel` enum (RPP). */
  aiModel?: string | null;
  /** System prompt (di-prepend ke messages bila `messages` tidak diberikan). */
  system?: string;
  /** User prompt cepat (kalau tidak pakai `messages`). */
  prompt?: string;
  /** Pesan ChatML penuh (override `system` & `prompt`). */
  messages?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  /** Paksa output JSON via `response_format: json_object`. */
  json?: boolean;
}

/**
 * Service terpusat untuk semua interaksi LLM.
 * Pakai SDK `openai` karena vLLM expose API yang sepenuhnya kompatibel.
 * Tidak ada koneksi ke openai.com / generativelanguage.googleapis.com.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly clients = new Map<LlmProfile, OpenAI>();
  private tokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  private getClient(profile: LlmProfile): { client: OpenAI; ep: LlmEndpoint } {
    const ep = LLM_PROFILES[profile];
    let client = this.clients.get(profile);
    if (!client) {
      client = new OpenAI({ baseURL: ep.baseURL, apiKey: ep.apiKey });
      this.clients.set(profile, client);
    }
    return { client, ep };
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  private addUsage(
    u?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    } | null,
  ): void {
    if (!u) return;
    this.tokenUsage.promptTokens += u.prompt_tokens ?? 0;
    this.tokenUsage.completionTokens += u.completion_tokens ?? 0;
    this.tokenUsage.totalTokens += u.total_tokens ?? 0;
  }

  /** Generasi teks (chat completion). Mengembalikan string konten. */
  async chat(opts: ChatOptions): Promise<string> {
    const profile: LlmProfile =
      opts.profile ??
      (opts.aiModel ? resolveProfile(opts.aiModel) : 'fast');
    const { client, ep } = this.getClient(profile);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      opts.messages
        ? [...opts.messages]
        : [
            ...(opts.system
              ? [{ role: 'system' as const, content: opts.system }]
              : []),
            { role: 'user' as const, content: opts.prompt ?? '' },
          ];

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: ep.model,
        messages,
        temperature:
          opts.temperature ?? ep.defaults?.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? ep.defaults?.max_tokens ?? 4096,
      };
    if (opts.top_p ?? ep.defaults?.top_p) {
      params.top_p = opts.top_p ?? ep.defaults!.top_p!;
    }
    if (opts.json) {
      params.response_format = { type: 'json_object' };
    }

    try {
      const t0 = Date.now();
      const res = await client.chat.completions.create(params);
      const ms = Date.now() - t0;

      this.addUsage(res.usage);
      this.logger.log(
        `[${profile}/${ep.model}] ${ms}ms ` +
          `prompt=${res.usage?.prompt_tokens ?? '?'} ` +
          `completion=${res.usage?.completion_tokens ?? '?'}`,
      );

      return res.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
      this.logger.error(
        `LLM call failed [${profile}/${ep.model}]: ${err?.message ?? err}`,
      );
      throw new Error(`LLM call failed: ${err?.message ?? err}`);
    }
  }

  /**
   * Sama dengan chat() tapi memaksa output JSON dan otomatis parse.
   * Fallback parser: kalau json_object gagal, ekstrak balanced `{...}` pertama.
   */
  async chatJson<T = any>(opts: ChatOptions): Promise<T> {
    const text = await this.chat({ ...opts, json: true });
    return parseJsonLoose<T>(text);
  }

  /** Embedding via Infinity / TEI (juga OpenAI-compatible). */
  async embed(input: string | string[]): Promise<number[][]> {
    const { client, ep } = this.getClient('embedding');
    const res = await client.embeddings.create({ model: ep.model, input });
    return res.data.map((d) => d.embedding as number[]);
  }
}

/**
 * Parse JSON yang mungkin masih dibungkus markdown atau teks.
 * Strategi: trim → coba langsung → strip code fence → ambil balanced `{...}`.
 */
export function parseJsonLoose<T = any>(raw: string): T {
  if (!raw) throw new Error('Empty LLM response');
  const stripped = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* ignore, fall through */
      }
    }
    throw new Error('LLM response is not valid JSON');
  }
}
