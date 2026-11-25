import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface PickerOption {
  id: number;
  label: string;
  hint?: string | null;
}

interface Props {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  options: PickerOption[];
  placeholder: string;
  noneLabel: string;
}

/** A searchable list for picking an organization or contact (R18). */
export function Picker({ id, value, onChange, options, placeholder, noneLabel }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const choose = (next: number | null) => {
    onChange(next);
    setOpen(false);
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button id={id} type="button" className="input picker-trigger" aria-haspopup="listbox">
          <span className={selected ? undefined : "muted"}>{selected ? selected.label : placeholder}</span>
          <ChevronDown size={16} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="picker" align="start" sideOffset={6}>
          <Command label={placeholder}>
            <Command.Input className="picker-search" placeholder="Type to search" autoFocus />
            <Command.List className="picker-list">
              <Command.Empty className="picker-empty">No match.</Command.Empty>
              <Command.Item value={`__none ${noneLabel}`} onSelect={() => choose(null)} className="picker-item">
                <span className="muted">{noneLabel}</span>
                {value === null && <Check size={14} aria-hidden />}
              </Command.Item>
              {options.map((o) => (
                <Command.Item
                  key={o.id}
                  value={`${o.label} ${o.hint ?? ""} #${o.id}`}
                  onSelect={() => choose(o.id)}
                  className="picker-item"
                >
                  <span>
                    {o.label}
                    {o.hint && <span className="picker-hint"> · {o.hint}</span>}
                  </span>
                  {o.id === value && <Check size={14} aria-hidden />}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
