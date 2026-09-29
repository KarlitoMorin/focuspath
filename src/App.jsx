import { useEffect, useState } from 'react'
import { BADGES, PORTAL, SIZES, dueLabel, STEP_XP, TASKS, THEMES, XP_PER_LEVEL, isUnlocked, labels, levelInfo, themesUnlockedBetween } from './data.js'
import './App.css'

const STORAGE_KEY = 'focuspath-prototype-v1'

const DEFAULT_STATE = {
  progress: {},
  xp: 0,
  badges: [],
  lastTaskId: null,
  // Animations can be turned off in Focus settings (WCAG 2.3.3).
  settings: { focusMode: true, rewards: true, theme: 'classic', sprintMin: 15, motion: true },
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const state = { ...DEFAULT_STATE, ...saved, settings: { ...DEFAULT_STATE.settings, ...saved.settings } }
      if (!isUnlocked(state.settings.theme, state.xp)) state.settings.theme = 'classic'
      return state
    }
  } catch {
    // Storage unavailable: start fresh.
  }
  return DEFAULT_STATE
}

function blankProgress() {
  return { step: 0, checks: {}, started: false, paused: false, resumed: false, done: false }
}

function isInProgress(p) {
  return p && !p.done && (p.started || p.step > 0)
}

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ---------- Icons ---------- */

const Icon = {
  target: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="3" /></svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z" fill="currentColor" stroke="none" /></svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  ),
}

/* ---------- Small pieces ---------- */

function SizeTag({ size }) {
  const s = SIZES[size]
  return (
    <span className={`size-tag size-${size}`}>
      {s.label} · {s.time}
    </span>
  )
}

function ProgressBar({ total, done, theme }) {
  if (theme !== 'classic') {
    return (
      <div className="neck-wrap">
        <div className="neck-label">
          <span>Guitar neck</span>
          <span>
            {done}/{total} frets
          </span>
        </div>
        <div className="neck" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Tracks cleared">
          <span className="nut" />
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < done ? 'fret lit' : 'fret'}>
              {i < done && <span className="fret-dot" />}
            </span>
          ))}
        </div>
      </div>
    )
  }
  const pct = Math.round((done / total) * 100)
  return (
    <div className="progress">
      <div className="progress-label">
        <span>Progress</span>
        <span>
          {done}/{total}
        </span>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Steps completed">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function LevelBar({ xp, theme }) {
  const L = labels(theme)
  const { level, into, toNext } = levelInfo(xp)
  return (
    <div className="level">
      <div className="level-row">
        <strong>{L.level(level)}</strong>
        <span className="muted">{toNext} XP to next level</span>
      </div>
      <div className="bar level-bar" role="progressbar" aria-valuemin={0} aria-valuemax={XP_PER_LEVEL} aria-valuenow={into}>
        <span style={{ width: `${into}%` }} />
      </div>
    </div>
  )
}

function Badge({ badge, earned }) {
  return (
    <div className={earned ? 'badge earned' : 'badge locked'}>
      <span className="badge-icon">{earned ? Icon.star : Icon.lock}</span>
      <div>
        <strong>{badge.name}</strong>
        <small>{earned ? 'Earned' : badge.how}</small>
      </div>
    </div>
  )
}

