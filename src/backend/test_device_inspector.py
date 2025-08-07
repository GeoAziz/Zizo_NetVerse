import requests

API = "http://localhost:8000/api/v1"

def test_get_device():
    r = requests.get(f"{API}/devices/example-device-id")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "example-device-id"
    assert "enrichment" in data

def test_shutdown_device():
    r = requests.post(f"{API}/control/shutdown-device", json={"device_id": "example-device-id"})
    assert r.status_code == 200
    assert r.json()["status"] == "success"

def test_isolate_device():
    r = requests.post(f"{API}/control/isolate-device", json={"device_id": "example-device-id"})
    assert r.status_code == 200
    assert r.json()["status"] == "success"

def test_block_device():
    r = requests.post(f"{API}/control/block-device", json={"device_id": "example-device-id"})
    assert r.status_code == 200
    assert r.json()["status"] == "success"
