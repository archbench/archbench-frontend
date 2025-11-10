import { test, expect } from "@playwright/test";

const mockResult = {
  latencyMsP50: 12,
  latencyMsP95: 140,
  throughputRps: 2200,
  costPerHour: 0.12,
  status: "ok",
  score: 86,
  hints: ["Add cache"],
};

async function selectPreset(page, name: string) {
  await page.getByRole("button", { name: /select scenario/i }).click();
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

test.beforeEach(async ({ page }) => {
  await page.goto("/");
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

  const firstApply = page.getByRole("button", { name: /^apply$/i }).first();
  await firstApply.click();

  const stored = await page.evaluate(() => localStorage.getItem("scenario"));
  expect(stored).toContain("whatif-cache");
});

test("visual regression: selector menu and rubric", async ({ page }) => {
  await selectPreset(page, "URL Shortener");
  await page.getByRole("button", { name: /select scenario/i }).click();
  await expect(page).toHaveScreenshot("preset-menu.png", { fullPage: true });
  await page.keyboard.press("Escape");

  await mockSimulationRoute(page);
  await runSimulation(page);
  await expect(page.getByText(/Grading Rubric/i)).toBeVisible();
  await expect(page).toHaveScreenshot("rubric-panel.png", { fullPage: true });
});

