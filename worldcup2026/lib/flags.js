// Maps football-data.org team names to flag emoji.
//
// Most nations resolve via an ISO 3166-1 alpha-2 lookup converted to
// regional-indicator symbols. England / Scotland / Wales need subdivision
// "tag sequence" flags, which the regional-indicator scheme can't express.
// Unknown names or knockout placeholders (null teams) fall back to 🏁.

// football-data.org name -> ISO 3166-1 alpha-2 code.
// Includes naming quirks the API uses (e.g. "Korea Republic", "IR Iran",
// "Türkiye") plus common alternates, covering the realistic 2026 pool.
const NAME_TO_ISO2 = {
  // Hosts
  'United States': 'US', 'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  // CONMEBOL
  'Argentina': 'AR', 'Brazil': 'BR', 'Uruguay': 'UY', 'Colombia': 'CO',
  'Ecuador': 'EC', 'Paraguay': 'PY', 'Peru': 'PE', 'Chile': 'CL',
  'Bolivia': 'BO', 'Venezuela': 'VE',
  // UEFA
  'France': 'FR', 'Germany': 'DE', 'Spain': 'ES', 'Portugal': 'PT',
  'Italy': 'IT', 'Netherlands': 'NL', 'Belgium': 'BE', 'Croatia': 'HR',
  'Switzerland': 'CH', 'Austria': 'AT', 'Denmark': 'DK', 'Poland': 'PL',
  'Serbia': 'RS', 'Sweden': 'SE', 'Norway': 'NO', 'Ukraine': 'UA',
  'Czechia': 'CZ', 'Czech Republic': 'CZ', 'Hungary': 'HU', 'Romania': 'RO',
  'Greece': 'GR', 'Turkey': 'TR', 'Türkiye': 'TR', 'Russia': 'RU',
  'Slovakia': 'SK', 'Slovenia': 'SI', 'Republic of Ireland': 'IE',
  'Ireland': 'IE', 'Iceland': 'IS', 'Finland': 'FI', 'Albania': 'AL',
  'Bosnia and Herzegovina': 'BA', 'North Macedonia': 'MK', 'Georgia': 'GE',
  'Montenegro': 'ME', 'Kosovo': 'XK', 'Bulgaria': 'BG', 'Israel': 'IL',
  'Luxembourg': 'LU', 'Cyprus': 'CY', 'Armenia': 'AM', 'Azerbaijan': 'AZ',
  'Belarus': 'BY', 'Moldova': 'MD', 'Estonia': 'EE', 'Latvia': 'LV',
  'Lithuania': 'LT',
  // CONCACAF
  'Costa Rica': 'CR', 'Jamaica': 'JM', 'Panama': 'PA', 'Honduras': 'HN',
  'El Salvador': 'SV', 'Guatemala': 'GT', 'Trinidad and Tobago': 'TT',
  'Haiti': 'HT', 'Curaçao': 'CW', 'Suriname': 'SR', 'Nicaragua': 'NI',
  // CAF
  'Morocco': 'MA', 'Senegal': 'SN', 'Tunisia': 'TN', 'Algeria': 'DZ',
  'Egypt': 'EG', 'Nigeria': 'NG', 'Cameroon': 'CM', 'Ghana': 'GH',
  'Ivory Coast': 'CI', "Côte d'Ivoire": 'CI', 'Mali': 'ML',
  'Burkina Faso': 'BF', 'South Africa': 'ZA', 'DR Congo': 'CD',
  'Congo': 'CG', 'Cabo Verde': 'CV', 'Cape Verde': 'CV', 'Guinea': 'GN',
  'Gabon': 'GA', 'Zambia': 'ZM', 'Angola': 'AO', 'Equatorial Guinea': 'GQ',
  'Benin': 'BJ', 'Uganda': 'UG', 'Kenya': 'KE', 'Mauritania': 'MR',
  'Mozambique': 'MZ', 'Madagascar': 'MG', 'Namibia': 'NA', 'Tanzania': 'TZ',
  'Togo': 'TG', 'Sudan': 'SD', 'Libya': 'LY', 'Zimbabwe': 'ZW',
  // AFC
  'Japan': 'JP', 'Korea Republic': 'KR', 'South Korea': 'KR',
  'Korea DPR': 'KP', 'North Korea': 'KP', 'IR Iran': 'IR', 'Iran': 'IR',
  'Saudi Arabia': 'SA', 'Australia': 'AU', 'Qatar': 'QA', 'Iraq': 'IQ',
  'United Arab Emirates': 'AE', 'Uzbekistan': 'UZ', 'Jordan': 'JO',
  'Oman': 'OM', 'China PR': 'CN', 'China': 'CN', 'Bahrain': 'BH',
  'Syria': 'SY', 'Lebanon': 'LB', 'Kuwait': 'KW', 'Palestine': 'PS',
  'India': 'IN', 'Thailand': 'TH', 'Vietnam': 'VN', 'Indonesia': 'ID',
  'Malaysia': 'MY', 'Tajikistan': 'TJ', 'Kyrgyzstan': 'KG',
  'Turkmenistan': 'TM', 'Kazakhstan': 'KZ',
  // OFC
  'New Zealand': 'NZ', 'Fiji': 'FJ', 'New Caledonia': 'NC',
  'Solomon Islands': 'SB', 'Tahiti': 'PF', 'Papua New Guinea': 'PG',
};

// Home Nations need GB subdivision tag-sequence flags.
const SUBDIVISIONS = {
  England: 'gbeng',
  Scotland: 'gbsct',
  Wales: 'gbwls',
};

function isoToFlag(cc) {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function subdivisionFlag(code) {
  const tags = [...code]
    .map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0)))
    .join('');
  return '\u{1F3F4}' + tags + '\u{E007F}';
}

const DEFAULT_FLAG = '\u{1F3C1}'; // 🏁

export function flagFor(name) {
  if (!name) return DEFAULT_FLAG;
  if (SUBDIVISIONS[name]) return subdivisionFlag(SUBDIVISIONS[name]);
  const iso = NAME_TO_ISO2[name];
  return iso ? isoToFlag(iso) : DEFAULT_FLAG;
}
