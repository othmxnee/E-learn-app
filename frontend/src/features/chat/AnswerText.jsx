import React from 'react';

// Renders the light markdown the model produces — bold, bullets, numbered
// lists — without pulling in a markdown library. The model is asked for plain
// prose, but it still reaches for **bold** and bullet lists, and showing those
// markers literally looks broken.
//
// Only inline bold/italic and list structure are handled: anything else is
// printed as written, so unexpected syntax degrades to plain text rather than
// disappearing.

// The model is asked for plain-text mathematics, but it still reaches for
// LaTeX on formula-heavy topics. Rendering it raw shows the student
// `$n^{\log_b a}$`, so the markers are unwrapped into readable text as a
// fallback. This is presentation only — the underlying answer is unchanged.
const stripLatex = (text) =>
    String(text)
        // $...$ and $$...$$ delimiters
        .replace(/\$\$?([^$]+)\$\$?/g, '$1')
        // \frac{a}{b} -> (a)/(b), before the generic command stripper
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
        // Named functions keep their name; symbols become their plain form.
        // No \b anchor: `_` is a word character, so \log_b would not match one.
        .replace(/\\(?:log|ln|sin|cos|tan|exp|max|min|sum|prod)/g, (m) => m.slice(1))
        .replace(/\\(?:times|cdot)/g, '×')
        .replace(/\\leq/g, '<=')
        .replace(/\\geq/g, '>=')
        // Anything else backslash-prefixed is dropped. This must run before the
        // brace unwrapping below, or commands nested inside ^{...} survive.
        .replace(/\\[a-zA-Z]+/g, '')
        // Grouping braces: n^{2} -> n^(2), a_{i} -> a_i
        .replace(/\^\{([^{}]+)\}/g, '^($1)')
        .replace(/_\{([^{}]+)\}/g, '_$1')
        .replace(/[ \t]{2,}/g, ' ');

// Splits on **bold** and *italic* runs, keeping the delimiters out of the output.
const renderInline = (rawText, keyPrefix) => {
    const text = stripLatex(rawText);
    const parts = [];
    const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

    let lastIndex = 0;
    let match;
    let index = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        const key = `${keyPrefix}-i${index++}`;

        if (token.startsWith('**')) {
            parts.push(<strong key={key} className="font-semibold">{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('`')) {
            parts.push(
                <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">
                    {token.slice(1, -1)}
                </code>
            );
        } else {
            parts.push(<em key={key}>{token.slice(1, -1)}</em>);
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
};

const AnswerText = ({ content }) => {
    const lines = String(content || '').split('\n');
    const blocks = [];

    let listItems = [];
    let listOrdered = false;

    const flushList = () => {
        if (!listItems.length) return;
        const ListTag = listOrdered ? 'ol' : 'ul';
        blocks.push(
            <ListTag
                key={`list-${blocks.length}`}
                className={`my-1.5 space-y-1 pl-4 ${listOrdered ? 'list-decimal' : 'list-disc'}`}
            >
                {listItems.map((item, index) => (
                    <li key={index} className="pl-0.5">{renderInline(item, `l${blocks.length}-${index}`)}</li>
                ))}
            </ListTag>
        );
        listItems = [];
    };

    lines.forEach((rawLine, lineIndex) => {
        const line = rawLine.trimEnd();
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

        if (bullet || numbered) {
            const ordered = Boolean(numbered);
            // A change of list type starts a new list.
            if (listItems.length && ordered !== listOrdered) flushList();
            listOrdered = ordered;
            listItems.push((bullet || numbered)[1]);
            return;
        }

        flushList();

        if (!line.trim()) return;

        blocks.push(
            <p key={`p-${lineIndex}`} className="my-1 first:mt-0 last:mb-0">
                {renderInline(line, `p${lineIndex}`)}
            </p>
        );
    });

    flushList();

    return <div className="leading-relaxed">{blocks}</div>;
};

export default AnswerText;
