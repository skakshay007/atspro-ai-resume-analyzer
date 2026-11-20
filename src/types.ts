export interface BulletRewrite {
  original: string;
  improved: string;
  reason: string;
}

export interface AnalysisResult {
  matchScore: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  bulletRewrites: BulletRewrite[];
  formattingTips: string[];
}

export interface ExtractTextResponse {
  text: string;
  fileName: string;
  pageCount?: number;
  characterCount: number;
}
