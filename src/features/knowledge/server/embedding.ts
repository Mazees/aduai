import "server-only";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
let loader: Promise<FeatureExtractionPipeline> | undefined;

// Muat model sekali per instance server.
async function extractor() {
  if (!loader) {
    const projectRequire = createRequire(path.join(process.cwd(), "package.json"));
    const load = new Function("load", "name", "return load(name);") as
      (load: NodeJS.Require, name: string) => typeof import("@huggingface/transformers");
    const transformers = load(projectRequire, "@huggingface/transformers");
    transformers.env.allowLocalModels = false;
    transformers.env.useBrowserCache = false;
    transformers.env.cacheDir = path.join(os.tmpdir(), "aduai-model-cache");
    loader = transformers.pipeline<"feature-extraction">("feature-extraction", MODEL, { dtype: "q8", device: "cpu" });
  }
  try { return await loader; } catch (error) { loader = undefined; throw error; }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) throw new Error("EMPTY_EMBEDDING_INPUT");
  const model = await extractor();
  const output = await model(text.trim(), { pooling: "mean", normalize: true });
  const values = Array.from(output.data, Number);
  if (values.length !== 384 || !values.every(Number.isFinite) || !values.some((v) => v !== 0)) throw new Error("INVALID_EMBEDDING");
  return values;
}

// Pecah berdasarkan token model agar potongan tidak melebihi panjang konteks embedding.
export async function chunkDocument(content: string): Promise<string[]> {
  const model = await extractor();
  const tokens = model.tokenizer.encode(content, { add_special_tokens: false });
  if (tokens.length > 50_000) throw new Error("DOCUMENT_TOO_LARGE");
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 80) {
    const text = model.tokenizer.decode(tokens.slice(i, i + 96), { skip_special_tokens: true }).trim();
    if (text) chunks.push(text);
  }
  return chunks;
}


// Satu informasi tetap satu baris: rata-ratakan embedding setiap potongan.
export async function generateDocumentEmbedding(content: string): Promise<number[]> {
  const chunks = await chunkDocument(content);
  if (!chunks.length) throw new Error('EMPTY_EMBEDDING_INPUT');
  const sum = new Array<number>(384).fill(0);
  for (const chunk of chunks) {
    const vector = await generateEmbedding(chunk);
    vector.forEach((value, index) => { sum[index] += value; });
  }
  const norm = Math.sqrt(sum.reduce((total, value) => total + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) throw new Error('INVALID_EMBEDDING');
  return sum.map((value) => value / norm);
}
