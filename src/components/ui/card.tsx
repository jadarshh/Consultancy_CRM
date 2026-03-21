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
  const gradientMap = {
    primary: "linear-gradient(135deg, var(--primary-50), var(--primary-100))",
    success: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
    warning: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
    danger:  "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
  };

  const accentMap = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger:  "var(--danger)",
  };

  const colorMap = {
    primary: { icon: "var(--primary)" },
    success: { icon: "var(--success)" },
    warning: { icon: "var(--warning)" },
    danger:  { icon: "var(--danger)" },
  };

  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  return (
    <div
      className="card card-hover p-5 flex items-start gap-4"
      style={{ borderTop: `2px solid ${accentMap[color]}` }}
    >
      {icon && (
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradientMap[color], color: colorMap[color].icon }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight mt-0.5" style={{ color: "var(--text-primary)" }}>
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
