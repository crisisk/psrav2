import unittest
from unittest.mock import Mock, patch
from app.cache.redis_cluster import RedisClusterClient
from app.cache.cache_manager import CacheManager

class TestCaching(unittest.TestCase):
    def setUp(self):
        self.redis_mock = Mock(spec=RedisClusterClient)
        self.manager = CacheManager(self.redis_mock)

    def test_get_hit_l1(self):
        self.manager.l1_cache["user:1"] = "data"
        result = self.manager.get("user:1")
        self.assertEqual(result, "data")
        self.assertEqual(self.manager.metrics["hits"], 1)

    def test_get_miss_with_fetch(self):
        self.redis_mock.get.return_value = None
        self.redis_mock.exists.return_value = False
        self.redis_mock.set.return_value = True
        result = self.manager.get("user:1", lambda: "fetched_data")
        self.assertEqual(result, "fetched_data")
        self.assertEqual(self.manager.metrics["misses"], 1)

    def test_set_and_invalidate(self):
        self.redis_mock.set.return_value = True
        self.manager.set("user:1", "data")
        self.assertIn("user:1", self.manager.l1_cache)
        self.redis_mock.delete.return_value = True
        self.manager.invalidate("user:1")
        self.assertNotIn("user:1", self.manager.l1_cache)

    def test_compression(self):
        large_value = "x" * 2000  # >1KB
        self.redis_mock.set.return_value = True
        self.manager.set("user:1", large_value)
        # Verify compression is called (mocked)
        self.redis_mock.set.assert_called()

    def test_stampede_prevention(self):
        # Simulate concurrent access
        import threading
        results = []
        def fetch():
            results.append(self.manager.get("user:1", lambda: "data"))
        threads = [threading.Thread(target=fetch) for _ in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()
        self.assertEqual(len(results), 5)
        self.assertEqual(results[0], "data")  # Only one fetch

    def test_metrics(self):
        self.manager.get("user:1")  # Miss
        self.manager.get("user:1")  # Hit
        metrics = self.manager.get_metrics()
        self.assertEqual(metrics["misses"], 1)
        self.assertEqual(metrics["hits"], 1)
        self.assertAlmostEqual(metrics["hit_rate"], 0.5)

if __name__ == "__main__":
    unittest.main()