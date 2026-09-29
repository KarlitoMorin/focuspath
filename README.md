# FocusPath

A distraction-free, goal-anchored learning interface for students with ADHD.

Group 3 · BSCS3A · Human-Computer Interaction · Activity 2 / Midterm Project: Inclusive Interfaces

This is a clickable prototype designed for our persona, Lucas: a 15-year-old high school student with ADHD. He loses focus on cluttered interfaces and forgets what he set out to do.

## Features

| Feature | What it does | Need addressed |
|---|---|---|
| Focus Mode | One task per screen; menus and extra links stay hidden | Visual overload |
| Distraction Shield | No ads or autoplay; an Animations switch turns all motion off | Ads and motion |
| Simple Nav + "You are here" | Same header on every screen, with a location line under it | Getting lost |
| Goal Anchor | Pinned card: "You're working on: Submit English essay · Step 2 of 4" | Forgetting his goal |
| Step Chunking + Progress | Short checklist per step; Next unlocks when it's done | Sustaining focus |
| Focus Sprints | 10 / 15 / 25 min timer that suggests breaks | Sustaining focus |
| "Where was I?" Resume | Auto-save, then a Welcome back screen marking each step Done, Current, or Locked | Recovering his goal |
| Game-Style Rewards | +20 XP per step, size bonus, focus levels, badges | Sustaining focus |
| Task Size Tags | Quick / Medium / Big, with bonuses of +30 / +50 / +80 XP | Easier to start |
| Due-Date Guidance | Tasks sorted by due date; "Start here" on the soonest; calm "Due today" / "Due tomorrow" tags; no push notifications | Visual overload, ads and motion |
| Achievements | Finished tasks, XP, and a badge shelf | Motivation |
| Guitar themes | Acoustic (100 XP), Electric (200 XP), Headliner (300 XP) | Sustaining focus |

## Demo tips

In Focus settings (gear icon), the **Demo** buttons jump straight to a screen: Essay Step 2, Welcome back, Ready to submit, or +100 XP. **Reset prototype** starts over.

Progress is saved in your own browser, so each person who opens the link starts fresh.

## Run locally

```bash
npm install
npm run dev
```

Built with React and Vite. Task data is sample content; the learning-platform connection is simulated.
