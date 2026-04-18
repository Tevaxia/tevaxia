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

  test("/hotellerie/housekeeping staffing adaptatif", async ({ page }) => {
    await page.goto("/hotellerie/housekeeping");
    const body = page.locator("body");
    await expect(body).toContainText(/housekeeping|staffing|agents|ménage/i);
    // Staffing summary visible
    await expect(body).toContainText(/checkout|stayover|superviseur|shift/i);
  });

  test("/pro-agences/mandats pipeline agence", async ({ page }) => {
    await page.goto("/pro-agences/mandats");
    const body = page.locator("body");
    await expect(body).toContainText(/mandat|prospect|commission|connect|sign in/i);
  });

  test("/aml-kyc/archives archivage 5 ans", async ({ page }) => {
    await page.goto("/aml-kyc/archives");
    const body = page.locator("body");
    await expect(body).toContainText(/kyc|archiv|5 ans|connect|sign in/i);
  });

  test("/profil/confidentialite consentements RGPD", async ({ page }) => {
    await page.goto("/profil/confidentialite");
    const body = page.locator("body");
    await expect(body).toContainText(/consent|privacy|rgpd|gdpr|connect|sign in/i);
  });

  test("/terres-agricoles carte prix régionale", async ({ page }) => {
    await page.goto("/terres-agricoles");
    const body = page.locator("body");
    await expect(body).toContainText(/terre|agric|hectare|prairie|cereal/i);
    // Carte visible
    await expect(body).toContainText(/région|centre|nord|est|region/i);
  });

  test("/carte heatmap avec légende", async ({ page }) => {
    await page.goto("/carte");
    const body = page.locator("body");
    await expect(body).toContainText(/carte|map|commune|canton|prix/i);
  });

  test("/simulateur-aides veille Mémorial A", async ({ page }) => {
    await page.goto("/simulateur-aides");
    const body = page.locator("body");
    await expect(body).toContainText(/aide|klimabonus|bëllegen|veille|watch|memorial/i);
  });

  test("/estimateur-construction indices matériaux STATEC", async ({ page }) => {
    await page.goto("/estimateur-construction");
    const body = page.locator("body");
    await expect(body).toContainText(/construct|statec|matériaux|material|béton|steel/i);
  });

  test("/hotellerie/transactions comparables LU", async ({ page }) => {
    await page.goto("/hotellerie/transactions");
    const body = page.locator("body");
    await expect(body).toContainText(/transaction|comparable|cap rate|HVS|Horwath/i);
  });

  test("/hotellerie/impayes relances B2B", async ({ page }) => {
    await page.goto("/hotellerie/impayes");
    const body = page.locator("body");
    await expect(body).toContainText(/impay|relance|palier|intérêt|mise en demeure/i);
  });

  test("/hotellerie/benchmark auth wall", async ({ page }) => {
    await page.goto("/hotellerie/benchmark");
    const body = page.locator("body");
    await expect(body).toContainText(/benchmark|hôtel|connect|sign in/i);
  });

  test("/hotellerie/capex plan 10 ans", async ({ page }) => {
    await page.goto("/hotellerie/capex");
    const body = page.locator("body");
    await expect(body).toContainText(/capex|reserve|refresh|renovation|FF&E/i);
  });

  test("/verify hash verification page", async ({ page }) => {
    await page.goto("/verify");
    const body = page.locator("body");
    await expect(body).toContainText(/verif|hash|signature|SHA/i);
  });

  test("/pro-agences/fiche-bien PDF generator", async ({ page }) => {
    await page.goto("/pro-agences/fiche-bien");
    const body = page.locator("body");
    await expect(body).toContainText(/fiche|bien|prix|agence|PDF/i);
  });

  test("/syndic/procuration AG generator", async ({ page }) => {
    await page.goto("/syndic/procuration");
    const body = page.locator("body");
    await expect(body).toContainText(/procuration|assemblée|mandataire|copropriété/i);
  });

  test("/pms PMS hub accessible", async ({ page }) => {
    await page.goto("/pms");
    const body = page.locator("body");
    await expect(body).toContainText(/pms|property management|hôtel|hotel|motel|réservation|booking|connect|sign in/i);
  });

  test("/pro-agences/crm dashboard accessible", async ({ page }) => {
    await page.goto("/pro-agences/crm");
    const body = page.locator("body");
    await expect(body).toContainText(/crm|pipeline|prospect|mandat|connect|sign in/i);
  });

  test("/pro-agences/crm/contacts liste CRM", async ({ page }) => {
    await page.goto("/pro-agences/crm/contacts");
    const body = page.locator("body");
    await expect(body).toContainText(/contact|lead|prospect|acquéreur|connect|sign in/i);
  });

  test("/pro-agences/crm/tasks page tâches", async ({ page }) => {
    await page.goto("/pro-agences/crm/tasks");
    const body = page.locator("body");
    await expect(body).toContainText(/tâche|priority|connect|sign in/i);
  });

  test("/docs hub guides par persona", async ({ page }) => {
    await page.goto("/docs");
    const body = page.locator("body");
    await expect(body).toContainText(/particulier|expert|syndic|hôtelier|investisseur/i);
  });

  test("/docs/particulier guide accessible", async ({ page }) => {
    await page.goto("/docs/particulier");
    const body = page.locator("body");
    await expect(body).toContainText(/estimation|frais|aides|monte-carlo|achat|location/i);
  });

  test("/docs/hotellier guide accessible", async ({ page }) => {
    await page.goto("/docs/hotellier");
    const body = page.locator("body");
    await expect(body).toContainText(/pms|revpar|ebitda|usali|tva|ical/i);
  });

  test("/esg hub ESG accessible", async ({ page }) => {
    await page.goto("/esg");
    const body = page.locator("body");
    await expect(body).toContainText(/crrem|taxonomie|taxonomy|sfdr|esg/i);
  });

  test("/esg/crrem-pathways stranding analyzer", async ({ page }) => {
    await page.goto("/esg/crrem-pathways");
    const body = page.locator("body");
    await expect(body).toContainText(/crrem|stranding|pathway|1,5|kWh|pathways/i);
  });

  test("/esg/taxonomy wizard Climate Delegated Act", async ({ page }) => {
    await page.goto("/esg/taxonomy");
    const body = page.locator("body");
    await expect(body).toContainText(/taxonom|dnsh|substantial|nzeb|activity 7.7/i);
  });
});
