#!/usr/bin/env bash
# Smoke test untuk endpoint createRpp di backend NestJS.
#
# Prasyarat:
#   1. vLLM running di LLM_MAIN_BASE_URL (default http://localhost:8000/v1)
#   2. Backend running di http://localhost:${PORT:-3010}
set -euo pipefail

PORT="${PORT:-3010}"
SUBJECT="${SUBJECT:-Matematika}"
KELAS="${KELAS:-7}"
ALOKASI="${ALOKASI:-2x40 menit}"
AI_MODEL="${AI_MODEL:-GEMINI}"

ENDPOINT="http://localhost:${PORT}/api/graphql"

echo "→ ping vLLM ..."
curl -fsS -m 5 "${LLM_MAIN_BASE_URL:-http://localhost:8000/v1}/models" \
  | head -c 300 || echo "  (vLLM tidak menjawab — request akan gagal)"
echo
echo
echo "→ POST ${ENDPOINT}"
echo "   subject=${SUBJECT}  kelas=${KELAS}  ai_model=${AI_MODEL}"
echo

QUERY="mutation { createRpp(input: { mata_pelajaran: \"${SUBJECT}\", kelas: \"${KELAS}\", alokasi_waktu: \"${ALOKASI}\", ai_model: ${AI_MODEL} }) { id mataPelajaran kelas alokasi_waktu materi_pokok tujuan_pembelajaran_list materi_pembelajaran { pendahuluan { kegiatan deskripsi } } asesmen_pembelajaran { diagnostik formatif sumatif } } }"

curl -sS -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  --data "$(printf '{"query": %s}' "$(printf '%s' "$QUERY" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")" \
  | python3 -m json.tool 2>/dev/null || true
