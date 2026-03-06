export interface Station {
  name: string;
  format: string;
  region: string;
  /** Whether this station has traffic/delivery config set up */
  configured: boolean;
  /** Traffic delivery email (only if configured) */
  trafficEmail?: string;
}

export const STATIONS: Station[] = [
  {
    name: "Greatest Hits Radio",
    format: "Classic hits",
    region: "National",
    configured: true,
    trafficEmail: "traffic@greatesthitsradio.bauer.co.uk",
  },
  {
    name: "Hits Radio",
    format: "Contemporary hits",
    region: "National",
    configured: true,
    trafficEmail: "traffic@hitsradio.bauer.co.uk",
  },
  {
    name: "Absolute Radio",
    format: "Rock/alternative",
    region: "National",
    configured: true,
    trafficEmail: "traffic@absoluteradio.bauer.co.uk",
  },
  {
    name: "KISS FM",
    format: "Dance/urban",
    region: "National",
    configured: true,
    trafficEmail: "traffic@kissfm.bauer.co.uk",
  },
  {
    name: "Magic Radio",
    format: "Easy listening/pop",
    region: "National",
    configured: true,
    trafficEmail: "traffic@magicradio.bauer.co.uk",
  },
  {
    name: "Planet Rock",
    format: "Classic/hard rock",
    region: "National",
    configured: false,
  },
  {
    name: "Jazz FM",
    format: "Jazz/soul",
    region: "National",
    configured: false,
  },
  {
    name: "KISSTORY",
    format: "Old school dance",
    region: "National",
    configured: true,
    trafficEmail: "traffic@kisstory.bauer.co.uk",
  },
  {
    name: "Scala Radio",
    format: "Classical",
    region: "National",
    configured: false,
  },
  {
    name: "Kerrang! Radio",
    format: "Rock/metal",
    region: "West Midlands",
    configured: false,
  },
  // Regional stations referenced by REGIONS
  {
    name: "Kiss FM",
    format: "Dance/urban",
    region: "London & South East",
    configured: true,
    trafficEmail: "traffic@kissfm-london.bauer.co.uk",
  },
  {
    name: "Absolute",
    format: "Rock/alternative",
    region: "London & South East",
    configured: true,
    trafficEmail: "traffic@absolute-london.bauer.co.uk",
  },
  {
    name: "Magic",
    format: "Easy listening",
    region: "London & South East",
    configured: true,
    trafficEmail: "traffic@magic-london.bauer.co.uk",
  },
  {
    name: "Rock FM",
    format: "Rock/classic hits",
    region: "North West",
    configured: true,
    trafficEmail: "traffic@rockfm.bauer.co.uk",
  },
  {
    name: "Clyde 1",
    format: "Contemporary hits",
    region: "Scotland",
    configured: true,
    trafficEmail: "traffic@clyde1.bauer.co.uk",
  },
  {
    name: "Forth 1",
    format: "Contemporary hits",
    region: "Scotland",
    configured: false,
  },
  {
    name: "Free Radio",
    format: "Contemporary hits",
    region: "Midlands",
    configured: false,
  },
  {
    name: "Gem",
    format: "Classic hits",
    region: "Midlands",
    configured: true,
    trafficEmail: "traffic@gem.bauer.co.uk",
  },
  {
    name: "Cool FM",
    format: "Contemporary hits",
    region: "Northern Ireland",
    configured: false,
  },
];
