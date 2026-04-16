import django.db.models.deletion
import uuid
import pgvector.django
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("notebooks", "0002_alter_notebookfile_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotebookTopic",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("notebook", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="topics", to="notebooks.notebook")),
                ("name", models.CharField(max_length=255)),
                ("embedding", pgvector.django.VectorField(dimensions=3072)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddIndex(
            model_name="notebooktopic",
            index=models.Index(fields=["notebook"], name="rag_notebooktopic_notebook_idx"),
        ),
    ]