function ThemePicker({ xp, current, onPick }) {
  return (
    <div className="themes" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => {
        const open = xp >= t.xp
        const on = current === t.id
        return (
          <button
            key={t.id}
            role="radio"
            aria-checked={on}
            disabled={!open}
            className={on ? 'theme-card on' : 'theme-card'}
            onClick={() => onPick(t.id)}
          >
            <span className={`swatch swatch-${t.id}`} aria-hidden="true" />
            <strong>{t.name}</strong>
            <small>
              {on ? 'In use' : open ? 'Unlocked' : (
                <>
                  {Icon.lock} {t.xp} XP
                </>
              )}
            </small>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- App ---------- */

export default function App() {
  const [state, setState] = useState(loadState)
  const initialResume = state.lastTaskId && isInProgress(state.progress[state.lastTaskId])
  const [screen, setScreen] = useState(initialResume ? 'resume' : 'tasks')
  const [taskId, setTaskId] = useState(initialResume ? state.lastTaskId : null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [cleared, setCleared] = useState(null)
  const [savedAt, setSavedAt] = useState(false)
  const [newBadges, setNewBadges] = useState([])
  const [lastEarned, setLastEarned] = useState(null)
  const [newThemes, setNewThemes] = useState([])
  const [sprint, setSprint] = useState({ remaining: state.settings.sprintMin * 60, running: false, over: false })

  const { settings } = state
  const L = labels(settings.theme)
  const task = TASKS.find((t) => t.id === taskId)
  const prog = (task && state.progress[task.id]) || blankProgress()

  // Auto-save every change (this is the "checkpoint" behind the Resume feature).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore: prototype still works without storage.
    }
  }, [state])

  // Focus Sprint countdown.
  useEffect(() => {
    if (!sprint.running) return
    const id = setInterval(() => {
      setSprint((s) => {
        if (s.remaining <= 1) return { ...s, remaining: 0, running: false, over: true }
        return { ...s, remaining: s.remaining - 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [sprint.running])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest('.menu-wrap')) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e) => e.key === 'Escape' && setSettingsOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  const update = (fn) => {
    setState((s) => fn(structuredClone(s)))
    setSavedAt(true)
  }
  const setSetting = (key, value) =>
    update((s) => {
      s.settings[key] = value
      return s
    })

  const setFocus = (on) => {
    setSetting('focusMode', on)
    setToast(on ? 'Focus Mode on: menus, feed and sidebar hidden.' : 'Focus Mode off: full portal view.')
  }

  const resetSprint = (min = settings.sprintMin, running = true) =>
    setSprint({ remaining: min * 60, running, over: false })

  const go = (next) => {
    setMenuOpen(false)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  /* ----- Flow actions ----- */

  const openTask = (id) => {
    setTaskId(id)
    setCleared(null)
    const p = state.progress[id]
    if (isInProgress(p)) {
      go('resume')
      return
    }
    update((s) => {
      s.progress[id] = { ...(s.progress[id] || blankProgress()), started: true }
      s.lastTaskId = id
      return s
    })
    resetSprint()
    go('step')
  }

  const toggleCheck = (i) =>
    update((s) => {
      const p = s.progress[task.id]
      const list = p.checks[p.step] || task.steps[p.step].items.map(() => false)
      list[i] = !list[i]
      p.checks[p.step] = list
      return s
    })

  const nextStep = () => {
    const n = prog.step + 1
    update((s) => {
      const p = s.progress[task.id]
      // XP for a step is earned once, even if he goes back and redoes it.
      if (n > (p.best || 0)) {
        s.xp += STEP_XP
        p.best = n
      }
      if (n < task.steps.length) p.step = n
      else p.reviewing = true
      return s
    })
    setCleared(n)
    if (n > (prog.best || 0)) {
      const unlocked = themesUnlockedBetween(state.xp, state.xp + STEP_XP)
      if (unlocked.length && settings.rewards) setToast(`🎸 ${unlocked[0].name} theme unlocked!`)
    }
    if (n >= task.steps.length) go('review')
    else window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setCleared(null)
    update((s) => {
      const p = s.progress[task.id]
      p.step -= 1
      return s
    })
  }

  const pauseAndSave = () => {
    update((s) => {
      s.progress[task.id].paused = true
      s.lastTaskId = task.id
      return s
    })
    setSprint((sp) => ({ ...sp, running: false }))
    setToast(`Progress saved. You stopped at ${L.step} ${prog.step + 1} of ${task.steps.length}.`)
    setCleared(null)
    go('tasks')
  }

  const continueTask = () => {
    update((s) => {
      const p = s.progress[task.id]
      if (p.paused) p.resumed = true
      p.paused = false
      s.lastTaskId = task.id
      return s
    })
    resetSprint()
    go(prog.reviewing ? 'review' : 'step')
  }

  const backFromReview = () => {
    update((s) => {
      const p = s.progress[task.id]
      p.reviewing = false
      return s
    })
    setCleared(null)
    go('step')
  }

  const submit = () => {
    const bonus = SIZES[task.size].bonus
    const earned = task.steps.length * STEP_XP + bonus
    const doneCount = TASKS.filter((t) => state.progress[t.id]?.done).length + 1
    const unlocked = []
    const has = (id) => state.badges.includes(id)
    if (!has('first-riff')) unlocked.push('first-riff')
    if (prog.resumed && !has('comeback')) unlocked.push('comeback')
    if (doneCount >= 2 && !has('encore')) unlocked.push('encore')
    if (doneCount >= 3 && !has('full-setlist')) unlocked.push('full-setlist')

    update((s) => {
      const p = s.progress[task.id]
      p.done = true
      p.reviewing = false
      p.doneAt = new Date().toISOString()
      p.xpEarned = earned
      s.xp += bonus
      s.badges = [...s.badges, ...unlocked]
      s.lastTaskId = null
      return s
    })
    setSprint((sp) => ({ ...sp, running: false }))
    setNewBadges(unlocked)
    setNewThemes(themesUnlockedBetween(state.xp, state.xp + bonus))
    setLastEarned({ steps: task.steps.length, bonus, earned, size: task.size })
    setCleared(null)
    go('complete')
  }

  const resetAll = () => {
    setState(structuredClone(DEFAULT_STATE))
    setSettingsOpen(false)
    setTaskId(null)
    setSprint({ remaining: DEFAULT_STATE.settings.sprintMin * 60, running: false, over: false })
    setToast('Prototype reset.')
    go('tasks')
  }

  // Demo shortcuts (Focus settings): jump straight to a state for the presentation.
  const loadDemo = (kind) => {
    const essay = TASKS[0]
    const done = (i) => essay.steps[i].items.map(() => true)
    const next = structuredClone(kind === 'xp' ? state : DEFAULT_STATE)
    next.settings = { ...state.settings }
    let target = 'step'
    if (kind === 'xp') {
      const unlocked = themesUnlockedBetween(state.xp, state.xp + 100)
      next.xp += 100
      setState(next)
      setSettingsOpen(false)
      setToast(unlocked.length ? `+100 XP. 🎸 ${unlocked[0].name} theme unlocked!` : '+100 XP added.')
      return
    }
    if (kind === 'step2' || kind === 'resume') {
      next.progress.essay = { ...blankProgress(), started: true, step: 1, best: 1, paused: kind === 'resume', checks: { 0: done(0), 1: [true, false, false] } }
      next.xp = STEP_XP
      if (kind === 'resume') target = 'resume'
    }
    if (kind === 'submit') {
      next.progress.essay = { ...blankProgress(), started: true, step: 3, best: 4, reviewing: true, checks: Object.fromEntries(essay.steps.map((_, i) => [i, done(i)])) }
      next.xp = STEP_XP * 4
      target = 'review'
    }
    next.lastTaskId = essay.id
    setState(next)
    setSavedAt(true)
    setTaskId(essay.id)
    setCleared(null)
    setSettingsOpen(false)
    resetSprint(settings.sprintMin, target === 'step')
    go(target)
  }

  /* ----- Screens ----- */

  const doneTasks = TASKS.filter((t) => state.progress[t.id]?.done)
  const openTasks = TASKS.filter((t) => !state.progress[t.id]?.done).sort((a, b) => a.dueIn - b.dueIn)
  const inTask = task && ['step', 'resume', 'review', 'sprint'].includes(screen)

  const here = {
    tasks: ['Tasks'],
    achievements: ['Tasks', 'Achievements'],
    step: ['Tasks', task?.title, `${L.step} ${prog.step + 1}`],
    sprint: ['Tasks', task?.title, 'Focus Sprint'],
    resume: ['Tasks', task?.title, 'Welcome back'],
    review: ['Tasks', task?.title, 'Final check'],
    complete: ['Tasks', task?.title, 'Done'],
  }[screen]

  function TaskList() {
    return (
      <section className="page">
        <div className="list-head">
          <h1>Your tasks</h1>
        </div>
        {settings.rewards && (
          <span className="chip">
            <span className="chip-star">{Icon.star}</span> {state.xp} XP
          </span>
        )}

        {openTasks.length === 0 ? (
          <div className="card empty">
            <h2>All tasks finished</h2>
            <p className="muted">Nothing left for now. Nice work.</p>
            <button className="btn primary" onClick={() => go('achievements')}>
              See your Achievements
            </button>
          </div>
        ) : (
          <ul className="tasks">
            {openTasks.map((t, i) => {
              const p = state.progress[t.id]
              const going = isInProgress(p)
              return (
                <li key={t.id} className={i === 0 ? 'card task suggested' : 'card task'}>
                  <div className="task-main">
                    <div className="task-top">
                      <span className="subject">{t.subject}</span>
                      {i === 0 && <span className="start-here">Start here</span>}
                    </div>
                    <h2>{t.title}</h2>
                    <div className="task-meta">
                      <span className="due-tag">
                        {Icon.clock} {dueLabel(t.dueIn)}
                      </span>
                      <SizeTag size={t.size} />
                    </div>
                    {going && (
                      <p className="saved-note">
                        {Icon.save} Saved at {L.step} {Math.min(p.step + 1, t.steps.length)} of {t.steps.length}
                      </p>
                    )}
                  </div>
                  <button className="btn primary" onClick={() => openTask(t.id)}>
                    {going ? 'Continue' : 'Start'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    )
  }

  function GoalAnchor() {
    return (
      <div className="goal-anchor" role="region" aria-label="Goal Anchor">
        <span className="goal-icon">{Icon.target}</span>
        <div className="goal-text">
          <span className="goal-kicker">You're working on:</span>
          <strong>{task.title}</strong>
          <span className="goal-step">
            {prog.reviewing ? 'Final check' : `${L.step} ${prog.step + 1} of ${task.steps.length}`}
          </span>
        </div>
        {savedAt && (
          <span className="saved" title="Progress saved" aria-label="Progress saved">
            {Icon.check}
          </span>
        )}
      </div>
    )
  }

  function StepScreen() {
    const step = task.steps[prog.step]
    const checks = prog.checks[prog.step] || step.items.map(() => false)
    const firstOpen = checks.findIndex((c) => !c)
    const allDone = firstOpen === -1
    const left = checks.filter((c) => !c).length
    const isLast = prog.step === task.steps.length - 1
    return (
      <section className="page step-page">
        {cleared && settings.rewards && (
          <div className="cleared" role="status">
            <span className="chip-star">{Icon.star}</span> {L.cleared(cleared)}
          </div>
        )}
        {cleared && !settings.rewards && (
          <div className="cleared plain" role="status">
            {L.step} {cleared} done.
          </div>
        )}

        <article className="card step-card">
          <div className="step-top">
            <span className="step-label">
              {L.step} {prog.step + 1}
            </span>
            {settings.rewards && (
              <span className="xp">
                <span className="chip-star">{Icon.star}</span> {state.xp} XP
              </span>
            )}
          </div>
          <h1 className="step-title">{step.title}</h1>

          <ul className="checklist">
            {step.items.map((item, i) => (
              <li key={i} className={i === firstOpen ? 'current' : checks[i] ? 'ticked' : ''}>
                <label>
                  <input type="checkbox" checked={!!checks[i]} onChange={() => toggleCheck(i)} />
                  <span className="box">{checks[i] && Icon.check}</span>
                  <span className="item-text">{item}</span>
                </label>
              </li>
            ))}
          </ul>

          <ProgressBar total={task.steps.length} done={prog.step} theme={settings.theme} />

          <button className="sprint-box" onClick={() => go('sprint')} aria-label="Open Focus Sprint timer">
            <span className="sprint-icon">{Icon.clock}</span>
            <span className="sprint-name">{sprint.over ? 'Break time' : 'Focus Sprint'}</span>
            <span className="sprint-time">
              {formatTime(sprint.remaining)} / {formatTime(settings.sprintMin * 60)}
            </span>
          </button>

          <div className="actions">
            <button className="btn primary big" onClick={nextStep} disabled={!allDone}>
              {allDone
                ? isLast
                  ? 'Check & submit →'
                  : `Next ${L.step.toLowerCase()} →`
                : `${isLast ? 'Check & submit' : `Next ${L.step.toLowerCase()}`} · ${left} left`}
            </button>
            <div className={prog.step === 0 ? 'secondary single' : 'secondary'}>
              <button className="btn" onClick={pauseAndSave}>
                Pause &amp; Save
              </button>
              {prog.step > 0 && (
                <button className="btn" onClick={prevStep}>
                  ← Back
                </button>
              )}
            </div>
          </div>
        </article>
      </section>
    )
  }

  function SprintScreen() {
    const total = settings.sprintMin * 60
    const r = 88
    const circ = 2 * Math.PI * r
    const frac = sprint.remaining / total
    return (
      <section className="page sprint-page">
        <div className="ring" role="timer" aria-live="off" aria-label={`${formatTime(sprint.remaining)} left`}>
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={r} className="ring-bg" />
            <circle
              cx="100"
              cy="100"
              r={r}
              className="ring-fg"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - frac)}
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div className="ring-text">
            <span className="ring-time">{formatTime(sprint.remaining)}</span>
            <span className="muted">left</span>
          </div>
        </div>

        {sprint.over ? (
          <>
            <h2>Sprint done. Take a break?</h2>
            <div className="stack">
              <button className="btn primary big" onClick={pauseAndSave}>
                Take a break
              </button>
              <button
                className="btn"
                onClick={() => {
                  resetSprint()
                  go('step')
                }}
              >
                Start another sprint
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{sprint.running ? "Keep going! You're doing great." : 'Sprint paused.'}</h2>
            <div className="stack">
              <button className="btn primary big" onClick={() => setSprint((s) => ({ ...s, running: !s.running }))}>
                {sprint.running ? 'Pause' : 'Resume'}
              </button>
              <button className="btn" onClick={() => go('step')}>
                Back to {L.step.toLowerCase()}
              </button>
            </div>
          </>
        )}
      </section>
    )
  }

  function ResumeScreen() {
    const doneSteps = prog.reviewing ? task.steps.length : prog.step
    return (
      <section className="page">
        <div className="card resume">
          <p className="kicker">Where was I?</p>
          <h1>Welcome back!</h1>
          <ol className="step-status">
            {task.steps.map((s, i) => {
              const status = i < doneSteps ? 'Done' : i === doneSteps ? 'Current' : 'Locked'
              return (
                <li key={i} className={status.toLowerCase()}>
                  <span className="status-icon">
                    {status === 'Done' ? Icon.check : status === 'Locked' ? Icon.lock : <span className="dot" />}
                  </span>
                  <span className="status-title">{s.title}</span>
                  <span className="status-tag">{status}</span>
                </li>
              )
            })}
            {prog.reviewing && (
              <li className="current">
                <span className="status-icon">
                  <span className="dot" />
                </span>
                <span className="status-title">Check before you submit</span>
                <span className="status-tag">Current</span>
              </li>
            )}
          </ol>
          <div className="actions">
            <button className="btn primary big" onClick={continueTask}>
              Continue →
            </button>
            <div className="secondary">
              <button className="btn" onClick={() => go('tasks')}>
                Back to tasks
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function ReviewScreen() {
    return (
      <section className="page">
        {cleared && settings.rewards && (
          <div className="cleared" role="status">
            <span className="chip-star">{Icon.star}</span> {L.cleared(cleared)}
          </div>
        )}
        <div className="card">
          <h1>Check before you submit</h1>
          <ul className="review-list">
            {task.steps.map((s, i) => (
              <li key={i}>
                <span className="status-icon done">{Icon.check}</span>
                <span className="status-title">{s.title}</span>
              </li>
            ))}
          </ul>
          <div className="actions">
            <button className="btn primary big" onClick={submit}>
              Submit assignment
            </button>
            <div className="secondary">
              <button className="btn" onClick={pauseAndSave}>
                Pause &amp; Save
              </button>
              <button className="btn" onClick={backFromReview}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function CompleteScreen() {
    if (!settings.rewards || !lastEarned) {
      return (
        <section className="page">
          <div className="card center">
            <h1>Submitted</h1>
            <p className="muted">{task.title}</p>
            <div className="stack">
              <button className="btn primary big" onClick={() => go('tasks')}>
                Back to tasks
              </button>
            </div>
          </div>
        </section>
      )
    }
    return (
      <section className="page">
        <div className="card center complete">
          <span className="emblem">{Icon.star}</span>
          <h1>{L.complete}</h1>
          <p className="muted">{task.title}</p>
          <table className="xp-table">
            <tbody>
              <tr>
                <td>
                  {lastEarned.steps} {L.step.toLowerCase()}s × {STEP_XP} XP
                </td>
                <td>+{lastEarned.steps * STEP_XP}</td>
              </tr>
              <tr>
                <td>{SIZES[lastEarned.size].label} task bonus</td>
                <td>+{lastEarned.bonus}</td>
              </tr>
              <tr className="total">
                <td>XP earned</td>
                <td>+{lastEarned.earned} XP</td>
              </tr>
            </tbody>
          </table>
          <LevelBar xp={state.xp} theme={settings.theme} />
          {newBadges.length > 0 && (
            <div className="new-badges">
              <p className="kicker">Badges unlocked</p>
              <div className="badge-grid">
                {newBadges.map((id) => (
                  <Badge key={id} badge={BADGES.find((b) => b.id === id)} earned />
                ))}
              </div>
            </div>
          )}
          {newThemes.length > 0 && (
            <div className="unlock">
              <span className={`swatch swatch-${newThemes.at(-1).id}`} aria-hidden="true" />
              <div>
                <p className="kicker">New theme unlocked</p>
                <strong>🎸 {newThemes.at(-1).name}</strong>
              </div>
              <button className="btn" onClick={() => setSetting('theme', newThemes.at(-1).id)} disabled={settings.theme === newThemes.at(-1).id}>
                {settings.theme === newThemes.at(-1).id ? 'In use' : 'Use it'}
              </button>
            </div>
          )}
          <div className="stack">
            <button className="btn primary big" onClick={() => go('tasks')}>
              {openTasks.length ? 'Back to tasks' : 'All done: see tasks'}
            </button>
            <button className="btn" onClick={() => go('achievements')}>
              View Achievements
            </button>
          </div>
        </div>
      </section>
    )
  }

  function AchievementsScreen() {
    return (
      <section className="page">
        <div className="list-head">
          <h1>Achievements</h1>
          <button className="btn" onClick={() => go('tasks')}>
            ← Tasks
          </button>
        </div>
        <div className="card">
          <div className="xp-big">
            <span className="chip-star">{Icon.star}</span> {state.xp} XP
          </div>
          <LevelBar xp={state.xp} theme={settings.theme} />
        </div>

        <h2 className="section-title">
          {L.finished} {L.trophy}
        </h2>
        {doneTasks.length === 0 ? (
          <p className="muted">None yet.</p>
        ) : (
          <ul className="trophies">
            {doneTasks.map((t) => {
              const p = state.progress[t.id]
              return (
                <li key={t.id} className="card trophy-card">
                  <span className="trophy-icon" aria-hidden="true">
                    {L.trophy}
                  </span>
                  <div>
                    <strong>{t.title}</strong>
                    <small className="muted">
                      {t.subject} · {SIZES[t.size].label} · Finished{' '}
                      {new Date(p.doneAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </small>
                  </div>
                  <span className="trophy-xp">+{p.xpEarned} XP</span>
                </li>
              )
            })}
          </ul>
        )}

        <h2 className="section-title">Guitar themes</h2>
        <ThemePicker xp={state.xp} current={settings.theme} onPick={(id) => setSetting('theme', id)} />

        <h2 className="section-title">Badge shelf</h2>
        <div className="badge-grid">
          {BADGES.map((b) => (
            <Badge key={b.id} badge={b} earned={state.badges.includes(b.id)} />
          ))}
        </div>
      </section>
    )
  }

  function SettingsPanel() {
    return (
      <div className="overlay" onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}>
        <div className="card sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div className="sheet-head">
            <h2 id="settings-title">Focus settings</h2>
            <button className="btn" onClick={() => setSettingsOpen(false)}>
              Done
            </button>
          </div>
          <div className="sheet-body">

          <label className="setting">
            <span>
              <strong>Focus Mode</strong>
            </span>
            <input type="checkbox" className="switch" checked={settings.focusMode} onChange={(e) => setFocus(e.target.checked)} />
          </label>

          <label className="setting">
            <span>
              <strong>Animations</strong>
            </span>
            <input type="checkbox" className="switch" checked={settings.motion} onChange={(e) => setSetting('motion', e.target.checked)} />
          </label>

          <label className="setting">
            <span>
              <strong>Game-style rewards</strong>
            </span>
            <input type="checkbox" className="switch" checked={settings.rewards} onChange={(e) => setSetting('rewards', e.target.checked)} />
          </label>

          <div className="setting col">
            <span>
              <strong>Theme</strong>
              <small>Earn XP to unlock guitar themes.</small>
            </span>
            <ThemePicker xp={state.xp} current={settings.theme} onPick={(id) => setSetting('theme', id)} />
          </div>

          <div className="setting col">
            <span>
              <strong>Sprint length</strong>
            </span>
            <div className="segmented" role="radiogroup" aria-label="Sprint length">
              {[10, 15, 25].map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={settings.sprintMin === m}
                  className={settings.sprintMin === m ? 'on' : ''}
                  onClick={() => {
                    setSetting('sprintMin', m)
                    resetSprint(m, sprint.running)
                  }}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="setting col">
            <span>
              <strong>Demo</strong>
              <small>Jump to a screen for the presentation.</small>
            </span>
            <div className="demo-grid">
              <button className="btn" onClick={() => loadDemo('step2')}>
                Essay, Step 2
              </button>
              <button className="btn" onClick={() => loadDemo('resume')}>
                Welcome back
              </button>
              <button className="btn" onClick={() => loadDemo('submit')}>
                Ready to submit
              </button>
              <button className="btn" onClick={() => loadDemo('xp')}>
                +100 XP
              </button>
            </div>
          </div>

          <button className="btn danger" onClick={resetAll}>
            Reset prototype
          </button>
          </div>
        </div>
      </div>
    )
  }

  const openMenu = (item) => {
    if (item === 'Home' || item === 'Tasks') go('tasks')
    else if (item === 'Achievements') go('achievements')
    else setToast(`${item} is part of the full learning platform.`)
  }

  function Sidebar() {
    const current = screen === 'achievements' ? 'Achievements' : 'Tasks'
    return (
      <aside className="side" aria-label="Portal menu">
        {PORTAL.menu.map((item) => (
          <button key={item} className={item === current ? 'on' : ''} onClick={() => openMenu(item)}>
            {item}
          </button>
        ))}
      </aside>
    )
  }

  function Feed() {
    return (
      <aside className="feed" aria-label="Class feed">
        <div className="card feed-card">
          <h2>Class stream</h2>
          <ul>
            {PORTAL.feed.map((post, i) => (
              <li key={i}>
                <span className="feed-from">{post.from}</span>
                <p>{post.text}</p>
                <small>{post.when} ago</small>
              </li>
            ))}
          </ul>
        </div>
        <div className="card feed-card">
          <h2>Upcoming</h2>
          <ul>
            {openTasks.map((t) => (
              <li key={t.id} className="due">
                <p>{t.title}</p>
                <small>{dueLabel(t.dueIn)}</small>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    )
  }

  const screens = {
    tasks: TaskList,
    step: StepScreen,
    sprint: SprintScreen,
    resume: ResumeScreen,
    review: ReviewScreen,
    complete: CompleteScreen,
    achievements: AchievementsScreen,
  }

  return (
    <div className={`app theme-${settings.theme} ${settings.motion ? 'motion-on' : 'motion-off'}`}>
      <header className="topbar">
        <div className="menu-wrap">
          <button className="icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            {Icon.menu}
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button
                role="menuitem"
                className={screen === 'tasks' || inTask ? 'on' : ''}
                onClick={() => (inTask ? pauseAndSave() : go('tasks'))}
              >
                {Icon.list} Active tasks <span className="menu-count">{openTasks.length}</span>
              </button>
              <button role="menuitem" className={screen === 'achievements' ? 'on' : ''} onClick={() => go('achievements')}>
                {Icon.check} Done <span className="menu-count">{doneTasks.length}</span>
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setSettingsOpen(true)
                }}
              >
                {Icon.gear} Settings
              </button>
            </div>
          )}
        </div>
        {!settings.focusMode && (
          <nav className="topnav" aria-label="Main">
            <button className={screen === 'tasks' ? 'on' : ''} onClick={() => go('tasks')}>
              Tasks
            </button>
            <button className={screen === 'achievements' ? 'on' : ''} onClick={() => go('achievements')}>
              Achievements
            </button>
            {['Classes', 'Calendar', 'Grades'].map((item) => (
              <button key={item} onClick={() => openMenu(item)}>
                {item}
              </button>
            ))}
          </nav>
        )}
        <div className="topbar-right">
          <button
            className={settings.focusMode ? 'focus-pill on' : 'focus-pill'}
            onClick={() => setFocus(!settings.focusMode)}
            aria-pressed={settings.focusMode}
          >
            <span className="pill-dot" /> Focus Mode: {settings.focusMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      <main className={settings.focusMode ? 'main' : 'main portal'}>
        {!settings.focusMode && Sidebar()}
        <div className="center">
        {inTask && GoalAnchor()}
        <nav className="here" aria-label="You are here">
          <span className="here-icon">{Icon.pin}</span>
          <span className="here-label">You are here:</span>
          <span className="crumbs">
            {here.map((c, i) => (
              <span key={i} className={i === here.length - 1 ? 'crumb last' : 'crumb'} aria-current={i === here.length - 1 ? 'page' : undefined}>
                {c}
              </span>
            ))}
          </span>
        </nav>
        <div key={`${screen}-${prog.step}`} className="screen">
          {screens[screen]()}
        </div>
        </div>
        {!settings.focusMode && Feed()}
      </main>

      {toast && (
        <div className="toast" role="status">
          {Icon.save} {toast}
        </div>
      )}
      {settingsOpen && SettingsPanel()}
    </div>
  )
}
