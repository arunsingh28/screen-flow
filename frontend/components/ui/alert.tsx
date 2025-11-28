import * as React from "react";

type AlertVariant = "default" | "destructive" | "success" | "warning" | "info";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
}

const getAlertClasses = (variant: AlertVariant = "default"): string => {
    const baseClasses = "relative w-full rounded-lg border p-4 flex items-start gap-3";

    const variantClasses: Record<AlertVariant, string> = {
        default: "bg-slate-50 border-slate-200 text-slate-900",
        destructive: "bg-red-50 border-red-200 text-red-900",
        success: "bg-green-50 border-green-200 text-green-900",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
        info: "bg-blue-50 border-blue-200 text-blue-900",
    };

    return `${baseClasses} ${variantClasses[variant]}`;
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant, children, ...props }, ref) => (
        <div
            ref={ref}
            role="alert"
            className={`${getAlertClasses(variant)} ${className || ''}`}
            {...props}
        >
            {children}
        </div>
    )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={`mb-1 font-semibold leading-none tracking-tight ${className || ''}`}
        {...props}
    />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={`text-sm leading-relaxed ${className || ''}`}
        {...props}
    />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
