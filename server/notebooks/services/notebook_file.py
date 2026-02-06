from ..models import NotebookFile
from pathlib import Path

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
