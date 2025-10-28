// Store Mind UI - Supply Chain Intelligence Dashboard

class StoreMindUI {
    constructor() {
        this.ws = null;
        this.charts = {};
        this.data = {
            warehouse: {},
            orders: [],
            costs: {},
            entropy: {
                demand: 0.45,
                supply: 0.32,
                adversary: 0.18
            }
        };
        
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.createEntropyGauges();
        this.createCostChart();
        this.loadInitialData();
        this.startRealTimeUpdates();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/store-ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to Store Mind');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from Store Mind');
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    createEntropyGauges() {
        const gauges = [
            { id: 'demand-entropy', value: this.data.entropy.demand, label: 'Demand' },
            { id: 'supply-entropy', value: this.data.entropy.supply, label: 'Supply' },
            { id: 'adversary-entropy', value: this.data.entropy.adversary, label: 'Adversary' }
        ];

        gauges.forEach(gauge => {
            this.createGauge(gauge.id, gauge.value, gauge.label);
        });
    }

    createGauge(canvasId, value, label) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 70;

        const drawGauge = (currentValue) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#2a2a4a';
            ctx.stroke();
            
            // Value arc
            const endAngle = 0.75 * Math.PI + (currentValue * 1.5 * Math.PI);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle);
            ctx.lineWidth = 10;
            ctx.strokeStyle = this.getEntropyColor(currentValue);
            ctx.stroke();
            
            // Center text
            ctx.font = 'bold 24px Inter';
            ctx.fillStyle = '#e6e6fa';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((currentValue * 100).toFixed(0) + '%', centerX, centerY);
        };

        drawGauge(value);
        this.charts[canvasId] = { canvas, ctx, drawGauge, value };
    }

    getEntropyColor(value) {
        if (value < 0.3) return '#10b981'; // Green
        if (value < 0.7) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    }

    createCostChart() {
        const ctx = document.getElementById('cost-chart');
        
        this.costChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Base Cost', 'Diesel', 'Temperature', 'Quantity', 'Urgency'],
                datasets: [{
                    data: [50, 15, 10, 15, 10],
                    backgroundColor: [
                        '#6366f1',
                        '#818cf8',
                        '#a5b4fc',
                        '#c7d2fe',
                        '#e0e7ff'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e6e6fa',
                            font: {
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });
    }

    loadInitialData() {
        // Mock warehouse data
        const warehouseData = [
            { sku: 'water', quantity: 250, status: 'optimal', color: '#10b981' },
            { sku: 'soda', quantity: 180, status: 'low', color: '#f59e0b' },
            { sku: 'juice', quantity: 120, status: 'optimal', color: '#10b981' },
            { sku: 'energy', quantity: 95, status: 'critical', color: '#ef4444' },
            { sku: 'snack', quantity: 320, status: 'optimal', color: '#10b981' },
            { sku: 'healthy', quantity: 75, status: 'low', color: '#f59e0b' },
            { sku: 'candy', quantity: 200, status: 'optimal', color: '#10b981' }
        ];

        this.renderWarehouse(warehouseData);
        this.renderOrders();
        this.updateMarketData();
    }

    renderWarehouse(data) {
        const grid = document.getElementById('warehouse-grid');
        grid.innerHTML = '';

        data.forEach(item => {
            const box = document.createElement('div');
            box.className = 'warehouse-box';
            box.style.borderLeftColor = item.color;
            
            box.innerHTML = `
                <h4>${item.sku.charAt(0).toUpperCase() + item.sku.slice(1)}</h4>
                <div class="quantity">${item.quantity}</div>
                <div class="status">${item.status}</div>
            `;
            
            grid.appendChild(box);
        });
    }

    renderOrders() {
        const orders = [
            { sku: 'water', quantity: 10, price: 7.50, urgency: false, timestamp: Date.now() - 300000 },
            { sku: 'energy', quantity: 25, price: 37.50, urgency: true, timestamp: Date.now() - 180000 },
            { sku: 'healthy', quantity: 15, price: 27.00, urgency: false, timestamp: Date.now() - 60000 }
        ];

        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = '';

        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-item';
            
            orderDiv.innerHTML = `
                <div class="order-details">
                    <div class="order-sku">${order.sku.toUpperCase()}</div>
                    <div class="order-qty">${order.quantity} units</div>
                </div>
                <div class="order-price">$${order.price.toFixed(2)}</div>
                ${order.urgency ? '<span class="urgency-badge">⚡</span>' : ''}
            `;
            
            ordersList.appendChild(orderDiv);
        });
    }

    updateMarketData() {
        const marketData = {
            diesel: 1.45 + (Math.random() - 0.5) * 0.1,
            temperature: 22.3 + (Math.random() - 0.5) * 2,
            leadTime: 2.1 + (Math.random() - 0.5) * 0.5
        };

        document.getElementById('diesel-price').textContent = 
            `€${marketData.diesel.toFixed(2)}/L`;
        document.getElementById('temperature').textContent = 
            `${marketData.temperature.toFixed(1)}°C`;
        document.getElementById('lead-time').textContent = 
            `${marketData.leadTime.toFixed(1)} days`;
    }

    updateEntropyGauges() {
        // Simulate entropy changes
        this.data.entropy.demand = Math.max(0, Math.min(1, 
            this.data.entropy.demand + (Math.random() - 0.5) * 0.1));
        this.data.entropy.supply = Math.max(0, Math.min(1, 
            this.data.entropy.supply + (Math.random() - 0.5) * 0.08));
        this.data.entropy.adversary = Math.max(0, Math.min(1, 
            this.data.entropy.adversary + (Math.random() - 0.5) * 0.05));

        Object.keys(this.charts).forEach(key => {
            const chart = this.charts[key];
            let value;
            
            if (key.includes('demand')) value = this.data.entropy.demand;
            else if (key.includes('supply')) value = this.data.entropy.supply;
            else if (key.includes('adversary')) value = this.data.entropy.adversary;
            
            chart.value = value;
            chart.drawGauge(value);
        });
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.updateEntropyGauges();
            this.updateMarketData();
            this.renderOrders(); // Refresh orders
        }, 5000);
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'warehouse_update':
                this.renderWarehouse(data.warehouse);
                break;
            case 'order_received':
                this.addOrder(data.order);
                break;
            case 'entropy_update':
                this.data.entropy = data.entropy;
                this.updateEntropyGauges();
                break;
            case 'market_update':
                this.updateMarketData(data.market);
                break;
        }
    }

    addOrder(order) {
        const ordersList = document.getElementById('orders-list');
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        
        orderDiv.innerHTML = `
            <div class="order-details">
                <div class="order-sku">${order.sku.toUpperCase()}</div>
                <div class="order-qty">${order.quantity} units</div>
            </div>
            <div class="order-price">$${order.price.toFixed(2)}</div>
            ${order.urgency ? '<span class="urgency-badge">⚡</span>' : ''}
        `;
        
        ordersList.insertBefore(orderDiv, ordersList.firstChild);
        
        // Remove old orders if too many
        while (ordersList.children.length > 10) {
            ordersList.removeChild(ordersList.lastChild);
        }
    }

    renderActivityFeed() {
        const activities = [
            { time: '2 min ago', text: 'New order received: 25x ENERGY' },
            { time: '5 min ago', text: 'Diesel price increased by €0.03' },
            { time: '8 min ago', text: 'Warehouse restocked: +50 WATER' },
            { time: '12 min ago', text: 'Adversary detected: ETA exaggeration' }
        ];

        const feed = document.getElementById('activity-feed');
        feed.innerHTML = '';

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-time">${activity.time}</div>
                <div class="activity-text">${activity.text}</div>
            `;
            feed.appendChild(item);
        });
    }

    updateCostChart() {
        if (this.costChart) {
            // Simulate cost breakdown changes
            const newData = [
                45 + Math.random() * 10,
                15 + Math.random() * 5,
                10 + Math.random() * 3,
                15 + Math.random() * 5,
                10 + Math.random() * 3
            ];
            
            this.costChart.data.datasets[0].data = newData;
            this.costChart.update();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StoreMindUI();
});

// Add CSS for urgency badge
const style = document.createElement('style');
style.textContent = `
    .urgency-badge {
        background: #f59e0b;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.8rem;
        margin-left: 0.5rem;
    }
`;
document.head.appendChild(style);
