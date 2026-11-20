import {useEffect, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';

interface ScoreRingProps {
  score: number;
  matchedCount: number;
  missingCount: number;
}

export function ScoreRing({score, matchedCount, missingCount}: ScoreRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayScore, setDisplayScore] = useState(prefersReducedMotion ? score : 0);

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayScore(clampedScore);
      return;
    }

    let frameId: number;
    const duration = 900;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * clampedScore));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [clampedScore, prefersReducedMotion]);

  const size = 188;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const totalSkills = matchedCount + missingCount;
  const coveragePct = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 100) : 0;

  // Color coding: red <50, amber 50-75, emerald >75
  const tier =
    clampedScore > 75
      ? {
          label: 'Strong Alignment',
          strokeClass: 'stroke-emerald-400',
          textClass: 'text-emerald-400',
          barClass: 'bg-emerald-400',
          glowColor: 'rgba(16, 185, 129, 0.14)',
        }
      : clampedScore >= 50
        ? {
            label: 'Moderate Alignment',
            strokeClass: 'stroke-amber-400',
            textClass: 'text-amber-400',
            barClass: 'bg-amber-400',
            glowColor: 'rgba(245, 158, 11, 0.14)',
          }
        : {
            label: 'Low Alignment',
            strokeClass: 'stroke-rose-400',
            textClass: 'text-rose-400',
            barClass: 'bg-rose-400',
            glowColor: 'rgba(244, 63, 94, 0.14)',
          };

  return (
    <div className="flex flex-col items-center justify-between h-full p-6 rounded-xl bg-zinc-900/75 backdrop-blur-md border border-zinc-800/90">
      <div className="w-full flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-zinc-200">ATS Match Score</h3>
        <span className={`text-xs font-semibold ${tier.textClass}`}>{tier.label}</span>
      </div>

      {/* Circular Ring */}
      <div
        className="relative my-6 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 0 24px ${tier.glowColor})`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`ATS Match Score ${clampedScore} out of 100, ${tier.label}`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-zinc-800"
          />
          {/* Animated Progress Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{strokeDashoffset: prefersReducedMotion ? strokeDashoffset : circumference}}
            animate={{strokeDashoffset}}
            transition={{duration: prefersReducedMotion ? 0 : 0.95, ease: [0.16, 1, 0.3, 1]}}
            className={tier.strokeClass}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono text-5xl font-semibold tracking-tight text-zinc-100 tabular-nums">
              {displayScore}
            </span>
            <span className="font-mono text-base text-zinc-500 tabular-nums">/100</span>
          </div>
          <span className="mt-1 text-xs text-zinc-400">Overall Fit</span>
        </div>
      </div>

      {/* Keyword Coverage Bar */}
      <div className="w-full pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-zinc-400">Keyword Coverage</span>
          <span className="font-mono font-medium text-zinc-200 tabular-nums">
            {matchedCount}/{totalSkills} ({coveragePct}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            initial={{scaleX: prefersReducedMotion ? coveragePct / 100 : 0}}
            animate={{scaleX: coveragePct / 100}}
            transition={{duration: prefersReducedMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1]}}
            style={{transformOrigin: 'left'}}
            className={`h-full w-full rounded-full ${tier.barClass}`}
          />
        </div>
      </div>
    </div>
  );
}
