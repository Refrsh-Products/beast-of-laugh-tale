from ..models import NotebookFile
from pathlib import Path

class NotebookFileService:
    @staticmethod
    def add_notebook_file(notebook, uploaded_file):
        try:
            file_name = Path(uploaded_file.name).name
            file_type = file_name.split(".")[-1]
            notebook_file = NotebookFile.objects.create(
                    notebook=notebook,
                    name=file_name,
                    file=uploaded_file,
                    file_type=file_type
                    )
            notebook_file.file_url = notebook_file.file.url
            notebook_file.save(update_fields=["file_url"])
            return notebook_file
        except Exception as err:
            print("[Notebook File Service] Error: ", str(err))
            raise
