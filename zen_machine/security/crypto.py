"""Cryptographic utilities for secure communication between agents."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import json

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.backends import default_backend


class SecurityManager:
    """Manages cryptographic operations for agent communication."""
    
    def __init__(self, secret_key: bytes):
        self.secret_key = secret_key
        self.key_rotation_interval = timedelta(days=1)
        self.last_rotation = datetime.utcnow()
    
    def sign_message(self, message: Dict) -> str:
        """Sign a message with HMAC-SHA256."""
        message_str = json.dumps(message, sort_keys=True)
        signature = hmac.new(
            self.secret_key,
            message_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def verify_signature(self, message: Dict, signature: str) -> bool:
        """Verify message signature."""
        expected_signature = self.sign_message(message)
        return hmac.compare_digest(signature, expected_signature)
    
    def generate_session_key(self) -> bytes:
        """Generate a new session key for secure communication."""
        return secrets.token_bytes(32)
    
    def rotate_secret_key(self) -> bytes:
        """Rotate the secret key."""
        if datetime.utcnow() - self.last_rotation > self.key_rotation_interval:
            self.secret_key = secrets.token_bytes(32)
            self.last_rotation = datetime.utcnow()
        return self.secret_key
    
    def create_secure_payload(self, data: Dict, timestamp: Optional[datetime] = None) -> Dict:
        """Create a secure payload with signature and timestamp."""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        payload = {
            "data": data,
            "timestamp": timestamp.isoformat(),
            "nonce": secrets.token_hex(16)
        }
        
        signature = self.sign_message(payload)
        payload["signature"] = signature
        
        return payload
    
    def verify_secure_payload(self, payload: Dict, max_age: timedelta = timedelta(minutes=5)) -> bool:
        """Verify a secure payload."""
        try:
            # Check timestamp
            timestamp = datetime.fromisoformat(payload["timestamp"])
            if datetime.utcnow() - timestamp > max_age:
                return False
            
            # Verify signature
            signature = payload.pop("signature")
            is_valid = self.verify_signature(payload, signature)
            payload["signature"] = signature  # Restore signature
            
            return is_valid
            
        except (KeyError, ValueError):
            return False


class MutualTLSManager:
    """Manages mutual TLS certificates and verification."""
    
    def __init__(self, cert_path: str, key_path: str, ca_path: str):
        self.cert_path = cert_path
        self.key_path = key_path
        self.ca_path = ca_path
    
    def generate_self_signed_cert(self, common_name: str) -> Tuple[bytes, bytes]:
        """Generate a self-signed certificate for testing."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        public_key = private_key.public_key()
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        return private_pem, public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
    
    def verify_peer_certificate(self, cert_pem: bytes) -> bool:
        """Verify a peer certificate."""
        try:
            certificate = load_pem_x509_certificate(cert_pem, default_backend())
            # Add certificate verification logic
            return True
        except Exception:
            return False


class RateLimiter:
    """Rate limiting for API endpoints."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for identifier."""
        now = datetime.utcnow()
        
        # Clean old entries
        cutoff = now - timedelta(seconds=self.window_seconds)
        self.requests = {
            k: v for k, v in self.requests.items()
            if v > cutoff
        }
        
        # Count current requests
        current_requests = len([
            v for v in self.requests.values()
            if v > cutoff
        ])
        
        if current_requests >= self.max_requests:
            return False
        
        self.requests[identifier] = now
        return True
