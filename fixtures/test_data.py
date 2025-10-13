"""
Test fixtures for PSRA-LTSD unit tests.
"""

import json
from datetime import datetime
from typing import Dict, List, Any

# Sample product data
SAMPLE_PRODUCT = {
    "name": "Electric Bicycle",
    "description": "Electric bicycle with aluminum frame and lithium-ion battery",
    "hs_code": "8711.60",
    "components": [
        {
            "name": "Aluminum Frame",
            "description": "Aluminum bicycle frame",
            "hs_code": "8714.91",
            "country_of_origin": "China",
            "value": 150.0,
            "weight": 5.0
        },
        {
            "name": "Lithium-ion Battery",
            "description": "36V 10Ah lithium-ion battery",
            "hs_code": "8507.60",
            "country_of_origin": "Japan",
            "value": 200.0,
            "weight": 2.5
        },
        {
            "name": "Electric Motor",
            "description": "250W electric hub motor",
            "hs_code": "8501.31",
            "country_of_origin": "Germany",
            "value": 100.0,
            "weight": 3.0
        },
        {
            "name": "Controller",
            "description": "Electric bicycle controller",
            "hs_code": "8537.10",
            "country_of_origin": "Taiwan",
            "value": 50.0,
            "weight": 0.5
        },
        {
            "name": "Wheels",
            "description": "26-inch bicycle wheels",
            "hs_code": "8714.92",
            "country_of_origin": "Vietnam",
            "value": 80.0,
            "weight": 4.0
        }
    ],
    "manufacturing_processes": [
        {
            "name": "Frame Assembly",
            "description": "Assembly of the bicycle frame",
            "country": "Netherlands",
            "value_added": 100.0
        },
        {
            "name": "Electrical System Integration",
            "description": "Integration of the battery, motor, and controller",
            "country": "Netherlands",
            "value_added": 150.0
        },
        {
            "name": "Final Assembly",
            "description": "Final assembly and testing of the bicycle",
            "country": "Netherlands",
            "value_added": 120.0
        }
    ],
    "total_value": 950.0,
    "total_weight": 15.0
}

# Sample trade agreements
SAMPLE_TRADE_AGREEMENTS = [
    {
        "name": "EU-Japan EPA",
        "countries": ["EU", "Japan"],
        "effective_date": "2019-02-01",
        "rules": {
            "8711.60": {
                "rule_type": "value_added",
                "threshold": 50.0
            }
        }
    },
    {
        "name": "EU-Vietnam FTA",
        "countries": ["EU", "Vietnam"],
        "effective_date": "2020-08-01",
        "rules": {
            "8711.60": {
                "rule_type": "ctsh",
                "exceptions": ["8714.91", "8714.92"]
            }
        }
    }
]

# Sample component analysis
SAMPLE_COMPONENT_ANALYSIS = {
    "Aluminum Frame": {
        "is_originating": False,
        "confidence": 0.95,
        "reasoning": "The aluminum frame is manufactured in China, which is not part of the EU. There is no evidence of substantial transformation or value-added processes that would confer originating status."
    },
    "Lithium-ion Battery": {
        "is_originating": True,
        "confidence": 0.9,
        "reasoning": "The lithium-ion battery is manufactured in Japan, which has a trade agreement with the EU (EU-Japan EPA). Under this agreement, batteries of HS code 8507.60 are considered originating."
    },
    "Electric Motor": {
        "is_originating": True,
        "confidence": 0.98,
        "reasoning": "The electric motor is manufactured in Germany, which is part of the EU. Therefore, it is automatically considered originating for EU purposes."
    },
    "Controller": {
        "is_originating": False,
        "confidence": 0.85,
        "reasoning": "The controller is manufactured in Taiwan, which does not have a comprehensive trade agreement with the EU that would confer originating status to this component."
    },
    "Wheels": {
        "is_originating": False,
        "confidence": 0.9,
        "reasoning": "The wheels are manufactured in Vietnam. While there is an EU-Vietnam FTA, the specific rules of origin for HS code 8714.92 require more processing than what is indicated in the data."
    }
}

# Sample manufacturing analysis
SAMPLE_MANUFACTURING_ANALYSIS = {
    "Frame Assembly": {
        "is_substantial_transformation": False,
        "confidence": 0.8,
        "reasoning": "Frame assembly alone does not constitute substantial transformation as it does not result in a change in tariff classification or meet the value-added threshold."
    },
    "Electrical System Integration": {
        "is_substantial_transformation": True,
        "confidence": 0.9,
        "reasoning": "The integration of the battery, motor, and controller constitutes substantial transformation as it changes the essential character of the components, resulting in a new product with different functionality."
    },
    "Final Assembly": {
        "is_substantial_transformation": True,
        "confidence": 0.95,
        "reasoning": "Final assembly and testing completes the transformation from components to a finished electric bicycle, changing the tariff classification from components to a complete vehicle."
    }
}

