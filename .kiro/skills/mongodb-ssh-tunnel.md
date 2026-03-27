# MongoDB SSH Tunnel Connection Skill

## Contexto
Este projeto usa MongoDB hospedado em um servidor VPS (37.27.205.5) acessível via túnel SSH.

## Configuração de Conexão

### Informações do Servidor
- **Host**: 37.27.205.5
- **Porta MongoDB (servidor)**: 27017
- **Porta local (túnel)**: 27017
- **Usuário MongoDB**: mongo
- **Database**: templatedb
- **Auth Database**: admin
- **Chave SSH**: ~/.ssh/postgresql

### URI de Conexão
```
mongodb://mongo:PASSWORD@localhost:27017/templatedb?authSource=admin
```

## Como Conectar

### 1. Verificar se o túnel está ativo
```powershell
# Windows PowerShell
Get-Process | Where-Object {$_.ProcessName -eq "ssh"} | Select-Object Id,ProcessName,StartTime
```

### 2. Criar túnel SSH (se não estiver ativo)
```bash
ssh -f -i ~/.ssh/postgresql -L 27017:localhost:27017 root@37.27.205.5 -N
```

**Parâmetros:**
- `-f`: Executa em background
- `-i ~/.ssh/postgresql`: Usa chave SSH específica
- `-L 27017:localhost:27017`: Mapeia porta local 27017 para porta 27017 do servidor
- `-N`: Não executa comandos remotos (apenas túnel)
- `root@37.27.205.5`: Usuário e host do servidor

### 3. Matar túnel (se necessário)
```powershell
# Windows PowerShell
Get-Process | Where-Object {$_.ProcessName -eq "ssh"} | Stop-Process
```

### 4. Testar conexão
```bash
node scripts/diagnose-connection.js
```

Ou via API (com servidor rodando):
```
http://localhost:3000/api/test/db
```

## Troubleshooting

### Erro: "Address already in use"
A porta 27017 já está em uso. Opções:
1. Matar o processo SSH que está usando a porta
2. Usar outra porta local (ex: 27018)

### Erro: "Connection timeout"
1. Verificar se o túnel SSH está ativo
2. Verificar se o MongoDB está rodando no servidor:
   ```bash
   ssh -i ~/.ssh/postgresql root@37.27.205.5 "docker ps | grep mongo"
   ```

### Erro: "Authentication failed"
1. Verificar credenciais no .env
2. Verificar se o usuário existe no MongoDB

## Scripts Úteis

### Diagnóstico completo
```bash
node scripts/diagnose-connection.js
```

### Verificar emails duplicados
```bash
node scripts/check-duplicate-emails.js
```

### Testar operações de usuário
```bash
node scripts/test-user-operations.js
```

## Ambiente de Produção

Em produção, a aplicação deve conectar diretamente ao MongoDB sem túnel SSH.
Certifique-se de que:
1. A porta do MongoDB está exposta no servidor (se necessário)
2. O firewall permite conexões da aplicação
3. O .env de produção tem a URI correta

## Modelos de Dados

A aplicação possui 3 coleções MongoDB:
1. **users** - Usuários (credenciais e Google OAuth)
2. **notifications** - Notificações push
3. **pushsubscriptions** - Assinaturas de push notifications

## Comandos Rápidos

### Conectar ao MongoDB via túnel e testar
```bash
ssh -f -i ~/.ssh/postgresql -L 27017:localhost:27017 root@37.27.205.5 -N && node scripts/diagnose-connection.js
```

### Verificar status do MongoDB no servidor
```bash
ssh -i ~/.ssh/postgresql root@37.27.205.5 "docker service ls | grep mongo"
```

## Notas Importantes

- O túnel SSH deve estar ativo durante todo o desenvolvimento local
- A senha do MongoDB está no arquivo .env (não commitada no git)
- A chave SSH (~/.ssh/postgresql) é necessária para conexão
- O MongoDB está rodando em Docker Swarm no servidor
