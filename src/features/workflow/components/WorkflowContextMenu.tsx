import { Copy, Edit, Search, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface WorkflowContextMenuProps {
  id: string;
  top: number;
  left: number;
  onCopy: () => void;
  onEditDescription: () => void;
  onDelete: () => void;
  onClose: () => void;
  onInspect?: () => void;
}

export const WorkflowContextMenu = ({
  top,
  left,
  onCopy,
  onEditDescription,
  onDelete,
  onClose,
  onInspect,
}: WorkflowContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  const handle = (fn: () => void) => { fn(); onClose(); };

  return (
    <div
      ref={ref}
      style={{ top, left }}
      className="absolute z-50 min-w-[160px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95"
    >
      <MenuItem icon={Copy}  label="Copy Node"        onClick={() => handle(onCopy)} />
      <MenuItem icon={Edit}  label="Edit Description" onClick={() => handle(onEditDescription)} />
      {onInspect && <MenuItem icon={Search} label="Inspect" onClick={() => handle(onInspect)} />}
      <div className="-mx-1 my-1 h-px bg-border" />
      <MenuItem icon={Trash2} label="Delete Node" danger onClick={() => handle(onDelete)} />
    </div>
  );
};

function MenuItem({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </button>
  );
}
