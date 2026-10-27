# Deploying

The app is one Node process and one SQLite file. `Dockerfile` builds it; the database lives on a mounted volume at `/data`.

## Fly.io (trial hosting)

One-time, on your PC with [flyctl](https://fly.io/docs/flyctl/install/) installed and `fly auth login` done:

```
fly launch --copy-config --no-deploy      # accept the app name it offers, or pick one
fly volumes create data --size 1  # 1 GB is plenty (the volume on the live app is named "data")
fly secrets set ORIGIN=https://<app-name>.fly.dev
fly deploy
```

Later deploys are `fly deploy` from the repo root. To let Claude deploy from GitHub Actions instead, create a token with `fly tokens create deploy` and add it as the repository secret `FLY_API_TOKEN`; the workflow in `.github/workflows/fly.yml` then deploys on every push to main.

## A VPS (Hetzner, per the build plan)

```
docker build -t recipe-app .
docker run -d --name recipe-app -p 127.0.0.1:3000:3000 -v recipe-data:/data -e ORIGIN=https://recipes.example.com recipe-app
```

Put Caddy in front for HTTPS (`reverse_proxy 127.0.0.1:3000`). Back up `/data/recipes.db` with Litestream or a nightly copy.

## Locally

```
cd app && npm install && npm run build
ORIGIN=http://localhost:3000 node build        # PowerShell: $env:ORIGIN="http://localhost:3000"; node build
```
