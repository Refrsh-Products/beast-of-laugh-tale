from ..models import NotebookFile
from ..models import Notebook
from pathlib import Path
from django.shortcuts import get_object_or_404
import pymupdf

class NotebookFileService:
    @staticmethod
    def add_notebook_file(notebook, uploaded_file):
        try:
            file_name = Path(uploaded_file.name).name
            file_type = file_name.split(".")[-1]
            NotebookFile.objects.create(
                    notebook=notebook,
                    name=file_name,
                    file=uploaded_file,
                    content="",
                    file_type=file_type
                    )
            return True
        except Exception:
            return False



class ContentReaderService:

    def __init__(self):
        pass

    def _read_pdf(self, path):
        content = ""

        with pymupdf.open(path) as doc:
            for page in doc:
                content += page.get_text()

        return content


    def read_content_of(self, notebook_id):
        notebook = get_object_or_404(Notebook, id=notebook_id)
        notebook_files = notebook.files.all()

        reader_map = {
                "pdf": self._read_pdf
                }

        content_map = {}

        for notebook_file in notebook_files:
            name = notebook_file.name
            content = ""


            if len(notebook_file.content) != 0:
                content = notebook_file.content
            else:
                path = notebook_file.file.path
                file_type = notebook_file.file_type
                content = reader_map[file_type](path=path)

            content_map[name] = content

        return content_map









