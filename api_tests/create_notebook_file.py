
import requests

url = "http://127.0.0.1:8000/notebooks/file/create"

# Example file to upload
files = {
    "file": open("/home/musa/Downloads/mid1_stuff.pdf", "rb")  # replace with your file path
}

# Notebook ID
data = {
    "notebook_id": 2  # replace with the actual notebook ID
}

response = requests.post(url, data=data, files=files)

# Print status and response
print(response.status_code)
print(response.json())
