import { Separator } from "@/components/ui/separator";

/**
 * Kept as a named component because the quiz screens use it as a rhythm
 * element with its own vertical spacing, not as a bare rule.
 */
export default function Divider() {
  return <Separator className="my-6" />;
}
