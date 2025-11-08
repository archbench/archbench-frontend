import { useMemo, useState } from "react";
import { Search, Filter, Tag, Check } from "lucide-react";
import type { Preset } from "@/types/presets";
import type { LibraryState } from "@/types/progress";
import Button from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PresetBriefTabs } from "@/components/ScenarioSelector";
import { cn } from "@/lib/utils";

type StatusFilter = "solved" | "attempted" | "unsolved";

type Props = {
  presets: Preset[];
  progress: LibraryState;
  onLoadPreset: (slug: string) => void;
  onToggleSolved: (slug: string, solved: boolean) => void;
};

export default function LibraryView({ presets, progress, onLoadPreset, onToggleSolved }: Props) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [briefPreset, setBriefPreset] = useState<Preset | null>(null);

  const allTags = useMemo(() => {
    const bucket = new Set<string>();
    presets.forEach((preset) => {
      preset.meta.tags?.forEach((tag) => bucket.add(tag));
    });
    return Array.from(bucket).sort((a, b) => a.localeCompare(b));
  }, [presets]);

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return presets
      .map((preset) => {
        const entry = progress.progress[preset.meta.slug];
        const solved = Boolean(entry?.solved);
        const attempts = entry?.attempts ?? 0;
        const lastScore = entry?.lastScore ?? null;
        const status: StatusFilter = solved ? "solved" : attempts > 0 ? "attempted" : "unsolved";
        return { preset, entry, solved, attempts, lastScore, status };
      })
      .filter(({ preset, status }) => {
        const meta = preset.meta;
        const matchesSearch =
          !text ||
          [meta.name, meta.slug, meta.category, ...(meta.tags ?? [])]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(text));

        if (!matchesSearch) {
          return false;
        }

        const matchesDifficulty = difficulty === "all" || meta.difficulty === difficulty;
        if (!matchesDifficulty) {
          return false;
        }

        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(status);
        if (!matchesStatus) {
          return false;
        }

        const matchesTags =
          tagFilters.length === 0 ||
          tagFilters.every((tag) => meta.tags?.includes(tag));
        if (!matchesTags) {
          return false;
        }

        return true;
      });
  }, [presets, progress.progress, search, difficulty, statusFilters, tagFilters]);

  const clearFiltersEnabled =
    Boolean(search.trim()) || difficulty !== "all" || statusFilters.length > 0 || tagFilters.length > 0;

  const toggleStatus = (value: StatusFilter) => {
    setStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const toggleTag = (tag: string) => {
    setTagFilters((prev) => (prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]));
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Library</p>
        <h1 className="text-3xl font-bold text-text dark:text-white">Preset Library</h1>
        <p className="mt-1 text-sm text-muted">
          Triage scenarios like a LeetCode backlog. Filter by difficulty, review tags, and load presets directly into the editor.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-subtle dark:border-borderDark dark:bg-surfaceDark">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, slug, category, or tag"
              className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-borderDark dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!clearFiltersEnabled}
            onClick={() => {
              setSearch("");
              setDifficulty("all");
              setStatusFilters([]);
              setTagFilters([]);
            }}
          >
            Clear Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Tabs value={difficulty} onValueChange={(value) => setDifficulty(value as typeof difficulty)}>
            <TabsList className="bg-transparent">
              {["all", "easy", "medium", "hard"].map((level) => (
                <TabsTrigger key={level} value={level} className="px-4">
                  {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="sm" aria-haspopup="listbox">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {["solved", "attempted", "unsolved"].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilters.includes(status as StatusFilter)}
                  onCheckedChange={() => toggleStatus(status as StatusFilter)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary" size="sm" aria-expanded={tagsPopoverOpen}>
                <Tag className="mr-2 h-4 w-4" aria-hidden="true" />
                Tags ({tagFilters.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." aria-label="Search tags" />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {allTags.map((tag) => {
                      const selected = tagFilters.includes(tag);
                      return (
                        <CommandItem key={tag} onSelect={() => toggleTag(tag)}>
                          <Check
                            className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
                            aria-hidden="true"
                          />
                          {tag}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border bg-surface shadow-subtle dark:border-borderDark dark:bg-surfaceDark">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted dark:border-borderDark">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Difficulty</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last Score</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted">
                  No presets match the current filters.
                </td>
              </tr>
            ) : (
              rows.map(({ preset, solved, status, lastScore }) => (
                <tr key={preset.meta.slug} className="border-b border-border/40 last:border-none dark:border-borderDark/40">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text dark:text-white">{preset.meta.name}</span>
                      <span className="text-xs text-muted">/{preset.meta.slug}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{preset.meta.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={preset.meta.difficulty} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(preset.meta.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={status} />
                  </td>
                  <td className="px-4 py-3">{typeof lastScore === "number" ? `${lastScore}` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted" htmlFor={`solved-${preset.meta.slug}`}>
                        <Checkbox
                          id={`solved-${preset.meta.slug}`}
                          checked={solved}
                          onCheckedChange={(checked) => onToggleSolved(preset.meta.slug, Boolean(checked))}
                          aria-label={`Toggle solved for ${preset.meta.name}`}
                        />
                        Solved
                      </label>
                      <Button type="button" size="sm" variant="secondary" onClick={() => onLoadPreset(preset.meta.slug)}>
                        Load
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`View details for ${preset.meta.name}`}
                        onClick={() => setBriefPreset(preset)}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Dialog open={Boolean(briefPreset)} onOpenChange={(open) => !open && setBriefPreset(null)}>
        <DialogContent className="max-w-2xl">
          {briefPreset ? (
            <>
              <DialogHeader>
                <DialogTitle>{briefPreset.brief.title}</DialogTitle>
                <DialogDescription>/{briefPreset.meta.slug}</DialogDescription>
              </DialogHeader>
              <PresetBriefTabs preset={briefPreset} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) {
    return <Badge variant="outline">—</Badge>;
  }
  const palette: Record<string, string> = {
    easy: "border-success/40 bg-success/10 text-success",
    medium: "border-warning/40 bg-warning/10 text-warning",
    hard: "border-danger/40 bg-danger/10 text-danger",
  };
  return (
    <Badge variant="secondary" className={cn("text-xs", palette[difficulty] ?? "")}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
}

function StatusPill({ status }: { status: StatusFilter }) {
  const map: Record<StatusFilter, { label: string; classes: string }> = {
    solved: { label: "Solved", classes: "bg-success/15 text-success" },
    attempted: { label: "Attempted", classes: "bg-primary/10 text-primary" },
    unsolved: { label: "Unsolved", classes: "bg-muted/20 text-muted" },
  };
  const { label, classes } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        classes,
      )}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
