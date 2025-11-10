import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScenarioSelector from "@/components/ScenarioSelector";
import type { Preset } from "@/types/presets";

const presets: Preset[] = [
  {
    meta: { slug: "url-shortener", name: "URL Shortener" },
    brief: { title: "URL", summary: "", workload: {} },
    scenario: { name: "url-shortener", nodes: [], edges: [] },
  },
  {
    meta: { slug: "chat-dm", name: "Chat DM" },
    brief: { title: "Chat", summary: "", workload: {} },
    scenario: { name: "chat-dm", nodes: [], edges: [] },
  },
];

const Harness = () => {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div>
      <ScenarioSelector presets={presets} activeSlug={active} onSelect={setActive} />
      <span data-testid="active-preset">{active ?? "none"}</span>
    </div>
  );
};

describe("ScenarioSelector", () => {
  beforeAll(() => {
    window.matchMedia =
      window.matchMedia ||
      (() =>
        ({
          matches: false,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList);
  });

  it("opens the popover and selects a preset", async () => {
    render(<Harness />);
    const button = screen.getByRole("button", { name: /select scenario/i });
    await userEvent.click(button);

    const search = screen.getByPlaceholderText(/search presets/i);
    await userEvent.type(search, "URL");

    const option = await screen.findByText("URL Shortener");
    await userEvent.click(option);

    const state = screen.getByTestId("active-preset");
    expect(state).toHaveTextContent("url-shortener");
  });

  it("filters presets by query text", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: /select scenario/i }));
    await userEvent.type(screen.getByPlaceholderText(/search presets/i), "Chat");

    expect(screen.queryByText("URL Shortener")).not.toBeInTheDocument();
    expect(screen.getByText("Chat DM")).toBeInTheDocument();
  });
});
