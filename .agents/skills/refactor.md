---
name: refactor
description: Refatoração cirúrgica de código gerado rápido (ex. AI Studio, Copilot, geração automática) para deixá-lo auditável por um humano, sem alterar comportamento. Use quando o código funciona mas está difícil de ler, revisar ou confiar — funções gigantes, lógica de negócio misturada com UI/infra, nomes genéricos, estado implícito, ausência de tratamento de erro. Ative antes de qualquer commit final de um módulo gerado por IA, ou quando o usuário pedir "limpa esse código", "deixa isso auditável", "refatora isso".
---

# Refactor — Código auditável por humano

## Quando usar

Use esta skill quando:

- O código foi gerado rápido (por IA ou sob pressão de prazo) e funciona, mas ninguém confiaria nele sem reler tudo do zero
- Funções/componentes estão grandes demais para entender de uma vez
- Lógica de negócio está misturada com UI, requisições HTTP, ou acesso a dados
- Nomes de variáveis/funções não dizem o que a coisa faz
- Existe estado implícito, efeitos colaterais escondidos, ou fluxo difícil de seguir
- Antes de um commit final de qualquer módulo que vai para revisão humana

**Não use** para reescrever do zero, trocar de stack, ou misturar com desenvolvimento de feature nova. Isso é reescrita, não refatoração — e fica para outra etapa.

---

## O problema que esta skill resolve

Código gerado rapidamente por um agente (Google AI Studio, Copilot, geração automática em geral) tende a otimizar para "funciona" e ignora "alguém vai precisar confiar nisso sem ter escrito". Os sintomas mais comuns:

- Tudo em um arquivo só, ou um componente/função fazendo 5 coisas diferentes
- Lógica de negócio embutida dentro de handlers de UI ou rotas HTTP
- Nomes como `data`, `handleClick`, `temp`, `processStuff`
- `try/catch` vazio ou ausente; erros engolidos silenciosamente
- Estado mutável compartilhado sem ficar claro quem altera o quê
- Zero comentários sobre *decisões* (só, quando existem, comentários óbvios que repetem o código)
- Nenhum teste — então qualquer mudança é um salto de fé

O objetivo desta skill não é "código bonito". É: **um humano que não escreveu isso consegue ler, entender o que faz, confiar que está correto, e mudar com segurança — em um tempo razoável.**

---

## Definição operacional de "auditável"

Um trecho de código está auditável quando passa nestes testes objetivos:

1. **Teste dos 30 segundos** — alguém consegue entender o que uma função faz lendo só ela, sem pular para outros arquivos, em até ~30 segundos
2. **Nome = contrato** — o nome da função/variável já diz o que ela faz ou contém, sem precisar ler o corpo
3. **Uma responsabilidade por unidade** — cada função faz uma coisa; cada componente renderiza/orquestra uma coisa
4. **Erros são visíveis** — toda operação que pode falhar (rede, parsing, I/O) trata o erro de forma explícita, nunca engole silenciosamente
5. **Fluxo é linear** — sem aninhamento profundo de `if`; guard clauses em vez de pirâmides
6. **Comentários explicam "por quê", não "o quê"** — se o comentário só repete o código em português, ele não deveria existir; se existe uma decisão não óbvia (ex: "por que esse timeout é 3s e não 1s"), isso merece comentário
7. **Mudança é segura** — existe pelo menos um teste de caracterização cobrindo o comportamento atual antes de qualquer refatoração

Se um trecho falha em 1 desses critérios, ele é candidato a refatoração.

---

## O processo (ordem obrigatória)

```
1. AUDITAR     → mapear o que existe, sem mexer em nada ainda
2. PROTEGER    → garantir uma rede de segurança antes de tocar no código
3. REFATORAR   → mudanças pequenas, uma de cada vez, testando a cada passo
4. VERIFICAR   → confirmar que nada quebrou
5. ENTREGAR    → resumo do que mudou e por quê, para quem for revisar
```

Pular a fase 2 (proteger) é a forma mais comum de transformar "refatoração seguro" em "reescrita arriscada disfarçada de refatoração".

### Fase 1 — Auditar (não mude nada ainda)

Antes de editar qualquer linha, produza um diagnóstico rápido:

- Liste as funções/componentes acima de ~50 linhas ou que fazem visivelmente mais de uma coisa
- Marque onde lógica de negócio está misturada com UI, rede, ou acesso a dados
- Marque nomes que não revelam intenção
- Marque erros não tratados (chamadas async sem catch, parsing sem validação)
- Marque estado implícito (variáveis globais, mutação compartilhada, ordem de execução que importa sem ficar óbvio)
- Identifique se já existe alguma cobertura de teste

