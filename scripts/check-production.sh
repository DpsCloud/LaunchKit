#!/bin/bash

echo "🔍 DIAGNÓSTICO DE PRODUÇÃO"
echo "================================"

echo -e "\n📦 Containers rodando:"
docker ps | grep -E "nextjs|mongo"

echo -e "\n🔧 Serviços Docker Swarm:"
docker service ls | grep -E "nextjs|mongo"

echo -e "\n📊 Status do Next.js:"
docker service ps nextjs-mqtedo --no-trunc

echo -e "\n📊 Status do MongoDB:"
docker service ps mongo-db-jhpuwa --no-trunc

echo -e "\n📝 Últimos logs do Next.js (últimas 50 linhas):"
docker service logs --tail 50 nextjs-mqtedo

echo -e "\n🌐 Redes Docker:"
docker network ls

echo -e "\n🔗 Rede do MongoDB:"
docker inspect $(docker ps -q -f name=mongo-db-jhpuwa) | grep -A 5 NetworkMode

echo -e "\n🔗 Rede do Next.js:"
docker inspect $(docker ps -q -f name=nextjs-mqtedo) | grep -A 5 NetworkMode

echo -e "\n✅ Diagnóstico concluído!"
