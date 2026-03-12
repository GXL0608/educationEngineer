export function splitTextIntoSegments(text: string) {
  return text
    .split(/(?<=[。！？；])/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinSegments(items: string[]) {
  return items.join("").trim();
}
