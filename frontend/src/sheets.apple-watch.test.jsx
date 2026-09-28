// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { startFlow } from './sheets.jsx'
import { appleWatchReminderEnabled, appleWatchShortcutUrl } from './lib/apple-watch.js'

const mounted = []
function mountTopSheet() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const button = (host, text) => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text)
const iphone = () => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')

describe('Apple Watch reminder at workout start', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    useUI.setState({ sheets: [], toasts: [] })
    useStore.setState(s => ({ user: null, S: { ...s.S,
      active: null, routines: [], workouts: [], bodyweight: [], weighIn: true,
      appleWatchReminder: true, appleWatchShortcut: '',
    } }))
    document.body.innerHTML = ''
  })
  afterEach(() => {
    act(() => mounted.splice(0).forEach(root => root.unmount()))
    vi.restoreAllMocks()
  })

  it('defaults on for iPhone profiles and respects an explicit off choice', () => {
    iphone()
    expect(appleWatchReminderEnabled({})).toBe(true)
    expect(appleWatchReminderEnabled({ appleWatchReminder: null })).toBe(true)
    expect(appleWatchReminderEnabled({ appleWatchReminder: false })).toBe(false)
  })

  it('does not prompt other devices unless they opt in', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 16)')
    expect(appleWatchReminderEnabled({})).toBe(false)
    expect(appleWatchReminderEnabled({ appleWatchReminder: true })).toBe(true)
  })

  it('saves the weigh-in, then waits for the Watch before starting the selected routine', () => {
    useStore.setState(s => ({ S: { ...s.S, routines: [{ id: 'upper-body', name: 'Upper body', ex: [] }] } }))
    act(() => startFlow(['upper-body']))
    const weighIn = mountTopSheet()
    expect(weighIn.textContent).toContain('Quick check-in')
    act(() => button(weighIn, 'Save & start workout').click())
    expect(useStore.getState().S.active).toBeNull()
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(useUI.getState().sheets[0].locked).toBe(true)
    const reminder = mountTopSheet()
    expect(reminder.textContent).toContain('Start your Apple Watch workout')
    expect(useStore.getState().S.bodyweight[0].w).toBe(70)
    act(() => button(reminder, 'Watch is ready - start workout').click())
    expect(useStore.getState().S.active).toMatchObject({ bw: 70, routineIds: ['upper-body'] })
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('still prompts when the weigh-in is skipped, and allows starting without a Watch', () => {
    act(() => startFlow([]))
    const weighIn = mountTopSheet()
    act(() => button(weighIn, 'Start without weighing in').click())
    const reminder = mountTopSheet()
    act(() => button(reminder, 'Start without Apple Watch').click())
    expect(useStore.getState().S.active.bw).toBeNull()
    expect(useStore.getState().S.bodyweight).toEqual([])
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('works with weigh-in disabled and can be cancelled without creating a session', () => {
    useStore.setState(s => ({ S: { ...s.S, weighIn: false } }))
    act(() => startFlow([]))
    const reminder = mountTopSheet()
    expect(reminder.textContent).toContain('Start your Apple Watch workout')
    act(() => reminder.querySelector('[aria-label="Cancel"]').click())
    expect(useStore.getState().S.active).toBeNull()
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('starts immediately when both prompts are off, even on iPhone', () => {
    iphone()
    useStore.setState(s => ({ S: { ...s.S, weighIn: false, appleWatchReminder: false } }))
    act(() => startFlow([]))
    expect(useStore.getState().S.active).not.toBeNull()
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('offers an encoded Shortcut link on iPhone without treating the handoff as a started workout', () => {
    iphone()
    useStore.setState(s => ({ S: { ...s.S, weighIn: false, appleWatchShortcut: ' Lift & Walk #1 ' } }))
    act(() => startFlow([]))
    const reminder = mountTopSheet()
    const link = reminder.querySelector('a')
    expect(link.getAttribute('href')).toBe('shortcuts://run-shortcut?name=Lift%20%26%20Walk%20%231')
    // Avoid launching an external app in the test; the app itself must not start the timer.
    link.addEventListener('click', e => e.preventDefault())
    act(() => link.click())
    expect(useStore.getState().S.active).toBeNull()
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(reminder.textContent).toContain('check that your Watch is recording')
  })

  it('hides Shortcut launching on non-iPhone devices and for blank names', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 16)')
    useStore.setState(s => ({ S: { ...s.S, weighIn: false, appleWatchShortcut: 'Lift' } }))
    act(() => startFlow([]))
    expect(mountTopSheet().querySelector('a')).toBeNull()
    expect(appleWatchShortcutUrl('   ')).toBeNull()
    expect(appleWatchShortcutUrl(undefined)).toBeNull()
  })
})
