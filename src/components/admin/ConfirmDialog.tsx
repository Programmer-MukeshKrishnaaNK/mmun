import { useCallback, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

interface ConfirmOptions {
  title: string;
  description?: string;
  /** Defaults to "Delete". */
  confirmLabel?: string;
  /** Red confirm button. Defaults to true, since this is mostly used for deletes. */
  destructive?: boolean;
}

/**
 * Replaces window.confirm() for destructive actions.
 *
 * window.confirm works on phones, but it is the wrong tool here. iOS Safari
 * offers "Don't show more alerts" after a page shows a few dialogs, and once a
 * viewer taps that, confirm() returns false without ever appearing — so Delete
 * would silently do nothing, with no way to tell that from a refused
 * confirmation. It is also blocked outright inside cross-origin iframes and in
 * some in-app browsers, and it can't be styled, so it looks like a browser
 * warning rather than part of the console.
 *
 * Returns a promise so call sites keep reading top to bottom:
 *   if (!(await confirm({ title: "Delete this?" }))) return;
 */
export function useConfirm(): { confirm: (options: ConfirmOptions) => Promise<boolean>; dialog: ReactNode } {
  const [open, setOpen] = useState(false);
  // Kept after `open` flips to false so the sheet can animate out with its
  // text intact rather than emptying mid-transition.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A dialog opened while another is pending would strand the first
        // promise; treat that as a cancellation.
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setOptions(next);
        setOpen(true);
      }),
    [],
  );

  const dialog = (
    <Sheet
      open={open}
      onClose={() => settle(false)}
      title={options?.title ?? ""}
      description={options?.description}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => settle(false)} className="sm:w-auto" block>
          Cancel
        </Button>
        <Button
          variant={options?.destructive === false ? "primary" : "danger"}
          onClick={() => settle(true)}
          className="sm:w-auto"
          block
        >
          {options?.confirmLabel ?? "Delete"}
        </Button>
      </div>
    </Sheet>
  );

  return { confirm, dialog };
}
