/** Strip diacritics and non-alphanumerics, e.g. for email local parts. */
export function toAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
