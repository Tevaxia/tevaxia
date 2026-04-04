package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Résultat du simulateur ROI rénovation énergétique")
public record RenovationResponse(

        @Schema(description = "Saut de classe simulé (ex: F → B)")
        String sautClasse,

        @Schema(description = "Détail des postes de travaux")
        List<PosteTravaux> postes,

        @Schema(description = "Coût total minimum (travaux seuls) en euros")
        long totalMin,

        @Schema(description = "Coût total maximum (travaux seuls) en euros")
        long totalMax,

        @Schema(description = "Coût total moyen (travaux seuls) en euros")
        long totalMoyen,

        @Schema(description = "Honoraires architecte + bureau d'études (~10%)")
        long honoraires,

        @Schema(description = "Coût total du projet (travaux + honoraires)")
        long totalProjet,

        @Schema(description = "Durée estimée du chantier en mois")
        int dureeEstimeeMois,

        @Schema(description = "Gain de valeur estimé en euros suite au saut de classe")
        long gainValeur,

        @Schema(description = "Gain de valeur en pourcentage")
        double gainValeurPct,

        @Schema(description = "Retour sur investissement en pourcentage (gain / reste à charge après aides)")
        double roiPct,

        @Schema(description = "Subventions Klimabonus")
        Klimabonus klimabonus,

        @Schema(description = "Prêt climatique à taux préférentiel")
        Klimapret klimapret,

        @Schema(description = "Subvention conseil en énergie")
        long subventionConseil,

        @Schema(description = "Total des aides en euros")
        long totalAides,

        @Schema(description = "Reste à charge après aides en euros")
        long resteACharge,

        @Schema(description = "Économie annuelle d'énergie en kWh")
        long economieAnnuelleKwh,

        @Schema(description = "Économie annuelle d'énergie en euros")
        long economieAnnuelleEur,

        @Schema(description = "Temps de retour sur investissement net (après aides) en années")
        double paybackAnnees,

        @Schema(description = "Valeur actuelle nette sur 20 ans en euros")
        long van20ans,

        @Schema(description = "Taux de rendement interne en %")
        double triPct
) {
    @Schema(description = "Détail d'un poste de travaux de rénovation")
    public record PosteTravaux(
            @Schema(description = "Libellé du poste", example = "Isolation façade (ITE)")
            String label,

            @Schema(description = "Coût minimum en euros")
            long coutMin,

            @Schema(description = "Coût maximum en euros")
            long coutMax,

            @Schema(description = "Coût moyen en euros")
            long coutMoyen
    ) {}

    @Schema(description = "Subventions Klimabonus pour la rénovation énergétique")
    public record Klimabonus(
            @Schema(description = "Nombre de classes sautées")
            int sautClasses,

            @Schema(description = "Taux de subvention (ex: 0.50 = 50%)")
            double taux,

            @Schema(description = "Montant de la subvention en euros")
            long montant,

            @Schema(description = "Description du calcul")
            String description
    ) {}

    @Schema(description = "Prêt climatique à taux préférentiel (Klimaprêt)")
    public record Klimapret(
            @Schema(description = "Montant maximum empruntable en euros")
            long montantMax,

            @Schema(description = "Taux d'intérêt annuel")
            double taux,

            @Schema(description = "Durée maximale en mois")
            int dureeMois,

            @Schema(description = "Mensualité indicative en euros")
            long mensualite
    ) {}
}
