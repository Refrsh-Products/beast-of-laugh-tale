import {
  FolderOpen, Zap, Brain, Lock, BookOpen, Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "📁": FolderOpen,
  "⚡": Zap,
  "🧠": Brain,
  "🔒": Lock,
  "📓": BookOpen,
  "✦": Sparkles,
};

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

export function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  const Icon = ICON_MAP[icon] ?? Sparkles;

  return (
    <div className="bg-card rounded-sm p-6 flex flex-col gap-4 border border-border shadow-[0_4px_12px_-4px_rgba(14,15,12,0.12)]">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 border border-primary/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-card-foreground mb-2">{title}</h3>
        <p className="text-xs text-card-foreground/70 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
