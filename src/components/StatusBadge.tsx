import React from "react";
import { ComplaintStatus } from "@/types/complaint";
import { AlertCircle, CheckCircle2, Clock, CheckCheck, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  NEW: {
    label: "Menunggu Validasi",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Diterima",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "Sedang Ditangani",
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
    icon: AlertCircle,
  },
  RESOLVED: {
    label: "Selesai",
    bg: "bg-teal-50",
    text: "text-primary",
    border: "border-teal-200",
    icon: CheckCheck,
  },
  REJECTED: {
    label: "Ditolak",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
  },
};

export default function StatusBadge({ status, size = "md", showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs sm:text-sm gap-1.5",
    lg: "px-3.5 py-1.5 text-sm sm:text-base gap-2 font-medium",
  };

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18,
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}

