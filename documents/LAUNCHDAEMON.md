# HeyTeX Launch Daemon Auto-Start

HeyTeX sử dụng **Launch Daemon** để tự động khởi động khi Mac Mini boot (không cần SSH login).

## Các Service

Tất cả services chạy với user `mac`, group `staff`:

| Service | Port | LaunchDaemon |
|---------|------|--------------|
| PostgreSQL | 5432 | com.heytex.postgresql |
| Backend | 5433 | com.heytex.backend |
| MinIO | 5434 | com.heytex.minio |
| TeXLive | 5435 | com.heytex.texlive |

## File Locations

- **Source plists**: `/Users/mac/heytex/launchd-daemons/*.plist`
- **System plists**: `/Library/LaunchDaemons/com.heytex.*.plist` (owner: root:wheel)
- **Logs**: `/tmp/heytex-*.log` và `/tmp/heytex-*-error.log`

## Management Commands

```bash
# Kiểm tra status
sudo launchctl list | grep heytex

# Unload service
sudo launchctl unload /Library/LaunchDaemons/com.heytex.backend.plist

# Load service
sudo launchctl load /Library/LaunchDaemons/com.heytex.backend.plist

# Restart service
sudo launchctl unload /Library/LaunchDaemons/com.heytex.backend.plist
sudo launchctl load /Library/LaunchDaemons/com.heytex.backend.plist

# Xem logs
tail -f /tmp/heytex-backend.log
tail -f /tmp/heytex-backend-error.log
```

## Update Service

Nếu cần update plist:

```bash
# 1. Edit source file
nano /Users/mac/heytex/launchd-daemons/com.heytex.backend.plist

# 2. Unload old daemon
sudo launchctl unload /Library/LaunchDaemons/com.heytex.backend.plist

# 3. Copy và set ownership
sudo cp /Users/mac/heytex/launchd-daemons/com.heytex.backend.plist /Library/LaunchDaemons/
sudo chown root:wheel /Library/LaunchDaemons/com.heytex.backend.plist

# 4. Load lại
sudo launchctl load /Library/LaunchDaemons/com.heytex.backend.plist
```

## Troubleshooting

### Service không start

```bash
# Xem error log
cat /tmp/heytex-backend-error.log

# Check port conflicts
lsof -i :5433
```

### Port already in use

Kill process cũ trước khi load daemon:

```bash
lsof -i :5433 | grep LISTEN  # Tìm PID
kill <PID>
sudo launchctl load /Library/LaunchDaemons/com.heytex.backend.plist
```

## Lưu ý

- **LaunchDaemon vs LaunchAgent**: Daemon chạy khi boot (không cần login), Agent chạy khi user login
- **SSH Login**: LaunchAgent không chạy qua SSH, phải dùng LaunchDaemon
- **Ownership**: Daemon plist phải có owner `root:wheel`
- **Location**: System daemon ở `/Library/LaunchDaemons/`, user agent ở `~/Library/LaunchAgents/`
