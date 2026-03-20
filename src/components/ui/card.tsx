import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className, hover, padding = "md" }: CardProps) {
  return (
    <div className={cn("card", paddingClasses[padding], hover && "card-hover", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  changeType = "positive",
  icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const colorMap = {
    primary: { bg: "var(--primary-50)", icon: "var(--primary)" },
    success: { bg: "var(--success-bg)", icon: "var(--success)" },
    warning: { bg: "var(--warning-bg)", icon: "var(--warning)" },
    danger: { bg: "var(--danger-bg)", icon: "var(--danger)" },
  };

  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  return (
    <div className="card p-5 flex items-start gap-4">
      {icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: colorMap[color].bg, color: colorMap[color].icon }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        {change && (
          <p className={cn("text-xs mt-1", changeColors[changeType])}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
