# Player Enhancements — Netlify deploy folder

Self-contained site for Netlify. Static page + two serverless functions
(`/api/build` and `/api/stats`).

## Layout

```
netlify-builder/
  netlify.toml              # publish dir + function config + jar inclusion
  public/index.html         # the page (static, publish root)
  netlify/functions/
    build/                  # POST /api/build  -> returns the personalized jar
      build.js
      package.json          # adm-zip dependency
      moggrab.jar           # the template jar (re-stuffed per request)
    stats/                  # GET /api/stats  -> build counter (in-memory)
      stats.js
```

## Deploy (git-based only — drag-and-drop won't run the functions)

1. Turn the folder into a repo and push it:
   ```
   cd netlify-builder
   git init
   git add .
   git commit -m "mod builder"
   ```
2. Create an empty repo on GitHub and push to it.
3. In Netlify: **Add new site → Import an existing project → GitHub**, pick
   the repo.
4. Settings that matter:
   - **Build command**: leave blank
   - **Publish directory**: `public`
5. Deploy. Your site is live at `https://<name>.netlify.app`.

Local test (needs Node installed):
```
cd netlify-builder
npm install netlify-cli -g
netlify dev
```
then open `http://localhost:8888`.

## Updating the template jar

Rebuild locally: `gradlew.bat :moggrab:installTemplate`, then re-copy the
jar (serverless fleets cache it in git, so a plain redeploy is enough):
```
Copy-Item mod-builder\template\moggrab.jar netlify-builder\netlify\functions\build\moggrab.jar -Force
git add .
git commit -m "update jar"
git push     # Netlify auto-rebuilds
```

## Notes

- The build counter and rate limiter are in-memory: they reset on cold
  starts and are per-instance. Fine for a hobby site; wire a KV store
  (Netlify Blobs / Supabase) if you want them to stick.
- Functions only run on git-connected deploys. A drag-and-drop "manual"
  deploy serves the page but `/api/build` will 404.
- Keep the jar out of any published paths other than the function bundle —
  it's included via `included_files`, not as a downloadable asset.