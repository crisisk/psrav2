from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class MLServiceMock:
    """
    Mock service simulating the functionality of the v5.6 ML Stack components:
    - Embed/Qdrant (for RAG/Rule Retrieval)
    - Classify (for Judge-Model/Pre-processing)
    """
    
    def get_rule_embeddings(self, input_text: str) -> List[Dict[str, Any]]:
        """
        Simulates the 'embed' service and Qdrant retrieval.
        Retrieves relevant rule snippets based on product description/HS code.
        """
        logger.info(f"Simulating Qdrant retrieval for: {input_text[:30]}...")
        
        # Mock rule snippets with relevance scores
        return [
            {"snippet": "Rule 4: Change of Tariff Heading (CTH) applies to HS 39.17.", "relevance": 0.95},
            {"snippet": "Rule 3: Value-Added (VA) threshold is 50% for HS 40.16.", "relevance": 0.88},
            {"snippet": "General Rule 1: Wholly Obtained (WO) applies to raw materials.", "relevance": 0.75},
        ]

    def classify_product_relevance(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates the 'classify' service.
        Classifies product data for relevance (e.g., HS39/HS40) and data quality.
        """
        logger.info(f"Simulating classification for product: {product_data.get('product_name')}")
        
        # Mock classification results
        if "Polymer" in product_data.get("product_name", ""):
            return {
                "hs_sector_match": "HS39 (Plastics)",
                "confidence": 0.98,
                "data_quality_score": 0.90,
                "is_complex_case": True
            }
        else:
            return {
                "hs_sector_match": "HS40 (Rubber)",
                "confidence": 0.95,
                "data_quality_score": 0.85,
                "is_complex_case": False
            }

# Singleton instance
ml_service_mock = MLServiceMock()

