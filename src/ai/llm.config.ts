/**
 * Konfigurasi terpusat untuk LLM lokal (vLLM, OpenAI-compatible API).
 * Semua nilai di-override via env. Lihat backend/.env.example.
 */

export type LlmProfile = 'main' | 'fast' | 'creative' | 'reason' | 'embedding';

export interface LlmEndpoint {
  baseURL: string;
  apiKey: string;
  model: string;
  defaults?: { temperature?: number; top_p?: number; max_tokens?: number };
}

const env = (key: string, fallback: string): string =>
  process.env[key] && process.env[key]!.trim().length > 0
    ? process.env[key]!
    : fallback;

const num = (key: string, fallback: number): number => {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const DEFAULT_BASE = 'http://localhost:8000/v1';
const DEFAULT_KEY = 'sk-local';

export const LLM_PROFILES: Record<LlmProfile, LlmEndpoint> = {
  main: {
    baseURL: env('LLM_MAIN_BASE_URL', env('LLM_BASE_URL', DEFAULT_BASE)),
    apiKey: env('LLM_MAIN_API_KEY', env('LLM_API_KEY', DEFAULT_KEY)),
    model: env('LLM_MAIN_MODEL', 'Qwen/Qwen2.5-72B-Instruct-FP8'),
    defaults: {
      temperature: num('LLM_MAIN_TEMPERATURE', 0.7),
      max_tokens: num('LLM_MAIN_MAX_TOKENS', 4096),
    },
  },
  fast: {
    baseURL: env('LLM_FAST_BASE_URL', 'http://localhost:8001/v1'),
    apiKey: env('LLM_FAST_API_KEY', env('LLM_API_KEY', DEFAULT_KEY)),
    model: env('LLM_FAST_MODEL', 'Qwen/Qwen2.5-32B-Instruct-FP8'),
    defaults: {
      temperature: num('LLM_FAST_TEMPERATURE', 0.7),
      max_tokens: num('LLM_FAST_MAX_TOKENS', 4096),
    },
  },
  creative: {
    baseURL: env(
      'LLM_CREATIVE_BASE_URL',
      env('LLM_MAIN_BASE_URL', DEFAULT_BASE),
    ),
    apiKey: env('LLM_CREATIVE_API_KEY', env('LLM_API_KEY', DEFAULT_KEY)),
    model: env(
      'LLM_CREATIVE_MODEL',
      env('LLM_MAIN_MODEL', 'Qwen/Qwen2.5-72B-Instruct-FP8'),
    ),
    defaults: {
      temperature: num('LLM_CREATIVE_TEMPERATURE', 0.85),
      top_p: num('LLM_CREATIVE_TOP_P', 0.95),
      max_tokens: num('LLM_CREATIVE_MAX_TOKENS', 6144),
    },
  },
  reason: {
    baseURL: env(
      'LLM_REASON_BASE_URL',
      env('LLM_MAIN_BASE_URL', DEFAULT_BASE),
    ),
    apiKey: env('LLM_REASON_API_KEY', env('LLM_API_KEY', DEFAULT_KEY)),
    model: env(
      'LLM_REASON_MODEL',
      'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
    ),
    defaults: {
      temperature: num('LLM_REASON_TEMPERATURE', 0.3),
      max_tokens: num('LLM_REASON_MAX_TOKENS', 8192),
    },
  },
  embedding: {
    baseURL: env('LLM_EMBED_BASE_URL', 'http://localhost:8002'),
    apiKey: env('LLM_EMBED_API_KEY', env('LLM_API_KEY', DEFAULT_KEY)),
    model: env('LLM_EMBED_MODEL', 'BAAI/bge-m3'),
  },
};

/**
 * Mapping `AiModel` enum (GraphQL) → profile internal.
 * Mempertahankan backwards-compat untuk client lama.
 */
export const AI_MODEL_TO_PROFILE: Record<string, LlmProfile> = {
  OPENAI: 'main',
  SweetV1: 'main',
  GEMINI: 'fast',
  EmiliaAiV1: 'fast',
  EmiliaAiV2: 'creative',
  EmiliaAiV3: 'reason',
};

export function resolveProfile(aiModel?: string | null): LlmProfile {
  if (!aiModel) return 'fast';
  return AI_MODEL_TO_PROFILE[aiModel] ?? 'fast';
}
