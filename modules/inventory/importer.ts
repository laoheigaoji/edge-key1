export function parseCardLines(lines: string) {
  const allLines = lines
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(allLines));
  const removedCount = allLines.length - unique.length;

  return { items: unique, removedCount };
}
