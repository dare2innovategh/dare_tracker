import { useState, useEffect } from "react";

/**
 * Helper hook for select fields to handle empty/null values
 * @param initialValue The initial value for the select field
 * @returns An object with value and onChange properties
 */
export function useSelectSafety(initialValue?: string | null) {
  const [value, setValue] = useState<string | undefined>(
    initialValue === null ? undefined : initialValue
  );

  useEffect(() => {
    setValue(initialValue === null ? undefined : initialValue);
  }, [initialValue]);

  return { value, onChange: setValue };
}