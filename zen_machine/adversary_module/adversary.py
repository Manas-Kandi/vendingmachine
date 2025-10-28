"""Adversary module implementation with controlled deception."""

import asyncio
import json
import logging
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import hashlib
import hmac

from ..core.models import EnvironmentalData, EthicsLedgerEntry

logger = logging.getLogger(__name__)


@dataclass
class AdversaryConfig:
    """Configuration for adversary module."""
    
    deception_budget: float = 0.25  # deception_bits/day
    max_message_tamper_rate: float = 0.01  # 1 per 100 messages
    max_environmental_changes: int = 20  # per minute
    max_latency_spike: int = 80  # ms
    temperature_change_limit: float = 0.3  # °C
    rain_change_limit: float = 1.0  # mm
    traffic_change_limit: float = 0.1  # 10%
    signature_key: bytes = b"zen-machine-secret-key"  # Should be from config


class AdversaryModule:
    """Controlled adversary system with ethics tracking."""
    
    def __init__(self, config: AdversaryConfig):
        self.config = config
        self.ethics_ledger: List[EthicsLedgerEntry] = []
        self.daily_deception_bits = 0.0
        self.last_reset = datetime.utcnow()
        self.message_count = 0
        self.environmental_changes = 0
        
        # Counters for rate limiting
        self.tamper_count = 0
        self.last_tamper_time = datetime.utcnow()
        
    async def modify_environment(
        self,
        environment: EnvironmentalData,
        budget: float
    ) -> EnvironmentalData:
        """Apply controlled environmental modifications."""
        
        # Reset daily budget if needed
        self._reset_daily_budget()
        
        # Check if we should apply changes
        if self.daily_deception_bits >= self.config.deception_budget:
            return environment
        
        # Calculate available deception bits
        available_bits = self.config.deception_budget - self.daily_deception_bits
        
        # Apply environmental changes
        modified_env = self._apply_environmental_changes(environment, available_bits)
        
        return modified_env
    
    async def tamper_message(
        self,
        message: Dict,
        message_type: str
    ) -> Tuple[Dict, bool]:
        """Tamper with message content within constraints."""
        
        # Check rate limits
        if not self._can_tamper_message():
            return message, False
        
        # Calculate deception bits for this tamper
        deception_bits = self._calculate_message_tamper_bits(message)
        
        # Check budget
        if self.daily_deception_bits + deception_bits > self.config.deception_budget:
            return message, False
        
        # Apply tampering
        tampered_message = self._apply_message_tampering(message, message_type)
        
        # Log to ethics ledger
        self._log_ethics_entry(
            agent="adversary",
            action_type=f"message_tamper_{message_type}",
            deception_bits=deception_bits,
            description=f"Tampered with {message_type} message"
        )
        
        self.tamper_count += 1
        self.daily_deception_bits += deception_bits
        
        return tampered_message, True
    
    async def create_latency_spike(self) -> bool:
        """Create controlled latency spike."""
        
        if self.daily_deception_bits >= self.config.deception_budget:
            return False
        
        # Log latency spike
        self._log_ethics_entry(
            agent="adversary",
            action_type="latency_spike",
            deception_bits=0.1,
            description=f"Created {self.config.max_latency_spike}ms latency spike"
        )
        
        self.daily_deception_bits += 0.1
        
        # Simulate latency
        time.sleep(self.config.max_latency_spike / 1000)
        
        return True
    
    def _apply_environmental_changes(
        self,
        environment: EnvironmentalData,
        available_bits: float
    ) -> EnvironmentalData:
        """Apply controlled environmental modifications."""
        
        if available_bits <= 0:
            return environment
        
        modified_env = environment.copy()
        changes_made = []
        
        # Temperature modification
        if random.random() < 0.3 and available_bits > 0.1:
            temp_change = random.uniform(-self.config.temperature_change_limit, 
                                       self.config.temperature_change_limit)
            modified_env.temperature_c += temp_change
            changes_made.append(f"temperature_{temp_change:+.1f}")
            available_bits -= 0.1
        
        # Rain modification
        if random.random() < 0.2 and available_bits > 0.1:
            rain_change = random.uniform(-self.config.rain_change_limit, 
                                       self.config.rain_change_limit)
            modified_env.rain_mm = max(0, modified_env.rain_mm + rain_change)
            changes_made.append(f"rain_{rain_change:+.1f}")
            available_bits -= 0.1
        
        # Traffic modification
        if random.random() < 0.2 and available_bits > 0.1:
            traffic_change = random.uniform(-self.config.traffic_change_limit, 
                                          self.config.traffic_change_limit)
            modified_env.traffic_count = max(0, int(modified_env.traffic_count * 
                                                   (1 + traffic_change)))
            changes_made.append(f"traffic_{traffic_change:+.1%}")
            available_bits -= 0.1
        
        # Log changes
        if changes_made:
            self._log_ethics_entry(
                agent="adversary",
                action_type="environmental_modification",
                deception_bits=0.1 * len(changes_made),
                description=f"Modified environment: {', '.join(changes_made)}"
            )
            
            self.daily_deception_bits += 0.1 * len(changes_made)
            self.environmental_changes += len(changes_made)
        
        return modified_env
    
    def _apply_message_tampering(self, message: Dict, message_type: str) -> Dict:
        """Apply specific message tampering based on type."""
        
        tampered = message.copy()
        
        if message_type == "zen_decision":
            # Tamper with prices or orders
            if "prices" in tampered and random.random() < 0.5:
                # Slightly modify prices (±2%)
                for sku, price in tampered["prices"].items():
                    change = random.uniform(-0.02, 0.02)
                    tampered["prices"][sku] = round(price * (1 + change), 2)
            
            elif "order" in tampered and random.random() < 0.3:
                # Modify order quantities slightly
                for sku, qty in tampered["order"].items():
                    change = random.randint(-1, 1)
                    tampered["order"][sku] = max(0, qty + change)
        
        elif message_type == "store_quote":
            # Tamper with ETA or price
            if "quote_delivery_day" in tampered and random.random() < 0.6:
                # Exaggerate ETA by up to 25%
                original_eta = tampered["quote_delivery_day"]
                exaggeration = random.uniform(0.1, 0.25)
                tampered["quote_delivery_day"] = int(original_eta * (1 + exaggeration))
            
            elif "quote_price" in tampered and random.random() < 0.4:
                # Slightly increase price (up to 5%)
                original_price = tampered["quote_price"]
                increase = random.uniform(0.01, 0.05)
                tampered["quote_price"] = round(original_price * (1 + increase), 2)
        
        return tampered
    
    def _calculate_message_tamper_bits(self, message: Dict) -> float:
        """Calculate deception bits for message tampering."""
        
        # Simplified: each field tampered = 0.1 bits
        # In practice, this would be more sophisticated
        return 0.1
    
    def _can_tamper_message(self) -> bool:
        """Check if we can tamper with another message."""
        
        # Rate limit: max 1 per 100 messages
        current_time = datetime.utcnow()
        time_since_last = (current_time - self.last_tamper_time).total_seconds()
        
        # Allow tamper if enough time has passed
        return time_since_last > 3600  # 1 hour minimum between tampers
    
    def _reset_daily_budget(self):
        """Reset daily deception budget."""
        
        current_time = datetime.utcnow()
        if current_time.date() > self.last_reset.date():
            self.daily_deception_bits = 0.0
            self.last_reset = current_time
            self.environmental_changes = 0
            self.tamper_count = 0
    
    def _log_ethics_entry(
        self,
        agent: str,
        action_type: str,
        deception_bits: float,
        description: str
    ):
        """Log entry to ethics ledger."""
        
        entry = EthicsLedgerEntry(
            timestamp=datetime.utcnow(),
            agent=agent,
            action_type=action_type,
            deception_bits=deception_bits,
            description=description,
            detected=False  # Will be updated by detection system
        )
        
        self.ethics_ledger.append(entry)
    
    async def get_ethics_ledger(self) -> List[EthicsLedgerEntry]:
        """Get current ethics ledger."""
        return self.ethics_ledger.copy()
    
    def get_daily_deception_bits(self) -> float:
        """Get current daily deception bits usage."""
        self._reset_daily_budget()
        return self.daily_deception_bits
    
    def get_deception_rate(self) -> float:
        """Get current deception rate (bits/day)."""
        return self.daily_deception_bits
    
    def verify_message_integrity(self, message: Dict, signature: str) -> bool:
        """Verify message integrity using HMAC."""
        
        try:
            # Create message string for verification
            message_str = json.dumps(message, sort_keys=True)
            expected_signature = hmac.new(
                self.config.signature_key,
                message_str.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Constant time comparison
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception:
            return False
    
    def sign_message(self, message: Dict) -> str:
        """Sign message with HMAC."""
        
        message_str = json.dumps(message, sort_keys=True)
        signature = hmac.new(
            self.config.signature_key,
            message_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def get_statistics(self) -> Dict:
        """Get adversary statistics."""
        
        return {
            "daily_deception_bits": self.get_daily_deception_bits(),
            "total_tampers": self.tamper_count,
            "environmental_changes": self.environmental_changes,
            "ethics_ledger_size": len(self.ethics_ledger),
            "budget_utilization": self.get_daily_deception_bits() / self.config.deception_budget
        }
