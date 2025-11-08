import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { Portal as PopoverPortal } from "@radix-ui/react-popover";
import type { Preset } from "@/types/presets";
import Button from "./common/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";

type Props = {
  presets: Preset[];
  activeSlug: string | null;
  onSelect: (presetSlug: string) => void;
};

export default function ScenarioSelector({ presets, activeSlug, onSelect }: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const componentId = useId();
  const listboxId = `${componentId}-presets`;
  const briefPanelId = `${componentId}-brief`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const groupedPresets = useMemo(() => {
    const groups = new Map<string, Preset[]>();
    presets.forEach((preset) => {
      const key = preset.meta.category ?? "General";
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(preset);
      } else {
        groups.set(key, [preset]);
      }
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => ({
        label: key,
        items: bucket.sort((a, b) => a.meta.name.localeCompare(b.meta.name)),
      }));
  }, [presets]);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.meta.slug === activeSlug) ?? null,
    [presets, activeSlug],
  );

  useEffect(() => {
    if (!selectedPreset) {
      setBriefOpen(false);
    }
  }, [selectedPreset]);

  const briefContent = (
    <div id={briefPanelId}>
      {selectedPreset ? (
        <PresetBriefTabs preset={selectedPreset} />
      ) : (
        <p className="text-sm text-muted">Select a preset to view its brief.</p>
      )}
    </div>
  );

  const chooserButtonLabel = selectedPreset ? selectedPreset.meta.name : "Select scenario";

  useEffect(() => {
    setSelectorOpen(false);
  }, [isMobile]);

  const handlePresetSelection = (slug: string) => {
    onSelect(slug);
    setSelectorOpen(false);
  };

  useIsomorphicLayoutEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (!selectorOpen || !triggerRef.current || isMobile) {
      document.body.style.removeProperty("--ab-selector-width");
      return;
    }
    const width = triggerRef.current.getBoundingClientRect().width;
    document.body.style.setProperty("--ab-selector-width", `${Math.ceil(width)}px`);
    return () => {
      document.body.style.removeProperty("--ab-selector-width");
    };
  }, [selectorOpen, isMobile]);

  useBodyScrollLock(selectorOpen && !isMobile);

  return (
    <div className="flex items-center gap-2">
      {isMobile ? (
        <Drawer open={selectorOpen} onOpenChange={setSelectorOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              ref={triggerRef}
              className="w-64 justify-between"
              aria-haspopup="listbox"
              aria-expanded={selectorOpen}
              aria-controls={listboxId}
            >
              <span className="truncate text-left">{chooserButtonLabel}</span>
              <ChevronsUpDown className="h-4 w-4 text-muted" aria-hidden="true" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="z-overlay h-[70vh] overflow-auto rounded-t-2xl border border-border bg-surface p-0 shadow-lg dark:border-borderDark dark:bg-surfaceDark">
            {renderSelectorContent({
              groupedPresets,
              activeSlug,
              listboxId,
              autoFocus: false,
              listClassName: "max-h-full overflow-y-auto",
              onSelect: handlePresetSelection,
            })}
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              ref={triggerRef}
              className="w-64 justify-between"
              aria-haspopup="listbox"
              aria-expanded={selectorOpen}
              aria-controls={listboxId}
            >
              <span className="truncate text-left">{chooserButtonLabel}</span>
              <ChevronsUpDown className="h-4 w-4 text-muted" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              className="fixed z-overlay w-[var(--ab-selector-width,16rem)] max-h-[60vh] overflow-hidden rounded-md border border-border/60 bg-surface p-0 shadow-lg dark:border-borderDark/60 dark:bg-zinc-900"
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
            >
              {renderSelectorContent({
                groupedPresets,
                activeSlug,
                listboxId,
                autoFocus: true,
                listClassName: "",
                useScrollArea: true,
                onSelect: handlePresetSelection,
              })}
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Show preset brief"
        onClick={() => setBriefOpen(true)}
        disabled={!selectedPreset}
        aria-controls={briefPanelId}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </Button>

      {isMobile ? (
        <Drawer open={briefOpen} onOpenChange={setBriefOpen}>
          <DrawerContent aria-describedby={briefPanelId}>
            <DrawerHeader className="space-y-2">
              <DrawerTitle>{selectedPreset?.brief.title ?? "Preset brief"}</DrawerTitle>
              <DrawerDescription>
                {selectedPreset ? `/${selectedPreset.meta.slug}` : "Pick a preset to view details."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6">{briefContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
          <DialogContent aria-describedby={briefPanelId}>
            <DialogHeader>
              <DialogTitle>{selectedPreset?.brief.title ?? "Preset brief"}</DialogTitle>
              <DialogDescription>
                {selectedPreset ? `/${selectedPreset.meta.slug}` : "Pick a preset to view details."}
              </DialogDescription>
            </DialogHeader>
            {briefContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function renderSelectorContent({
  groupedPresets,
  activeSlug,
  listboxId,
  autoFocus,
  listClassName,
  useScrollArea = false,
  onSelect,
}: {
  groupedPresets: { label: string; items: Preset[] }[];
  activeSlug: string | null;
  listboxId: string;
  autoFocus: boolean;
  listClassName: string;
  useScrollArea?: boolean;
  onSelect: (slug: string) => void;
}) {
  const listContent = (
    <CommandList id={listboxId}>
      <CommandEmpty>No scenarios found.</CommandEmpty>
      {groupedPresets.map((group) => (
        <CommandGroup
          key={group.label}
          heading={group.label}
          className="[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-[1] [&_[cmdk-group-heading]]:bg-surface/95 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted supports-[backdrop-filter]:[&_[cmdk-group-heading]]:bg-surface/75 dark:[&_[cmdk-group-heading]]:bg-surfaceDark/95"
        >
          {group.items.map((preset) => {
            const isActive = preset.meta.slug === activeSlug;
            return (
              <CommandItem
                key={preset.meta.slug}
                value={`${preset.meta.slug} ${preset.meta.name}`}
                onSelect={() => onSelect(preset.meta.slug)}
                className={cn(
                  "cursor-pointer px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10",
                  isActive && "border border-primary/30 bg-primary/10",
                )}
              >
                <Check
                  className={cn("h-4 w-4", isActive ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-text dark:text-white">
                    {preset.meta.name}
                  </span>
                  <span className="text-xs text-muted">/{preset.meta.slug}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      ))}
    </CommandList>
  );

  const scrollWrapper = useScrollArea ? (
    <ScrollArea
      className={cn("max-h-[60vh]", listClassName)}
      onWheelCapture={(event) => event.stopPropagation()}
    >
      {listContent}
    </ScrollArea>
  ) : (
    <div className={listClassName} onWheelCapture={(event) => event.stopPropagation()}>
      {listContent}
    </div>
  );

  return (
    <Command className="w-full">
      <CommandInput placeholder="Search presets..." aria-label="Search presets" autoFocus={autoFocus} />
      {scrollWrapper}
      <CommandSeparator />
      <p className="border-t border-border/40 px-3 py-2 text-xs text-muted">
        Use ↑↓ to navigate, Enter to apply, Esc to close.
      </p>
    </Command>
  );
}

export function PresetBriefTabs({ preset }: { preset: Preset }) {
  const summaryParagraphs = preset.brief.summary
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const workload = preset.brief.workload;

  return (
    <Tabs defaultValue="overview">
      <TabsList className="w-full">
        <TabsTrigger value="overview" className="flex-1">
          Overview
        </TabsTrigger>
        <TabsTrigger value="workload" className="flex-1">
          Workload
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text dark:border-borderDark dark:bg-surfaceDark dark:text-white">
        {summaryParagraphs.map((paragraph, index) => (
          <p key={index} className={index ? "mt-3" : undefined}>
            {paragraph}
          </p>
        ))}
      </TabsContent>
      <TabsContent value="workload">
        <div className="rounded-md border border-border bg-surface p-4 text-sm dark:border-borderDark dark:bg-surfaceDark">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Requests / sec</dt>
              <dd className="text-base font-semibold text-text dark:text-white">
                {workload?.rps?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">p95 target (ms)</dt>
              <dd className="text-base font-semibold text-text dark:text-white">
                {workload?.p95TargetMs ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Cost target ($/h)</dt>
              <dd className="text-base font-semibold text-text dark:text-white">
                {workload?.costTargetPerHour ? workload.costTargetPerHour.toFixed(2) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia(query);
    const handler = () => setMatches(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