Isso vira um checklist curto de "o que vou mexer e por quê" — não precisa ser formal, mas precisa existir antes do passo 2.

### Fase 2 — Proteger (rede de segurança)

**Regra inegociável: nunca refatore código sem alguma garantia de que o comportamento atual está preservado.**

- Se já existem testes cobrindo o trecho: rode-os antes de começar, confirme que passam (estado verde).
- Se **não existem testes**: escreva testes de caracterização — testes que capturam o comportamento *atual* do código (certo ou errado) antes de mexer. Não é hora de corrigir bugs, é hora de fotografar o comportamento existente.
  - Para uma função pura: chame com os inputs principais e capture os outputs reais como expectativa.
  - Para um endpoint/handler: teste o caminho feliz, um erro esperado, e um caso de borda óbvio.
  - Para um componente de UI: teste o que renderiza dado um estado, e o que dispara ao interagir.
- Se o código depende de algo difícil de testar isoladamente (ex: chamada de rede direta dentro da função), isso já é, por si só, um achado da auditoria — vai virar uma refatoração de extração antes de qualquer outra coisa, justamente para tornar testável.

Se o usuário disser "não tem tempo para testes agora", deixe claro que sem rede de segurança a "refatoração" vira edição às cegas, e ofereça uma versão mínima (1-2 testes de caracterização do caminho mais crítico) em vez de pular essa fase inteiramente.

### Fase 3 — Refatorar (passos pequenos)

Regras de ouro:

1. **Comportamento é preservado** — refatoração muda o "como", nunca o "o quê"
2. **Um tipo de mudança por vez** — não misture "renomear variável" com "extrair função" com "mudar tipo" no mesmo passo. Se for commitar, um commit por mudança semântica.
3. **Teste depois de cada passo** — se quebrou, você sabe exatamente qual mudança foi
4. **Nunca misture com feature nova** — se durante a refatoração você perceber um bug real ou uma feature faltando, anote e trate depois, em outra etapa

Ordem sugerida de ataque (da mudança mais segura para a mais arriscada):

1. Renomear (variáveis, funções, arquivos) para nomes que revelam intenção
2. Extrair constantes nomeadas no lugar de números/strings mágicos
3. Aplicar guard clauses para achatar condicionais aninhados
4. Extrair funções menores de dentro de funções grandes (Extract Method)
5. Separar responsabilidades misturadas (lógica de negócio ↔ UI ↔ I/O) em unidades distintas
6. Introduzir tipos onde havia `any`/dados não tipados
7. Aplicar padrão de projeto (Strategy, Chain of Responsibility etc.) **somente** se a complexidade condicional realmente justificar — nunca por estética

#### Catálogo de code smells → correção

**Função/método longo demais**
```diff
- async function processOrder(orderId) {
-   // 50 linhas: busca pedido
-   // 30 linhas: valida pedido
-   // 40 linhas: calcula preço
-   // 30 linhas: atualiza estoque
-   // 20 linhas: cria envio
- }

+ async function processOrder(orderId) {
+   const order = await fetchOrder(orderId);
+   validateOrder(order);
+   const pricing = calculatePricing(order);
+   await updateInventory(order);
+   const shipment = await createShipment(order);
+   return { order, pricing, shipment };
+ }
```

**Código duplicado**
```diff
- function calculateUserDiscount(user) {
-   if (user.membership === 'gold') return user.total * 0.2;
-   if (user.membership === 'silver') return user.total * 0.1;
-   return 0;
- }
- function calculateOrderDiscount(order) {
-   if (order.user.membership === 'gold') return order.total * 0.2;
-   if (order.user.membership === 'silver') return order.total * 0.1;
-   return 0;
- }

+ function getMembershipDiscountRate(membership) {
+   const rates = { gold: 0.2, silver: 0.1 };
+   return rates[membership] ?? 0;
+ }
+ function calculateUserDiscount(user) {
+   return user.total * getMembershipDiscountRate(user.membership);
+ }
+ function calculateOrderDiscount(order) {
+   return order.total * getMembershipDiscountRate(order.user.membership);
+ }
```

**Classe/módulo "deus" (faz tudo)**
```diff
- class UserManager {
-   createUser() {}
-   updateUser() {}
-   sendEmail() {}
-   generateReport() {}
-   handlePayment() {}
- }

+ class UserService { create() {} update() {} delete() {} }
+ class EmailService { send(to, subject, body) {} }
+ class ReportService { generate(type, params) {} }
+ class PaymentService { process(amount, method) {} }
```

