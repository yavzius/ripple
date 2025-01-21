import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Control, Controller, RegisterOptions } from "react-hook-form";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxFormProps {
  name: string;
  control: Control<any>;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  rules?: RegisterOptions;
}

export function ComboboxForm({
  name,
  control,
  options,
  placeholder = "Select an option",
  disabled = false,
  rules,
}: ComboboxFormProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => {
        const [open, setOpen] = React.useState(false);
        const [searchQuery, setSearchQuery] = React.useState("");

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className={cn(
                  "w-full justify-between",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value
                  ? options.find((option) => option.value === field.value)?.label
                  : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white">
              <Command>
                <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={(currentValue) => {
                          const selectedOption = options.find(opt => opt.label === currentValue);
                          field.onChange(selectedOption?.value === field.value ? "" : selectedOption?.value);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            option.value === field.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
} 