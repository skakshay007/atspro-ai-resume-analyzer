import {useMemo, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  Search,
} from 'lucide-react';
import type {AnalysisResult} from '../types';
import {buildMarkdownReport, copyToClipboard} from '../utils/markdownReport';
import {ScoreRing} from './ScoreRing';

interface ResultsDashboardProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  onLoadSample: () => void;
}

type SkillFilter = 'all' | 'matched' | 'missing';

export function ResultsDashboard({
  result,
  isLoading,
  onLoadSample,
}: ResultsDashboardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [skillSearch, setSkillSearch] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedMissing, setCopiedMissing] = useState(false);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);

  const normalizedQuery = skillSearch.trim().toLowerCase();

  const filteredMatched = useMemo(() => {
    if (!result) return [];
    if (!normalizedQuery) return result.matchedKeywords;
    return result.matchedKeywords.filter((k) => k.toLowerCase().includes(normalizedQuery));
  }, [result, normalizedQuery]);

  const filteredMissing = useMemo(() => {
    if (!result) return [];
    if (!normalizedQuery) return result.missingKeywords;
    return result.missingKeywords.filter((k) => k.toLowerCase().includes(normalizedQuery));
  }, [result, normalizedQuery]);

  const handleCopyFullReport = async () => {
    if (!result) return;
    const markdown = buildMarkdownReport(result);
    const ok = await copyToClipboard(markdown);
    if (ok) {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2200);
    }
  };

  const handleCopyMissingSkills = async () => {
    if (!result || result.missingKeywords.length === 0) return;
    const ok = await copyToClipboard(result.missingKeywords.join(', '));
    if (ok) {
      setCopiedMissing(true);
      setTimeout(() => setCopiedMissing(false), 2000);
    }
  };

  const handleCopyBullet = async (text: string, idx: number) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedBulletIdx(idx);
      setTimeout(() => {
        setCopiedBulletIdx((prev) => (prev === idx ? null : prev));
      }, 2000);
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <section
        id="results"
        aria-label="Analysis loading"
        aria-busy="true"
        className="mt-12 scroll-mt-24 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-44 rounded-md bg-zinc-800/80 animate-pulse" />
            <div className="h-4 w-64 rounded-md bg-zinc-900 animate-pulse" />
          </div>
          <div className="h-10 w-40 rounded-lg bg-zinc-800/80 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-[330px] rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-6 flex flex-col items-center justify-center gap-4">
            <div className="h-44 w-44 rounded-full border-[12px] border-zinc-800 animate-pulse" />
            <div className="h-3 w-36 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="lg:col-span-8 h-[330px] rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-6 space-y-5">
            <div className="h-5 w-40 rounded bg-zinc-800 animate-pulse" />
            <div className="space-y-2.5">
              <div className="h-4 w-full rounded bg-zinc-800/70 animate-pulse" />
              <div className="h-4 w-11/12 rounded bg-zinc-800/70 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-zinc-800/70 animate-pulse" />
            </div>
            <div className="pt-4 border-t border-zinc-800/80 space-y-3">
              <div className="h-4 w-48 rounded bg-zinc-800 animate-pulse" />
              <div className="h-4 w-full rounded bg-zinc-800/60 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-zinc-800/60 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="h-52 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-6 space-y-4">
          <div className="h-5 w-44 rounded bg-zinc-800 animate-pulse" />
          <div className="flex flex-wrap gap-2.5">
            {Array.from({length: 12}).map((_, idx) => (
              <div key={idx} className="h-8 w-24 rounded-md bg-zinc-800/70 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty State
  if (!result) {
    return (
      <section id="results" aria-label="Analysis preview" className="mt-12 scroll-mt-24">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-8 sm:p-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-semibold text-zinc-100">
              Your ATS Report Will Appear Here
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Paste or upload a resume alongside a job description above, then run Analyze Match to
              generate a recruiter-grade breakdown across four key dimensions.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-zinc-800/80">
            <div>
              <p className="font-mono text-xs text-indigo-400 tabular-nums">01</p>
              <h3 className="mt-1.5 font-display text-sm font-semibold text-zinc-200">
                Calibrated Match Score
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                0–100 ATS score paired with an executive recruiter summary of fit and gaps.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-indigo-400 tabular-nums">02</p>
              <h3 className="mt-1.5 font-display text-sm font-semibold text-zinc-200">
                Skills Gap Breakdown
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Side-by-side audit of matched technical/soft skills and critical missing keywords.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-indigo-400 tabular-nums">03</p>
              <h3 className="mt-1.5 font-display text-sm font-semibold text-zinc-200">
                Bullet Point Enhancer
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Three targeted Before vs. After rewrites strengthened with action verbs and metrics.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-indigo-400 tabular-nums">04</p>
              <h3 className="mt-1.5 font-display text-sm font-semibold text-zinc-200">
                Markdown Export
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Actionable formatting tips plus one-click Markdown export for offline editing.
              </p>
            </div>
          </div>

          <div className="mt-7 pt-6 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs text-zinc-400">
              Want to try it right away without uploading a file?
            </span>
            <button
              type="button"
              onClick={onLoadSample}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Load Sample Software Engineer Data
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Populated Results Dashboard
  return (
    <motion.section
      id="results"
      aria-label="ATS Analysis Results"
      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
      className="mt-12 scroll-mt-24 space-y-8"
    >
      {/* Dashboard Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-100">
            Analysis Report
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono tabular-nums">
            <span>{result.matchedKeywords.length} matched skills</span>
            <span aria-hidden="true">·</span>
            <span>{result.missingKeywords.length} missing skills</span>
            <span aria-hidden="true">·</span>
            <span>{result.bulletRewrites.length} bullet rewrites</span>
            <span aria-hidden="true">·</span>
            <span>{result.formattingTips.length} formatting tips</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyFullReport}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-sm font-medium text-zinc-100 bg-zinc-900 border border-zinc-700/90 hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {copiedReport ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300">Copied Markdown Report</span>
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 text-indigo-400" />
              <span>Copy Full Report</span>
            </>
          )}
        </button>
      </div>

      {/* Row 1: Score Ring + Executive Summary & Formatting Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4">
          <ScoreRing
            score={result.matchScore}
            matchedCount={result.matchedKeywords.length}
            missingCount={result.missingKeywords.length}
          />
        </div>

        <div className="lg:col-span-8 flex flex-col justify-between rounded-xl bg-zinc-900/75 backdrop-blur-md border border-zinc-800/90 p-6 sm:p-7">
          {/* Executive Summary */}
          <div>
            <h3 className="font-display text-sm font-semibold text-zinc-200">
              Recruiter Executive Summary
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">
              {result.summary}
            </p>
          </div>

          {/* Formatting Improvements separated by hairline divider */}
          <div id="formatting-tips" className="mt-6 pt-6 border-t border-zinc-800/80 scroll-mt-24">
            <h3 className="font-display text-sm font-semibold text-zinc-200">
              Formatting &amp; Structure Improvements
            </h3>
            <ol className="mt-4 space-y-3.5">
              {result.formattingTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3.5 text-sm leading-relaxed text-zinc-300">
                  <span className="font-mono text-xs font-semibold text-indigo-400 tabular-nums mt-0.5 shrink-0">
                    0{index + 1}.
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Row 2: Skills Gap Breakdown */}
      <div
        id="skills-gap"
        className="scroll-mt-24 rounded-xl bg-zinc-900/75 backdrop-blur-md border border-zinc-800/90 p-6 sm:p-7"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <h3 className="font-display text-lg font-semibold text-zinc-100">
              Skills Gap Breakdown
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Direct comparison of keywords detected in your resume versus requirements in the target description.
            </p>
          </div>

          {/* Interactive Filter Bar & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Filter skills..."
                aria-label="Filter skills"
                className="min-h-[38px] w-44 rounded-lg bg-zinc-950/70 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 border border-zinc-800 focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter skills by match status"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-zinc-950/80 border border-zinc-800/80"
            >
              {(
                [
                  {id: 'all', label: 'All'},
                  {id: 'matched', label: `Matched (${result.matchedKeywords.length})`},
                  {id: 'missing', label: `Missing (${result.missingKeywords.length})`},
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={skillFilter === tab.id}
                  onClick={() => setSkillFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    skillFilter === tab.id
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`mt-6 grid grid-cols-1 gap-8 ${
            skillFilter === 'all' ? 'lg:grid-cols-2 lg:divide-x lg:divide-zinc-800/80' : ''
          }`}
        >
          {/* Matched Skills */}
          {skillFilter !== 'missing' && (
            <div className={skillFilter === 'all' ? 'lg:pr-6' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Matched Keywords</span>
                  <span className="font-mono text-zinc-400 tabular-nums">
                    ({filteredMatched.length})
                  </span>
                </h4>
              </div>

              {filteredMatched.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredMatched.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300"
                    >
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                      <span>{keyword}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {normalizedQuery
                    ? 'No matched keywords match your filter.'
                    : 'No directly matched keywords detected.'}
                </p>
              )}
            </div>
          )}

          {/* Missing Skills */}
          {skillFilter !== 'matched' && (
            <div className={skillFilter === 'all' ? 'lg:pl-8' : ''}>
              <div className="flex items-center justify-between mb-4 gap-3">
                <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>Missing Keywords</span>
                  <span className="font-mono text-zinc-400 tabular-nums">
                    ({filteredMissing.length})
                  </span>
                </h4>

                {result.missingKeywords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyMissingSkills}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-md transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedMissing ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-300">Copied list</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy missing</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {filteredMissing.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredMissing.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-200"
                    >
                      <span className="font-mono text-[11px] text-amber-400" aria-hidden="true">
                        +
                      </span>
                      <span>{keyword}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {normalizedQuery
                    ? 'No missing keywords match your filter.'
                    : 'Great coverage — no major keyword gaps detected.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Interactive Bullet Point Enhancer */}
      <div id="bullet-enhancer" className="scroll-mt-24 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-zinc-100">
            Bullet Point Enhancer
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            High-leverage Before vs. After rewrites engineered with stronger action verbs, target alignment, and quantifiable impact.
          </p>
        </div>

        <div className="space-y-4">
          {result.bulletRewrites.map((rewrite, index) => {
            const isCopied = copiedBulletIdx === index;
            return (
              <article
                key={index}
                className="rounded-xl bg-zinc-900/75 backdrop-blur-md border border-zinc-800/90 overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/35">
                  <h4 className="font-display text-sm font-semibold text-zinc-200">
                    0{index + 1}. Impact Rewrite
                  </h4>

                  <button
                    type="button"
                    onClick={() => handleCopyBullet(rewrite.improved, index)}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Copy Improved</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Before vs. After Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
                  <div className="p-5 bg-rose-950/10">
                    <p className="text-xs font-semibold text-rose-300/90 mb-2">
                      Before · Original Resume Bullet
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {rewrite.original}
                    </p>
                  </div>

                  <div className="p-5 bg-emerald-950/15">
                    <p className="text-xs font-semibold text-emerald-400 mb-2">
                      After · ATS-Optimized Rewrite
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-100 font-medium">
                      {rewrite.improved}
                    </p>
                  </div>
                </div>

                {/* Rationale Footer */}
                <div className="px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-950/30 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-2.5 text-xs">
                  <span className="font-semibold text-indigo-300 shrink-0">Why it works:</span>
                  <span className="text-zinc-400 leading-relaxed">{rewrite.reason}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
