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
    name: 'English Essay',
    title: 'Submit English essay',
    subject: 'English',
    size: 'big',
    time: 'About 45+ min',
    color: 'blue',
    dueIn: 1, // days from today
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
    name: 'Mathematics Activity',
    title: 'Complete Activity 3',
    subject: 'Math',
    size: 'quick',
    time: 'About 10 min',
    color: 'green',
    dueIn: 0,
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
    name: 'Science Assignment',
    title: 'Read Chapter 4',
    subject: 'Science',
    size: 'medium',
    time: 'About 25 min',
    color: 'amber',
    dueIn: 3,
    steps: [
      {
        title: 'Read the chapter section',
        video: { title: 'Chapter 4 intro', length: '2:10' },
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

TASKS.push(
  {
    id: 'history',
    name: 'History Project',
    title: 'Research and write the summary',
    subject: 'History',
    size: 'medium',
    time: 'About 35 min',
    color: 'purple',
    dueIn: -1,
    steps: [
      { title: 'Research your topic', items: ['Pick 2 sources', 'Note 3 key facts'] },
      { title: 'Write the summary', items: ['Write the opening sentence', 'Explain the key facts', 'Check your spelling'] },
    ],
  },
  {
    id: 'filipino',
    name: 'Filipino Assignment',
    title: 'Write the reflection paper',
    subject: 'Filipino',
    size: 'quick',
    time: 'About 20 min',
    color: 'cyan',
    dueIn: 2,
    steps: [
      { title: 'Plan your reflection', items: ['Reread the story', 'Write down 2 things you felt'] },
      { title: 'Write your reflection', items: ['Write the first paragraph', 'Write the second paragraph'] },
    ],
  },
)

export const BADGES = [
  { id: 'first-riff', icon: 'note', name: 'First Riff', how: 'Finish your first task' },
  { id: 'comeback', icon: 'comeback', name: 'Comeback', how: 'Return to a task after a break and finish it' },
  { id: 'encore', icon: 'sparkle', name: 'Encore', how: 'Finish 2 tasks' },
  { id: 'full-setlist', icon: 'trophy', name: 'Full Setlist', how: 'Finish all 5 tasks' },
]

// Due-Date Guidance: calm labels, relative to today ("Due today", "Due tomorrow", or the weekday).
export function dueLabel(dueIn) {
  if (dueIn === -1) return 'Was due yesterday'
  if (dueIn < -1) {
    const day = new Date()
    day.setDate(day.getDate() + dueIn)
    return `Was due ${day.toLocaleDateString('en-US', { weekday: 'long' })}`
  }
  if (dueIn === 0) return 'Due today'
  if (dueIn === 1) return 'Due tomorrow'
  const day = new Date()
  day.setDate(day.getDate() + dueIn)
  return `Due ${day.toLocaleDateString('en-US', { weekday: 'long' })}`
}

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
    working: guitar ? 'Now playing:' : "You're working on:",
  }
}
