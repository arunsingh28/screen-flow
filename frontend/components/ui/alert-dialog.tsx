import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const AlertDialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({
    open: false,
    onOpenChange: () => { },
})

const AlertDialog: React.FC<{
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
}> = ({ children, open: controlledOpen, onOpenChange: setControlledOpen, defaultOpen = false }) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const onOpenChange = isControlled ? setControlledOpen : setUncontrolledOpen

    return (
        <AlertDialogContext.Provider value={{ open: !!open, onOpenChange: onOpenChange || (() => { }) }}>
            {children}
        </AlertDialogContext.Provider>
    )
}

const AlertDialogTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, onClick, ...props }) => {
    const { onOpenChange } = React.useContext(AlertDialogContext)
    return (
        <button
            className={cn(className)}
            onClick={(e) => {
                onOpenChange(true)
                onClick?.(e)
            }}
            {...props}
        >
            {children}
        </button>
    )
}

const AlertDialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { open } = React.useContext(AlertDialogContext)
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {children}
        </div>
    )
}

const AlertDialogOverlay: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in",
                className
            )}
            {...props}
        />
    )
}

const AlertDialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <div
                className={cn(
                    "fixed z-50 grid w-full max-w-lg scale-100 gap-4 border bg-background p-6 opacity-100 shadow-lg animate-in fade-in-90 zoom-in-90 sm:rounded-lg md:w-full",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </AlertDialogPortal>
    )
}

const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)

const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const AlertDialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
    <h2 className={cn("text-lg font-semibold", className)} {...props} />
)

const AlertDialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

const AlertDialogAction: React.FC<React.ComponentProps<typeof Button>> = ({ className, ...props }) => (
    <Button className={cn(className)} {...props} />
)

const AlertDialogCancel: React.FC<React.ComponentProps<typeof Button>> = ({ className, onClick, ...props }) => {
    const { onOpenChange } = React.useContext(AlertDialogContext)
    return (
        <Button
            variant="outline"
            className={cn("mt-2 sm:mt-0", className)}
            onClick={(e) => {
                onOpenChange(false)
                onClick?.(e)
            }}
            {...props}
        />
    )
}

export {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
}
