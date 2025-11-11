import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import NodeParameters from "@/components/Inspector/NodeParameters";
import type { Scenario } from "@/types/api";

const scenario: Scenario = {
  name: "demo",
  nodes: [
    {
      id: "api",
      type: "service",
      capacityRps: 1200,
    },
  ],
  edges: [],
};

const Harness = ({ initial, onScenarioChange }: { initial: Scenario; onScenarioChange?: (next: string) => void }) => {
  const [json, setJson] = useState(JSON.stringify(initial));
  return (
    <NodeParameters
      scenarioJson={json}
      onScenarioChange={(next) => {
        setJson(next);
        onScenarioChange?.(next);
      }}
    />
  );
};

describe("NodeParameters", () => {
  it("shows and clears validation errors for capacity", async () => {
    const user = userEvent.setup();
    render(<Harness initial={scenario} />);

    const capacityInput = screen.getByPlaceholderText(/e\.g\. 3200/i);
    await user.clear(capacityInput);
    await user.type(capacityInput, "-5");
    const activeCapacityInput = screen.getAllByLabelText(/capacity/i)[0] as HTMLInputElement;
    fireEvent.blur(activeCapacityInput);

    await screen.findByText(/capacity must be greater than 0 rps/i);

    const capacityInputValid = screen.getByPlaceholderText(/e\.g\. 3200/i);
    await user.clear(capacityInputValid);
    await user.type(capacityInputValid, "2500");
    const activeValidInput = screen.getAllByLabelText(/capacity/i)[0] as HTMLInputElement;
    fireEvent.blur(activeValidInput);

    await waitFor(() => {
      expect(screen.queryByText(/capacity must be greater than 0 rps/i)).not.toBeInTheDocument();
    });
  });
});
