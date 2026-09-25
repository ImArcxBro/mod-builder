# Player Enhancements — mod builder (GitHub Pages)

A webhook → Minecraft mod builder that runs 100% in the browser. No backend,
no functions. GitHub Pages serves the page, the vendored JSZip, and the
stored template jar. The jar gets re-zipped client-side with the caller's
webhook burned into `webhook.txt`.

```
mod-site/
  index.html        # the builder UI (JSZip powered, fully static)
  jszip.min.js      # vendored JSZip 3.10.1
  assets/moggrab.jar  # template mod (1.21.11 Fabric), built from ../moggrab
```

## Deploy to GitHub Pages

1. Create the repo:
   `https://github.com/new` → name it `mod-builder` → leave it **empty**
   (do NOT tick "Add a README") → Create.

2. From a terminal in this folder:
   ```
   git remote -v                      # already pointing at mod-builder?
   git push -u origin main            # first push pops a sign-in window
   ```

3. Enable Pages:
   Repo → **Settings → Pages** → Source: **Deploy from a branch** →
   Branch `main`, root `/` → Save.

4. Live at `https://<username>.github.io/mod-builder/` in a minute or two.

## Updating the template jar

Rebuild locally from the repo root, copy the fresh jar in, push:

```
gradlew.bat :moggrab:installTemplate
Copy-Item mod-builder\template\moggrab.jar mod-site\assets\moggrab.jar -Force
cd mod-site; git add .; git commit -m "update jar"; git push
```

## Notes

- Everything is client-side: the webhook you paste never goes anywhere
  except Discord. There's no rate limit and no build counter that survives
  a refresh (localStorage keeps a per-browser count).
- Anyone who loads the site has the same capability — one static jar plus
  JS. That's the tradeoff of a serverless Pages deployment.
- The jar is fetched as an opaque binary; GitHub serves `.jar` fine.
- Local test: `python -m http.server 8080` inside this folder, then open
  `http://localhost:8080`.

## Optional: hide the Discord hook behind a Worker relay

Instead of burning an obvious `discord.com/api/webhooks/...` string into the
jar, point the builder at a Cloudflare Worker that forwards to Discord. The
jar then only contains a clean `<name>.workers.dev` URL.

1. Cloudflare → **Workers & Pages** → **Create Worker** → paste
   `../cloudflare-worker/worker.js` into the editor.
2. Worker → **Settings → Variables** → add:
   - `DISCORD_WEBHOOK` = your real Discord webhook URL
   - `HOOK_SECRET` = any random string (leaving it empty = no lock)
3. **Deploy**, then copy the `*.workers.dev` URL it gives you and paste
   *that* into the builder box instead of the Discord URL.
4. Rotate the worker name / deploy a fresh worker now and then so the URL
   in the wild isn't a permanent, fingerprinted target.