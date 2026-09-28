# About this fork

This is [siddharthreddi/openGym](https://github.com/siddharthreddi/openGym), forked from
[DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym).

The Apple Watch reminder customization is based on upstream v1.3.8, commit
`f91cde15a1c7ec9af815a1c5878643105636abdf`.

## Custom behavior

After saving or skipping the workout weigh-in, the app can remind you to start
your Apple Watch workout. Enable or disable it under **Settings → During a
workout → Apple Watch reminder**. The default is enabled on iPhone. Continue
explicitly to start the OpenGym timer, or cancel to leave the session unstarted.

An optional saved iPhone Shortcut can be opened by its exact name. The browser
cannot directly start Apple's Watch Workout app or confirm that the Watch is
recording. Test the Shortcut on the actual iPhone and Watch before relying on it.
The Watch workout must be ended separately.

## Development

The local `origin` remote points to this fork, and `upstream` points to the
original project. Custom work is saved on `codex/apple-watch-reminder`, based on
the deployed version. Fetch upstream changes and review them before merging;
updating this fork does not automatically deploy the hosted app.

From `frontend/`, the existing customization was verified with:

```bash
npm ci --ignore-scripts
TZ=UTC npm test
npm run build
node scripts/check-locales.mjs
```

All 1,592 frontend tests passed. The existing Hevy import test assumes UTC; use
the timezone above to match CI. New reminder text falls back to English in other
languages. The live reminder was checked at a phone-sized viewport; physical
Watch/Shortcut handoff remains a device test.

Only application source and tests are included here. Runtime account data,
workout history, credentials, backups, and private deployment files are not part
of this fork. The original AGPL-3.0-or-later license and attribution are retained.
