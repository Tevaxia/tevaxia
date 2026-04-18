export type PmsPropertyType = "hotel" | "motel" | "chambres_hotes" | "residence" | "auberge" | "camping";

export type PmsRoomStatus =
  | "available" | "occupied" | "dirty" | "clean"
  | "inspected" | "out_of_order" | "maintenance";

export type PmsReservationStatus =
  | "quote" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";

export type PmsReservationSource =
  | "direct" | "website" | "booking" | "expedia" | "airbnb"
  | "gha" | "corporate" | "tour_operator" | "other";

export type PmsPaymentMethod =
  | "cash" | "card" | "bank_transfer" | "ota_virtual" | "voucher" | "invoice";

export type PmsInvoiceType = "standard" | "deposit" | "credit" | "proforma";

export type PmsHousekeepingStatus = "pending" | "in_progress" | "done" | "inspected" | "skipped";

export type PmsHousekeepingTaskType =
  | "checkout_clean" | "stayover" | "deep_clean" | "inspection" | "maintenance" | "linen_change";

export interface PmsProperty {
  id: string;
  user_id: string;
  org_id: string | null;
  name: string;
  property_type: PmsPropertyType;
  address: string | null;
  commune: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  tva_rate: number;
  tva_rate_fb: number | null;
  taxe_sejour_eur: number | null;
  taxe_sejour_enfants: boolean;
  currency: string;
  check_in_time: string;
  check_out_time: string;
  registration_number: string | null;
  vat_number: string | null;
  invoice_prefix: string | null;
  invoice_next_number: number;
  legal_footer: string | null;
  created_at: string;
  updated_at: string;
}

export interface PmsRoomType {
  id: string;
  property_id: string;
  code: string;
  name: string;
  description: string | null;
  capacity_adults: number;
  capacity_children: number;
  extra_bed_allowed: boolean;
  extra_bed_price: number | null;
  base_rate: number;
  size_m2: number | null;
  amenities: string[];
  photos: string[];
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PmsRoom {
  id: string;
  property_id: string;
  room_type_id: string;
  number: string;
  floor: number | null;
  status: PmsRoomStatus;
  status_note: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PmsRatePlan {
  id: string;
  property_id: string;
  code: string;
  name: string;
  description: string | null;
  refundable: boolean;
  breakfast_included: boolean;
  discount_pct: number;
  min_los: number;
  max_los: number | null;
  advance_booking_days: number | null;
  cancellation_deadline_hours: number;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PmsGuest {
  id: string;
  property_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  document_country: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
  language: string;
  preferences: Record<string, unknown>;
  notes: string | null;
  total_stays: number;
  total_nights: number;
  total_spent: number;
  deletion_scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface PmsSeasonalRate {
  id: string;
  property_id: string;
  rate_plan_id: string;
  room_type_id: string;
  start_date: string;
  end_date: string;
  price: number;
  min_los: number;
  max_los: number | null;
  closed_to_arrival: boolean;
  closed_to_departure: boolean;
  stop_sell: boolean;
  created_at: string;
}

export interface PmsReservation {
  id: string;
  property_id: string;
  reservation_number: string;
  status: PmsReservationStatus;
  source: PmsReservationSource;
  external_ref: string | null;
  guest_id: string | null;
  booker_name: string | null;
  booker_email: string | null;
  booker_phone: string | null;
  check_in: string;
  check_out: string;
  nb_adults: number;
  nb_children: number;
  nb_nights: number;
  total_amount: number;
  amount_paid: number;
  deposit_amount: number;
  deposit_paid: boolean;
  currency: string;
  cancellation_policy: string | null;
  notes: string | null;
  special_requests: string | null;
  internal_notes: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PmsReservationRoom {
  id: string;
  reservation_id: string;
  room_id: string | null;
  room_type_id: string;
  rate_plan_id: string;
  nightly_rate: number;
  nb_nights: number;
  nb_adults: number;
  nb_children: number;
  line_total: number;
  extra_bed_count: number;
  notes: string | null;
  created_at: string;
}

export interface PmsPayment {
  id: string;
  reservation_id: string;
  amount: number;
  method: PmsPaymentMethod;
  paid_at: string;
  reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface PmsInvoice {
  id: string;
  property_id: string;
  reservation_id: string | null;
  guest_id: string | null;
  invoice_number: string;
  invoice_type: PmsInvoiceType;
  issue_date: string;
  due_date: string | null;
  customer_name: string;
  customer_address: string | null;
  customer_vat_number: string | null;
  hebergement_ht: number;
  hebergement_tva_rate: number;
  hebergement_tva: number;
  fb_ht: number;
  fb_tva_rate: number;
  fb_tva: number;
  other_ht: number;
  other_tva_rate: number;
  other_tva: number;
  taxe_sejour: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  currency: string;
  paid: boolean;
  paid_at: string | null;
  notes: string | null;
  legal_footer: string | null;
  issued: boolean;
  issued_at: string | null;
  pdf_storage_path: string | null;
  pdf_hash_sha256: string | null;
  created_at: string;
  updated_at: string;
}

export interface PmsHousekeepingTask {
  id: string;
  property_id: string;
  room_id: string;
  reservation_id: string | null;
  task_date: string;
  task_type: PmsHousekeepingTaskType;
  status: PmsHousekeepingStatus;
  priority: number;
  assigned_to: string | null;
  assigned_to_label: string | null;
  estimated_minutes: number;
  actual_minutes: number | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  inspected_at: string | null;
  inspected_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PmsNightAudit {
  id: string;
  property_id: string;
  audit_date: string;
  total_rooms: number;
  occupied_rooms: number;
  arrivals_count: number;
  departures_count: number;
  stayovers_count: number;
  no_shows_count: number;
  room_revenue: number;
  fb_revenue: number;
  other_revenue: number;
  total_revenue: number;
  taxe_sejour_collected: number;
  occupancy_pct: number;
  adr: number;
  revpar: number;
  notes: string | null;
  closed: boolean;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PmsAvailabilityRow {
  day: string;
  room_type_id: string;
  room_type_code: string;
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
}
