#!/bin/bash

# Script para estabelecer túnel SSH para MongoDB
# Baseado nas configurações do projeto

echo "🔄 Estabelecendo túnel SSH para MongoDB..."

# Configurações (ajuste conforme necessário)
SSH_USER="root"
SSH_HOST="seu-servidor.com"
SSH_PORT="22"
REMOTE_MONGO_PORT="27017"
LOCAL_PORT="27017"

# Comando SSH tunnel
ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_MONGO_PORT} ${SSH_USER}@${SSH_HOST} -p ${SSH_PORT}

# O comando acima ficará rodando. Para parar, use Ctrl+C
