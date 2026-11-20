import {useCallback, useEffect, useRef, useState} from 'react';
import {Header} from './components/Header';
import {InputSection} from './components/InputSection';
import {ResultsDashboard} from './components/ResultsDashboard';
import {SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME} from './data/sampleData';
import type {AnalysisResult, ExtractTextResponse} from './types';

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedPageCount, setUploadedPageCount] = useState<number | undefined>(undefined);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const resultsAnchorRef = useRef<HTMLDivElement>(null);

  const handleLoadSample = useCallback(() => {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setUploadedFileName('Jordan_Patel_SWE_Resume.txt (Sample)');
    setUploadedPageCount(undefined);
    setError(null);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as ExtractTextResponse & {error?: string};
      if (!response.ok) {
        throw new Error(data.error || 'Could not extract text from the uploaded file.');
      }

      setResumeText(data.text);
      setUploadedFileName(data.fileName);
      setUploadedPageCount(data.pageCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text from file.');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (resumeText.trim().length < 40 || jobDescription.trim().length < 40) {
      setError('Please provide both a resume and a job description before analyzing.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      const data = (await response.json()) as AnalysisResult & {error?: string};
      if (!response.ok) {
        throw new Error(data.error || 'Unable to complete resume match analysis.');
      }

      setResult(data);

      // Smoothly bring the newly generated report into view
      requestAnimationFrame(() => {
        resultsAnchorRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeText, jobDescription]);

  // Support Cmd/Ctrl + Enter shortcut to trigger analysis
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (
          !isAnalyzing &&
          !isExtracting &&
          resumeText.trim().length >= 40 &&
          jobDescription.trim().length >= 40
        ) {
          e.preventDefault();
          void handleAnalyze();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAnalyze, isAnalyzing, isExtracting, resumeText, jobDescription]);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 relative">
      {/* Subtle ambient radial gradient at top canvas edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_45%_at_50%_-10%,rgba(99,102,241,0.14),transparent)]"
      />

      <Header onLoadSample={handleLoadSample} hasResults={Boolean(result)} />

      <main className="relative z-10 flex-1 mx-auto w-full max-w-[1280px] px-6 pt-10 pb-20">
        {/* Compact Workspace Heading */}
        <div className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 [text-wrap:balance]">
            Measure resume alignment before you apply.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
            Upload a PDF or paste your resume beside any job description to score ATS readiness,
            pinpoint missing keywords, and upgrade weak bullet points with quantifiable impact.
          </p>
        </div>

        {/* Two-Column Input Section */}
        <InputSection
          resumeText={resumeText}
          jobDescription={jobDescription}
          uploadedFileName={uploadedFileName}
          uploadedPageCount={uploadedPageCount}
          isExtracting={isExtracting}
          isAnalyzing={isAnalyzing}
          error={error}
          onResumeChange={(val) => {
            setResumeText(val);
            if (!val) {
              setUploadedFileName(null);
              setUploadedPageCount(undefined);
            }
          }}
          onJobDescriptionChange={setJobDescription}
          onFileUpload={handleFileUpload}
          onClearResume={() => {
            setResumeText('');
            setUploadedFileName(null);
            setUploadedPageCount(undefined);
          }}
          onClearJobDescription={() => setJobDescription('')}
          onDismissError={() => setError(null)}
          onAnalyze={handleAnalyze}
        />

        {/* Interactive Results Dashboard */}
        <div ref={resultsAnchorRef} className="scroll-mt-24">
          <ResultsDashboard
            result={result}
            isLoading={isAnalyzing}
            onLoadSample={handleLoadSample}
          />
        </div>
      </main>

      <footer className="relative z-10 border-t border-zinc-900 py-6">
        <div className="mx-auto max-w-[1280px] px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <span>ATSPro AI · Resume &amp; Job Description Match Analyzer</span>
          <span>Tip: Press Ctrl / Cmd + Enter to run analysis</span>
        </div>
      </footer>
    </div>
  );
}