# Sample origin determination
SAMPLE_ORIGIN_DETERMINATION = {
    "country_of_origin": "Netherlands",
    "confidence": 0.92,
    "reasoning": "The substantial transformation rule applies. The manufacturing processes in the Netherlands (particularly the electrical system integration and final assembly) constitute substantial transformation, changing the essential character of the components into a new product (electric bicycle).",
    "rule_applied": "Substantial transformation rule",
    "components_analysis": {
        "summary": "3 out of 5 components by value are non-originating",
        "originating_value_percentage": 31.6,
        "key_factors": ["EU origin of motor", "Japan origin of battery with EPA"]
    },
    "manufacturing_analysis": {
        "summary": "Substantial transformation occurs in the Netherlands",
        "substantial_transformation": True,
        "key_processes": ["Electrical System Integration", "Final Assembly"]
    }
}

# Sample preferential status
SAMPLE_PREFERENTIAL_STATUS = [
    {
        "agreement": "EU-Japan EPA",
        "is_preferential": True,
        "confidence": 0.85,
        "reasoning": "Under the EU-Japan EPA, the electric bicycle qualifies for preferential treatment because it undergoes substantial transformation in the Netherlands (EU) and incorporates a significant Japanese component (battery) that is considered originating under the agreement.",
        "documentation_required": ["EUR.1 Movement Certificate", "Supplier's Declaration", "Commercial Invoice Declaration"]
    },
    {
        "agreement": "EU-Vietnam FTA",
        "is_preferential": False,
        "confidence": 0.9,
        "reasoning": "Under the EU-Vietnam FTA, the electric bicycle does not qualify for preferential treatment because it does not meet the specific rule of origin for HS code 8711.60, which requires that all non-originating materials of headings 8714.91 and 8714.92 be substantially transformed. The bicycle uses non-originating wheels from Vietnam without sufficient transformation.",
        "documentation_required": []
    }
]

# Sample origin report
SAMPLE_ORIGIN_REPORT = {
    "product": SAMPLE_PRODUCT,
    "origin": SAMPLE_ORIGIN_DETERMINATION,
    "preferential_status": SAMPLE_PREFERENTIAL_STATUS,
    "timestamp": datetime.now().isoformat(),
    "calculation_time_ms": 1250,
    "version": "2.0.0"
}

# Sample workflow state
def create_sample_workflow_state(current_step: str = "initialized") -> Dict[str, Any]:
    """Create a sample workflow state for testing."""
    from langgraph.graph import StateGraph, END
    
    # Import here to avoid circular imports
    import sys
    sys.path.append("/home/ubuntu/sevensa_implementation/kubernetes_migration/services/psra/langgraph")
    from origin_calculation_graph import Product, TradeAgreement, Component, ManufacturingProcess
    
    # Create product from sample data
    product = Product(**SAMPLE_PRODUCT)
    
    # Create trade agreements from sample data
    trade_agreements = [TradeAgreement(**ta) for ta in SAMPLE_TRADE_AGREEMENTS]
    
    # Create the initial state
    state = {
        "product": product,
        "trade_agreements": trade_agreements,
        "component_analysis": SAMPLE_COMPONENT_ANALYSIS if current_step != "initialized" else None,
        "manufacturing_analysis": SAMPLE_MANUFACTURING_ANALYSIS if current_step in ["manufacturing_analyzed", "origin_determined", "preferential_status_verified", "report_generated"] else None,
        "origin_determination": SAMPLE_ORIGIN_DETERMINATION if current_step in ["origin_determined", "preferential_status_verified", "report_generated"] else None,
        "preferential_status": SAMPLE_PREFERENTIAL_STATUS if current_step in ["preferential_status_verified", "report_generated"] else None,
        "current_step": current_step,
        "errors": [],
        "start_time": datetime.now().timestamp(),
        "checkpoints": {},
        "report": SAMPLE_ORIGIN_REPORT if current_step == "report_generated" else None
    }
    
    return state

# Mock LLM responses
MOCK_LLM_RESPONSES = {
    "analyze_components": json.dumps(SAMPLE_COMPONENT_ANALYSIS),
    "analyze_manufacturing": json.dumps(SAMPLE_MANUFACTURING_ANALYSIS),
    "determine_origin": json.dumps(SAMPLE_ORIGIN_DETERMINATION),
    "verify_preferential_status": json.dumps(SAMPLE_PREFERENTIAL_STATUS)
}
