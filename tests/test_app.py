import urllib.parse

from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "testuser+pytest@example.com"
    quoted_activity = urllib.parse.quote(activity, safe="")
    quoted_email = urllib.parse.quote(email, safe="")

    # Signup
    resp = client.post(f"/activities/{quoted_activity}/signup?email={quoted_email}")
    assert resp.status_code == 200
    assert email in resp.json().get("message", "")

    # Verify participant present
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    data = resp2.json()
    assert email in data[activity]["participants"]

    # Unregister
    resp3 = client.delete(f"/activities/{quoted_activity}/participants?email={quoted_email}")
    assert resp3.status_code == 200
    assert email in resp3.json().get("message", "")

    # Verify removed
    resp4 = client.get("/activities")
    assert email not in resp4.json()[activity]["participants"]


def test_unregister_nonexistent():
    activity = "Chess Club"
    email = "nonexistent+pytest@example.com"
    quoted_activity = urllib.parse.quote(activity, safe="")
    quoted_email = urllib.parse.quote(email, safe="")

    resp = client.delete(f"/activities/{quoted_activity}/participants?email={quoted_email}")
    assert resp.status_code == 404
