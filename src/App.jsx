import { useEffect, useState } from 'react'
import { BADGES, SIZES, dueLabel, STEP_XP, TASKS, THEMES, XP_PER_LEVEL, isUnlocked, labels, levelInfo, themesUnlockedBetween } from './data.js'
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
  user: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  pick: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c-2.5-2.2-7-7.4-7-12 0-3.3 3.1-5 7-5s7 1.7 7 5c0 4.6-4.5 9.8-7 12z" fill="currentColor" stroke="none" /></svg>
  ),
  palette: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.7-1.4-.7-2.2 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.7-4-8.6-9-8.6z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 11h6M9 15h4" /></svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5h.01" /></svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 10" /></svg>
  ),
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
  eye: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
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
  save: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  ),
}

/* ---------- Small pieces ---------- */

function ProgressBar({ total, done, theme, label }) {
  if (theme !== 'classic') {
    return (
      <div className="neck-wrap">
        <div className="neck" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label}>
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
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label}>
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
  const [videoChoice, setVideoChoice] = useState({})
  const [filter, setFilter] = useState('todo')
  const [focusIntroOpen, setFocusIntroOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [draft, setDraft] = useState(null)
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
      if (e.type === 'keydown' ? e.key !== 'Escape' : e.target.closest('.menu-wrap')) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!settingsOpen && !themeOpen && !focusIntroOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setSettingsOpen(false)
      setThemeOpen(false)
      setFocusIntroOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen, themeOpen, focusIntroOpen])

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

  // Focus Mode on = one task at a time, autoplay blocked, motion off. One tap, no settings.
  // Turning it on explains what it does, until he ticks "Don't show this again".
  const setFocus = (on) => {
    setSetting('focusMode', on)
    if (on && !settings.hideFocusIntro) {
      setDontShowAgain(false)
      setFocusIntroOpen(true)
    } else {
      setToast(on ? 'Focus Mode on.' : 'Focus Mode off.')
    }
  }
  const closeFocusIntro = () => {
    if (dontShowAgain) setSetting('hideFocusIntro', true)
    setFocusIntroOpen(false)
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
    if (doneCount >= TASKS.length && !has('full-setlist')) unlocked.push('full-setlist')

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

  /* ----- Screens ----- */

  const doneTasks = TASKS.filter((t) => state.progress[t.id]?.done)
  const openTasks = TASKS.filter((t) => !state.progress[t.id]?.done).sort((a, b) => a.dueIn - b.dueIn)
  const inTask = task && ['step', 'resume', 'review', 'sprint'].includes(screen)

  function TaskCard(t, i) {
    const p = state.progress[t.id]
    const going = isInProgress(p)
    return (
      <li key={t.id}>
        <button className={`tcard c-${t.color}${i === 0 ? ' suggested' : ''}`} onClick={() => openTask(t.id)}>
          <span className="tcard-body">
            <span className="tcard-name">
              <span className="sr-only">{t.subject}: </span>
              {t.title}
              {i === 0 && <span className="start-here">Start here</span>}
            </span>
            <span className="tcard-meta">
              <span className="due-tag">{dueLabel(t.dueIn)}</span>
              <span className={`size-pill pill-${t.size}`}>
                {SIZES[t.size].label} · {t.time.replace(/^About /, '')}
              </span>
            </span>
            {going && (
              <span className="saved-note">
                {Icon.save} Saved at {L.step} {Math.min(p.step + 1, t.steps.length)} of {t.steps.length}
              </span>
            )}
          </span>
          <span className="tcard-go">{Icon.chevron}</span>
        </button>
      </li>
    )
  }

  const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  function WorkSummary(t) {
    const p = state.progress[t.id] || {}
    return (
      <li key={t.id} className={`tcard summary c-${t.color}`}>
        <span className="tcard-body">
          <span className="tcard-name">
            <span className="sr-only">{t.subject}: </span>
            {t.title}
          </span>
          <span className="summary-line">
            <>
              Finished {shortDate(p.doneAt)} · {t.steps.length} {L.step.toLowerCase()}s
              {settings.rewards && <> · +{p.xpEarned} XP</>}
            </>
          </span>
        </span>
      </li>
    )
  }

  function TaskList() {
    const missed = openTasks.filter((t) => t.dueIn < 0)
    const todo = openTasks.filter((t) => t.dueIn >= 0)
    const tabs = [
      { id: 'todo', label: 'To Do', count: todo.length, icon: Icon.clipboard },
      { id: 'missed', label: 'Missed', count: missed.length, icon: Icon.alert },
      { id: 'done', label: 'Done', count: doneTasks.length, icon: Icon.checkCircle },
    ]

    if (settings.focusMode) {
      const inProgress = openTasks.filter((t) => isInProgress(state.progress[t.id]))
      const next = inProgress.find((t) => t.id === state.lastTaskId) || inProgress[0] || todo[0] || missed[0]
      return (
        <section className="page">
          <div className="list-head">
            <h1 className="list-title">{next && isInProgress(state.progress[next.id]) ? 'Continue your task' : 'Up next'}</h1>
          </div>
          {next ? (
            <ul className="tasks">{TaskCard(next, isInProgress(state.progress[next.id]) ? -1 : 0)}</ul>
          ) : (
            <div className="card empty">
              <h2>All tasks finished</h2>
              <p className="muted">Nothing left for now. Nice work.</p>
            </div>
          )}
          <p className="muted small focus-note">Other tasks are hidden while Focus Mode is on.</p>
        </section>
      )
    }

    return (
      <section className="page">
        <div className="list-head">
          <h1 className="list-title">Your Tasks</h1>
        </div>
        <div className="status-tabs" role="tablist" aria-label="Task status">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filter === tab.id}
              className={`status-tab tab-${tab.id}${filter === tab.id ? ' on' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              <span className="status-icon-lg">{tab.icon}</span>
              <span className="status-label">{tab.label}</span>
              <span className="status-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {filter !== 'todo' && <h2 className="section-title">{filter === 'missed' ? 'Missed' : 'Done'}</h2>}

        {filter === 'todo' &&
          (todo.length === 0 ? (
            <div className="card empty">
              <h2>All tasks finished</h2>
              <p className="muted">Nothing left for now. Nice work.</p>
              <button className="btn primary" onClick={() => go('achievements')}>
                See your Achievements
              </button>
            </div>
          ) : (
            <ul className="tasks">{todo.map((t, i) => TaskCard(t, i))}</ul>
          ))}

        {filter === 'missed' &&
          (missed.length === 0 ? (
            <p className="muted">No missed tasks.</p>
          ) : (
            <ul className="tasks">{missed.map((t) => TaskCard(t, -1))}</ul>
          ))}

        {filter === 'done' &&
          (doneTasks.length === 0 ? (
            <p className="muted">Finished tasks show up here.</p>
          ) : (
            <>
              <p className="muted small">
                {doneTasks.length} finished
                {settings.rewards && <> · {doneTasks.reduce((sum, t) => sum + (state.progress[t.id].xpEarned || 0), 0)} XP earned</>}
              </p>
              <ul className="tasks">{doneTasks.map((t) => WorkSummary(t))}</ul>
            </>
          ))}
      </section>
    )
  }

  function GoalAnchor() {
    const doneSteps = prog.reviewing ? task.steps.length : prog.step
    return (
      <div className="goal-anchor" role="region" aria-label="Goal Anchor">
        <span className="goal-icon">{settings.theme === 'classic' ? Icon.target : Icon.pick}</span>
        <div className="goal-text">
          <span className="goal-kicker">{L.working}</span>
          <strong>{task.title}</strong>
        </div>
        {savedAt && (
          <span className="saved" title="Progress saved" aria-label="Progress saved">
            {Icon.check}
          </span>
        )}
        <div className="anchor-progress">
          <ProgressBar
            total={task.steps.length}
            done={doneSteps}
            theme={settings.theme}
            label={`${doneSteps} of ${task.steps.length} ${L.step.toLowerCase()}s done`}
          />
        </div>
      </div>
    )
  }

  function VideoTile(video) {
    const key = `${task.id}-${prog.step}`
    // Autoplays like a normal platform when Focus Mode is off; Focus Mode blocks autoplay.
    const playing = videoChoice[key] ?? !settings.focusMode
    const setPlaying = (on) => setVideoChoice((c) => ({ ...c, [key]: on }))
    return (
      <div className={playing ? 'video playing' : 'video'}>
        <div className="video-screen">
          {playing ? (
            <>
              <span className="video-live">{Icon.play} Playing</span>
              <span className="video-bar">
                <span />
              </span>
            </>
          ) : (
            <button className="video-play" onClick={() => setPlaying(true)} aria-label={`Play ${video.title}`}>
              {Icon.play}
            </button>
          )}
        </div>
        <div className="video-info">
          <span>
            <strong>{video.title}</strong>
            <small>Teacher video · {video.length}</small>
          </span>
          {playing ? (
            <button className="btn" onClick={() => setPlaying(false)}>
              Pause
            </button>
          ) : (
            settings.focusMode && <small className="video-note">Autoplay blocked</small>
          )}
        </div>
      </div>
    )
  }

  // A linked web page with an ad in it; Focus Mode hides the ad.
  function ArticleTile(article) {
    return (
      <div className="article">
        <small>{article.source}</small>
        <strong className="article-title">{article.title}</strong>
        <p>{article.before}</p>
        {settings.focusMode ? (
          <p className="ad-hidden">{Icon.check} Ad hidden</p>
        ) : (
          <div className="article-ad" aria-label="Advertisement">
            <span className="ad-tag">Ad</span>
            <span>
              <strong>SnapQuiz Pro</strong>
              <small>Finish homework 2x faster! Tap to learn more.</small>
            </span>
          </div>
        )}
        <p>{article.after}</p>
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
          {settings.rewards && (
            <div className="step-top">
              <span className="xp">
                <span className="chip-star">{Icon.star}</span> {state.xp} XP
              </span>
            </div>
          )}
          <h1 className="step-title">{step.title}</h1>

          {step.video && VideoTile(step.video)}
          {step.article && ArticleTile(step.article)}

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
                  ? 'Check & submit'
                  : `Next ${L.step.toLowerCase()}`
                : `${isLast ? 'Check & submit' : `Next ${L.step.toLowerCase()}`} · ${left} left`}
            </button>
            <div className={prog.step === 0 ? 'secondary single' : 'secondary'}>
              <button className="btn" onClick={pauseAndSave}>
                Pause &amp; Save
              </button>
              {prog.step > 0 && (
                <button className="btn" onClick={prevStep}>
                  Back
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
        <h1 className="list-title">Focus Sprint</h1>
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
            <div className="pair">
              <button className="btn big" onClick={() => go('tasks')}>
                Back to tasks
              </button>
              <button className="btn primary big" onClick={continueTask}>
                Continue
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
                Back
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
        <div className="page-head">
          <button className="icon-btn back-btn" onClick={() => go('tasks')} aria-label="Back to tasks">
            {Icon.back}
          </button>
          <h1 className="list-title">Achievements</h1>
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

        <h2 className="section-title">Badge shelf</h2>
        <div className="badge-grid">
          {BADGES.map((b) => (
            <Badge key={b.id} badge={b} earned={state.badges.includes(b.id)} />
          ))}
        </div>
      </section>
    )
  }

  const openSettings = () => {
    setMenuOpen(false)
    setDraft({ ...settings })
    setSettingsOpen(true)
  }
  const openTheme = () => {
    setMenuOpen(false)
    setDraft({ theme: settings.theme })
    setThemeOpen(true)
  }
  const closeSheets = () => {
    setSettingsOpen(false)
    setThemeOpen(false)
  }
  const saveDraft = () => {
    update((s) => {
      s.settings = { ...s.settings, ...draft }
      return s
    })
    if (draft.sprintMin && draft.sprintMin !== settings.sprintMin) resetSprint(draft.sprintMin, sprint.running)
    closeSheets()
    setToast(themeOpen ? 'Theme saved.' : 'Settings saved.')
  }
  const setDraftValue = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  function Sheet(title, body) {
    return (
      <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeSheets()}>
        <div className="card sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div className="sheet-head">
            <h2 id="sheet-title">{title}</h2>
            <button className="icon-btn" onClick={closeSheets} aria-label="Close">
              {Icon.x}
            </button>
          </div>
          <div className="sheet-body">{body}</div>
          <div className="sheet-foot">
            <button className="btn primary big" onClick={saveDraft}>
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  function SettingsPanel() {
    return Sheet(
      'Settings',
      <>
        <label className="setting">
          <span>
            <strong>Animations</strong>
            <small>Always off in Focus Mode.</small>
          </span>
          <input type="checkbox" className="switch" checked={draft.motion} onChange={(e) => setDraftValue('motion', e.target.checked)} />
        </label>

        <label className="setting">
          <span>
            <strong>Game-style rewards</strong>
          </span>
          <input type="checkbox" className="switch" checked={draft.rewards} onChange={(e) => setDraftValue('rewards', e.target.checked)} />
        </label>

        <div className="setting col">
          <span>
            <strong>Sprint length</strong>
          </span>
          <div className="segmented" role="radiogroup" aria-label="Sprint length">
            {[10, 15, 25].map((m) => (
              <button key={m} role="radio" aria-checked={draft.sprintMin === m} className={draft.sprintMin === m ? 'on' : ''} onClick={() => setDraftValue('sprintMin', m)}>
                {m} min
              </button>
            ))}
          </div>
        </div>
      </>,
    )
  }

  function ThemePanel() {
    return Sheet(
      'Theme',
      <div className="setting col">
        <span>
          <small>Earn XP to unlock guitar themes.</small>
        </span>
        <ThemePicker xp={state.xp} current={draft.theme} onPick={(id) => setDraftValue('theme', id)} />
      </div>,
    )
  }

  const openMenu = (item) => {
    setMenuOpen(false)
    setToast(`${item} is part of the full learning platform.`)
  }

  function FocusIntro() {
    const items = [
      ['One task at a time', 'Other tasks and menus stay hidden.'],
      ['Ads and autoplay blocked', 'Ads are hidden and videos wait until you press play.'],
      ['Motion off', 'Nothing on screen moves or flashes.'],
    ]
    return (
      <div className="overlay centered" onClick={(e) => e.target === e.currentTarget && closeFocusIntro()}>
        <div className="card focus-intro" role="dialog" aria-modal="true" aria-labelledby="focus-intro-title">
          <span className="focus-intro-icon">{Icon.target}</span>
          <h2 id="focus-intro-title">Focus Mode is on</h2>
          <ul>
            {items.map(([label, detail]) => (
              <li key={label}>
                <span className="focus-mark">{Icon.check}</span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </li>
            ))}
          </ul>
          <label className="dont-show">
            <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
            Don't show this again
          </label>
          <button className="btn primary big" onClick={closeFocusIntro}>
            Got it
          </button>
        </div>
      </div>
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
    <div className={`app theme-${settings.theme} ${settings.motion && !settings.focusMode ? 'motion-on' : 'motion-off'}`}>
      <header className="topbar">
        <button className="logo" onClick={() => (inTask ? pauseAndSave() : go('tasks'))} aria-label="FocusPath, your tasks">
          <span className="logo-mark">{Icon.target}</span>
          <span className="logo-text">FocusPath</span>
        </button>
        <div className="topbar-right">
          <div className="focus-wrap">
            <button
              className={settings.focusMode ? 'focus-switch on' : 'focus-switch'}
              onClick={() => setFocus(!settings.focusMode)}
              role="switch"
              aria-checked={settings.focusMode}
            >
              <span className="fs-dot" />
              <span className="fs-label">
                Focus<span className="fs-long"> Mode</span>
              </span>
              <span className="fs-state">{settings.focusMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          <div className="menu-wrap">
            <button
              className={settings.focusMode ? 'avatar gear' : 'avatar'}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={settings.focusMode ? 'Menu' : 'Profile menu'}
              aria-expanded={menuOpen}
            >
              {settings.focusMode ? Icon.gear : Icon.user}
            </button>
            {menuOpen && (
              <div className="menu profile-menu" role="menu">
                {!settings.focusMode && (
                  <div className="profile-head">
                    <strong>Lucas</strong>
                    <small>Student</small>
                  </div>
                )}
                <button role="menuitem" className={screen === 'achievements' ? 'on' : ''} onClick={() => go('achievements')}>
                  {Icon.trophy} Achievements
                </button>
                <button role="menuitem" onClick={openTheme}>
                  {Icon.palette} Theme
                </button>
                <button role="menuitem" onClick={openSettings}>
                  {Icon.gear} Settings
                </button>
                {!settings.focusMode && (
                  <>
                    <button role="menuitem" onClick={() => openMenu('Help')}>
                      {Icon.help} Help
                    </button>
                    <hr />
                    <button role="menuitem" onClick={() => openMenu('Log out')}>
                      {Icon.logout} Log out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="center">
        {inTask && GoalAnchor()}
        <div key={`${screen}-${prog.step}`} className="screen">
          {screens[screen]()}
        </div>
        </div>
      </main>

      {toast && (
        <div className="toast" role="status">
          {Icon.save} {toast}
        </div>
      )}
      {settingsOpen && SettingsPanel()}
      {themeOpen && ThemePanel()}
      {focusIntroOpen && FocusIntro()}
    </div>
  )
}
