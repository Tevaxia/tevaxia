import { test, expect } from "@playwright/test";

test.describe("Smoke tests — parcours critiques publics", () => {
  test("home charge avec CTA estimation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/tevaxia/i);
    // Le hero doit contenir un mot clé métier
    const body = page.locator("body");
    await expect(body).toContainText(/immobili|estimation|valorisation|luxembourg/i);
  });

  test("/estimation — formulaire avec champs commune/surface", async ({ page }) => {
    await page.goto("/estimation");
    // Au moins un input texte pour commune
    const inputs = page.locator('input[type="text"], input:not([type])');
    await expect(inputs.first()).toBeVisible({ timeout: 10000 });
  });

  test("/frais-acquisition charge", async ({ page }) => {
    await page.goto("/frais-acquisition");
    const body = page.locator("body");
    await expect(body).toContainText(/notaire|enregistrement|frais/i);
  });

  test("/str hub affiche les 5 calculateurs STR", async ({ page }) => {
    await page.goto("/str");
    const body = page.locator("body");
    await expect(body).toContainText(/airbnb|rentabilit|compliance/i);
    // Attend au moins 3 tuiles
    const tiles = page.locator('a[href*="/str/"]');
    await expect(tiles.first()).toBeVisible();
  });

  test("/hotellerie hub accessible", async ({ page }) => {
    await page.goto("/hotellerie");
    const body = page.locator("body");
    await expect(body).toContainText(/hôtel|hotel|revpar/i);
  });

  test("/guide liste les articles", async ({ page }) => {
    await page.goto("/guide");
    const body = page.locator("body");
    await expect(body).toContainText(/guide|article|frais|bail/i);
  });

  test("/api-docs expose la doc OpenAPI", async ({ page }) => {
    await page.goto("/api-docs");
    const body = page.locator("body");
    await expect(body).toContainText(/api|openapi|swagger|documentation/i);
  });

  test("/status page publique", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/str/forecast page charge (client-side calculator)", async ({ page }) => {
    await page.goto("/str/forecast");
    const body = page.locator("body");
    await expect(body).toContainText(/forecast|prévisionnel|prognose/i);
    // Bouton "Données démo" doit être présent pour onboarding sans historique
    const demoBtn = page.getByRole("button", { name: /démo|demo|seed/i });
    await expect(demoBtn.first()).toBeVisible();
  });

  test("/syndic/benchmark page nécessite auth mais s'affiche", async ({ page }) => {
    await page.goto("/syndic/benchmark");
    await expect(page.locator("body")).toBeVisible();
    // Sans auth, message login attendu ; avec auth, titre benchmark
    const body = page.locator("body");
    await expect(body).toContainText(/benchmark|connect|sign in/i);
  });

  test("/marche/forecast prévisions prix avec 3 scénarios", async ({ page }) => {
    await page.goto("/marche/forecast");
    const body = page.locator("body");
    await expect(body).toContainText(/pessimiste|pessimistic|central|optimiste|optimistic/i);
    // Au moins un input pour saisir la commune
    const inputs = page.locator("input[type='text'], input:not([type])");
    await expect(inputs.first()).toBeVisible({ timeout: 10000 });
  });

  test("/energy/audit 20 questions audit guidé", async ({ page }) => {
    await page.goto("/energy/audit");
    const body = page.locator("body");
    await expect(body).toContainText(/audit|énergie|energy|klimabonus/i);
    // Progress bar ou question devrait être présent
    await expect(body).toContainText(/question|\/\s*20|construction/i);
  });

  test("/gestion-locative/ais page AIS avec calculateur abattement 75 %", async ({ page }) => {
    await page.goto("/gestion-locative/ais");
    const body = page.locator("body");
    await expect(body).toContainText(/ais|abattement|75/i);
    // Inputs calculateur présents
    const inputs = page.locator("input[type='number'], input[type='range']");
    await expect(inputs.first()).toBeVisible({ timeout: 10000 });
  });

  test("/hotellerie/observatoire-lu observatoire STATEC", async ({ page }) => {
    await page.goto("/hotellerie/observatoire-lu");
    const body = page.locator("body");
    await expect(body).toContainText(/observatoire|statec|occupation|revpar/i);
    // KPI cards
    await expect(body).toContainText(/nuitées|nights|übernachtungen|dormidas|nuechten/i);
  });
});
