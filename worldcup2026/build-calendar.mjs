#!/usr/bin/env node
// Builds worldcup2026/calendar.ics — a subscribable iCal feed of all
// FIFA World Cup 2026 matches, rendered in US Eastern time, from the
// football-data.org API. Run hourly by .github/workflows/update-worldcup.yml.
//
// Zero dependencies: Node 20+ with native fetch, ESM, hand-rolled RFC 5545
// writer. Set FOOTBALL_DATA_TOKEN in the environment.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flagFor } from './lib/flags.js';
import { groupLabel, stageLabel } from './lib/stages.js';
import { venueLocation } from './lib/venues.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ICS_PATH = join(HERE, 'calendar.ics');
const SEQ_PATH = join(HERE, 'data', 'sequences.json');

const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const DOMAIN = 'marklemerise.com';
const TZID = 'America/New_York';
const MATCH_DURATION_MIN = 120;

// --- fetch ----------------------------------------------------------------

async function fetchMatches() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    throw new Error('FOOTBALL_DATA_TOKEN is not set');
  }
  const res = await fetch(API_URL, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org returned ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data.matches)) {
    throw new Error('Unexpected API response: missing matches array');
  }
  return data.matches;
}

// --- time helpers ---------------------------------------------------------

// Wall-clock time in America/New_York as "YYYYMMDDTHHMMSS" (floating local,
// paired with TZID=America/New_York). DST is handled by Intl.
function easternStamp(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZID,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const p = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  const hour = p.hour === '24' ? '00' : p.hour; // some engines emit "24"
  return `${p.year}${p.month}${p.day}T${hour}${p.minute}${p.second}`;
}

// UTC "YYYYMMDDTHHMMSSZ" for DTSTAMP / LAST-MODIFIED.
function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// --- ICS text helpers -----------------------------------------------------

function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Fold to <=75 octets per RFC 5545. Continuation lines start with a space,
// which counts toward the 75. Splits between code points; unfolding rejoins
// the exact bytes, so splitting a multi-code-point emoji is lossless.
function foldLine(line) {
  const segments = [];
  let cur = '';
  let curBytes = 0;
  for (const ch of line) {
    const chBytes = Buffer.byteLength(ch, 'utf8');
    const limit = segments.length === 0 ? 75 : 74; // 74 + leading space = 75
    if (curBytes + chBytes > limit) {
      segments.push(cur);
      cur = ch;
      curBytes = chBytes;
    } else {
      cur += ch;
      curBytes += chBytes;
    }
  }
  segments.push(cur);
  return segments.join('\r\n ');
}

// --- match rendering ------------------------------------------------------

function buildSummary(match) {
  const home = match.homeTeam?.name || 'TBD';
  const away = match.awayTeam?.name || 'TBD';
  const prefix =
    match.stage === 'GROUP_STAGE' ? groupLabel(match.group) : stageLabel(match.stage);

  let summary = `${prefix}: ${home} ${flagFor(match.homeTeam?.name)} vs. ${away} ${flagFor(
    match.awayTeam?.name,
  )}`;

  const ft = match.score?.fullTime;
  if (match.status === 'FINISHED' && ft && ft.home != null && ft.away != null) {
    let score = `${ft.home}-${ft.away}`;
    const pens = match.score?.penalties;
    if (pens && pens.home != null && pens.away != null) {
      score += `, ${pens.home}-${pens.away} pens`;
    }
    summary += ` (${score})`;
  }
  return summary;
}

function buildEvent(match, sequences, dtstamp) {
  const start = new Date(match.utcDate);
  const end = new Date(start.getTime() + MATCH_DURATION_MIN * 60000);
  const dtStart = easternStamp(start);
  const dtEnd = easternStamp(end);

  const summary = buildSummary(match);
  const location = venueLocation(match.venue);
  const uid = `wc2026-match-${match.id}@${DOMAIN}`;

  // Bump SEQUENCE only when visible content changes, so clients update the
  // existing event in place (UID match + higher SEQUENCE) without duplicating.
  const hash = createHash('sha1')
    .update(`${summary}|${location}|${dtStart}|${dtEnd}`)
    .digest('hex');
  const prev = sequences[uid];
  let seq = prev ? prev.seq : 0;
  if (prev && prev.hash !== hash) seq += 1;
  sequences[uid] = { seq, hash };

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SEQUENCE:${seq}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${TZID}:${dtStart}`,
    `DTEND;TZID=${TZID}:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
  ];
  if (location) lines.push(`LOCATION:${escapeText(location)}`);
  if (match.lastUpdated) {
    lines.push(`LAST-MODIFIED:${utcStamp(new Date(match.lastUpdated))}`);
  }
  lines.push('END:VEVENT');
  return lines;
}

// Full VTIMEZONE so clients that don't know America/New_York render correctly.
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'X-LIC-LOCATION:America/New_York',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

function buildCalendar(matches, sequences) {
  const dtstamp = utcStamp(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${DOMAIN}//World Cup 2026//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:World Cup 2026',
    `X-WR-TIMEZONE:${TZID}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...VTIMEZONE,
  ];

  const sorted = [...matches].sort(
    (a, b) => new Date(a.utcDate) - new Date(b.utcDate),
  );
  for (const match of sorted) {
    lines.push(...buildEvent(match, sequences, dtstamp));
  }
  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

// --- main -----------------------------------------------------------------

async function main() {
  const matches = await fetchMatches();

  let sequences = {};
  try {
    sequences = JSON.parse(readFileSync(SEQ_PATH, 'utf8'));
  } catch {
    // first run / missing file — start fresh
  }

  const ics = buildCalendar(matches, sequences);

  writeFileSync(ICS_PATH, ics);
  writeFileSync(SEQ_PATH, JSON.stringify(sequences, null, 2) + '\n');

  console.log(`Wrote ${matches.length} matches to ${ICS_PATH}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