**Lista de parâmetros longa demais**
```diff
- function createUser(email, password, name, age, address, city, country, phone) {}

+ interface UserData {
+   email: string; password: string; name: string;
+   age?: number; address?: Address; phone?: string;
+ }
+ function createUser(data: UserData) {}
```

**Números/strings mágicos**
```diff
- if (user.status === 2) {}
- const discount = total * 0.15;
- setTimeout(callback, 86400000);

+ const UserStatus = { ACTIVE: 1, INACTIVE: 2, SUSPENDED: 3 } as const;
+ const DISCOUNT_RATES = { STANDARD: 0.1, PREMIUM: 0.15, VIP: 0.2 } as const;
+ const ONE_DAY_MS = 24 * 60 * 60 * 1000;
+
+ if (user.status === UserStatus.INACTIVE) {}
+ const discount = total * DISCOUNT_RATES.PREMIUM;
+ setTimeout(callback, ONE_DAY_MS);
```

**Condicionais aninhados ("código pirâmide")**
```diff
- function process(order) {
-   if (order) {
-     if (order.user) {
-       if (order.user.isActive) {
-         if (order.total > 0) {
-           return processOrder(order);
-         } else { return { error: 'Total inválido' }; }
-       } else { return { error: 'Usuário inativo' }; }
-     } else { return { error: 'Sem usuário' }; }
-   } else { return { error: 'Sem pedido' }; }
- }

+ function process(order) {
+   if (!order) return { error: 'Sem pedido' };
+   if (!order.user) return { error: 'Sem usuário' };
+   if (!order.user.isActive) return { error: 'Usuário inativo' };
+   if (order.total <= 0) return { error: 'Total inválido' };
+   return processOrder(order);
+ }
```

**Erro engolido silenciosamente**
```diff
- async function fetchData() {
-   try {
-     return await api.get('/data');
-   } catch (e) {}
- }

+ async function fetchData() {
+   try {
+     return await api.get('/data');
+   } catch (error) {
+     logger.error('Falha ao buscar dados', { error });
+     throw new DataFetchError('Não foi possível carregar os dados', { cause: error });
+   }
+ }
```

**Lógica de negócio misturada com UI/transporte**
```diff
- function handleSubmit(formData) {
-   if (formData.total > 1000 && formData.user.membership !== 'gold') {
-     setError('Apenas membros gold podem fazer pedidos acima de R$1000');
-     return;
-   }
-   fetch('/api/orders', { method: 'POST', body: JSON.stringify(formData) });
- }

+ // regra de negócio isolada, testável sem UI
+ function canPlaceOrder(formData) {
+   if (formData.total > 1000 && formData.user.membership !== 'gold') {
+     return { allowed: false, reason: 'Apenas membros gold podem fazer pedidos acima de R$1000' };
+   }
+   return { allowed: true };
+ }
+
+ function handleSubmit(formData) {
+   const check = canPlaceOrder(formData);
+   if (!check.allowed) return setError(check.reason);
+   return ordersApi.create(formData);
+ }
```

**Tipagem fraca / dados sem forma definida**
```diff
- function calculateDiscount(user, total, membership, date) {
-   if (membership === 'gold' && date.getDay() === 5) return total * 0.25;
-   if (membership === 'gold') return total * 0.2;
-   return total * 0.1;
- }

+ type Membership = 'bronze' | 'silver' | 'gold';
+ interface DiscountResult { original: number; discount: number; final: number; rate: number }
+
+ function calculateDiscount(membership: Membership, total: number, date: Date): DiscountResult {
+   if (total < 0) throw new Error('Total não pode ser negativo');
+   let rate = 0.1;
+   if (membership === 'gold' && date.getDay() === 5) rate = 0.25;
+   else if (membership === 'gold') rate = 0.2;
+   else if (membership === 'silver') rate = 0.15;
+   const discount = total * rate;
+   return { original: total, discount, final: total - discount, rate };
+ }
```

#### Padrões de projeto — usar com moderação

Só introduza um padrão de projeto quando a alternativa (condicional crescendo) já é claramente pior. Padrão de projeto adicionado cedo demais piora a auditabilidade, não melhora.

