import psycopg2
import logging
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection parameters (replace with your config)
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'your_db',
    'user': 'your_user',
    'password': 'your_password'
}

def analyze_slow_queries(threshold_ms=1000):
    """
    Analyze slow queries from pg_stat_statements.
    - threshold_ms: Queries taking longer than this are flagged.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query pg_stat_statements for slow queries
        query = """
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements
        WHERE mean_time > %s
        ORDER BY mean_time DESC
        LIMIT 20;
        """
        cursor.execute(query, (threshold_ms,))
        results = cursor.fetchall()
        
        logger.info(f"Found {len(results)} slow queries (threshold: {threshold_ms}ms)")
        for row in results:
            logger.info(f"Query: {row['query'][:100]}... | Mean Time: {row['mean_time']:.2f}ms | Calls: {row['calls']}")
            
            # Run EXPLAIN for optimization suggestions
            explain_query = f"EXPLAIN (ANALYZE, BUFFERS) {row['query']}"
            cursor.execute(explain_query)
            explain_result = cursor.fetchall()
            logger.info(f"EXPLAIN: {explain_result}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error analyzing queries: {e}")

if __name__ == "__main__":
    analyze_slow_queries()