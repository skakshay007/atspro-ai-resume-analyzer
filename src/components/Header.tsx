interface HeaderProps {
  onLoadSample: () => void;
  hasResults: boolean;
}

export function Header({onLoadSample, hasResults}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-8 px-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
        >
          ATSPro AI
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400"
        >
          <a
            href="#analyzer"
            className="hover:text-zinc-100 transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Analyzer
          </a>
          <a
            href="#results"
            className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
              hasResults ? 'hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Score Report
          </a>
          <a
            href="#skills-gap"
            className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
              hasResults ? 'hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Skills Gap
          </a>
          <a
            href="#bullet-enhancer"
            className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
              hasResults ? 'hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Bullet Enhancer
          </a>
        </nav>

        {/* Zone 3: Single primary header action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            className="min-h-[40px] px-4 py-2 text-sm font-medium text-zinc-100 bg-zinc-900 border border-zinc-700/80 rounded-lg hover:bg-zinc-800 hover:border-zinc-600 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Load Sample Data
          </button>
        </div>
      </div>
    </header>
  );
}
