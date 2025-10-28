"""Command-line interface for Zen Machine."""

import asyncio
import json
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

from .core.simulation import SimulationEngine
from .core.models import SimulationConfig, SKU
from .zen_agent.agent import ZenAgent, ZenAgentConfig
from .store_agent.agent import StoreAgent, StoreAgentConfig
from .adversary_module.adversary import AdversaryModule, AdversaryConfig
from .infrastructure.database import DatabaseManager
from .infrastructure.redis_manager import RedisManager, RedisConfig

console = Console()


@click.group()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
def cli(verbose: bool):
    """Zen Machine - Autonomous AI vending-supplier micro-economy."""
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


@cli.command()
@click.option('--days', '-d', default=30, help='Number of days to simulate')
@click.option('--output', '-o', help='Output file for results')
@click.option('--seed', '-s', type=int, help='Random seed for reproducibility')
@click.option('--config', '-c', help='Configuration file path')
@click.option('--adversary-budget', default=0.25, help='Daily adversary budget')
@click.option('--margin-target', default=0.18, help='Target gross margin')
@click.option('--spoilage-limit', default=0.008, help='Maximum spoilage rate')
async def simulate(days: int, output: Optional[str], seed: Optional[int], 
                  config: Optional[str], adversary_budget: float, 
                  margin_target: float, spoilage_limit: float):
    """Run simulation with specified parameters."""
    
    start_date = datetime.now() - timedelta(days=days)
    end_date = datetime.now()
    
    # Load configuration
    if config:
        with open(config, 'r') as f:
            config_data = json.load(f)
    else:
        # Default configuration
        config_data = {
            "sku_list": [
                {
                    "id": "water",
                    "name": "Bottled Water",
                    "msrp": 1.50,
                    "cost": 0.50,
                    "shelf_life_days": 365,
                    "category": "beverage"
                },
                {
                    "id": "soda",
                    "name": "Soda",
                    "msrp": 2.00,
                    "cost": 0.75,
                    "shelf_life_days": 180,
                    "category": "beverage"
                },
                {
                    "id": "snack",
                    "name": "Snack Bar",
                    "msrp": 1.75,
                    "cost": 0.80,
                    "shelf_life_days": 90,
                    "category": "snack"
                }
            ],
            "initial_inventory": {"water": 20, "soda": 15, "snack": 25}
        }
    
    sku_list = [SKU(**sku) for sku in config_data["sku_list"]]
    initial_inventory = config_data["initial_inventory"]
    
    sim_config = SimulationConfig(
        start_date=start_date,
        end_date=end_date,
        tick_minutes=15,
        random_seed=seed,
        sku_list=sku_list,
        initial_inventory=initial_inventory,
        adversary_budget=adversary_budget,
        margin_target=margin_target,
        spoilage_limit=spoilage_limit
    )
    
    # Create agents
    zen_config = ZenAgentConfig()
    store_config = StoreAgentConfig()
    adversary_config = AdversaryConfig(deception_budget=adversary_budget)
    
    zen_agent = ZenAgent(zen_config)
    store_agent = StoreAgent(store_config)
    adversary = AdversaryModule(adversary_config)
    
    # Create infrastructure
    db_manager = DatabaseManager("sqlite+aiosqlite:///:memory:")
    redis_manager = RedisManager(RedisConfig())
    
    await db_manager.initialize()
    await redis_manager.initialize()
    
    engine = SimulationEngine(
        config=sim_config,
        zen_agent=zen_agent,
        store_agent=store_agent,
        adversary=adversary,
        db_manager=db_manager,
        redis_manager=redis_manager
    )
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Running simulation...", total=None)
        
        result = await engine.run_simulation()
        
        progress.update(task, description="Simulation complete!")
    
    # Display results
    console.print(f"\n[bold green]Simulation Complete![/bold green]")
    console.print(f"Duration: {days} days")
    console.print(f"Total Revenue: ${result.total_revenue:.2f}")
    console.print(f"Total Costs: ${result.total_costs:.2f}")
    console.print(f"Gross Margin: {result.gross_margin:.1%}")
    console.print(f"Spoilage Rate: {result.spoilage_rate:.2%}")
    console.print(f"Uptime: {result.uptime_percentage:.1f}%")
    console.print(f"Avg Latency: {result.average_latency_ms:.1f}ms")
    
    # Create summary table
    table = Table(title="Key Metrics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="magenta")
    
    for key, value in result.summary.items():
        table.add_row(key.replace("_", " ").title(), f"{value:.3f}")
    
    console.print(table)
    
    # Save results
    if output:
        with open(output, 'w') as f:
            json.dump({
                "config": sim_config.dict(),
                "summary": result.summary,
                "total_revenue": result.total_revenue,
                "total_costs": result.total_costs,
                "gross_margin": result.gross_margin,
                "spoilage_rate": result.spoilage_rate,
                "uptime_percentage": result.uptime_percentage,
                "average_latency_ms": result.average_latency_ms,
                "ethics_ledger": [entry.dict() for entry in result.ethics_ledger]
            }, f, indent=2, default=str)
        console.print(f"\nResults saved to {output}")
    
    await db_manager.close()
    await redis_manager.close()


@cli.command()
@click.option('--host', default='0.0.0.0', help='Host to bind to')
@click.option('--port', default=8000, help='Port to bind to')
@click.option('--reload', is_flag=True, help='Enable auto-reload')
async def serve(host: str, port: int, reload: bool):
    """Start the Zen Machine API server."""
    
    import uvicorn
    
    uvicorn.run(
        "zen_machine.api.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


@cli.command()
@click.option('--check', is_flag=True, help='Only check configuration')
@click.option('--fix', is_flag=True, help='Auto-fix issues')
def config(check: bool, fix: bool):
    """Validate and manage configuration."""
    
    config_path = Path("config.json")
    
    if not config_path.exists():
        console.print("[yellow]Creating default configuration...[/yellow]")
        default_config = {
            "database": {
                "url": "postgresql+asyncpg://zen:zen_password@localhost:5432/zen_machine"
            },
            "redis": {
                "host": "localhost",
                "port": 6379,
                "db": 0
            },
            "models": {
                "zen_agent": "models/mistral-7b-instruct-v0.3.Q4_K_M.gguf",
                "store_agent": "models/phi-3-mini-4k-instruct-q4.gguf"
            },
            "simulation": {
                "tick_minutes": 15,
                "adversary_budget": 0.25,
                "latency_budget_ms": 200,
                "margin_target": 0.18,
                "spoilage_limit": 0.008
            }
        }
        
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        console.print("[green]Default configuration created at config.json[/green]")
    
    if check:
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            console.print("[green]Configuration is valid JSON[/green]")
            
            # Check required fields
            required_fields = [
                "database.url",
                "redis.host",
                "redis.port",
                "models.zen_agent",
                "models.store_agent"
            ]
            
            for field in required_fields:
                keys = field.split('.')
                value = config
                for key in keys:
                    if key not in value:
                        console.print(f"[red]Missing required field: {field}[/red]")
                        return
                    value = value[key]
            
            console.print("[green]All required fields present[/green]")
            
        except Exception as e:
            console.print(f"[red]Configuration error: {e}[/red]")


@cli.command()
def test():
    """Run the test suite."""
    import subprocess
    
    console.print("[yellow]Running test suite...[/yellow]")
    
    try:
        result = subprocess.run([
            "pytest", "tests/", "-v", "--cov=zen_machine"
        ], capture_output=True, text=True)
        
        console.print(result.stdout)
        
        if result.returncode == 0:
            console.print("[green]All tests passed![/green]")
        else:
            console.print("[red]Some tests failed[/red]")
            console.print(result.stderr)
            
    except FileNotFoundError:
        console.print("[red]pytest not found. Install with: pip install pytest[/red]")


@cli.command()
@click.option('--days', default=90, help='Number of days for backtest')
@click.option('--output', default='backtest_results.json', help='Output file')
async def backtest(days: int, output: str):
    """Run 90-day backtest for validation."""
    
    console.print(f"[yellow]Running {days}-day backtest...[/yellow]")
    
    # Use the simulate command with backtest parameters
    await simulate(
        days=days,
        output=output,
        seed=42,  # Fixed seed for reproducible backtest
        adversary_budget=0.25,
        margin_target=0.18,
        spoilage_limit=0.008
    )
    
    console.print(f"[green]Backtest complete! Results in {output}[/green]")


@cli.command()
@click.option('--port', default=8080, help='Port for monitoring dashboard')
async def monitor(port: int):
    """Start monitoring dashboard."""
    
    console.print(f"[green]Starting monitoring dashboard on port {port}[/green]")
    
    # Simple monitoring server
    import http.server
    import socketserver
    import threading
    
    class MonitoringHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Zen Machine Monitor</title>
                <meta http-equiv="refresh" content="5">
            </head>
            <body>
                <h1>Zen Machine Monitoring Dashboard</h1>
                <p>Status: Running</p>
                <p>Port: {port}</p>
                <p>Last updated: {datetime.now()}</p>
            </body>
            </html>
            """
            
            self.wfile.write(html.encode())
    
    with socketserver.TCPServer(("", port), MonitoringHandler) as httpd:
        console.print(f"[green]Monitoring dashboard available at http://localhost:{port}[/green]")
        httpd.serve_forever()


if __name__ == '__main__':
    asyncio.run(cli())
