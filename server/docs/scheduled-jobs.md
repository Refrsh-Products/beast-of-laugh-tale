# Scheduled Jobs (Subscription Expiry Cron)

## Overview

Freshr has one recurring maintenance job in production: **downgrading paid
accounts once their subscription end date passes.** A user who paid for the
`PAID` tier keeps their higher limits until `subscription_end_date`; after that
they must fall back to `FREE`. Nothing in a normal request cycle does this, so a
scheduled job sweeps for expired subscriptions and downgrades them.

The task lives at `accounts/tasks.py :: expire_subscriptions` and the downgrade
logic at `accounts/services/downgrade.py :: downgrade_account_to_free`.

---

## Two ways it can be scheduled

There are **two** wiring options in the codebase, and it is important to know
which one is actually running.

### 1. Celery Beat (declared, not the production driver)

`freshr/settings.py` declares a Beat schedule:

```python
CELERY_BEAT_SCHEDULE = {
    "expire-subscriptions": {
        "task": "accounts.tasks.expire_subscriptions",
        "schedule": crontab(minute=0),  # every hour on the hour
    }
}
```

This only takes effect if a **Celery Beat** process is running alongside the
worker. If Beat is not deployed, this entry does nothing.

### 2. Host crontab (the production driver)

To avoid running a separate always-on Beat process (resource cost on a single
VPS), production instead calls the task **synchronously** from the host's
`crontab`, executing it inside the running web container:

```cron
# m h dom mon dow  command
# Hourly: downgrade accounts whose paid subscription has expired.
0 * * * * docker exec freshr-prod-web-1 python manage.py shell -c "from accounts.tasks import expire_subscriptions; expire_subscriptions()" >> /var/log/freshr-expire-subscriptions.log 2>&1
```

Notes on this line:

- It runs **every hour on the hour** (`0 * * * *`).
- `docker exec freshr-prod-web-1` runs the command inside the production web
  container, so the code and DB settings match the app exactly.
- Calling `expire_subscriptions()` directly (not `.delay()`) runs it **in the
  cron process**, not on a Celery worker — no broker, no worker required.
- `>> ... 2>&1` appends **stdout and stderr** to
  `/var/log/freshr-expire-subscriptions.log`, which is where you look to confirm
  it ran.

> The container name `freshr-prod-web-1` is Docker Compose's generated name
> (`<project>-<service>-<n>`). If a redeploy changes the project name or scales
> the service, this name can change and the `docker exec` will fail with
> `Error: No such container` — see [Troubleshooting](#troubleshooting).

---

## What the job does

`expire_subscriptions` (`accounts/tasks.py`):

1. Selects every account with `tier_plan = PAID` and `subscription_end_date`
   in the past.
2. For each, re-checks the condition inside a `select_for_update()`
   transaction (guards against a concurrent renewal) and calls
   `downgrade_account_to_free`, which sets `tier_plan = FREE`,
   `subscription_status = EXPIRED`, and archives any notebooks over the free
   limit (`accounts/services/downgrade.py`).
3. Emits a heartbeat log line and returns the number downgraded.

Because the downgrade also flips `subscription_status` to `EXPIRED`, an account
is only swept **once** — subsequent runs no longer match it.

---

## Observability

### Heartbeat log

Every run logs a summary line (even when nothing was due), so the log file is a
**positive signal the job executed**, not just silence on success:

```json
{"level": "INFO", "logger": "accounts.tasks", "message": "expire_subscriptions: downgraded 0 of 0 expired PAID account(s)", "time": "..."}
```

Check the most recent runs:

```sh
grep expire_subscriptions /var/log/freshr-expire-subscriptions.log | tail
```

A healthy log shows one such line roughly every hour. (The
`NN objects imported automatically` line that also appears is just Django
shell's harmless auto-import banner.)

### Health-check command

`python manage.py check_expired_subscriptions` reports any `PAID` account that is
past its end date **beyond a grace window** — i.e. one that *should* already have
been downgraded but wasn't. It exits `0` when clean and `1` (with the offending
account IDs) when something is stuck, so it can drive an alert.

```sh
docker exec freshr-prod-web-1 python manage.py check_expired_subscriptions
# OK: no overdue PAID accounts        -> exit 0
# STALE: 2 overdue PAID account(s):   -> exit 1
```

The grace window defaults to 90 minutes (the hourly sweep plus slack) so an
account that expired minutes ago and is simply waiting for the next top-of-hour
run does not false-alarm. Override with `--grace-minutes N`.

### Optional: alert-only cron

Because cron only reports a job that exits **non-zero**, adding a second crontab
line turns the health check into a silent watchdog that only speaks up when the
sweep has fallen behind. It runs 5 minutes after the sweep and costs one extra
short-lived `docker exec` per hour:

```cron
# Health check 5 min after the sweep; only produces output when accounts are stuck.
5 * * * * docker exec freshr-prod-web-1 python manage.py check_expired_subscriptions >> /var/log/freshr-expire-check.log 2>&1
```

---

## Verifying by hand

Independent of the logs, right after any hour boundary there should be **no**
`PAID` account sitting past its end date. Confirm directly against the DB:

```sh
docker exec freshr-prod-web-1 python manage.py shell -c "
from django.utils import timezone
from accounts.models import Account, TierPlan
stale = Account.objects.filter(tier_plan=TierPlan.PAID, subscription_end_date__lt=timezone.now())
print('overdue PAID accounts:', stale.count())
"
```

You can also force a run at any time:

```sh
docker exec freshr-prod-web-1 python manage.py shell -c "from accounts.tasks import expire_subscriptions; print(expire_subscriptions())"
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `syslog` shows the cron firing, but log file has tracebacks | `Error: No such container` — container renamed/recreated on redeploy | Update the container name in `crontab -e` (check `docker ps`). |
| No heartbeat lines in the log at all | Deployed image predates the logging change | Rebuild/redeploy the `web` image — the container runs baked-in code, not the working tree. |
| `check_expired_subscriptions` reports STALE accounts | Sweep not running, or erroring inside the container | Inspect `/var/log/freshr-expire-subscriptions.log`; run the task by hand (above) and read the traceback. |
| Job runs but nothing downgrades when it should | Clock/timezone mismatch, or `subscription_end_date` not set | Confirm `timezone.now()` vs the stored end dates in a shell. |

---

## Changing the schedule

- **Host crontab (production):** `crontab -e` on the server. Cron uses the
  system daemon's timezone — confirm with `timedatectl`.
- **Celery Beat (if adopted):** edit `CELERY_BEAT_SCHEDULE` in
  `freshr/settings.py` and run a Beat process. Note `crontab(minute=0)` there is
  Celery's schedule helper, unrelated to the host crontab.
