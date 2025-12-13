# Scripts & Configs Overview

## Active Scripts

### Setup
- **setup-mac.sh** - Initial setup: Install PostgreSQL, MinIO, Node.js, nginx
- **setup-nginx.sh** - Configure nginx with HeyTeX config

### Service Management
- **start-services.sh** - Manual start all services (fallback, not needed with LaunchDaemon)
- **stop-services.sh** - Stop all HeyTeX LaunchDaemon services

### Utilities
- **cache-packages.sh** - Cache LaTeX packages for offline use

## Active Configs

- **nginx-heytex.conf** - Nginx reverse proxy config (port 5436)
  - Location: Copied to `/opt/homebrew/etc/nginx/servers/heytex.conf`
  - Serves: Static files + Backend proxy

- **cloudflare-tunnel-config.yml** - Cloudflare tunnel routing
  - Location: `~/.cloudflared/config.yml`
  - Routes: heytex.truyenthong.edu.vn → localhost:5436

## LaunchDaemons (Auto-start)

Services automatically start on boot via LaunchDaemon:

```
/Library/LaunchDaemons/
├── com.heytex.postgresql.plist   (Port 5432)
├── com.heytex.backend.plist      (Port 5433)
├── com.heytex.minio.plist        (Port 5434)
└── com.heytex.texlive.plist      (Port 5435)
```

Source files: `launchd-daemons/*.plist`

See [LAUNCHDAEMON.md](LAUNCHDAEMON.md) for management commands.

## Removed Files

Cleaned up outdated/unused files:
- ❌ `*.service` - systemd configs (Linux only, not macOS)
- ❌ `start.sh, start-all.sh, start-mac.sh, start-production.sh` - Old port configs
- ❌ `autostart.sh` - Replaced by LaunchDaemon
- ❌ `run-backend.sh, run-frontend.sh` - Redundant
- ❌ `stop-all.sh` - Merged into stop-services.sh
- ❌ `nginx.conf, heytex-simple.conf` - Old configs
