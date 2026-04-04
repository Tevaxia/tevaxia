package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.RenovationRequest;
import eu.tevaxia.energy.model.dto.RenovationResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RenovationServiceTest {

    private final RenovationService service = new RenovationService();

    @Test
    void sautFversB_retournePostesCorrects() {
        var request = new RenovationRequest("F", "B", 120.0, 1975, 650_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertEquals("F → B", response.sautClasse());
        assertFalse(response.postes().isEmpty());
        assertTrue(response.totalMoyen() > 0);
        assertTrue(response.totalProjet() > response.totalMoyen(), "Projet > travaux (honoraires)");
    }

    @Test
    void honorairesSontEnvironDixPourcent() {
        var request = new RenovationRequest("G", "A", 100.0, 1980, 800_000.0, null);
        RenovationResponse response = service.calculer(request);

        double ratio = (double) response.honoraires() / response.totalMoyen();
        assertEquals(0.10, ratio, 0.01, "Honoraires devraient être ~10% du total travaux");
    }

    @Test
    void batimentAncienCoutePlusCher() {
        var requestAncien = new RenovationRequest("G", "D", 100.0, 1920, 500_000.0, null);
        var requestRecent = new RenovationRequest("G", "D", 100.0, 2000, 500_000.0, null);

        RenovationResponse ancien = service.calculer(requestAncien);
        RenovationResponse recent = service.calculer(requestRecent);

        assertTrue(ancien.totalMoyen() > recent.totalMoyen(),
                "Un bâtiment pré-1945 devrait coûter plus cher à rénover");
    }

    @Test
    void gainValeurPositifPourAmeliorationClasse() {
        var request = new RenovationRequest("G", "A", 150.0, 1970, 700_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.gainValeur() > 0, "Le gain de valeur devrait être positif (G→A)");
        assertTrue(response.gainValeurPct() > 0);
    }

    @Test
    void classeCiblePireQuActuelle_lance_exception() {
        var request = new RenovationRequest("B", "F", 100.0, 1990, 500_000.0, null);
        assertThrows(IllegalArgumentException.class, () -> service.calculer(request));
    }

    @Test
    void dureeMinimumTroisMois() {
        var request = new RenovationRequest("B", "A", 80.0, 2000, 400_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.dureeEstimeeMois() >= 3, "Durée minimum devrait être 3 mois");
    }

    @Test
    void surfaceInfluenceLesCouts() {
        var petite = new RenovationRequest("F", "C", 60.0, 1985, 300_000.0, null);
        var grande = new RenovationRequest("F", "C", 200.0, 1985, 300_000.0, null);

        assertTrue(service.calculer(grande).totalMoyen() > service.calculer(petite).totalMoyen(),
                "Plus de surface = plus de coûts");
    }

    // --- Tests Klimabonus (§5.4) ---

    @Test
    void klimabonus_unSaut_25pourcent() {
        var request = new RenovationRequest("E", "D", 100.0, 1990, 500_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertEquals(0.25, response.klimabonus().taux());
        assertTrue(response.klimabonus().montant() > 0);
    }

    @Test
    void klimabonus_quatreSauts_625pourcent() {
        var request = new RenovationRequest("G", "C", 100.0, 1990, 500_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertEquals(0.625, response.klimabonus().taux());
    }

    @Test
    void resteAChargeInferieurAuProjet() {
        var request = new RenovationRequest("F", "B", 120.0, 1975, 650_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.resteACharge() < response.totalProjet(),
                "Le reste à charge doit être inférieur au coût total grâce aux aides");
        assertTrue(response.totalAides() > 0);
    }

    // --- Tests profitabilité ---

    @Test
    void economieAnnuellePositive() {
        var request = new RenovationRequest("F", "B", 120.0, 1975, 650_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.economieAnnuelleKwh() > 0, "Économie kWh positive");
        assertTrue(response.economieAnnuelleEur() > 0, "Économie € positive");
    }

    @Test
    void paybackRaisonnable() {
        var request = new RenovationRequest("F", "B", 120.0, 1975, 650_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.paybackAnnees() > 0 && response.paybackAnnees() < 50,
                "Le payback devrait être entre 0 et 50 ans");
    }

    @Test
    void vanPositiveSurVingtAns() {
        var request = new RenovationRequest("G", "B", 120.0, 1975, 650_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.van20ans() > 0,
                "La VAN sur 20 ans devrait être positive pour un gros saut de classe");
    }

    @Test
    void triPositif() {
        var request = new RenovationRequest("F", "B", 120.0, 1975, 650_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertTrue(response.triPct() > 0, "Le TRI devrait être positif");
    }

    // --- Test classes H et I ---

    @Test
    void sautIversA_fonctionneCorrectement() {
        var request = new RenovationRequest("I", "A", 100.0, 1940, 500_000.0, null);
        RenovationResponse response = service.calculer(request);

        assertEquals("I → A", response.sautClasse());
        assertFalse(response.postes().isEmpty());
        assertTrue(response.gainValeur() > 0);
        assertEquals(0.625, response.klimabonus().taux(), "8 sauts >= 4 → 62,5%");
    }
}
