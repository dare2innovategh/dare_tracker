import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormTooltipProps {
  content: string;
  iconSize?: number;
}

export function FormTooltip({ content, iconSize = 16 }: FormTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle 
            className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" 
            size={iconSize} 
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}