/**
 * A delegate's assignment as "Portfolio • Committee", e.g.
 * "Delegate • UN Security Council".
 *
 * Either half may be missing — older profiles have no `portfolio` — and the
 * separator only appears when both are present, so a missing portfolio reads
 * as just the committee rather than "• UNGA".
 */
export function formatAssignment(portfolio?: string, committee?: string): string | undefined {
  const parts = [portfolio, committee]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" • ") : undefined;
}
