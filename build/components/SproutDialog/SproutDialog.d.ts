import { NodeData } from '../nodes';
interface SproutDialogProps {
    /** Sprout node data to display, or null when nothing is selected. */
    sprout: NodeData | null;
    /** Whether the dialog is open. */
    open: boolean;
    /** Called when the open state should change. */
    onOpenChange: (open: boolean) => void;
}
/**
 * Shared product ("sprout") teaser. Surfaces the description and catalog
 * metadata (tagline, license, release date, self-hostable) with the available
 * calls to action, so every layout (tree, beehive, 3D) shows the same teaser
 * rather than jumping straight to the product site.
 */
declare const SproutDialog: ({ sprout, open, onOpenChange }: SproutDialogProps) => import("react/jsx-runtime").JSX.Element;
export default SproutDialog;
//# sourceMappingURL=SproutDialog.d.ts.map