**Strategy** — quando há um `if/else`/`switch` que escolhe comportamento e tende a crescer com novos casos:
```diff
- function calculateShipping(order, method) {
-   if (method === 'standard') return order.total > 50 ? 0 : 5.99;
-   if (method === 'express') return order.total > 100 ? 9.99 : 14.99;
-   if (method === 'overnight') return 29.99;
- }

+ const shippingStrategies = {
+   standard: (order) => order.total > 50 ? 0 : 5.99,
+   express: (order) => order.total > 100 ? 9.99 : 14.99,
+   overnight: () => 29.99,
+ };
+ function calculateShipping(order, method) {
+   return shippingStrategies[method](order);
+ }
```

**Chain of Responsibility** — quando há uma sequência de validações independentes que hoje vive como vários `if` soltos:
- Útil só se a lista de validações for grande (5+) e crescer com frequência. Para 2-3 validações, guard clauses simples já resolvem e são mais legíveis.

### Fase 4 — Verificar

- Rode todos os testes (os de caracterização + os pré-existentes) — têm que passar sem exceção
- Releia cada função alterada com o checklist de auditabilidade (seção acima) — ela passa nos 7 critérios?
- Confirme que nenhum comportamento observável mudou (mesmos inputs → mesmos outputs, mesmos efeitos colaterais)
- Se algo precisar mudar de comportamento (bug real encontrado no caminho), isso é uma decisão separada — comunique explicitamente, não esconda dentro do refactor

### Fase 5 — Entregar

Feche com um resumo curto para quem for revisar (humano), contendo:

- O que foi identificado na auditoria (1-2 linhas por problema)
- O que foi mudado, agrupado por tipo de mudança (não por arquivo)
- O que **não** foi mexido e por quê (escopo deliberadamente fora)
- Cobertura de teste antes/depois
- Qualquer achado que não foi corrigido agora (bug real, dívida técnica) para virar item separado

---

## Checklist final por módulo

**Auditoria**
- [ ] Funções/componentes grandes ou multi-responsabilidade identificados
- [ ] Lógica de negócio misturada com UI/rede/I/O identificada
- [ ] Nomes pouco claros identificados
- [ ] Erros não tratados identificados
- [ ] Estado implícito identificado

**Proteção**
- [ ] Existe teste cobrindo o comportamento atual antes de mexer (escrito se não existia)
- [ ] Testes passam (estado verde) antes do primeiro corte

**Refatoração**
- [ ] Cada mudança foi de um tipo só (sem misturar rename + extração + retipagem no mesmo passo)
- [ ] Nenhuma feature nova ou correção de bug foi misturada no meio
- [ ] Testes rodados e verdes após cada passo

**Resultado (critério de auditável)**
- [ ] Toda função passa no teste dos 30 segundos
- [ ] Nomes revelam intenção sem precisar ler o corpo
- [ ] Cada unidade tem uma responsabilidade
- [ ] Erros são tratados de forma explícita, nunca engolidos
- [ ] Sem aninhamento profundo — guard clauses no lugar de pirâmides
- [ ] Comentários (quando existem) explicam decisão, não repetem código
- [ ] Resumo de entrega escrito para quem for revisar

---

## Operações de refatoração — referência rápida

| Operação | O que faz |
|---|---|
| Extract Method | Transforma um trecho em função nomeada |
| Extract Class/Module | Move um conjunto de responsabilidades para uma unidade própria |
| Inline Method | Traz o corpo de uma função de volta para o chamador (quando a abstração não compensa) |
| Rename | Troca nome por um que revela intenção |
| Introduce Parameter Object | Agrupa parâmetros relacionados em um objeto/tipo |
| Replace Magic Number/String with Constant | Substitui valor solto por constante nomeada |
| Decompose Conditional | Quebra condição complexa em variáveis/funções nomeadas |
| Replace Nested Conditional with Guard Clauses | Achata pirâmide de `if` em retornos antecipados |
| Replace Conditional with Strategy/Polymorphism | Troca `if/switch` que escolhe comportamento por mapa de estratégias |
| Introduce Null Object | Elimina checagens repetidas de null/undefined |

---

## Quando NÃO refatorar

- Código que funciona e não vai mudar de novo (não mexa só por estética)
- Código crítico em produção sem nenhum teste — primeiro adicione testes de caracterização, só depois refatore
- Sob prazo muito apertado e sem rede de segurança possível — nesse caso, é melhor isolar o trecho problemático (extrair para uma função claramente marcada) do que arriscar uma refatoração ampla sem testes
- "Just because" — refatoração precisa de motivo concreto (vai facilitar entendimento, vai habilitar mudança futura, vai reduzir risco), não é exercício de estilo
