import logging
from pathlib import Path

from ..models import NotebookFile

logger = logging.getLogger(__name__)

class NotebookFileService:
    @staticmethod
    def add_notebook_file(notebook, uploaded_file, file_size):
        try:
            file_name = Path(uploaded_file.name).name
            file_type = file_name.split(".")[-1]
            notebook_file = NotebookFile.objects.create(
                    notebook=notebook,
                    name=file_name,
                    file=uploaded_file,
                    file_size=file_size,
                    file_type=file_type
                    )
            notebook_file.file_url = notebook_file.file.url
            notebook_file.save(update_fields=["file_url"])
            return notebook_file
        except Exception as err:
            logger.exception("Error uploading a file to the notebook: error=%s ", str(err))
            raise
