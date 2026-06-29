import { VariantProps } from 'class-variance-authority';
import { ClassProp } from 'class-variance-authority/types';
import type * as React from "react";
declare const buttonVariants: (props?: ({
    variant?: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
    size?: "default" | "icon" | "sm" | "lg" | null | undefined;
} & ClassProp) | undefined) => string;
declare function Button({ className, variant, size, asChild, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export { Button, 
/** @knipignore */
buttonVariants, };
//# sourceMappingURL=button.d.ts.map