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

export default function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  const Icon = ICON_MAP[icon] ?? Sparkles;

  return (
    <div className="group rounded-lg border border-border bg-card p-6 flex flex-col gap-4 hover:border-border/60 hover:bg-card/80 transition-all duration-150">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
