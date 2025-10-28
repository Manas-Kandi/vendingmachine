"""PostgreSQL database management for Zen Machine."""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Optional
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

logger = logging.getLogger(__name__)

Base = declarative_base()


class SimulationEvent(Base):
    """Table for storing simulation events."""
    
    __tablename__ = "simulation_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    simulation_id = Column(String(64), index=True)
    event_type = Column(String(50), index=True)
    agent = Column(String(20), index=True)
    data = Column(JSON)
    metadata = Column(JSON)


class InventoryState(Base):
    """Table for storing inventory states."""
    
    __tablename__ = "inventory_states"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    simulation_id = Column(String(64), index=True)
    sku_id = Column(String(50), index=True)
    stock_level = Column(Integer)
    spoilage_rate = Column(Float)
    days_since_restock = Column(Float)


class EthicsLedger(Base):
    """Table for ethics ledger entries."""
    
    __tablename__ = "ethics_ledger"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    simulation_id = Column(String(64), index=True)
    agent = Column(String(20), index=True)
    action_type = Column(String(50), index=True)
    deception_bits = Column(Float)
    description = Column(Text)
    detected = Column(Boolean, default=False)
    detection_method = Column(String(100))


class AgentMemory(Base):
    """Table for agent memory storage."""
    
    __tablename__ = "agent_memory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent = Column(String(20), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    memory_type = Column(String(50), index=True)
    data = Column(JSON)
    vector_embedding = Column(JSON)  # 384-d vector


class DatabaseManager:
    """Manages PostgreSQL database operations."""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = None
        self.session_factory = None
        
    async def initialize(self):
        """Initialize database connection and create tables."""
        
        try:
            # Create engine
            self.engine = create_async_engine(
                self.connection_string,
                echo=False,
                pool_size=20,
                max_overflow=30
            )
            
            # Create session factory
            self.session_factory = sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Create tables
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def store_event(
        self,
        simulation_id: str,
        event_type: str,
        agent: str,
        data: Dict,
        metadata: Optional[Dict] = None
    ) -> str:
        """Store a simulation event."""
        
        async with self.session_factory() as session:
            event = SimulationEvent(
                simulation_id=simulation_id,
                event_type=event_type,
                agent=agent,
                data=data,
                metadata=metadata or {}
            )
            
            session.add(event)
            await session.commit()
            
            return str(event.id)
    
    async def store_inventory_state(
        self,
        simulation_id: str,
        inventory_data: Dict
    ) -> None:
        """Store inventory state."""
        
        async with self.session_factory() as session:
            for sku_id, data in inventory_data.items():
                state = InventoryState(
                    simulation_id=simulation_id,
                    sku_id=sku_id,
                    stock_level=data.get("stock_level", 0),
                    spoilage_rate=data.get("spoilage_rate", 0.0),
                    days_since_restock=data.get("days_since_restock", 0.0)
                )
                session.add(state)
            
            await session.commit()
    
    async def store_ethics_entry(self, entry: Dict) -> str:
        """Store ethics ledger entry."""
        
        async with self.session_factory() as session:
            ethics_entry = EthicsLedger(
                simulation_id=entry.get("simulation_id", "default"),
                agent=entry["agent"],
                action_type=entry["action_type"],
                deception_bits=entry["deception_bits"],
                description=entry["description"],
                detected=entry.get("detected", False),
                detection_method=entry.get("detection_method")
            )
            
            session.add(ethics_entry)
            await session.commit()
            
            return str(ethics_entry.id)
    
    async def store_agent_memory(
        self,
        agent: str,
        memory_type: str,
        data: Dict,
        vector_embedding: Optional[List[float]] = None
    ) -> str:
        """Store agent memory."""
        
        async with self.session_factory() as session:
            memory = AgentMemory(
                agent=agent,
                memory_type=memory_type,
                data=data,
                vector_embedding=vector_embedding
            )
            
            session.add(memory)
            await session.commit()
            
            return str(memory.id)
    
    async def get_simulation_events(
        self,
        simulation_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        event_type: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict]:
        """Get simulation events with filtering."""
        
        async with self.session_factory() as session:
            query = session.query(SimulationEvent).filter(
                SimulationEvent.simulation_id == simulation_id
            )
            
            if start_time:
                query = query.filter(SimulationEvent.timestamp >= start_time)
            
            if end_time:
                query = query.filter(SimulationEvent.timestamp <= end_time)
            
            if event_type:
                query = query.filter(SimulationEvent.event_type == event_type)
            
            events = await query.order_by(SimulationEvent.timestamp.desc()).limit(limit).all()
            
            return [
                {
                    "id": str(e.id),
                    "timestamp": e.timestamp.isoformat(),
                    "event_type": e.event_type,
                    "agent": e.agent,
                    "data": e.data,
                    "metadata": e.metadata
                }
                for e in events
            ]
    
    async def get_ethics_ledger(
        self,
        simulation_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict]:
        """Get ethics ledger entries."""
        
        async with self.session_factory() as session:
            query = session.query(EthicsLedger).filter(
                EthicsLedger.simulation_id == simulation_id
            )
            
            if start_time:
                query = query.filter(EthicsLedger.timestamp >= start_time)
            
            if end_time:
                query = query.filter(EthicsLedger.timestamp <= end_time)
            
            entries = await query.order_by(EthicsLedger.timestamp.desc()).all()
            
            return [
                {
                    "id": str(e.id),
                    "timestamp": e.timestamp.isoformat(),
                    "agent": e.agent,
                    "action_type": e.action_type,
                    "deception_bits": e.deception_bits,
                    "description": e.description,
                    "detected": e.detected,
                    "detection_method": e.detection_method
                }
                for e in entries
            ]
    
    async def get_agent_memory(
        self,
        agent: str,
        memory_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """Get agent memory entries."""
        
        async with self.session_factory() as session:
            query = session.query(AgentMemory).filter(
                AgentMemory.agent == agent
            )
            
            if memory_type:
                query = query.filter(AgentMemory.memory_type == memory_type)
            
            memories = await query.order_by(AgentMemory.timestamp.desc()).limit(limit).all()
            
            return [
                {
                    "id": str(m.id),
                    "timestamp": m.timestamp.isoformat(),
                    "memory_type": m.memory_type,
                    "data": m.data,
                    "vector_embedding": m.vector_embedding
                }
                for m in memories
            ]
    
    async def get_simulation_summary(self, simulation_id: str) -> Dict:
        """Get simulation summary statistics."""
        
        async with self.session_factory() as session:
            # Count events by type
            event_counts = await session.execute(
                """
                SELECT event_type, COUNT(*) 
                FROM simulation_events 
                WHERE simulation_id = $1 
                GROUP BY event_type
                """,
                [simulation_id]
            )
            
            # Count ethics entries
            ethics_counts = await session.execute(
                """
                SELECT action_type, COUNT(*) 
                FROM ethics_ledger 
                WHERE simulation_id = $1 
                GROUP BY action_type
                """,
                [simulation_id]
            )
            
            # Total deception bits
            total_deception = await session.execute(
                """
                SELECT SUM(deception_bits) 
                FROM ethics_ledger 
                WHERE simulation_id = $1
                """,
                [simulation_id]
            )
            
            return {
                "event_counts": dict(event_counts),
                "ethics_counts": dict(ethics_counts),
                "total_deception_bits": float(total_deception.scalar() or 0.0)
            }
    
    async def close(self):
        """Close database connection."""
        
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connection closed")
