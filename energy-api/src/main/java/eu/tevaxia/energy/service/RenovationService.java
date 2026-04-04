package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.RenovationRequest;
import eu.tevaxia.energy.model.dto.RenovationResponse;
import eu.tevaxia.energy.model.dto.RenovationResponse.PosteTravaux;
import eu.tevaxia.energy.model.dto.RenovationResponse.Klimabonus;
import eu.tevaxia.energy.model.dto.RenovationResponse.Klimapret;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service de calcul du ROI d'une rénovation énergétique.
 * <p>
 * Inclut : coûts travaux, Klimabonus, Klimaprêt, VAN/TRI/payback.
 * Conforme SPEC-FONCTIONNELLE §5.2–5.4.
 */
@Service
public class RenovationService {

    private static final List<String> CLASSES = List.of("A", "B", "C", "D", "E", "F", "G", "H", "I");

    /** Ajustement en % par rapport à la classe D. Conforme §5.1. */
    private static final Map<String, Double> IMPACT_ENERGIE = Map.of(
            "A",  8.0, "B",  5.0, "C",  2.0, "D", 0.0,
            "E", -3.0, "F", -7.0, "G", -12.0, "H", -18.0, "I", -25.0
    );

    /** Consommation médiane par classe en kWh/m²/an (énergie primaire). Conforme §5.2. */
    private static final Map<String, Integer> CONSO_PAR_CLASSE = Map.of(
            "A", 35, "B", 60, "C", 93, "D", 130,
            "E", 180, "F", 255, "G", 350, "H", 450, "I", 550
    );

    /** Facteur énergie primaire → finale. */
    private static final double FACTEUR_EP_FINALE = 0.75;

    /** Prix moyen de l'énergie en €/kWh (configurable). */
    private static final double PRIX_ENERGIE_KWH = 0.12;

    /** Taux d'actualisation pour la VAN. */
    private static final double TAUX_ACTUALISATION = 0.03;

    /** Horizon de calcul en années. */
    private static final int HORIZON_ANNEES = 20;

    /** Hausse annuelle du prix de l'énergie (scénario central). */
    private static final double HAUSSE_ENERGIE = 0.03;

    /** Subvention forfaitaire conseil en énergie. */
    private static final long SUBVENTION_CONSEIL = 1_500;

    /** Klimaprêt : taux 1,5 %, max 100 000 €, durée max 15 ans. */
    private static final double KLIMAPRET_TAUX = 0.015;
    private static final long KLIMAPRET_MAX = 100_000;
    private static final int KLIMAPRET_DUREE_MOIS = 180;

    /** Coûts unitaires par poste en €/m² (min, max). */
    private record CoutUnitaire(String label, double min, double max) {}

    private static final Map<String, CoutUnitaire> POSTES = new LinkedHashMap<>();
    static {
        POSTES.put("isolation_facade",    new CoutUnitaire("Isolation façade (ITE)", 120, 220));
        POSTES.put("isolation_toiture",   new CoutUnitaire("Isolation toiture / combles", 80, 160));
        POSTES.put("isolation_sol",       new CoutUnitaire("Isolation sol / cave", 40, 90));
        POSTES.put("fenetres",            new CoutUnitaire("Remplacement fenêtres (triple vitrage)", 80, 150));
        POSTES.put("chauffage",           new CoutUnitaire("Système de chauffage (PAC)", 100, 200));
        POSTES.put("ventilation",         new CoutUnitaire("VMC double flux", 40, 80));
        POSTES.put("solaire_thermique",   new CoutUnitaire("Panneaux solaires thermiques", 30, 60));
        POSTES.put("solaire_pv",          new CoutUnitaire("Panneaux photovoltaïques", 50, 100));
        POSTES.put("electricite",         new CoutUnitaire("Mise aux normes électrique", 30, 60));
    }

