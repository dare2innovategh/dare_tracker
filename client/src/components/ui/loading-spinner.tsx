import { Loader2, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner(props: LucideProps) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin", props.className)} 
      aria-hidden="true"
      {...props}
    />
  );
}