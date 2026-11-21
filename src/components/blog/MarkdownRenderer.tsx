import React from 'react';

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'mailto:'
    );
  } catch {
    return false;
  }
}

function isSafeImageSrc(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Renders inline Markdown tokens (**bold**, *italic*, `code`, [link](url)) safely as React nodes.
 */
function renderInlineNodes(text: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-slate-900">
          {renderInlineNodes(part.slice(2, -2), `${key}-b`)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      ((part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))) &&
      part.length > 2
    ) {
      return (
        <em key={key} className="italic text-slate-800">
          {renderInlineNodes(part.slice(1, -1), `${key}-i`)}
        </em>
      );
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[0.88em] border border-slate-200 break-words"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link: [label](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const splitIdx = part.indexOf('](');
      const label = part.slice(1, splitIdx);
      const href = part.slice(splitIdx + 2, -1).trim();
      if (isSafeHref(href)) {
        const external = !href.startsWith('/');
        return (
          <a
            key={key}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium break-words"
          >
            {label}
          </a>
        );
      }
      return <span key={key}>{label}</span>;
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export const MarkdownRenderer: React.FC<{ content: string }> = ({
  content,
}) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push(
        <hr key={`hr-${i}`} className="my-8 border-t border-slate-200" />
      );
      i += 1;
      continue;
    }

    // Headings (# .. ####)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) {
        blocks.push(
          <h2
            key={`h1-${i}`}
            className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-7 sm:mt-8 mb-3 first:mt-0 break-words"
          >
            {renderInlineNodes(text, `h1-${i}`)}
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h2
            key={`h2-${i}`}
            className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 mt-7 sm:mt-8 mb-3 first:mt-0 break-words"
          >
            {renderInlineNodes(text, `h2-${i}`)}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3
            key={`h3-${i}`}
            className="text-lg font-bold text-slate-900 mt-6 mb-2.5"
          >
            {renderInlineNodes(text, `h3-${i}`)}
          </h3>
        );
      } else {
        blocks.push(
          <h4
            key={`h4-${i}`}
            className="text-base font-bold text-slate-900 mt-5 mb-2"
          >
            {renderInlineNodes(text, `h4-${i}`)}
          </h4>
        );
      }
      i += 1;
      continue;
    }

    // Standalone image line: ![alt](url)
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const alt = imageMatch[1].trim() || 'Article illustration';
      const src = imageMatch[2].trim();
      if (isSafeImageSrc(src)) {
        blocks.push(
          <figure key={`img-${i}`} className="my-6">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="w-full max-h-[480px] object-cover rounded-lg border border-slate-200 bg-slate-50"
            />
            {imageMatch[1].trim() && (
              <figcaption className="mt-2 text-center text-xs text-slate-500">
                {imageMatch[1].trim()}
              </figcaption>
            )}
          </figure>
        );
      }
      i += 1;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`bq-${i}`}
          className="my-5 pl-3.5 sm:pl-4 border-l-4 border-blue-600 bg-slate-50 py-3 pr-3.5 sm:pr-4 rounded-r-md text-slate-700 italic text-sm sm:text-base leading-relaxed break-words"
        >
          {renderInlineNodes(quoteLines.join(' '), `bq-${i}`)}
        </blockquote>
      );
      continue;
    }

    // Unordered list (- item or * item)
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul
          key={`ul-${i}`}
          className="my-4 pl-5 sm:pl-6 list-disc space-y-2 text-slate-700 text-[15px] sm:text-base leading-relaxed break-words"
        >
          {items.map((item, idx) => (
            <li key={`ul-item-${i}-${idx}`}>
              {renderInlineNodes(item, `ul-item-${i}-${idx}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list (1. item)
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol
          key={`ol-${i}`}
          className="my-4 pl-5 sm:pl-6 list-decimal space-y-2 text-slate-700 text-[15px] sm:text-base leading-relaxed break-words"
        >
          {items.map((item, idx) => (
            <li key={`ol-item-${i}-${idx}`}>
              {renderInlineNodes(item, `ol-item-${i}-${idx}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (collect consecutive plain lines)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i].trim();
      if (
        !current ||
        /^#{1,4}\s+/.test(current) ||
        /^!\[([^\]]*)\]\(([^)]+)\)$/.test(current) ||
        /^(-{3,}|\*{3,})$/.test(current) ||
        current.startsWith('> ') ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current)
      ) {
        break;
      }
      paraLines.push(current);
      i += 1;
    }

    if (paraLines.length > 0) {
      blocks.push(
        <p
          key={`p-${i}`}
          className="my-4 text-[15px] sm:text-base text-slate-700 leading-7 first:mt-0 break-words"
        >
          {renderInlineNodes(paraLines.join(' '), `p-${i}`)}
        </p>
      );
    } else {
      i += 1;
    }
  }

  return <div className="space-y-1 min-w-0 break-words overflow-x-hidden">{blocks}</div>;
};
