/**
 * Provider: PMS hôtel/motel — propriétés, chambres, réservations, guests,
 * factures, rate plans, groupes, folios.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listMyProperties } from "@/lib/pms/properties";
import { listRoomTypes, listRooms } from "@/lib/pms/rooms";
import { listReservations, listReservationLines, listPayments } from "@/lib/pms/reservations";
import { listGuests } from "@/lib/pms/guests";
import { listInvoices } from "@/lib/pms/invoices";
import { listRatePlans, listSeasonalRates } from "@/lib/pms/rates";
import { listGroups } from "@/lib/pms/groups";
import { getFolioByReservation, listFolioCharges } from "@/lib/pms/folios";

async function collect(_ctx: ExportContext): Promise<BackupBundle> {
  const properties = await listMyProperties();

  const roomTypesAll: unknown[] = [];
  const roomsAll: unknown[] = [];
  const reservationsAll: unknown[] = [];
  const reservationLinesAll: unknown[] = [];
  const paymentsAll: unknown[] = [];
  const guestsAll: unknown[] = [];
  const invoicesAll: unknown[] = [];
  const ratePlansAll: unknown[] = [];
  const seasonalRatesAll: unknown[] = [];
  const groupsAll: unknown[] = [];
  const foliosAll: unknown[] = [];
  const folioChargesAll: unknown[] = [];

  for (const prop of properties) {
    const [roomTypes, rooms, reservations, guests, invoices, ratePlans, seasonalRates, groups] = await Promise.all([
      listRoomTypes(prop.id),
      listRooms(prop.id),
      listReservations(prop.id),
      listGuests(prop.id),
      listInvoices(prop.id),
      listRatePlans(prop.id),
      listSeasonalRates(prop.id),
      listGroups(prop.id),
    ]);

    roomTypesAll.push(...roomTypes);
    roomsAll.push(...rooms);
    reservationsAll.push(...reservations);
    guestsAll.push(...guests);
    invoicesAll.push(...invoices);
    ratePlansAll.push(...ratePlans);
    seasonalRatesAll.push(...seasonalRates);
    groupsAll.push(...groups);

    for (const res of reservations) {
      const lines = await listReservationLines(res.id);
      const payments = await listPayments(res.id);
      reservationLinesAll.push(...lines);
      paymentsAll.push(...payments);

      const folio = await getFolioByReservation(res.id);
      if (folio) {
        foliosAll.push(folio);
        const charges = await listFolioCharges(folio.id);
        folioChargesAll.push(...charges);
      }
    }
  }

  const toJson = (v: unknown) => JSON.stringify(v, null, 2);

  const files: Record<string, string> = {
    "properties.json": toJson(properties),
    "room_types.json": toJson(roomTypesAll),
    "rooms.json": toJson(roomsAll),
    "reservations.json": toJson(reservationsAll),
    "reservation_lines.json": toJson(reservationLinesAll),
    "payments.json": toJson(paymentsAll),
    "guests.json": toJson(guestsAll),
    "invoices.json": toJson(invoicesAll),
    "rate_plans.json": toJson(ratePlansAll),
    "seasonal_rates.json": toJson(seasonalRatesAll),
    "groups.json": toJson(groupsAll),
    "folios.json": toJson(foliosAll),
    "folio_charges.json": toJson(folioChargesAll),
  };

  const counts: Record<string, number> = {
    properties: properties.length,
    room_types: roomTypesAll.length,
    rooms: roomsAll.length,
    reservations: reservationsAll.length,
    reservation_lines: reservationLinesAll.length,
    payments: paymentsAll.length,
    guests: guestsAll.length,
    invoices: invoicesAll.length,
    rate_plans: ratePlansAll.length,
    seasonal_rates: seasonalRatesAll.length,
    groups: groupsAll.length,
    folios: foliosAll.length,
    folio_charges: folioChargesAll.length,
  };

  return { files, counts };
}

export const pmsProvider: ExportProvider = {
  module: "pms",
  collect,
};
