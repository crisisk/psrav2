import unittest
from unittest.mock import patch, MagicMock
from tenacity import CircuitBreakerOpen
from app.resilience.circuit_breaker import get_circuit_breaker, get_metrics
from app.resilience.retry_policy import with_retry_and_circuit
from app.resilience.fallback_handlers import get_fallback

class TestCircuitBreakers(unittest.TestCase):
    
    def test_circuit_breaker_states(self):
        breaker = get_circuit_breaker("database")
        self.assertEqual(breaker.state, "closed")  # Initially closed
        
        # Simulate failures
        for _ in range(5):
            try:
                breaker.call(lambda: (_ for _ in ()).throw(Exception("Test failure")))
            except Exception:
                pass
        self.assertEqual(breaker.state, "open")
        
        # Wait for recovery (mock time if needed, or test half-open logic)
    
    def test_retry_with_idempotency(self):
        @with_retry_and_circuit("database", idempotency_key="test_key")
        def failing_func():
            raise Exception("Fail")
        
        with self.assertRaises(Exception):
            failing_func()
        
        # Second call with same key should skip (idempotency)
        with patch('app.resilience.retry_policy.logger') as mock_logger:
            failing_func()  # Should log warning and stop
            mock_logger.warning.assert_called()
    
    def test_fallback_handlers(self):
        fallback = get_fallback("database")
        result = fallback("SELECT * FROM test")
        self.assertEqual(result, [])
        
        fallback = get_fallback("unknown")
        result = fallback()
        self.assertEqual(result, {"error": "Unknown service"})
    
    def test_metrics(self):
        breaker = get_circuit_breaker("redis")
        # Simulate success
        breaker.call(lambda: "success")
        metrics = get_metrics("redis")
        self.assertEqual(metrics["success"], 1)

if __name__ == "__main__":
    unittest.main()