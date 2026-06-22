// Maps football-data.org `stage` values to human-readable knockout labels.
// GROUP_STAGE is handled by the caller (it uses the group letter instead).
//
// The 48-team 2026 format adds a Round of 32 (LAST_32). Exact stage strings
// for 2026 should be confirmed against a live API response; unknown values
// fall back to a title-cased version of the raw stage.

const STAGE_LABELS = {
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-final',
  SEMI_FINALS: 'Semi-final',
  THIRD_PLACE: 'Third-place play-off',
  FINAL: 'Final',
};

function titleCase(stage) {
  return stage
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function stageLabel(stage) {
  return STAGE_LABELS[stage] || titleCase(stage);
}

// "GROUP_A" -> "Group A"
export function groupLabel(group) {
  if (!group) return 'Group';
  return group.replace(/^GROUP_/, 'Group ');
}
