"use client";

export type OutlineItem = {
  level: number;
  text: string;
  offset: number;
};

/**
 * Parse H2 / H3 headings from markdown content.
 * Returns the character offset of each heading so callers can jump
 * the cursor to the right position in a textarea.
 */
export function parseOutline(content: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  let offset = 0;
  for (const line of content.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      items.push({
        level: match[1].length,
        text: match[2].trim(),
        offset,
      });
    }
    offset += line.length + 1; // +1 for \n
  }
  return items;
}

/**
 * Extract the lines belonging to one section, starting at the given heading
 * offset and continuing until the next heading of the same or higher level.
 */
export function extractSection(content: string, headingOffset: number): {
  text: string;
  insertOffset: number; // character offset where new content should be appended
} {
  const lines = content.split("\n");
  let currentOffset = 0;
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentOffset === headingOffset) {
      startLine = i;
      break;
    }
    currentOffset += lines[i].length + 1;
  }
  if (startLine === -1) return { text: "", insertOffset: content.length };

  const startLevel = lines[startLine].match(/^(#{2,3})/)?.[1].length ?? 2;
  let endLine = lines.length;
  for (let i = startLine + 1; i < lines.length; i++) {
    const match = lines[i].match(/^(#{2,3})/);
    if (match && match[1].length <= startLevel) {
      endLine = i;
      break;
    }
  }

  const sectionLines = lines.slice(startLine, endLine);
  const text = sectionLines.join("\n");
  // Insert offset = end of section (before next heading or EOF)
  let insertOffset = headingOffset;
  for (let i = startLine; i < endLine; i++) {
    insertOffset += lines[i].length + 1;
  }
  return { text, insertOffset };
}
