import requests

url = "http://127.0.0.1:8000/notebooks/generate_quiz/"
data = {
    "notebook_id": 2
}

response = requests.post(url, json=data)

print(response.status_code)
print(response.json())
