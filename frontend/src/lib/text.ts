/** URL-safe slug derived from a title, used for downloaded file names. */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "watercrab-result"
  );
}
