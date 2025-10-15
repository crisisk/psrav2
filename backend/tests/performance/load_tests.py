from locust import HttpUser, task, between
import json

class APILoadTest(HttpUser):
    wait_time = between(1, 3)  # Simulate user think time

    @task(3)  # Weight: 3 (frequent task)
    def test_get_users(self):
        response = self.client.get("/users", headers={"Accept-Encoding": "gzip"})
        if response.status_code == 200:
            data = json.loads(response.text)
            # Assert performance: response time < 500ms
            assert response.elapsed.total_seconds() * 1000 < 500, "Response too slow"

    @task(1)
    def test_pagination(self):
        response = self.client.get("/users?cursor=100&limit=50")
        assert response.status_code == 200

    @task(1)
    def test_heavy_task(self):
        # Simulate async task trigger
        response = self.client.post("/async/heavy-compute", json={"data": "large_payload"})
        assert response.status_code == 202  # Accepted for async

# Run with: locust -f load_tests.py --host=http://localhost:8000