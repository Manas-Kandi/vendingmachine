"""LLM interface for Zen Agent using a unified remote API."""

import json
from typing import Dict, Optional

from zen_machine.core.llm_interface import UnifiedLLMInterface

class ZenLLMInterface(UnifiedLLMInterface):
    """Interface to a remote LLM for Zen Agent reasoning."""

    def __init__(self):
        system_prompt = """You are Zen, a calm vending-machine operator.
Observe sales, inventory, weather, foot-traffic, electricity cost.
Output only JSON:
{ "prices": {"sku_id": price, ...}, "order": {"sku_id": quantity, ...}, "expedite": bool, "thought": "one-sentence why" }
Goals: maximize margin, avoid stock-out, minimise spoilage, stay legal.
Price bounds: [0.95×MSRP, 1.05×MSRP].
Never mention adversary or chaos; stay serene."""
        super().__init__(system_prompt=system_prompt)

    def _create_prompt(self, context: Dict) -> str:
        """Create a formatted prompt for the Zen LLM."""
        return f"""Current Context:
Inventory: {json.dumps(context['inventory'], indent=2)}
Environment: {json.dumps(context['environment'], indent=2)}
Demand Forecasts: {json.dumps(context['demand_forecasts'], indent=2)}

Based on this context, provide your decision in JSON format:"""

    def _validate_decision(self, decision: Dict, context: Dict) -> Optional[Dict]:
        """Validate the LLM's decision against constraints."""
        try:
            required_keys = ["prices", "order", "expedite", "thought"]
            if not all(key in decision for key in required_keys):
                return None

            sku_list = context["inventory"]["stock_levels"].keys()
            for sku_id in decision.get("prices", {}):
                if sku_id not in sku_list:
                    continue

            for sku_id, qty in decision.get("order", {}).items():
                if not isinstance(qty, int) or qty < 0:
                    decision["order"][sku_id] = 0

            if not isinstance(decision.get("expedite"), bool):
                decision["expedite"] = False

            if not isinstance(decision.get("thought"), str):
                decision["thought"] = "Optimized based on current conditions."

            return decision
        except Exception:
            return None