import * as React from "react"
import { cn } from "@/lib/utils"

// Simple Context to manage Tooltip state if needed, or just individual state
const TooltipContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <TooltipContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block group" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                {children}
            </div>
        </TooltipContext.Provider>
    );
};

const TooltipTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
    // If asChild is true, we just render the child. 
    // Events are handled by the parent Tooltip wrapper div for simplicity in this crash-fix version.
    if (asChild) {
        return <>{children}</>;
    }
    return (
        <button ref={ref} className={className} {...props}>
            {children}
        </button>
    );
});
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    if (!context?.open) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2",
                className
            )}
            style={{
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                marginTop: -sideOffset
            }}
            {...props}
        />
    );
});
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
