import type {AnalysisResult} from '../types';

export function buildMarkdownReport(result: AnalysisResult): string {
  const tier =
    result.matchScore > 75
      ? 'Strong Alignment'
      : result.matchScore >= 50
        ? 'Moderate Alignment'
        : 'Low Alignment';

  const matchedList =
    result.matchedKeywords.length > 0
      ? result.matchedKeywords.map((k) => `- ${k}`).join('\n')
      : '- None identified';

  const missingList =
    result.missingKeywords.length > 0
      ? result.missingKeywords.map((k) => `- ${k}`).join('\n')
      : '- None identified';

  const rewritesSection = result.bulletRewrites
    .map(
      (item, index) =>
        `### ${index + 1}. Impact Rewrite\n- **Before:** ${item.original}\n- **After:** ${item.improved}\n- **Why it works:** ${item.reason}`,
    )
    .join('\n\n');

  const tipsSection = result.formattingTips
    .map((tip, index) => `${index + 1}. ${tip}`)
    .join('\n');

  return `# ATSPro AI — Resume Match Report

**ATS Match Score:** ${result.matchScore}/100 (${tier})

## Executive Summary
${result.summary}

## Skills Gap Breakdown

### Matched Keywords (${result.matchedKeywords.length})
${matchedList}

### Missing Keywords (${result.missingKeywords.length})
${missingList}

## Bullet Point Enhancer
${rewritesSection}

## Formatting & Structure Improvements
${tipsSection}
`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback for sandboxed iframe clipboard restrictions
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
