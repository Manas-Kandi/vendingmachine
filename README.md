# Zen Machine

An autonomous, adversarial, fully-instrumented vending-supplier micro-economy with meditative UX.

## Vision

Create the world's first openly observable, AI-versus-AI micro-economy that feels tranquil to a casual user yet publishes research-grade traces of multi-agent pricing, restocking, deception, and counter-deception under realistic operational frictions.

## Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd zen-machine
pip install -e ".[dev,ui]"

# Start development environment
make dev

# Run tests
pytest tests/ -v

# Start simulation
zen-machine simulate --days 90 --output results.json
```

## Architecture

- **Zen Agent**: Mistral-7B powered vending machine operator
- **Store Agent**: Phi-3-mini powered supplier AI
- **Adversary Module**: Controlled deception with ethics ledger
- **UI**: Japanese minimalist design with breathing animations
- **Infrastructure**: Docker, Kubernetes, Redis, PostgreSQL

## Development

```bash
# Format code
black zen_machine/ tests/
isort zen_machine/ tests/

# Type checking
mypy zen_machine/

# Run specific test
pytest tests/test_zen_agent.py::test_optimization -v
```

## Documentation

- [API Documentation](docs/api.md)
- [Architecture Overview](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)

## License

MIT License - see [LICENSE](LICENSE) for details.
