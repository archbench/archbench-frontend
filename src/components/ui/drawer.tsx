import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../lib/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(function DrawerOverlay({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
});
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(function DrawerContent({ className, children, ...props }, ref) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[75%] flex-col rounded-t-2xl border border-border bg-surface shadow-subtle dark:border-borderDark dark:bg-surfaceDark",
          className,
        )}
        {...props}
      >
        <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-border dark:bg-borderDark" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 px-4 text-center", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 px-4 pb-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(function DrawerTitle({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold text-text dark:text-white", className)}
      {...props}
    />
  );
});
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(function DrawerDescription({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted", className)}
      {...props}
    />
  );
});
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
};

