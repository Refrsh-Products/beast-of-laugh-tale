from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Notebook

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

