# Performance baseline instrumentation

Temporary instrumentation added to capture a pre-load-test performance
baseline: current RPS and p95 latency per endpoint, so later load/stress
test results have something to be compared against ("Endpoint X currently
serves Y RPS at p95=Zms during peak").

Every touch point is tagged with the comment `pre-load-test` so the full set
of changes can always be found with:

```bash
grep -rln "pre-load-test" --include="*.py" --include="*.yml" --include="*.conf" .
```

## What was added

| File | Change |
|---|---|
| `server/freshr/perf_logging.py` | New `RequestPerfLoggingMiddleware` — logs `endpoint` (URL route pattern, not raw path), `method`, `status`, `duration_ms` per request |
| `server/freshr/settings.py` | Middleware registered in `MIDDLEWARE`; new `perf_file` logging handler (`RotatingFileHandler`, 50MB × 10 backups) + `perf` logger |
| `client/web/nginx.conf` | Additive `log_format perf` + `access_log /var/log/perf/access.log perf;`, alongside (not replacing) the existing stdout-based access log Dozzle reads |
| `docker-compose.prod.yml`, `docker-compose.staging.yml` | `web` service: `perf_logs_{env}` volume → `/app/logs`, `PERF_LOG_DIR` env var. `frontend` service: `nginx_perf_logs_{env}` volume → `/var/log/perf` |

Not enabled on `docker-compose.local.yml` or the `celery` service (no HTTP
traffic to log there).

## Deploying

No special steps — it ships with the normal deploy. Once the updated images
are running on staging/prod, confirm both logs are live:

```bash
docker exec <web-container>    tail -f /app/logs/perf.log
docker exec <frontend-container> tail -f /var/log/perf/access.log
```

## Collecting data

Let it run for however long you need (a few days of real traffic, or the
duration of a load test), then pull the files off the containers for
offline analysis — these are named Docker volumes, not bind mounts, so
`docker cp` is the simplest way to get them onto the host:

```bash
docker cp <web-container>:/app/logs/perf.log ./perf.log
docker cp <frontend-container>:/var/log/perf/access.log ./access.log
```

If `perf.log` has rotated (>50MB written), grab the numbered backups too
(`perf.log.1`, `perf.log.2`, ...) and concatenate oldest-first:

```bash
docker exec <web-container> sh -c 'ls /app/logs/perf.log.* 2>/dev/null'
cat perf.log.10 perf.log.9 ... perf.log.1 perf.log > perf-all.log   # oldest to newest
```

## Turning it into the "Endpoint X serves Y RPS at p95=Zms" table

Both logs are JSON-lines, one object per request — `jq` handles the
aggregation directly. Note the unit difference: Django's `duration_ms` is
milliseconds, nginx's `request_time` is **seconds**.

**Per-endpoint p95 latency + request count** (Django-side, route-level detail):
```bash
jq -s '
  group_by(.endpoint) | map({
    endpoint: .[0].endpoint,
    method: .[0].method,
    count: length,
    p95_ms: (sort_by(.duration_ms) | .[(length * 0.95 | floor)].duration_ms)
  }) | sort_by(-.count)
' perf.log
```

**Per-URI p95 latency + request count** (nginx-side, includes edge/network
latency Django never sees — useful as a cross-check against the Django numbers):
```bash
jq -s '
  group_by(.uri) | map({
    uri: .[0].uri,
    count: length,
    p95_s: (sort_by(.request_time) | .[(length * 0.95 | floor)].request_time)
  }) | sort_by(-.count)
' access.log
```

**RPS during peak** — bucket by minute, find the busiest bucket, divide by 60:
```bash
jq -r '.time[0:16]' perf.log | sort | uniq -c | sort -rn | head   # "YYYY-MM-DD HH:MM" -> count
```
The top line's count ÷ 60 is peak RPS across all endpoints for that minute.
Repeat filtered to one endpoint (`jq -r 'select(.endpoint=="/api/v1/notebooks/") | .time[0:16]'`)
for a per-endpoint peak RPS.

## Complementary: resource baseline (docker stats)

Not part of the code changes above, but the other half of a full baseline —
run on the host itself (not in a container) for the same collection window:

```bash
while true; do
  docker stats --no-stream --format \
    '{{.Container}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}' \
    | while read line; do echo "$(date -u +%FT%TZ),$line"; done >> stats.csv
  sleep 5
done
```
`--no-stream` is required — without it `docker stats` opens a live view and
never returns. 5s sampling for multiple days is a few MB of CSV; no rotation
needed for a one-off baseline.

## Removing it once the baseline is captured

This is meant to be temporary — no permanent monitoring dependency. To pull it
out:

1. Delete `server/freshr/perf_logging.py`.
2. In `server/freshr/settings.py`: remove `'freshr.perf_logging.RequestPerfLoggingMiddleware',`
   from `MIDDLEWARE`, and remove the `perf_file` handler + `perf` logger entries
   from `LOGGING`.
3. In `client/web/nginx.conf`: remove the `log_format perf ...` block above
   `server {}` and the `access_log ... perf;` line inside it.
4. In `docker-compose.prod.yml` and `docker-compose.staging.yml`: remove the
   `perf_logs_{env}` / `nginx_perf_logs_{env}` volume mounts (on `web` and
   `frontend`), the `PERF_LOG_DIR` env var, and the two volume declarations
   at the bottom of each file.
5. Deploy, then free the actual disk space — compose volume names are
   prefixed with the project name (`-p freshr-prod` / `-p freshr-staging` per
   each compose file's header comment), so find the exact names rather than
   guessing:
   ```bash
   docker volume ls | grep perf_logs
   docker volume rm <names from above>
   ```
6. Delete this file (`PERF_BASELINE.md`).
