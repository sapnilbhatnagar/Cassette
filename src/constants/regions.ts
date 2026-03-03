export interface Region {
  id: string;
  name: string;
  /** Keep legacy alias so API route references still work. */
  regionName: string;
  subtitle: string;
  reach: string;
  reachNumber: number;
  stationBrands: string[];
  localReferences: string[];
  mapPosition: { x: number; y: number };
}

export const REGIONS: Region[] = [
  {
    id: "london-se",
    name: "London & South East",
    regionName: "London & South East",
    subtitle: "Primary Market",
    reach: "12.4M",
    reachNumber: 12400000,
    stationBrands: ["Kiss FM", "Absolute", "Magic"],
    localReferences: ["Oxford Street", "the West End", "South Bank"],
    mapPosition: { x: 75, y: 78 },
  },
  {
    id: "north-west",
    name: "North West",
    regionName: "North West",
    subtitle: "Manchester & Liverpool",
    reach: "6.8M",
    reachNumber: 6800000,
    stationBrands: ["Hits Radio", "Rock FM"],
    localReferences: ["Deansgate", "the Northern Quarter", "Albert Dock"],
    mapPosition: { x: 55, y: 45 },
  },
  {
    id: "scotland",
    name: "Scotland",
    regionName: "Scotland",
    subtitle: "Glasgow & Edinburgh",
    reach: "4.2M",
    reachNumber: 4200000,
    stationBrands: ["Clyde 1", "Forth 1"],
    localReferences: ["Buchanan Street", "the Royal Mile", "Princes Street"],
    mapPosition: { x: 45, y: 20 },
  },
  {
    id: "midlands",
    name: "Midlands",
    regionName: "Midlands",
    subtitle: "Birmingham & Surrounds",
    reach: "5.1M",
    reachNumber: 5100000,
    stationBrands: ["Free Radio", "Gem"],
    localReferences: ["the Bullring", "Broad Street", "Victoria Square"],
    mapPosition: { x: 60, y: 58 },
  },
  {
    id: "northern-ireland",
    name: "Northern Ireland",
    regionName: "Northern Ireland",
    subtitle: "Belfast & Regional",
    reach: "1.5M",
    reachNumber: 1500000,
    stationBrands: ["Cool FM"],
    localReferences: ["Belfast city centre", "the Cathedral Quarter"],
    mapPosition: { x: 25, y: 35 },
  },
];
