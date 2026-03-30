@AGENTS.md

## Deploy Configuration (configured by /setup-deploy)
- Platform: Railway
- Production URL: https://giftos-gstack-production.up.railway.app
- Deploy workflow: auto-deploy on push to main
- Deploy status command: HTTP health check
- Merge method: squash
- Project type: web app
- Post-deploy health check: https://giftos-gstack-production.up.railway.app/

### Custom deploy hooks
- Pre-merge: pnpm test && pnpm build
- Deploy trigger: automatic on push to main
- Deploy status: poll production URL
- Health check: https://giftos-gstack-production.up.railway.app/
