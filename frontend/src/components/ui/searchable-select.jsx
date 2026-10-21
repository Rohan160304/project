/**
 * SearchableSelect — Popover + Command combobox
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for both:
 *   • Native HTML <select>
 *   • Radix UI <Select> (from @radix-ui/react-select)
 *
 * Props:
 *   value          — currently selected value (string)
 *   onValueChange  — callback(newValue: string)
 *   options        — [{ value: string, label: string }]
 *   placeholder    — text when nothing is selected (default: "Select…")
 *   searchPlaceholder — input hint (default: "Search…")
 *   emptyText      — text when search has no results (default: "No results found.")
 *   disabled       — boolean
 *   className      — extra classes for the trigger button
 *   align          — popover alignment: "start" | "center" | "end" (default: "start")
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * SearchableSelect
 */
const SearchableSelect = React.forwardRef(function SearchableSelect(
  {
    value, // string or array if multiple
    onValueChange,
    options = [],
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyText = "No results found.",
    disabled = false,
    multiple = false,
    className,
    align = "start",
    ...props
  },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const { t } = useLanguage();

  // Find the label for the current value
  const selectedLabel = React.useMemo(() => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) return null;
      if (value.length === 1) {
        const found = options.find((o) => String(o.value) === String(value[0]));
        return found ? t(found.label) : value[0];
      }
      return `${value.length} selected`;
    }
    if (!value) return null;
    const found = options.find((o) => String(o.value) === String(value));
    return found ? t(found.label) : value;
  }, [value, options, t, multiple]);

  function handleSelect(optValue) {
    if (multiple) {
      const arr = Array.isArray(value) ? [...value] : [];
      const valStr = String(optValue);
      if (arr.some((v) => String(v) === valStr)) {
        onValueChange?.(arr.filter((v) => String(v) !== valStr));
      } else {
        onValueChange?.([...arr, optValue]);
      }
    } else {
      onValueChange?.(optValue);
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between rounded-md border border-slate-200 bg-white px-3 text-sm font-normal shadow-none hover:bg-white focus:ring-1 focus:ring-orange-400",
            !selectedLabel && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <span className="truncate">{selectedLabel || t(placeholder)}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[180px] max-w-sm p-0"
        align={align}
        sideOffset={4}
      >
        <Command filter={(value, search) => {
          const normalizedValue = value.replace(/[\s.]+/g, "").toLowerCase();
          const normalizedSearch = search.replace(/[\s.]+/g, "").toLowerCase();
          if (normalizedValue.includes(normalizedSearch)) return 1;
          return 0;
        }}>
          <CommandInput placeholder={t(searchPlaceholder)} className="h-9" />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>{t(emptyText)}</CommandEmpty>
            <CommandGroup>
              {options.map((opt, idx) => (
                <CommandItem
                  key={`${opt.value}-${idx}`}
                  value={t(opt.label)} /* cmdk matches on this string */
                  onSelect={() => handleSelect(opt.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (multiple ? Array.isArray(value) && value.some((v) => String(v) === String(opt.value)) : String(value) === String(opt.value))
                        ? "opacity-100 text-orange-500"
                        : "opacity-0"
                    )}
                  />
                  {t(opt.label)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };
