import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import "./Dialog.css";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  width?: number;
}

export function Dialog({ open, onOpenChange, title, description, children, width = 520 }: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-overlay" />
        <RadixDialog.Content
          className="dialog"
          style={{ width }}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="dialog-head">
            <RadixDialog.Title className="dialog-title">{title}</RadixDialog.Title>
            <RadixDialog.Close className="icon-btn" aria-label="Close">
              <X size={18} aria-hidden />
            </RadixDialog.Close>
          </div>
          {description && <RadixDialog.Description className="dialog-description">{description}</RadixDialog.Description>}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="dialog-actions">{children}</div>;
}
