import type { NodeProps } from "reactflow";
import type { NodeDelta } from "@/compare/diff";
import { NodeOverlay } from "./NodeOverlay";
import type { CompareOverlayMode } from "@/types/compare";

export type BoardNodeData = {
  label: string;
  compareOverlay: CompareOverlayMode;
  delta?: NodeDelta;
};

export function BoardNode({ data }: NodeProps<BoardNodeData>) {
  return (
    <div className="relative min-w-[120px] rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm dark:border-borderDark dark:bg-surfaceDark">
      {data.label}
      {data.compareOverlay === "A-vs-B" ? <NodeOverlay delta={data.delta} /> : null}
    </div>
  );
}

export default BoardNode;
