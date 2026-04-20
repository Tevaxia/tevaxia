/**
 * Provider: CRM agences — contacts, mandats, tâches, interactions.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listContacts } from "@/lib/crm/contacts";
import { listTasks } from "@/lib/crm/tasks";
import { listInteractions } from "@/lib/crm/interactions";
import { listMyMandates } from "@/lib/agency-mandates";

async function collect(_ctx: ExportContext): Promise<BackupBundle> {
  const [contacts, tasks, interactions, mandates] = await Promise.all([
    listContacts({}),
    listTasks({}),
    listInteractions({}),
    listMyMandates(),
  ]);

  const toJson = (v: unknown) => JSON.stringify(v, null, 2);

  const files: Record<string, string> = {
    "contacts.json": toJson(contacts),
    "tasks.json": toJson(tasks),
    "interactions.json": toJson(interactions),
    "mandates.json": toJson(mandates),
  };

  const counts: Record<string, number> = {
    contacts: contacts.length,
    tasks: tasks.length,
    interactions: interactions.length,
    mandates: mandates.length,
  };

  return { files, counts };
}

export const crmAgencesProvider: ExportProvider = {
  module: "crm-agences",
  collect,
};
