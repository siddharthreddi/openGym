// A Safari Home Screen app can hand off to Shortcuts, but cannot start or observe
// a native Watch workout itself. Never treat opening this URL as a successful start.
export function isIPhone() {
  return typeof navigator !== 'undefined' && /iPhone|iPod/.test(navigator.userAgent)
}

export function appleWatchReminderEnabled(state) {
  return typeof state.appleWatchReminder === 'boolean' ? state.appleWatchReminder : isIPhone()
}

export function appleWatchShortcutUrl(name) {
  if (typeof name !== 'string' || !name.trim()) return null
  return 'shortcuts://run-shortcut?name=' + encodeURIComponent(name.trim().slice(0, 120))
}
