import requests

API = "http://localhost:8000"

def test_health_check():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert "services" in data

def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()
