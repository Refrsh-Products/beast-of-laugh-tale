"""
Reset stuck NotebookFile rows and re-dispatch their ingestion tasks.

Typical use — recover the files wedged in PROCESSING after the asyncio-Semaphore
event-loop bug, once the worker is running fixed code:

    # See what would be requeued (no writes, no dispatch):
    python manage.py requeue_ingestion --stuck --dry-run

    # Requeue everything stuck in PROCESSING:
    python manage.py requeue_ingestion --stuck

    # Requeue specific files by id:
    python manage.py requeue_ingestion --ids <uuid1> <uuid2>

    # Also cover ones already marked FAILED:
    python manage.py requeue_ingestion --stuck --include-failed
"""
from django.core.management.base import BaseCommand, CommandError

from notebooks.models import NotebookFile
from rag.tasks import ingest_note_task


class Command(BaseCommand):
    help = "Reset stuck/failed NotebookFile rows to PENDING and re-dispatch ingestion."

    def add_arguments(self, parser):
        parser.add_argument(
            "--ids",
            nargs="+",
            default=[],
            metavar="UUID",
            help="Specific NotebookFile ids to requeue.",
        )
        parser.add_argument(
            "--stuck",
            action="store_true",
            help="Select every file currently in PROCESSING.",
        )
        parser.add_argument(
            "--include-failed",
            action="store_true",
            help="With --stuck, also select files in FAILED.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without writing or dispatching.",
        )

    def handle(self, *args, **opts):
        ids = opts["ids"]
        stuck = opts["stuck"]
        include_failed = opts["include_failed"]
        dry_run = opts["dry_run"]

        if not ids and not stuck:
            raise CommandError("Pass --ids <uuid ...> and/or --stuck to select files.")

        # Build the selection.
        qs = NotebookFile.objects.none()
        if stuck:
            statuses = [NotebookFile.IngestionStatus.PROCESSING]
            if include_failed:
                statuses.append(NotebookFile.IngestionStatus.FAILED)
            qs = NotebookFile.objects.filter(ingestion_status__in=statuses)
        if ids:
            qs = qs | NotebookFile.objects.filter(id__in=ids)

        # Snapshot the ids up front: after we flip status to PENDING the --stuck
        # filter would no longer match, so we must not re-evaluate the queryset.
        files = list(qs.distinct())
        if not files:
            self.stdout.write(self.style.WARNING("No matching files found."))
            return

        self.stdout.write(f"Selected {len(files)} file(s):")
        for f in files:
            self.stdout.write(f"  {f.id}  [{f.ingestion_status}]  {f.name}")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes, nothing dispatched."))
            return

        file_ids = [f.id for f in files]

        # 1) Reset status so the UI stops showing a stale PROCESSING/FAILED state and
        #    clear any old error. Single UPDATE, no per-row save.
        NotebookFile.objects.filter(id__in=file_ids).update(
            ingestion_status=NotebookFile.IngestionStatus.PENDING,
            ingestion_error="",
        )

        # 2) Re-dispatch the Celery task for each file.
        dispatched = 0
        for fid in file_ids:
            ingest_note_task.delay(str(fid))  # type: ignore[attr-defined]
            dispatched += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Reset {len(file_ids)} file(s) to PENDING and dispatched "
                f"{dispatched} ingestion task(s)."
            )
        )
