export const guideSections = [
  {
    id: 1,
    title: 'Inbox → Capture',
    blurb: 'Dump raw sparks in seconds. Vault keeps them safe until you are ready to shape them.',
    bullets: [
      'Tap + Thoughts to save quick text, links, or voice notes.',
      'Templates nudge workflow ideas, pains, or link drops.',
      'Promote any thought straight into a structured idea.',
    ],
    action: { label: 'Open Inbox', route: 'Inbox' },
  },
  {
    id: 2,
    title: 'Home → Structure',
    blurb: 'Tell the story once. AI fills the rest so ideas have problem, solution, and MVP defined.',
    bullets: [
      'Use Autofill to generate problem/value loop from a title.',
      'Sort by status, score, or category to curate priorities.',
      'Shortlist contenders so your build queue is always ready.',
    ],
    action: { label: 'Go to Home', route: 'Home' },
  },
  {
    id: 3,
    title: 'AI Desk → Evaluate',
    blurb: 'Coach, editor, and sparring partner. Ask what to build next or how to unblock.',
    bullets: [
      'Send chats with context pulled from your top ideas.',
      'Trigger AI scoring to compare feasibility and impact.',
      'Request critiques on copy, assumptions, or launch plans.',
    ],
    action: { label: 'Launch AI Desk', route: 'AI' },
  },
  {
    id: 4,
    title: 'Progress → Focus',
    blurb: 'One build slot keeps you honest. Watch every stage and unstick paused projects.',
    bullets: [
      'Hero card highlights your active build with evaluation badges.',
      'Stage cards explain next actions for Shortlisted/Paused.',
      'Timeline surfaces score changes, notes, and lifecycle moves.',
    ],
    action: { label: 'Review Progress', route: 'Progress' },
  },
  {
    id: 5,
    title: 'Profile → Rituals',
    blurb: 'Control docs, subscriptions, and exports. Home base for account hygiene.',
    bullets: [
      'Update identity, theme, and notification settings.',
      'Upgrade plans or export data whenever you need.',
      'Docs hub links to Privacy, Terms, and this guide.',
    ],
    action: { label: 'Visit Profile', route: 'Profile' },
  },
];
