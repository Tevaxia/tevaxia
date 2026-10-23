import { createHash } from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { expect, it } from "vitest";
import LeasePdf from "@/components/LeasePdf";
import { leaseChecksum } from "../lease-document";

it("renders a readable lease PDF and verifies the checksum against the exact delivered bytes", async () => {
  const pdf = await renderToBuffer(<LeasePdf
    lot={{ id: "qa", name: "Appartement test", address: "3 rue Exemple", commune: "Luxembourg", surface: 60, classeEnergie: "B", estMeuble: true,
      prixAcquisition: 500000, anneeAcquisition: 2020, travauxMontant: 0, travauxAnnee: 2020,
      loyerMensuelActuel: 1500.50, chargesMensuelles: 200, vacant: false, createdAt: "2026-10-23", updatedAt: "2026-10-23" }}
    landlord={{ name: "Alice Test", address: "1 rue Exemple" }}
    tenant={{ name: "Bob Test", address: "2 rue Exemple" }}
    leaseStart="2026-11-01" leaseEndOrDuration="durée indéterminée" deposit={3001}
    conclusionDate="2026-10-23" cadastralReference="Section A, 123/456"
    premisesDescription="Séjour, cuisine, chambre, salle de bains et cave."
    furnitureSupplement={100.25} chargesType="advance" rentConfirmed={false}
  />);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  const document = await PDFDocument.load(pdf);
  expect(document.getPageCount()).toBeGreaterThanOrEqual(1);
  const checksum = await leaseChecksum(new Blob([new Uint8Array(pdf)]), "projet-bail.pdf");
  expect(checksum).toBe(`${createHash("sha256").update(pdf).digest("hex")}  projet-bail.pdf\n`);
}, 15000);
