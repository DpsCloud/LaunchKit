# PresençaHub - Especificação Técnica do MVP v1.0

## Critério de Sucesso
**3 clientes pagantes no ar** com site funcionando, catálogo gerenciável e CRM básico.

## Stack Adaptada para MVP Rápido

| Camada | Ferramenta Original | Adaptação MVP |
|--------|-------------------|---------------|
| Framework | Next.js 14 | ✅ Mantido |
| Auth | Clerk | ⚠️ **NextAuth** (gratuito) |
| Banco | PostgreSQL + Drizzle | ⚠️ **MongoDB + Mongoose** (já configurado) |
| Billing | Stripe | ✅ Mantido |
| Storage | Supabase/R2 | ✅ A definir |
| Email | Resend | ✅ Mantido |
| Deploy | Dokploy | ✅ Mantido |

## Módulos Prioritários (P0)

### 1. Multi-Tenant + Domínio
- Cada cliente em subdomínio: `nomedaloja.presencahub.com.br`
- Domínio próprio via CNAME (opcional)
- Middleware resolve tenant por hostname

### 2. Engine de Templates
- 3 templates: Clínica, Salão, Restaurante
- Renderização dinâmica por tenant
- Configurável: cores, textos, seções

### 3. Catálogo de Produtos
- CRUD completo pelo painel
- Upload de imagens
- Tipos: físico, serviço, item de cardápio

### 4. Carrinho + Checkout
- Carrinho client-side
- Modo 1: Pagamento online (Stripe)
- Modo 2: Reserva (paga na loja)

### 5. Gestão de Pedidos
- Painel do dono: ver pedidos
- Atualizar status: Confirmado → Preparando → Pronto → Entregue

### 6. Billing da Plataforma
- Assinatura mensal por tenant
- Stripe recorrência
- Suspensão automática por inadimplência

### 7. Auth Completa
- Login prestador (SUPER_ADMIN)
- Login cliente (TENANT_OWNER)
- Roles e permissões

## Módulos Secundários (P1)

### 8. CRM Básico
- Leads do formulário
- Anotações e status
- Link WhatsApp

### 9. Notificações
- Email via Resend
- Novo lead, novo pedido

### 10. Painel Multi-Conta
- Prestador acessa todos os clientes
- Impersonation com audit log

## Ordem de Implementação

1. ✅ Backup e fork criados
2. 🚀 Modelos de dados (Tenant, Product, Order, Contact)
3. 🚀 Middleware de resolução de tenant
4. 🚀 Atualizar User com roles
5. Engine de templates (1 template genérico)
6. CRUD de produtos + upload
7. Carrinho + checkout Stripe
8. Webhooks Stripe
9. Gestão de pedidos
10. CRM básico
11. Notificações Resend
12. Billing da plataforma
13. Templates adicionais
14. Domínio customizado
15. Deploy

## Segurança

- ✅ Isolamento por tenantId em todas as queries
- ✅ Validação server-side com Zod
- ✅ Rate limit em auth e checkout
- ✅ Upload seguro com validação MIME
- ✅ Webhook Stripe com verificação de assinatura
- ✅ Audit log para impersonation

## Critérios de Sucesso

- [ ] 3 tenants ativos com site público
- [ ] 1 transação real via Stripe
- [ ] Zero downtime em 7 dias
- [ ] 1 cliente atualiza catálogo sozinho
- [ ] 3 assinaturas mensais ativas
