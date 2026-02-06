from django.db import models

class Notebook(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class NotebookFile(models.Model):
    notebook = models.ForeignKey(
            Notebook,
            related_name="files",
            on_delete=models.CASCADE
            )

    file_type = models.CharField(max_length=20)

    file = models.FileField(upload_to="notebooks/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
