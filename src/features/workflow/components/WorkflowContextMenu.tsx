import { Copy, FileText, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface WorkflowContextMenuProps {
  id: string;
  top: number;
  left: number;
  onCopy: () => void;
  onEditDescription: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const WorkflowContextMenu = ({
  top,
  left,
  onCopy,
  onEditDescription,
  onDelete,
  onClose,
}: WorkflowContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top, left }}
      className="absolute z-50 min-w-[160px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    >
      <div className="p-1">
        <div
          onClick={onCopy}
          className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Node</span>
        </div>
        <div
          onClick={onEditDescription}
          className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Edit Description</span>
        </div>
        <div className="h-px my-1 bg-muted" />
        <div
          onClick={onDelete}
          className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-destructive/10 hover:text-destructive text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Node</span>
        </div>
      </div>
    </div>
  );
};
