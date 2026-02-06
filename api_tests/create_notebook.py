import requests

url = "http://127.0.0.1:8000/notebooks/create/"
data = {
    "title": "My Second Notebook"
}

response = requests.post(url, json=data)

print(response.status_code)
print(response.json())
