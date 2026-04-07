const fs = require("fs");
const path = require("path");

const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_RESULT = {
  documentType: "unknown",
  number: "",
  validUntil: ""
};

let cachedApiKey;

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cloneDefaultResult() {
  return { ...DEFAULT_RESULT };
}

function readApiKeyFromDotEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) {
      return "";
    }

    const envText = fs.readFileSync(envPath, "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^OPENAI_API_KEY\s*=\s*(.*)$/);
      if (!match) {
        continue;
      }

      return match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    console.error("Failed reading .env for OPENAI_API_KEY:", error.message);
  }

  return "";
}

function getOpenAiApiKey() {
  if (cachedApiKey !== undefined) {
    return cachedApiKey;
  }

  cachedApiKey = process.env.OPENAI_API_KEY || readApiKeyFromDotEnv();

  if (cachedApiKey && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = cachedApiKey;
  }

  return cachedApiKey;
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];

  for (const outputItem of payload?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      const textValue =
        typeof contentItem?.text === "string"
          ? contentItem.text
          : typeof contentItem?.text?.value === "string"
            ? contentItem.text.value
            : typeof contentItem?.value === "string"
              ? contentItem.value
              : "";

      if (textValue) {
        parts.push(textValue);
      }
    }
  }

  return parts.join("\n").trim();
}

function normalizeString(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function cleanLicenseNumber(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/o/g, "0")
    .replace(/s/g, "5")
    .replace(/i/g, "1")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

function extractLicenseNumberFromText(text) {
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = normalizeString(rawLine);
    if (!/LICENCIJA\s*Nr\.?/i.test(line)) {
      continue;
    }

    const match = line.match(/LICENCIJA\s*Nr\.?\s*[:\-]?\s*(.+)$/i);
    if (!match || !match[1]) {
      return "";
    }

    return cleanLicenseNumber(match[1]);
  }

  return "";
}

function normalizeDocumentType(value) {
  const normalized = normalizeString(value).toLowerCase();
  return ["license", "insurance", "unknown"].includes(normalized)
    ? normalized
    : DEFAULT_RESULT.documentType;
}

function normalizeValidUntil(value) {
  const normalized = normalizeString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function sanitizeResult(value) {
  const result = isObject(value) ? value : {};

  return {
    documentType: normalizeDocumentType(result.documentType),
    number: normalizeString(result.number),
    validUntil: normalizeValidUntil(result.validUntil)
  };
}

function tryParseJsonObject(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function stripMarkdownCodeFence(text) {
  const match = String(text || "").trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : String(text || "").trim();
}

function extractFirstJsonObject(text) {
  const source = stripMarkdownCodeFence(text);
  const direct = tryParseJsonObject(source);
  if (direct) {
    return direct;
  }

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = i;
      }

      depth += 1;
      continue;
    }

    if (char === "}" && depth > 0) {
      depth -= 1;

      if (depth === 0 && start !== -1) {
        const candidate = source.slice(start, i + 1);
        const parsed = tryParseJsonObject(candidate);
        if (parsed) {
          return parsed;
        }

        start = -1;
      }
    }
  }

  return null;
}

function extractStructuredResult(payload) {
  const directCandidates = [
    payload?.output_parsed,
    payload?.parsed,
    payload?.response?.output_parsed,
    payload?.response?.parsed
  ];

  for (const candidate of directCandidates) {
    if (isObject(candidate)) {
      return sanitizeResult(candidate);
    }
  }

  for (const outputItem of payload?.output || []) {
    if (isObject(outputItem?.parsed)) {
      return sanitizeResult(outputItem.parsed);
    }

    for (const contentItem of outputItem?.content || []) {
      const structuredCandidate =
        contentItem?.parsed ??
        contentItem?.json ??
        contentItem?.arguments ??
        contentItem?.input ??
        null;

      if (isObject(structuredCandidate)) {
        return sanitizeResult(structuredCandidate);
      }

      if (typeof structuredCandidate === "string") {
        const parsed = extractFirstJsonObject(structuredCandidate);
        if (parsed) {
          return sanitizeResult(parsed);
        }
      }
    }
  }

  const outputText = extractResponseText(payload);
  if (!outputText) {
    return null;
  }

  const parsed = extractFirstJsonObject(outputText);
  return parsed ? sanitizeResult(parsed) : null;
}

async function parseDocument(text) {
  const rawText = String(text || "");
  const cleanText = normalizeText(text);
  const extractedLicenseNumber = extractLicenseNumberFromText(rawText);

  if (!cleanText) {
    return {
      ...cloneDefaultResult(),
      number: extractedLicenseNumber
    };
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    console.error("OPENAI_API_KEY is missing; returning empty structured result.");
    return cloneDefaultResult();
  }

  try {
    const requestBody = {
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Extract document metadata from the provided document text. Return only the requested JSON fields. Use documentType as license, insurance, or unknown. Use empty strings when number or validUntil are missing. validUntil must be YYYY-MM-DD when present."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: cleanText
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "document_metadata",
          strict: true,
          schema: {
            type: "object",
            properties: {
              documentType: {
                type: "string",
                enum: ["license", "insurance", "unknown"]
              },
              number: {
                type: "string"
              },
              validUntil: {
                type: "string"
              }
            },
            required: ["documentType", "number", "validUntil"],
            additionalProperties: false
          }
        }
      }
    };

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return cloneDefaultResult();
    }

    const payload = await response.json();
    const parsed = extractStructuredResult(payload);
    if (!parsed) {
      console.error("OpenAI parsing failed: response did not contain usable JSON.");
      return {
        ...cloneDefaultResult(),
        number: extractedLicenseNumber
      };
    }

    return {
      ...parsed,
      number: extractedLicenseNumber || parsed.number
    };
  } catch (error) {
    console.error("OpenAI parsing failed:", error.message);
    return {
      ...cloneDefaultResult(),
      number: extractedLicenseNumber
    };
  }
}

module.exports = {
  parseDocument
};
