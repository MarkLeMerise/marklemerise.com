// Maps a match venue to "City, State/Province, Country".
//
// football-data.org's `venue` field is only a stadium name, and FIFA uses
// generic tournament names during the World Cup (e.g. "Dallas Stadium",
// "New York New Jersey Stadium"). We match on distinctive keywords so either
// the real stadium name or the FIFA name resolves to the same location.
// If nothing matches we return the raw venue string rather than nothing.

const VENUES = [
  { keywords: ['mercedes-benz', 'atlanta'], location: 'Atlanta, Georgia, USA' },
  { keywords: ['gillette', 'foxboro', 'boston'], location: 'Foxborough, Massachusetts, USA' },
  { keywords: ['at&t', 'arlington', 'dallas'], location: 'Arlington, Texas, USA' },
  { keywords: ['nrg', 'houston'], location: 'Houston, Texas, USA' },
  { keywords: ['arrowhead', 'kansas city'], location: 'Kansas City, Missouri, USA' },
  { keywords: ['sofi', 'inglewood', 'los angeles'], location: 'Inglewood, California, USA' },
  { keywords: ['hard rock', 'miami'], location: 'Miami Gardens, Florida, USA' },
  { keywords: ['metlife', 'east rutherford', 'new york', 'new jersey'], location: 'East Rutherford, New Jersey, USA' },
  { keywords: ['lincoln financial', 'philadelphia'], location: 'Philadelphia, Pennsylvania, USA' },
  { keywords: ['levi', 'santa clara', 'san francisco', 'bay area'], location: 'Santa Clara, California, USA' },
  { keywords: ['lumen', 'seattle'], location: 'Seattle, Washington, USA' },
  { keywords: ['bmo', 'toronto'], location: 'Toronto, Ontario, Canada' },
  { keywords: ['bc place', 'vancouver'], location: 'Vancouver, British Columbia, Canada' },
  { keywords: ['akron', 'guadalajara', 'zapopan'], location: 'Guadalajara, Jalisco, Mexico' },
  // "mexico city" is checked before the bare-keyword Monterrey/Guadalajara rules above won't catch it.
  { keywords: ['azteca', 'banorte', 'mexico city'], location: 'Mexico City, CDMX, Mexico' },
  { keywords: ['bbva', 'monterrey', 'guadalupe'], location: 'Monterrey, Nuevo León, Mexico' },
];

export function venueLocation(venue) {
  if (!venue) return '';
  const v = venue.toLowerCase();
  for (const { keywords, location } of VENUES) {
    if (keywords.some((k) => v.includes(k))) return location;
  }
  return venue; // unknown venue — better to show the raw name than nothing
}