    /** Postes nécessaires selon le saut de classe. */
    private static final Map<String, List<String>> POSTES_PAR_SAUT = new LinkedHashMap<>();
    static {
        // Sauts depuis I
        POSTES_PAR_SAUT.put("I_H", List.of("isolation_facade", "fenetres"));
        POSTES_PAR_SAUT.put("I_G", List.of("isolation_facade", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("I_F", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("I_E", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("I_D", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("I_C", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "electricite"));
        POSTES_PAR_SAUT.put("I_B", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique", "electricite"));
        POSTES_PAR_SAUT.put("I_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique", "solaire_pv", "electricite"));
        // Sauts depuis H
        POSTES_PAR_SAUT.put("H_G", List.of("isolation_facade", "fenetres"));
        POSTES_PAR_SAUT.put("H_F", List.of("isolation_facade", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("H_E", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("H_D", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("H_C", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("H_B", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique"));
        POSTES_PAR_SAUT.put("H_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique", "solaire_pv"));
        // Sauts depuis G
        POSTES_PAR_SAUT.put("G_F", List.of("isolation_facade", "fenetres"));
        POSTES_PAR_SAUT.put("G_E", List.of("isolation_facade", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("G_D", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("G_C", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("G_B", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique"));
        POSTES_PAR_SAUT.put("G_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique", "solaire_pv"));
        // Sauts depuis F
        POSTES_PAR_SAUT.put("F_E", List.of("isolation_facade", "fenetres"));
        POSTES_PAR_SAUT.put("F_D", List.of("isolation_facade", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("F_C", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("F_B", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("F_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_pv"));
        // Sauts depuis E
        POSTES_PAR_SAUT.put("E_D", List.of("isolation_facade", "fenetres"));
        POSTES_PAR_SAUT.put("E_C", List.of("isolation_facade", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("E_B", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"));
        POSTES_PAR_SAUT.put("E_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_pv"));
        // Sauts depuis D
        POSTES_PAR_SAUT.put("D_C", List.of("isolation_facade", "fenetres"));
        POSTES_PAR_SAUT.put("D_B", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage"));
        POSTES_PAR_SAUT.put("D_A", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation", "solaire_pv"));
        // Sauts depuis C
        POSTES_PAR_SAUT.put("C_B", List.of("isolation_toiture", "chauffage"));
        POSTES_PAR_SAUT.put("C_A", List.of("isolation_toiture", "chauffage", "ventilation", "solaire_pv"));
        // Saut depuis B
        POSTES_PAR_SAUT.put("B_A", List.of("solaire_pv", "ventilation"));
    }

    public RenovationResponse calculer(RenovationRequest request) {
        String classeActuelle = request.classeActuelle();
        String classeCible = request.classeCible();
        int idxActuelle = CLASSES.indexOf(classeActuelle);
        int idxCible = CLASSES.indexOf(classeCible);

        if (idxCible >= idxActuelle) {
            throw new IllegalArgumentException(
                    "La classe cible (%s) doit être meilleure que la classe actuelle (%s)"
                            .formatted(classeCible, classeActuelle));
        }

        // --- Coûts travaux ---
        String key = classeActuelle + "_" + classeCible;
        List<String> postesNecessaires = POSTES_PAR_SAUT.getOrDefault(key, List.of());

        double facteur = facteurAge(request.anneeConstruction());
        double surface = request.surface();

        List<PosteTravaux> postes = new ArrayList<>();
        long totalMin = 0, totalMax = 0, totalMoyen = 0;

        for (String posteId : postesNecessaires) {
            CoutUnitaire cu = POSTES.get(posteId);
            if (cu == null) continue;

            long min = Math.round(cu.min() * surface * facteur);
            long max = Math.round(cu.max() * surface * facteur);
            long moy = Math.round((min + max) / 2.0);

            postes.add(new PosteTravaux(cu.label(), min, max, moy));
            totalMin += min;
            totalMax += max;
            totalMoyen += moy;
        }

        long honoraires = Math.round(totalMoyen * 0.10);
        long totalProjet = totalMoyen + honoraires;
        int dureeMois = Math.max(3, Math.round(postesNecessaires.size() * 1.5f));

        // --- Gain de valeur ---
        double pctActuelle = IMPACT_ENERGIE.getOrDefault(classeActuelle, 0.0);
        double pctCible = IMPACT_ENERGIE.getOrDefault(classeCible, 0.0);
        double gainPct = pctCible - pctActuelle;
        long gainValeur = Math.round(request.valeurBien() * (gainPct / 100.0));

        // --- Klimabonus (§5.4) ---
        int sautClasses = idxActuelle - idxCible;
        double tauxKlimabonus = switch (sautClasses) {
            case 1 -> 0.25;
            case 2 -> 0.375;
            case 3 -> 0.50;
            default -> 0.625; // >= 4
        };
        long montantKlimabonus = Math.round(totalMoyen * tauxKlimabonus);
        var klimabonus = new Klimabonus(
                sautClasses, tauxKlimabonus, montantKlimabonus,
                "Saut %s → %s (%d classes) : %.1f%% des travaux subventionnés"
                        .formatted(classeActuelle, classeCible, sautClasses, tauxKlimabonus * 100)
        );

        // --- Klimaprêt ---
        long resteApresKlimabonus = totalProjet - montantKlimabonus - SUBVENTION_CONSEIL;
        long montantKlimapret = Math.min(Math.max(resteApresKlimabonus, 0), KLIMAPRET_MAX);
        long mensualite = montantKlimapret > 0
                ? Math.round(montantKlimapret * (KLIMAPRET_TAUX / 12) /
                    (1 - Math.pow(1 + KLIMAPRET_TAUX / 12, -KLIMAPRET_DUREE_MOIS)))
                : 0;
        var klimapret = new Klimapret(montantKlimapret, KLIMAPRET_TAUX, KLIMAPRET_DUREE_MOIS, mensualite);

        long totalAides = montantKlimabonus + SUBVENTION_CONSEIL;
        long resteACharge = Math.max(totalProjet - totalAides, 0);

        // ROI basé sur le reste à charge réel (après aides), pas le coût brut
        double roi = resteACharge > 0 ? (gainValeur * 100.0 / resteACharge) : 0.0;

        // --- Économies d'énergie (§5.2) ---
        int consoActuelle = CONSO_PAR_CLASSE.getOrDefault(classeActuelle, 130);
        int consoCible = CONSO_PAR_CLASSE.getOrDefault(classeCible, 130);
        long economieKwh = Math.round((consoActuelle - consoCible) * FACTEUR_EP_FINALE * surface);
        long economieEur = Math.round(economieKwh * PRIX_ENERGIE_KWH);

        // --- VAN / TRI / Payback (scénario hausse 3%/an) ---
        double payback = economieEur > 0 ? (double) resteACharge / economieEur : 99.0;

        double van = -resteACharge;
        for (int a = 1; a <= HORIZON_ANNEES; a++) {
            double flux = economieEur * Math.pow(1 + HAUSSE_ENERGIE, a);
            van += flux / Math.pow(1 + TAUX_ACTUALISATION, a);
        }

        double tri = calculerTRI(resteACharge, economieEur, HAUSSE_ENERGIE, HORIZON_ANNEES);

        return new RenovationResponse(
                classeActuelle + " → " + classeCible,
                postes,
                totalMin, totalMax, totalMoyen,
                honoraires, totalProjet, dureeMois,
                gainValeur,
                Math.round(gainPct * 10.0) / 10.0,
                Math.round(roi * 10.0) / 10.0,
                klimabonus, klimapret, SUBVENTION_CONSEIL,
                totalAides, resteACharge,
                economieKwh, economieEur,
                Math.round(payback * 10.0) / 10.0,
                Math.round(van),
                Math.round(tri * 1000.0) / 10.0
        );
    }

    /** Facteur multiplicateur selon l'ancienneté du bâtiment (§5.3). */
    private double facteurAge(int anneeConstruction) {
        int age = Year.now().getValue() - anneeConstruction;
        if (age > 80) return 1.30;
        if (age > 50) return 1.15;
        if (age > 30) return 1.05;
        return 1.00;
    }

    /** Calcul du TRI par méthode de Newton-Raphson. */
    private double calculerTRI(long investissement, long economieAn1, double hausse, int horizon) {
        if (investissement <= 0 || economieAn1 <= 0) return 0.0;
        double r = 0.10; // estimation initiale
        for (int iter = 0; iter < 50; iter++) {
            double npv = -investissement;
            double dnpv = 0;
            for (int a = 1; a <= horizon; a++) {
                double flux = economieAn1 * Math.pow(1 + hausse, a);
                npv += flux / Math.pow(1 + r, a);
                dnpv -= a * flux / Math.pow(1 + r, a + 1);
            }
            if (Math.abs(dnpv) < 1e-10) break;
            double newR = r - npv / dnpv;
            if (Math.abs(newR - r) < 1e-8) break;
            r = newR;
        }
        return Math.max(r, 0);
    }
}
