import { openai } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-4.1";

export function getInsightsModel() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add one at https://platform.openai.com and set OPENAI_API_KEY in .env.",
    );
  }
  return openai(DEFAULT_MODEL);
}
