import requests

url = "http://127.0.0.1:8000/notebooks/file/delete/2/"

response = requests.delete(url)

print(response.status_code)  # should print 204
