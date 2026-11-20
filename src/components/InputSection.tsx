import {useRef, useState, type ChangeEvent, type DragEvent} from 'react';
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface InputSectionProps {
  resumeText: string;
  jobDescription: string;
  uploadedFileName: string | null;
  uploadedPageCount?: number;
  isExtracting: boolean;
  isAnalyzing: boolean;
  error: string | null;
  onResumeChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  onClearResume: () => void;
  onClearJobDescription: () => void;
  onDismissError: () => void;
  onAnalyze: () => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function InputSection({
  resumeText,
  jobDescription,
  uploadedFileName,
  uploadedPageCount,
  isExtracting,
  isAnalyzing,
  error,
  onResumeChange,
  onJobDescriptionChange,
  onFileUpload,
  onClearResume,
  onClearJobDescription,
  onDismissError,
  onAnalyze,
}: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resumeWords = countWords(resumeText);
  const jdWords = countWords(jobDescription);
  const canAnalyze =
    resumeText.trim().length >= 40 &&
    jobDescription.trim().length >= 40 &&
    !isAnalyzing &&
    !isExtracting;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await onFileUpload(file);
    }
  };

  return (
    <section id="analyzer" aria-label="Resume and Job Description Inputs" className="scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Panel: Candidate Resume */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col rounded-xl bg-zinc-900/70 backdrop-blur-md border transition-colors duration-150 ${
            isDragging
              ? 'border-indigo-400 bg-indigo-950/20'
              : 'border-zinc-800/90 hover:border-zinc-700/80'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800/80">
            <div className="min-w-0">
              <label
                htmlFor="resume-textarea"
                className="block font-display text-sm font-semibold text-zinc-100"
              >
                Candidate Resume
              </label>
              <p className="mt-0.5 text-xs text-zinc-400 font-mono tabular-nums">
                {resumeWords} words · {resumeText.length.toLocaleString()} chars
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={handleFileChange}
                className="sr-only"
                id="resume-file-input"
                aria-label="Upload PDF or TXT resume"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting || isAnalyzing}
                className="inline-flex items-center gap-2 min-h-[38px] px-3.5 py-2 text-xs font-medium text-zinc-200 bg-zinc-800/80 border border-zinc-700/80 rounded-lg hover:bg-zinc-800 hover:border-zinc-600 disabled:opacity-50 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isExtracting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-indigo-400" />
                )}
                <span>{isExtracting ? 'Extracting...' : 'Upload PDF / TXT'}</span>
              </button>

              {resumeText.length > 0 && (
                <button
                  type="button"
                  onClick={onClearResume}
                  disabled={isAnalyzing}
                  aria-label="Clear resume"
                  className="inline-flex items-center justify-center min-h-[38px] min-w-[38px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Subtle Drop Hint / Active File Bar */}
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60 text-xs text-zinc-400">
            {isExtracting ? (
              <span className="flex items-center gap-2 text-indigo-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Extracting plain text from document...
              </span>
            ) : uploadedFileName ? (
              <span className="flex items-center gap-2 text-emerald-300 truncate">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-medium">{uploadedFileName}</span>
                {uploadedPageCount ? (
                  <span className="text-zinc-500 font-mono tabular-nums shrink-0">
                    · {uploadedPageCount} {uploadedPageCount === 1 ? 'page' : 'pages'}
                  </span>
                ) : null}
              </span>
            ) : (
              <span>Drop a .pdf or .txt file anywhere here, or paste resume text directly below.</span>
            )}
          </div>

          {/* Resume Textarea */}
          <div className="flex-1 flex flex-col p-4">
            <textarea
              id="resume-textarea"
              value={resumeText}
              onChange={(e) => onResumeChange(e.target.value)}
              placeholder="Paste your resume text here, or upload a PDF / TXT file above..."
              rows={14}
              spellCheck={false}
              className="w-full flex-1 min-h-[320px] resize-y rounded-lg bg-zinc-950/60 px-4 py-3.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-500 border border-zinc-800/70 focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Right Panel: Target Job Description */}
        <div className="flex flex-col rounded-xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/90 hover:border-zinc-700/80 transition-colors duration-150">
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800/80">
            <div className="min-w-0">
              <label
                htmlFor="jd-textarea"
                className="block font-display text-sm font-semibold text-zinc-100"
              >
                Target Job Description
              </label>
              <p className="mt-0.5 text-xs text-zinc-400 font-mono tabular-nums">
                {jdWords} words · {jobDescription.length.toLocaleString()} chars
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {jobDescription.length > 0 && (
                <button
                  type="button"
                  onClick={onClearJobDescription}
                  disabled={isAnalyzing}
                  aria-label="Clear job description"
                  className="inline-flex items-center justify-center min-h-[38px] min-w-[38px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Matching Alignment Info Row */}
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60 text-xs text-zinc-400">
            <span>Include responsibilities, required skills, and preferred qualifications for highest accuracy.</span>
          </div>

          {/* JD Textarea */}
          <div className="flex-1 flex flex-col p-4">
            <textarea
              id="jd-textarea"
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste the complete job description you are targeting..."
              rows={14}
              spellCheck={false}
              className="w-full flex-1 min-h-[320px] resize-y rounded-lg bg-zinc-950/60 px-4 py-3.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-500 border border-zinc-800/70 focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-150"
            />
          </div>
        </div>
      </div>

      {/* Inline Error Banner */}
      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-950/35 px-4 py-3.5 text-sm text-rose-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="text-rose-300 hover:text-rose-100 p-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Primary Action Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md px-5 py-4">
        <p className="text-xs text-zinc-400">
          {resumeText.trim().length < 40 || jobDescription.trim().length < 40
            ? 'Add both a resume and a target job description (or click Load Sample Data) to run an ATS audit.'
            : 'Ready to evaluate keyword alignment, impact metrics, and formatting quality.'}
        </p>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[44px] px-7 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-950/50 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Match...</span>
            </>
          ) : (
            <>
              <span>Analyze Match</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
