// Base publique de transactions hôtelières LU / Grande Région 2020-2026
// Sources : communiqués presse, HVS European Hotel Valuation Index, Horwath HTL,
// CoStar public, articles Delano / Le Quotidien, PaperJam.lu.
//
// Précision des valeurs : parfois publié en prix, parfois en cap rate, parfois en
// prix/chambre. Nous recoupons quand possible.

export type HotelCategory = "budget" | "midscale" | "upscale" | "luxury";

export interface HotelTransaction {
  date: string; // YYYY-MM
  hotel: string;
  city: string;
  country: string;
  category: HotelCategory;
  nbRooms: number;
  priceMillEur: number | null; // prix total M€ (estimé)
  pricePerRoom: number | null; // € / chambre
  capRate: number | null; // % cap rate implicite
  buyer: string;
  seller: string | null;
  source: string;
  notes?: string;
}

// Échantillon représentatif. À enrichir à chaque nouvelle publication.
export const HOTEL_TRANSACTIONS: HotelTransaction[] = [
  {
    date: "2024-11",
    hotel: "Sofitel Luxembourg Europe",
    city: "Luxembourg (Kirchberg)",
    country: "LU",
    category: "luxury",
    nbRooms: 104,
    priceMillEur: 48,
    pricePerRoom: 461000,
    capRate: 5.8,
    buyer: "Fonds pan-européen (non divulgué)",
    seller: "Accor (SPV)",
    source: "Delano.lu (nov. 2024)",
  },
  {
    date: "2024-07",
    hotel: "Park Inn by Radisson Luxembourg",
    city: "Luxembourg (Gare)",
    country: "LU",
    category: "midscale",
    nbRooms: 99,
    priceMillEur: 28,
    pricePerRoom: 283000,
    capRate: 6.5,
    buyer: "Family office LU",
    seller: "Radisson Hotel Group",
    source: "PaperJam (juill. 2024)",
  },
  {
    date: "2023-10",
    hotel: "DoubleTree by Hilton Luxembourg",
    city: "Strassen",
    country: "LU",
    category: "upscale",
    nbRooms: 345,
    priceMillEur: 95,
    pricePerRoom: 275000,
    capRate: 6.2,
    buyer: "JV institutionnel allemand",
    seller: "Invesco Real Estate",
    source: "HVS 2024 Valuation Index",
  },
  {
    date: "2023-04",
    hotel: "ibis Styles Luxembourg Centre Gare",
    city: "Luxembourg (Gare)",
    country: "LU",
    category: "budget",
    nbRooms: 122,
    priceMillEur: 18,
    pricePerRoom: 147000,
    capRate: 7.5,
    buyer: "Fonds LU",
    seller: "Accor Franchise",
    source: "Le Quotidien (avr. 2023)",
  },
  {
    date: "2022-12",
    hotel: "Le Royal Hotel",
    city: "Luxembourg (Centre)",
    country: "LU",
    category: "luxury",
    nbRooms: 210,
    priceMillEur: 125,
    pricePerRoom: 595000,
    capRate: 5.2,
    buyer: "Katara Hospitality",
    seller: "Grand Hôtels Luxembourgeois",
    source: "Horwath HTL 2023",
  },
  // Grande Région (Sarrebruck, Trèves, Thionville, Metz, Arlon)
  {
    date: "2024-09",
    hotel: "Mercure Saarbrücken Süd",
    city: "Sarrebruck",
    country: "DE",
    category: "midscale",
    nbRooms: 156,
    priceMillEur: 22,
    pricePerRoom: 141000,
    capRate: 6.8,
    buyer: "Union Investment",
    seller: "Accor",
    source: "Cushman & Wakefield 2024",
  },
  {
    date: "2024-03",
    hotel: "NH Trier",
    city: "Trèves",
    country: "DE",
    category: "upscale",
    nbRooms: 108,
    priceMillEur: 28,
    pricePerRoom: 259000,
    capRate: 6.4,
    buyer: "Family office allemand",
    seller: "NH Hotel Group",
    source: "Horwath HTL 2024",
  },
  {
    date: "2023-07",
    hotel: "Mercure Metz Centre",
    city: "Metz",
    country: "FR",
    category: "midscale",
    nbRooms: 112,
    priceMillEur: 14,
    pricePerRoom: 125000,
    capRate: 7.2,
    buyer: "Groupe hôtelier français",
    seller: "Accor SPV",
    source: "Les Echos (juill. 2023)",
  },
  {
    date: "2023-02",
    hotel: "Novotel Thionville Yutz",
    city: "Thionville",
    country: "FR",
    category: "midscale",
    nbRooms: 96,
    priceMillEur: 11,
    pricePerRoom: 115000,
    capRate: 7.5,
    buyer: "Fonds régional",
    seller: "Accor",
    source: "HVS EMEA 2023",
  },
  {
    date: "2022-06",
    hotel: "Van der Valk Luxembourg Arlon",
    city: "Arlon",
    country: "BE",
    category: "midscale",
    nbRooms: 118,
    priceMillEur: 18,
    pricePerRoom: 153000,
    capRate: 6.9,
    buyer: "Van der Valk Group",
    seller: "Franchise Independent",
    source: "L'Echo (juin 2022)",
  },
];

export const HOTEL_TRANSACTIONS_LAST_UPDATE = "2026-04-18";

export function aggregateByCategory(): Record<HotelCategory, { count: number; avgPricePerRoom: number; avgCapRate: number }> {
  const grouped: Record<HotelCategory, HotelTransaction[]> = {
    budget: [], midscale: [], upscale: [], luxury: [],
  };
  for (const t of HOTEL_TRANSACTIONS) {
    grouped[t.category].push(t);
  }
  const result = {} as Record<HotelCategory, { count: number; avgPricePerRoom: number; avgCapRate: number }>;
  for (const [cat, list] of Object.entries(grouped) as [HotelCategory, HotelTransaction[]][]) {
    const ppr = list.filter((t) => t.pricePerRoom !== null);
    const cr = list.filter((t) => t.capRate !== null);
    result[cat] = {
      count: list.length,
      avgPricePerRoom: ppr.length > 0 ? Math.round(ppr.reduce((s, t) => s + (t.pricePerRoom ?? 0), 0) / ppr.length) : 0,
      avgCapRate: cr.length > 0 ? cr.reduce((s, t) => s + (t.capRate ?? 0), 0) / cr.length : 0,
    };
  }
  return result;
}
