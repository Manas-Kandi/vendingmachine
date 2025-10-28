// Zen Machine UI - Japanese Minimalist Interactive Experience

class ZenMachineUI {
    constructor() {
        this.ws = null;
        this.isOpenMindVisible = false;
        this.animationFrame = null;
        this.currentMargin = 18.2;
        this.currentStock = 247;
        this.currentTraffic = 23;
        
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupEventListeners();
        this.create3DVendingMachine();
        this.startBreathingAnimation();
        this.loadInitialData();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to Zen Machine');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from Zen Machine');
            setTimeout(() => this.setupWebSocket(), 5000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    setupEventListeners() {
        const openMindBtn = document.getElementById('open-mind-btn');
        const closePanelBtn = document.getElementById('close-panel');
        
        openMindBtn.addEventListener('click', () => this.toggleOpenMind());
        closePanelBtn.addEventListener('click', () => this.toggleOpenMind());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideOpenMind();
            }
            if (e.key === 'o' || e.key === 'O') {
                this.toggleOpenMind();
            }
        });
    }

    create3DVendingMachine() {
        const container = document.getElementById('vending-machine');
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        this.renderer.setSize(400, 600);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Create vending machine geometry
        this.createVendingMachineGeometry();
        
        // Camera position
        this.camera.position.set(0, 0, 5);
        
        // Start render loop
        this.animate();
    }

    createVendingMachineGeometry() {
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(3, 4.5, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xf5f5f5,
            transparent: true,
            opacity: 0.9
        });
        this.machineBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.scene.add(this.machineBody);
        
        // Display window
        const windowGeometry = new THREE.BoxGeometry(2.5, 3, 0.1);
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3
        });
        this.displayWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        this.displayWindow.position.set(0, 0.5, 0.51);
        this.scene.add(this.displayWindow);
        
        // Status indicator (glowing sphere)
        const indicatorGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const indicatorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xd4af37,
            emissive: 0xd4af37,
            emissiveIntensity: 0.3
        });
        this.statusIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.statusIndicator.position.set(0, -1.8, 0.6);
        this.scene.add(this.statusIndicator);
    }

    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        // Gentle rotation
        this.machineBody.rotation.y += 0.005;
        
        // Breathing effect for status indicator
        const time = Date.now() * 0.001;
        const scale = 1 + Math.sin(time * 2) * 0.1;
        this.statusIndicator.scale.setScalar(scale);
        this.statusIndicator.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.2;
        
        this.renderer.render(this.scene, this.camera);
    }

    startBreathingAnimation() {
        const glow = document.querySelector('.breathing-glow');
        let intensity = 0.3;
        let increasing = true;
        
        const animate = () => {
            if (increasing) {
                intensity += 0.01;
                if (intensity >= 0.7) increasing = false;
            } else {
                intensity -= 0.01;
                if (intensity <= 0.3) increasing = true;
            }
            
            glow.style.opacity = intensity;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    loadInitialData() {
        // Mock data for initial load
        const products = [
            { id: 'water', name: 'Water', price: 1.50, stock: 15 },
            { id: 'soda', name: 'Soda', price: 2.00, stock: 8 },
            { id: 'juice', name: 'Juice', price: 2.50, stock: 12 },
            { id: 'energy', name: 'Energy', price: 3.00, stock: 5 },
            { id: 'snack', name: 'Snack', price: 1.75, stock: 20 },
            { id: 'candy', name: 'Candy', price: 1.25, stock: 18 },
            { id: 'healthy', name: 'Healthy', price: 3.50, stock: 7 },
            { id: 'coffee', name: 'Coffee', price: 2.25, stock: 10 }
        ];
        
        this.renderProducts(products);
        this.updateRealTimeStats();
    }

    renderProducts(products) {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '';
        
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item';
            productDiv.innerHTML = `
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock">${product.stock} left</div>
            `;
            grid.appendChild(productDiv);
        });
    }

    updateRealTimeStats() {
        // Simulate real-time updates
        setInterval(() => {
            this.currentMargin += (Math.random() - 0.5) * 0.2;
            this.currentStock += Math.floor((Math.random() - 0.5) * 5);
            this.currentTraffic += Math.floor((Math.random() - 0.5) * 3);
            
            this.currentMargin = Math.max(10, Math.min(25, this.currentMargin));
            this.currentStock = Math.max(0, this.currentStock);
            this.currentTraffic = Math.max(0, this.currentTraffic);
            
            document.getElementById('current-margin').textContent = 
                `${this.currentMargin.toFixed(1)}%`;
            document.getElementById('total-stock').textContent = this.currentStock;
            document.getElementById('current-traffic').textContent = this.currentTraffic;
            
            // Update breathing glow based on margin
            const glow = document.querySelector('.breathing-glow');
            const intensity = 0.3 + (this.currentMargin - 10) / 15 * 0.4;
            glow.style.background = `rgba(212, 175, 55, ${intensity})`;
            
            // Update 3D indicator
            if (this.statusIndicator) {
                const color = new THREE.Color();
                color.setHSL((this.currentMargin - 10) / 15 * 0.3, 0.8, 0.6);
                this.statusIndicator.material.color = color;
                this.statusIndicator.material.emissive = color;
            }
        }, 2000);
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'inventory_update':
                this.renderProducts(data.products);
                break;
            case 'margin_update':
                this.currentMargin = data.margin;
                document.getElementById('current-margin').textContent = 
                    `${this.currentMargin.toFixed(1)}%`;
                break;
            case 'traffic_update':
                this.currentTraffic = data.traffic;
                document.getElementById('current-traffic').textContent = this.currentTraffic;
                break;
            case 'reasoning_update':
                this.updateReasoningPanel(data.reasoning);
                break;
        }
    }

    toggleOpenMind() {
        if (this.isOpenMindVisible) {
            this.hideOpenMind();
        } else {
            this.showOpenMind();
        }
    }

    showOpenMind() {
        const panel = document.getElementById('reasoning-panel');
        panel.classList.add('open');
        this.isOpenMindVisible = true;
        this.loadReasoningData();
    }

    hideOpenMind() {
        const panel = document.getElementById('reasoning-panel');
        panel.classList.remove('open');
        this.isOpenMindVisible = false;
    }

    loadReasoningData() {
        // Mock reasoning data
        const reasoningData = {
            zen_decision: {
                thought: "Balancing inventory levels with expected demand based on current weather and traffic patterns",
                prices: {
                    water: 1.45,
                    soda: 2.10,
                    juice: 2.65,
                    energy: 3.15
                },
                orders: {
                    water: 10,
                    soda: 5,
                    juice: 8
                },
                expedite: false
            },
            store_quotes: {
                water: {
                    price: 0.75,
                    delivery: 2,
                    confidence: 0.95
                },
                soda: {
                    price: 1.20,
                    delivery: 1,
                    confidence: 0.88
                }
            },
            adversary_actions: [
                {
                    type: "temperature_modification",
                    change: "+0.2°C",
                    detected: false,
                    impact: "minimal"
                }
            ],
            environment: {
                temperature: 22.3,
                rain: 0.0,
                traffic: 23,
                time: "14:32"
            }
        };
        
        this.updateReasoningPanel(reasoningData);
    }

    updateReasoningPanel(data) {
        const content = document.getElementById('reasoning-content');
        
        content.innerHTML = `
            <div class="reasoning-section">
                <h4>Zen Agent Decision</h4>
                <p><em>"${data.zen_decision.thought}"</em></p>
                <div class="price-list">
                    ${Object.entries(data.zen_decision.prices).map(([sku, price]) => 
                        `<div>${sku}: $${price.toFixed(2)}</div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="reasoning-section">
                <h4>Store Agent Quotes</h4>
                ${Object.entries(data.store_quotes).map(([sku, quote]) => 
                    `<div>${sku}: $${quote.price} (${quote.delivery} days, ${quote.confidence * 100}% confidence)</div>`
                ).join('')}
            </div>
            
            <div class="reasoning-section">
                <h4>Environmental Context</h4>
                <div>Temperature: ${data.environment.temperature}°C</div>
                <div>Rain: ${data.environment.rain}mm</div>
                <div>Traffic: ${data.environment.traffic} people</div>
                <div>Time: ${data.environment.time}</div>
            </div>
            
            <div class="reasoning-section">
                <h4>Adversary Activity</h4>
                ${data.adversary_actions.map(action => 
                    `<div class="adversary-action ${action.detected ? 'detected' : 'undetected'}">
                        ${action.type}: ${action.change} (${action.impact})
                    </div>`
                ).join('')}
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZenMachineUI();
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when tab is not visible
    } else {
        // Resume animations
    }
});
