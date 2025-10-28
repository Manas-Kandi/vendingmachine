---
description: How to deploy Zen Machine to production
---

# Zen Machine Deployment Guide

## Prerequisites

- Docker and Docker Compose
- kubectl configured for your cluster
- Helm 3.x installed
- Access to container registry

## Local Development

1. **Start development environment:**
   ```bash
   make dev
   ```

2. **Access services:**
   - Zen UI: http://localhost:3000
   - Store UI: http://localhost:3001
   - Zen Agent API: http://localhost:8000
   - Store Agent API: http://localhost:8001

## Production Deployment

### Using Docker Compose

1. **Build and start:**
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
   ```

2. **Scale services:**
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d --scale zen-agent=3
   ```

### Using Kubernetes

1. **Create namespace:**
   ```bash
   kubectl apply -f infrastructure/k8s/namespace.yaml
   ```

2. **Deploy secrets:**
   ```bash
   # Update secrets.yaml with actual values
   kubectl apply -f infrastructure/k8s/secrets.yaml
   ```

3. **Deploy infrastructure:**
   ```bash
   kubectl apply -k infrastructure/k8s/
   ```

4. **Verify deployment:**
   ```bash
   kubectl get pods -n zen-machine
   kubectl get services -n zen-machine
   ```

### Using ArgoCD

1. **Install ArgoCD:**
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

2. **Create ArgoCD application:**
   ```bash
   kubectl apply -f infrastructure/argocd/zen-machine-app.yaml
   ```

3. **Sync application:**
   ```bash
   argocd app sync zen-machine
   ```

## Monitoring

### Health Checks

- **Zen Agent:** `curl http://localhost:8000/health`
- **Store Agent:** `curl http://localhost:8001/health`
- **Database:** `kubectl exec -it postgres-0 -- pg_isready -U zen`
- **Redis:** `kubectl exec -it redis-0 -- redis-cli ping`

### Logs

```bash
# Docker Compose
docker-compose logs -f zen-agent

# Kubernetes
kubectl logs -f deployment/zen-agent -n zen-machine
```

## Scaling

### Horizontal Pod Autoscaler

```bash
# Check HPA status
kubectl get hpa -n zen-machine

# Manual scaling
kubectl scale deployment zen-agent --replicas=5 -n zen-machine
```

### Database Scaling

```bash
# For PostgreSQL (requires additional setup)
kubectl patch deployment postgres -p '{"spec":{"replicas":3}}' -n zen-machine
```

## Rollback

### Using ArgoCD

```bash
argocd app rollback zen-machine
```

### Manual Rollback

```bash
# Previous deployment
kubectl rollout undo deployment/zen-agent -n zen-machine

# Check rollout status
kubectl rollout status deployment/zen-agent -n zen-machine
```

## Troubleshooting

### Common Issues

1. **Pod not starting:**
   ```bash
   kubectl describe pod <pod-name> -n zen-machine
   ```

2. **Service not accessible:**
   ```bash
   kubectl get endpoints -n zen-machine
   ```

3. **Database connection issues:**
   ```bash
   kubectl exec -it postgres-0 -- psql -U zen -d zen_machine -c "SELECT 1"
   ```

### Performance Tuning

1. **Resource limits:**
   ```bash
   kubectl top pods -n zen-machine
   ```

2. **Network latency:**
   ```bash
   kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://zen-agent-service
   ```
