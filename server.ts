import 'dotenv/config';
import express, {type Request, type Response} from 'express';
import multer from 'multer';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI, Type} from '@google/genai';
import {extractText} from 'unpdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as {status?: number}).status)
          : undefined;
      const isRetryable = status === 500 || status === 503 || status === 504 || status === undefined;
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function formatGeminiError(err: unknown): {status: number; message: string} {
  const message = err instanceof Error ? err.message : String(err);
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as {status?: number}).status)
      : 500;

  if (status === 403 || message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'API key authentication failed. Please check your Gemini API key in Settings > Secrets.',
    };
  }
  if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Rate limit or quota reached. Please wait a moment and try again, or verify your API key quota in Settings > Secrets.',
    };
  }
  if (message.includes('GEMINI_API_KEY is not configured')) {
    return {
      status: 503,
      message: 'Server API key is not configured. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: 'Analysis request failed. Please try again in a moment.',
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: {
      type: Type.INTEGER,
      description: 'Overall ATS match score from 0 to 100 based on skills overlap, seniority alignment, domain relevance, and measurable impact.',
    },
    summary: {
      type: Type.STRING,
      description: 'A sharp 2 to 3 sentence recruiter-style executive summary explaining overall fit, strongest selling points, and primary gap.',
    },
    matchedKeywords: {
      type: Type.ARRAY,
      items: {type: Type.STRING},
      description: 'Technical and soft skills explicitly present in both the resume and job description.',
    },
    missingKeywords: {
      type: Type.ARRAY,
      items: {type: Type.STRING},
      description: 'Important technical skills, tools, frameworks, or domain competencies required or strongly preferred in the job description that are missing or under-evidenced in the resume.',
    },
    bulletRewrites: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: {
            type: Type.STRING,
            description: 'An exact or closely quoted weak/generic bullet point from the candidate resume.',
          },
          improved: {
            type: Type.STRING,
            description: 'An upgraded ATS-optimized bullet point using a strong action verb, concrete scope, target JD keywords where truthful, and realistic quantifiable impact (use bracketed placeholders like [X%] only when no metric can be inferred, or concrete realistic metrics framing).',
          },
          reason: {
            type: Type.STRING,
            description: 'One concise sentence explaining why the rewrite scores higher with recruiters and ATS parsers.',
          },
        },
        required: ['original', 'improved', 'reason'],
      },
      description: 'Exactly 3 high-impact resume bullet rewrites.',
    },
    formattingTips: {
      type: Type.ARRAY,
      items: {type: Type.STRING},
      description: 'Exactly 3 quick, specific, actionable formatting or structural improvements tailored to this resume and target role.',
    },
  },
  required: [
    'matchScore',
    'summary',
    'matchedKeywords',
    'missingKeywords',
    'bulletRewrites',
    'formattingTips',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({limit: '2mb'}));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ok: true});
  });

  // Extract text from uploaded PDF or TXT resume
  app.post('/api/extract-text', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({error: 'No file uploaded. Please select a PDF or TXT file.'});
        return;
      }

      const fileName = file.originalname || 'resume';
      const lowerName = fileName.toLowerCase();
      const isPdf = file.mimetype === 'application/pdf' || lowerName.endsWith('.pdf');
      const isTxt = file.mimetype.startsWith('text/') || lowerName.endsWith('.txt');

      if (!isPdf && !isTxt) {
        res.status(400).json({error: 'Unsupported file type. Please upload a .pdf or .txt resume.'});
        return;
      }

      if (isTxt) {
        const text = file.buffer.toString('utf-8').replace(/\r\n/g, '\n').trim();
        if (!text) {
          res.status(400).json({error: 'The uploaded text file is empty.'});
          return;
        }
        res.json({
          text,
          fileName,
          characterCount: text.length,
        });
        return;
      }

      // PDF extraction using unpdf
      let extractedText = '';
      let totalPages: number | undefined;
      try {
        const uint8 = new Uint8Array(file.buffer);
        const result = await extractText(uint8, {mergePages: true});
        totalPages = result.totalPages;
        extractedText = (Array.isArray(result.text) ? result.text.join('\n\n') : result.text)
          .replace(/\r\n/g, '\n')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } catch (pdfErr) {
        console.warn('unpdf extraction failed, attempting Gemini fallback:', pdfErr);
      }

      // If scanned/image-only PDF yielded minimal text, fallback to Gemini multimodal extraction
      if (extractedText.length < 30 && process.env.GEMINI_API_KEY) {
        try {
          const ai = getAiClient();
          const base64Pdf = file.buffer.toString('base64');
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf,
                  },
                },
                {
                  text: 'Extract all readable text from this resume PDF accurately, preserving section headings and bullet points as plain text. Return only the extracted resume text without commentary.',
                },
              ],
            },
          });
          extractedText = (response.text ?? '').trim();
        } catch (fallbackErr) {
          console.error('Gemini PDF OCR fallback failed:', fallbackErr);
        }
      }

      if (!extractedText) {
        res.status(422).json({
          error: 'Could not extract readable text from this PDF. Try pasting your resume text directly.',
        });
        return;
      }

      res.json({
        text: extractedText,
        fileName,
        pageCount: totalPages,
        characterCount: extractedText.length,
      });
    } catch (err) {
      console.error('File extraction error:', err);
      res.status(500).json({error: 'Failed to process the uploaded file.'});
    }
  });

  // Analyze resume against job description using Gemini structured JSON output
  app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
      const {resumeText, jobDescription} = req.body as {
        resumeText?: string;
        jobDescription?: string;
      };

      const trimmedResume = typeof resumeText === 'string' ? resumeText.trim() : '';
      const trimmedJd = typeof jobDescription === 'string' ? jobDescription.trim() : '';

      if (trimmedResume.length < 40) {
        res.status(400).json({error: 'Please provide a fuller resume (at least 40 characters) before analyzing.'});
        return;
      }
      if (trimmedJd.length < 40) {
        res.status(400).json({error: 'Please provide a fuller job description (at least 40 characters) before analyzing.'});
        return;
      }

      const ai = getAiClient();

      const prompt = `Evaluate the following candidate resume against the target job description.

=== CANDIDATE RESUME ===
${trimmedResume.slice(0, 25000)}

=== TARGET JOB DESCRIPTION ===
${trimmedJd.slice(0, 20000)}

Provide an objective, realistic ATS evaluation strictly matching the JSON schema.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a Principal Technical Recruiter and Applicant Tracking System (ATS) specialist. ' +
              'Grade resumes rigorously and honestly against the provided job description. ' +
              'Calibrate matchScore realistically: <50 for weak fit/major missing requirements, 50-75 for solid partial fit with clear gaps, >75 for strong fit meeting most core requirements. ' +
              'Keep summary concise (2-3 sentences, executive recruiter tone). ' +
              'Extract distinct, normalized skill names for matchedKeywords and missingKeywords (avoid duplicates between the two arrays). ' +
              'For bulletRewrites, select 3 real bullets from the resume that lack impact or target alignment and rewrite each with strong action verbs, clear ownership, and quantifiable outcomes. ' +
              'Provide exactly 3 concrete, immediately actionable formattingTips tailored to the resume.',
            responseMimeType: 'application/json',
            responseSchema: analysisResponseSchema,
          },
        }),
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({error: 'The AI model returned an empty response. Please try again.'});
        return;
      }

      const parsed = JSON.parse(rawText) as {
        matchScore?: number;
        summary?: string;
        matchedKeywords?: string[];
        missingKeywords?: string[];
        bulletRewrites?: Array<{original: string; improved: string; reason: string}>;
        formattingTips?: string[];
      };

      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.matchScore ?? 0))));
      const matched = Array.from(
        new Set((parsed.matchedKeywords ?? []).map((s) => s.trim()).filter(Boolean)),
      );
      const matchedLower = new Set(matched.map((s) => s.toLowerCase()));
      const missing = Array.from(
        new Set(
          (parsed.missingKeywords ?? [])
            .map((s) => s.trim())
            .filter((s) => Boolean(s) && !matchedLower.has(s.toLowerCase())),
        ),
      );

      const result = {
        matchScore: score,
        summary: (parsed.summary ?? '').trim(),
        matchedKeywords: matched,
        missingKeywords: missing,
        bulletRewrites: (parsed.bulletRewrites ?? []).slice(0, 3).map((item) => ({
          original: (item.original ?? '').trim(),
          improved: (item.improved ?? '').trim(),
          reason: (item.reason ?? '').trim(),
        })),
        formattingTips: (parsed.formattingTips ?? [])
          .slice(0, 3)
          .map((tip) => tip.trim())
          .filter(Boolean),
      };

      res.json(result);
    } catch (err) {
      console.error('Analysis error:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({error: formatted.message});
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ATSPro AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
