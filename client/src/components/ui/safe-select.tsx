import * as React from "react"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem as OriginalSelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

// Safe version of SelectItem that doesn't allow empty string values
interface SafeSelectItemProps extends React.ComponentPropsWithoutRef<typeof OriginalSelectItem> {
  value: string;
}

const SafeSelectItem = React.forwardRef<
  React.ElementRef<typeof OriginalSelectItem>,
  SafeSelectItemProps
>(({ value, ...props }, ref) => {
  // Ensure value is never an empty string
  const safeValue = value || "undefined";
  
  return (
    <OriginalSelectItem
      ref={ref}
      value={safeValue}
      {...props}
    />
  );
});
SafeSelectItem.displayName = "SafeSelectItem";

// Create a safe version of Select that handles undefined/null values better
type SafeSelectProps = Omit<React.ComponentProps<typeof Select>, 'value' | 'defaultValue'> & {
  onValueChange?: (value: string) => void;
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  children: React.ReactNode;
}

const SafeSelect: React.FC<SafeSelectProps> = ({ 
  onValueChange, 
  value, 
  defaultValue,
  children,
  ...props 
}) => {
  // Ensure we never pass empty strings as value or defaultValue
  const safeValue = value === '' || value === null ? undefined : value;
  const safeDefaultValue = defaultValue === '' || defaultValue === null ? undefined : defaultValue;

  return (
    <Select
      onValueChange={onValueChange}
      value={safeValue}
      defaultValue={safeDefaultValue}
      {...props}
    >
      {children}
    </Select>
  );
};

export { 
  SafeSelect,
  SafeSelectItem,
  // Re-export original components
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue
}