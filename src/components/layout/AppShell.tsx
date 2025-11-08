import type { ReactNode } from "react";

type Props = {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AppShell({ header, children, footer }: Props) {
  return (
    <div className="app-shell">
      <header className="app-shell__header z-header">{header}</header>
      <main className="app-shell__content">{children}</main>
      {footer ? <footer className="app-shell__footer">{footer}</footer> : null}
    </div>
  );
}
