from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import time
import uuid

@dataclass
class Order:
    id: str
    agent_id: str
    asset: str
    side: str  # "buy" or "sell"
    price: float
    quantity: int
    timestamp: float

@dataclass
class Trade:
    id: str
    buyer_id: str
    seller_id: str
    asset: str
    price: float
    quantity: int
    timestamp: float

class OrderBook:
    def __init__(self, asset: str):
        self.asset = asset
        self.bids: List[Order] = []  # Buy orders, sorted high to low
        self.asks: List[Order] = []  # Sell orders, sorted low to high

    def add_order(self, order: Order) -> List[Trade]:
        trades = []
        if order.side == "buy":
            trades = self._match_bid(order)
            if order.quantity > 0:
                self.bids.append(order)
                self.bids.sort(key=lambda x: x.price, reverse=True)
        else:
            trades = self._match_ask(order)
            if order.quantity > 0:
                self.asks.append(order)
                self.asks.sort(key=lambda x: x.price)
        return trades

    def _match_bid(self, bid: Order) -> List[Trade]:
        trades = []
        while bid.quantity > 0 and self.asks:
            best_ask = self.asks[0]
            if bid.price < best_ask.price:
                break

            # Match found
            qty = min(bid.quantity, best_ask.quantity)
            price = best_ask.price  # Trade at the resting order's price

            trade = Trade(
                id=str(uuid.uuid4()),
                buyer_id=bid.agent_id,
                seller_id=best_ask.agent_id,
                asset=self.asset,
                price=price,
                quantity=qty,
                timestamp=time.time()
            )
            trades.append(trade)

            bid.quantity -= qty
            best_ask.quantity -= qty

            if best_ask.quantity == 0:
                self.asks.pop(0)
        
        return trades

    def _match_ask(self, ask: Order) -> List[Trade]:
        trades = []
        while ask.quantity > 0 and self.bids:
            best_bid = self.bids[0]
            if ask.price > best_bid.price:
                break

            # Match found
            qty = min(ask.quantity, best_bid.quantity)
            price = best_bid.price  # Trade at the resting order's price

            trade = Trade(
                id=str(uuid.uuid4()),
                buyer_id=best_bid.agent_id,
                seller_id=ask.agent_id,
                asset=self.asset,
                price=price,
                quantity=qty,
                timestamp=time.time()
            )
            trades.append(trade)

            ask.quantity -= qty
            best_bid.quantity -= qty

            if best_bid.quantity == 0:
                self.bids.pop(0)
        
        return trades

class Market:
    def __init__(self):
        self.books: Dict[str, OrderBook] = {
            "COMPUTE": OrderBook("COMPUTE"),
            "DATA": OrderBook("DATA"),
            "ENERGY": OrderBook("ENERGY")
        }
        self.trade_history: List[Trade] = []
        self.last_prices: Dict[str, float] = {
            "COMPUTE": 100.0,
            "DATA": 50.0,
            "ENERGY": 10.0
        }

    def place_order(self, order: Order) -> List[Trade]:
        if order.asset not in self.books:
            return []
        
        trades = self.books[order.asset].add_order(order)
        self.trade_history.extend(trades)
        
        # Update last prices
        for trade in trades:
            self.last_prices[trade.asset] = trade.price
            
        return trades

    def get_state(self) -> Dict:
        return {
            "last_prices": self.last_prices,
            "history_len": len(self.trade_history),
            "books": {
                asset: {
                    "bids": len(book.bids),
                    "asks": len(book.asks),
                    "best_bid": book.bids[0].price if book.bids else None,
                    "best_ask": book.asks[0].price if book.asks else None
                }
                for asset, book in self.books.items()
            }
        }
