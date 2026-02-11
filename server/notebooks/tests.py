from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Notebook
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile

class NotebookAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/notebooks/create/"

    def test_create_notebook(self):
        data = {"title" : "test notebook"}
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notebook.objects.count(), 1)
        notebook = Notebook.objects.first()
        self.assertEqual(notebook.title, "test notebook")
        self.assertIn("id", response.data)


class NotebookFileCreateAPITestCase(TestCase):
    def setUp(self):
        self.url = reverse("notebooks:file-create")
        self.notebook = Notebook.objects.create(title="Test Notebook")

    def test_create_notebook_file(self):
        test_file = SimpleUploadedFile(
                "test.pdf",
                b"Test content type",
                content_type="application/pdf"
                )

        data = {
                "notebook_id": self.notebook.id,
                "file": test_file
                }
        response = self.client.post(
                self.url,
                data,
                format="multiprt"
                )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
