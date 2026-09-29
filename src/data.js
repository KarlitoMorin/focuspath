// Demo content for the FocusPath prototype (Slide 13 of the content guide).
// In the real app these would come from the learning platform's API.

export const STEP_XP = 20

export const SIZES = {
  quick: { label: 'Quick', time: 'about 10 min', bonus: 30 },
  medium: { label: 'Medium', time: 'about 25 min', bonus: 50 },
  big: { label: 'Big', time: '45+ min', bonus: 80 },
}

export const TASKS = [
  {
    id: 'essay',
    title: 'Submit English essay',
    subject: 'English',
    size: 'big',
    steps: [
      {
        title: 'Read the essay prompt',
        items: ['Read the prompt once, start to finish', 'Highlight the main question', 'Write the question in your own words'],
      },
      {
        title: 'Write your introduction paragraph',
        items: ['Write a hook sentence', 'Give background in 1–2 sentences', 'State your thesis'],
      },
      {
        title: 'Write two body paragraphs',
        items: ['Body paragraph 1: point + evidence', 'Body paragraph 2: point + evidence', 'Link each one back to your thesis'],
      },
      {
        title: 'Write your conclusion and proofread',
        items: ['Restate your thesis', 'Sum up your main points', 'Read it aloud once to catch mistakes'],
      },
    ],
  },
  {
    id: 'math',
    title: 'Finish Math practice set',
    subject: 'Math',
    size: 'quick',
    steps: [
      {
        title: 'Solve problems 1–5',
        items: ['Problems 1–2', 'Problems 3–4', 'Problem 5'],
      },
      {
        title: 'Check your answers',
        items: ['Recheck each answer', 'Show your work for problem 5'],
      },
    ],
  },
  {
    id: 'science',
    title: 'Answer Science reading questions',
    subject: 'Science',
    size: 'medium',
    steps: [
      {
        title: 'Read the chapter section',
        items: ['Read the section headings first', 'Read the section', 'Note 3 key terms'],
      },
      {
        title: 'Answer questions 1–3',
        items: ['Question 1', 'Question 2', 'Question 3'],
      },
      {
        title: 'Answer questions 4–5',
        items: ['Question 4', 'Question 5', 'Check that every answer is a full sentence'],
      },
    ],
  },
]

export const BADGES = [
  { id: 'first-riff', name: 'First Riff', how: 'Finish your first task' },
  { id: 'comeback', name: 'Comeback', how: 'Return to a task after a break and finish it' },
  { id: 'encore', name: 'Encore', how: 'Finish 2 tasks' },
  { id: 'full-setlist', name: 'Full Setlist', how: 'Finish all 3 tasks' },
]

export const XP_PER_LEVEL = 100
export const SKILL_LEVELS = ['Beginner', 'Rhythm', 'Lead', 'Headliner']

export function levelInfo(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const into = xp % XP_PER_LEVEL
  return { level, into, toNext: XP_PER_LEVEL - into }
}

// Guitar themes are rewards: each one unlocks with XP (one per focus level).
export const THEMES = [
  { id: 'classic', name: 'Classic', xp: 0 },
  { id: 'acoustic', name: 'Acoustic', xp: 100 },
  { id: 'electric', name: 'Electric', xp: 200 },
  { id: 'headliner', name: 'Headliner', xp: 300 },
]

export const isUnlocked = (themeId, xp) => xp >= (THEMES.find((t) => t.id === themeId)?.xp ?? Infinity)

// Themes whose unlock point was passed when XP went from `before` to `after`.
export const themesUnlockedBetween = (before, after) => THEMES.filter((t) => t.xp > before && t.xp <= after)

// Wording for the Classic and Guitar themes (Slide 13 table).
export function labels(theme) {
  const guitar = theme !== 'classic'
  return {
    step: guitar ? 'Track' : 'Step',
    cleared: (n) => (guitar ? `Track ${n} nailed! +${STEP_XP} XP` : `Step ${n} cleared! +${STEP_XP} XP`),
    complete: guitar ? 'Set complete!' : 'Quest complete!',
    level: (lvl) =>
      guitar ? `Skill level: ${SKILL_LEVELS[Math.min(lvl, SKILL_LEVELS.length) - 1]}` : `Focus level ${lvl}`,
    finished: guitar ? 'Finished sets' : 'Finished tasks',
    trophy: guitar ? '🎸' : '🏆',
  }
}

// The regular learning-portal clutter that Focus Mode hides (menus, feed, sidebar).
export const PORTAL = {
  menu: ['Home', 'Tasks', 'Achievements', 'Classes', 'Calendar', 'Grades', 'Messages', 'Files'],
  feed: [
    { from: 'English', text: 'Essay rubric uploaded. Check it before you start.', when: '2h' },
    { from: 'Math', text: 'Practice set answers will be posted on Friday.', when: '5h' },
    { from: 'School', text: 'Club sign-ups are open this week.', when: '1d' },
    { from: 'Science', text: 'New reading added to Chapter 4.', when: '1d' },
    { from: 'School', text: 'Photo day is next Tuesday.', when: '2d' },
  ],
  upcoming: [
    { title: 'Math practice set', due: 'Thu' },
    { title: 'English essay', due: 'Fri' },
    { title: 'Science reading questions', due: 'Mon' },
  ],
}
