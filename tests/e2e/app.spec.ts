import { test, expect, type Page } from "@playwright/test";

const mockResult = {
  latencyMsP50: 12,
  latencyMsP95: 140,
  throughputRps: 2200,
  costPerHour: 0.12,
  status: "ok",
  score: 86,
  hints: ["Add cache"],
};

const scenarioButton = (page: Page) => page.locator('button[aria-haspopup="listbox"]').first();

async function selectPreset(page, name: string) {
  await scenarioButton(page).click();
  await page.getByPlaceholder("Search presets...").fill(name);
  await page.getByText(name, { exact: true }).click();
}

async function mockSimulationRoute(page) {
  await page.route("**/simulate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockResult),
    });
  });
}

async function runSimulation(page) {
  await page.getByRole("button", { name: /run simulation/i }).click();
}

test.beforeEach(async ({ page, browserName }, testInfo) => {
  if (browserName !== "chromium" && testInfo.title.includes("visual regression")) {
    test.skip(true, "Visual baselines only run on Chromium.");
  }
  await page.goto("/");
  if (process.env.E2E_BASE_URL?.includes("devtunnels")) {
    const continueButton = page.getByRole("button", { name: /continue/i });
    const isContinueVisible = await continueButton.isVisible().catch(() => false);
    if (isContinueVisible) {
      await continueButton.click();
    }
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});

test("shows header", async ({ page }) => {
  await expect(page.getByText("ArchBench")).toBeVisible();
});

test("selecting a preset updates the scenario", async ({ page }) => {
  await selectPreset(page, "URL Shortener");
  await expect(page.getByRole("button", { name: "URL Shortener" })).toBeVisible();
  const storedName = await page.evaluate(() => JSON.parse(localStorage.getItem("scenario") || "{}").name);
  expect(storedName).toBe("url-shortener");
});

test("runs simulation with mocked engine response", async ({ page }) => {
  await selectPreset(page, "URL Shortener");
  await mockSimulationRoute(page);
  await runSimulation(page);

  await expect(page.getByText(/Scenario Score/i)).toBeVisible();
  await expect(page.getByText("86")).toBeVisible();
  await expect(page.getByText("Add cache")).toBeVisible();
});

test("applying a what-if suggestion mutates the scenario JSON", async ({ page }) => {
  await selectPreset(page, "URL Shortener");
  await mockSimulationRoute(page);
  await runSimulation(page);

  await expect(page.getByText(/What-if suggestions/i)).toBeVisible();
  const firstCard = page.getByTestId("whatif-card").first();
  await expect(firstCard).toBeVisible();
  const applyButton = firstCard.getByTestId("whatif-apply");
  await expect(applyButton).toBeEnabled();
  await applyButton.click();

  const stored = await page.evaluate(() => localStorage.getItem("scenario"));
  expect(stored).toBeTruthy();
  const scenario = stored ? JSON.parse(stored) : {};
  const hasQueue = Array.isArray(scenario.nodes)
    ? scenario.nodes.some((node: { id?: string }) => node.id === "whatif-queue-api-links-db")
    : false;
  expect(hasQueue).toBe(true);
});

test("workload inspector edits enable running simulations", async ({ page }) => {
  await selectPreset(page, "URL Shortener");
  await mockSimulationRoute(page);

  await page.getByRole("tab", { name: /workload/i }).click();
  await page.getByLabel("Requests per second").fill("1200");
  await page.getByLabel("p95 target", { exact: false }).fill("180");

  await runSimulation(page);
  await expect(page.getByTestId("rubric-panel")).toBeVisible();
});

test("database inspector updates tables and indexes", async ({ page }) => {
  await selectPreset(page, "URL Shortener");
  await page.getByRole("tab", { name: /database/i }).click();

  await page.getByRole("button", { name: /^Add table$/i }).first().click();

  const newTableName = page.getByLabel("Table name", { exact: false }).last();
  await newTableName.fill("events");

  await page.getByRole("button", { name: /^Add column$/i }).last().click();
  await page.getByLabel("Column name").fill("event_id");
  await page.getByRole("combobox", { name: /type/i }).selectOption("string");
  await page.getByRole("dialog", { name: /add column/i }).getByRole("button", { name: /^Add column$/i }).click();

  await page.getByRole("button", { name: /^Add index$/i }).last().click();
  await page.getByLabel("Index name").fill("events_idx");
  await page.getByRole("dialog", { name: /add index/i }).getByRole("button", { name: /^Add index$/i }).click();

  await page.getByRole("tab", { name: /json/i }).click();
  const jsonValue = await page.getByLabel("Scenario JSON").inputValue();
  expect(jsonValue).toContain('"name": "events"');
  expect(jsonValue).toContain('"events_idx"');
});

test("overlay compare highlights node deltas", async ({ page, browserName }) => {
  await selectPreset(page, "URL Shortener");
  await mockSimulationRoute(page);
  await runSimulation(page);
  await page.getByRole("button", { name: /save snapshot a/i }).click();

  await page.getByRole("tab", { name: /json/i }).click();
  const jsonEditor = page.getByLabel("Scenario JSON");
  const baseJson = await jsonEditor.inputValue();
  const updatedJson = await page.evaluate((raw) => {
    const parsed = JSON.parse(raw);
    const apiNode = parsed.nodes?.find((node: { id?: string }) => node.id === "api");
    if (apiNode) {
      apiNode.capacityRps = 4000;
      apiNode.latencyMs = 22;
    }
    return JSON.stringify(parsed, null, 2);
  }, baseJson);
  await jsonEditor.fill(updatedJson);
  await page.getByRole("tab", { name: /^node$/i }).click();

  await runSimulation(page);
  await page.getByRole("button", { name: /save snapshot b/i }).click();

  const overlayToggle = page.getByRole("button", { name: /overlay compare/i });
  await overlayToggle.click();

  const deltaChip = page.getByTestId("node-overlay-api-dCapacityRps");
  await expect(deltaChip).toBeVisible();
  await expect(deltaChip).toContainText("Δrps");
  await expect(page.getByText(/overlay legend/i)).toBeVisible();

  if (browserName === "chromium") {
    await expect(page.locator(".react-flow")).toHaveScreenshot("compare-overlay.png", { maxDiffPixelRatio: 0.03 });
  }
});

test("visual regression: selector menu and rubric", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Visual baselines are tracked on Chromium only.");
  await selectPreset(page, "URL Shortener");
  await mockSimulationRoute(page);
  await runSimulation(page);
  await expect(page.getByText(/Simulation complete/i)).toBeVisible();

  await scenarioButton(page).click();
  const presetMenu = page.getByTestId("scenario-preset-menu");
  await expect(presetMenu).toBeVisible();
  await expect(presetMenu).toHaveScreenshot("preset-menu.png", { maxDiffPixelRatio: 0.02 });
  await page.keyboard.press("Escape");

  const rubricPanel = page.getByTestId("rubric-panel");
  await expect(rubricPanel).toBeVisible();
  await expect(rubricPanel).toHaveScreenshot("rubric-panel.png", { maxDiffPixelRatio: 0.02 });
});
