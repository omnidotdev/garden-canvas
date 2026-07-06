import {
  BookOpenIcon,
  CalendarIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  ScaleIcon,
  ServerIcon,
} from "lucide-react";

import { isImageUrl } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import type { NodeData } from "../nodes";

interface SproutDialogProps {
  /** Sprout node data to display, or null when nothing is selected. */
  sprout: NodeData | null;
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the open state should change. */
  onOpenChange: (open: boolean) => void;
}

/** Format an ISO date (e.g. `2025-12-21`) as a short human label. */
const formatReleaseDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    // Date-only values are parsed as UTC midnight; format in UTC so a
    // negative-offset timezone doesn't shift the day back by one.
    timeZone: "UTC",
  });
};

/**
 * Shared product ("sprout") teaser. Surfaces the description and catalog
 * metadata (tagline, license, release date, self-hostable) with the available
 * calls to action, so every layout (tree, beehive, 3D) shows the same teaser
 * rather than jumping straight to the product site.
 */
const SproutDialog = ({ sprout, open, onOpenChange }: SproutDialogProps) => {
  const releaseDate = formatReleaseDate(sprout?.release_date);
  const meta = [
    sprout?.license && { icon: ScaleIcon, label: sprout.license },
    releaseDate && { icon: CalendarIcon, label: releaseDate },
    sprout?.self_hostable && { icon: ServerIcon, label: "Self-hostable" },
  ].filter(Boolean) as { icon: typeof ScaleIcon; label: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="garden:sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="garden:text-xl">{sprout?.label}</DialogTitle>
          {sprout?.tagline && (
            <p className="garden:text-muted-foreground garden:text-sm garden:italic">
              {sprout.tagline}
            </p>
          )}
          {sprout?.description && (
            <DialogDescription className="garden:text-base">
              {sprout.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {sprout?.image &&
          (isImageUrl(sprout.image) ? (
            <img
              src={sprout.image}
              alt={sprout.label}
              className="garden:h-40 garden:w-full garden:object-contain garden:p-3"
            />
          ) : (
            <div className="garden:flex garden:h-32 garden:w-full garden:select-none garden:items-center garden:justify-center garden:text-7xl">
              {sprout.image}
            </div>
          ))}

        {meta.length > 0 && (
          <div className="garden:flex garden:flex-wrap garden:gap-2">
            {meta.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="garden:inline-flex garden:items-center garden:gap-1.5 garden:rounded-full garden:border garden:border-border garden:bg-muted/40 garden:px-2.5 garden:py-1 garden:text-muted-foreground garden:text-xs"
              >
                <Icon className="garden:h-3.5 garden:w-3.5" />
                {label}
              </span>
            ))}
          </div>
        )}

        {sprout?.version && (
          <div className="garden:text-muted-foreground garden:text-sm">
            Version: {sprout.version}
          </div>
        )}

        <DialogFooter className="garden:flex garden:flex-col garden:gap-2 garden:sm:flex-row garden:sm:justify-between garden:sm:gap-0">
          <div className="garden:flex garden:flex-wrap garden:gap-2">
            {sprout?.cta?.primary && (
              <Button
                onClick={() =>
                  window.open(sprout.cta?.primary.url, "_blank", "noopener")
                }
              >
                <ExternalLinkIcon />
                {sprout.cta.primary.label || "Visit Website"}
              </Button>
            )}

            {sprout?.docs_url && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(sprout.docs_url, "_blank", "noopener")
                }
              >
                <BookOpenIcon />
                Docs
              </Button>
            )}

            {sprout?.cta?.secondary && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(sprout.cta?.secondary?.url, "_blank", "noopener")
                }
              >
                <GitBranchIcon />
                {sprout.cta.secondary.label || "Source"}
              </Button>
            )}
          </div>

          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SproutDialog;
