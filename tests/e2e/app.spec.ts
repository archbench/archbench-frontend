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

test("visual regression: selector menu and rubric", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Visual baselines are tracked on Chromium only.");
  await selectPreset(page, "URL Shortener");
  await mockSimulationRoute(page);
  await runSimulation(page);
  await expect(page.getByText(/Simulation complete/i)).toBeVisible();

  await scenarioButton(page).click();
  const presetMenu = page.getByTestId("scenario-preset-menu");
  await expect(presetMenu).toBeVisible();
  await expect(presetMenu).toHaveScreenshot("preset-menu.png");
  await page.keyboard.press("Escape");

  const rubricPanel = page.getByTestId("rubric-panel");
  await expect(rubricPanel).toBeVisible();
  await expect(rubricPanel).toHaveScreenshot("rubric-panel.png");
});
