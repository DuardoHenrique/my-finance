---
name: qualidade
description: Segurança e testes (TDD). Ative ao implementar qualquer feature com auth, input, dados sensíveis ou novos endpoints. Execute o checklist de segurança antes de todo commit de módulo.
---

# Qualidade — Segurança + Testes

---

## SEGURANÇA

### Regras absolutas
- Segredos: apenas `process.env.*` — nunca hardcoded; `.env` no `.gitignore`
- Queries: sempre via TypeORM (`.findOne`, `.save`, QueryBuilder com parâmetros nomeados) — nunca concatenação de string SQL
- JWT: `httpOnly Cookie` com `Secure`, `SameSite=Strict` — nunca `localStorage`
- Senhas: `bcrypt` com custo ≥ 12 — nunca MD5, SHA1 ou texto puro
- Respostas: DTOs com campos explícitos — nunca retorne a entidade bruta (expõe `passwordHash`)
- Logs: nunca logue senha, token, CVV, número de cartão

### Validação de input (backend)
```typescript
// ValidationPipe global já filtra (whitelist: true, forbidNonWhitelisted: true)
// No DTO: sempre declare tipo, tamanho e formato com class-validator
@IsEmail() email: string
@IsString() @MinLength(8) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) password: string
```

### Autorização — filtrar sempre pelo userId
```typescript
// Sempre inclua userId nas queries — nunca busque só por id
this.repo.findOne({ where: { id, userId } })  // 404 se não for do usuário
```

### Rotas protegidas
```typescript
@UseGuards(JwtAuthGuard)            // autenticação
@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)  // admin only
```

### Upload de arquivos
```typescript
FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype))
      return cb(new BadRequestException('Tipo não permitido'), false)
    cb(null, true)
  },
})
```

### Checklist de segurança por módulo (executar antes do commit final)
- [ ] Nenhum segredo hardcoded
- [ ] Todo input validado via DTO + class-validator
- [ ] Queries via TypeORM — sem concatenação SQL
- [ ] JWT em httpOnly Cookie — não em localStorage
- [ ] Todas as rotas protegidas com `JwtAuthGuard`
- [ ] Recursos filtrados por `userId` do usuário autenticado
- [ ] Rotas admin com `RolesGuard + @Roles`
- [ ] Resposta retorna DTO — não entidade bruta
- [ ] Logs sem dados sensíveis
- [ ] Rate limiting em endpoints de auth

### Checklist pré-deploy (adicional)
- [ ] `.env` ausente do git (`git ls-files | grep .env`)
- [ ] `synchronize: false` no TypeORM config
- [ ] `secure: true` no cookie (exige HTTPS)
- [ ] `CORS_ORIGIN` aponta apenas para o domínio de produção
- [ ] `npm audit` sem vulnerabilidades críticas

---

## TESTES (TDD)

### A lei
```
TESTE FALHA PRIMEIRO → CÓDIGO MÍNIMO → TESTE PASSA → REFATORE
```
Escreveu código antes do teste: delete o código, comece pelo teste.

### Teste unitário — NestJS Service
```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService
  const mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn(), softDelete: jest.fn() }

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [ProductsService, { provide: getRepositoryToken(Product), useValue: mockRepo }],
    }).compile()
    service = mod.get(ProductsService)
    jest.clearAllMocks()
  })

  it('deve criar produto', async () => {
    const dto = { name: 'X', price: 10 }
    const saved = { id: 'uuid', ...dto, userId: 'u1' } as Product
    mockRepo.create.mockReturnValue(saved)
    mockRepo.save.mockResolvedValue(saved)

    const result = await service.create(dto, 'u1')

    expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, userId: 'u1' })
    expect(result).toEqual(saved)
  })

  it('deve lançar NotFoundException quando não existe', async () => {
    mockRepo.findOne.mockResolvedValue(null)
    await expect(service.findOne('id', 'u1')).rejects.toThrow(NotFoundException)
  })
})
```

```bash
npx jest products.service.spec.ts --no-coverage
# RED: falha com motivo esperado → implemente → GREEN: PASS
```

### Teste e2e — Controller HTTP
```typescript
// test/products.e2e-spec.ts
describe('POST /products (e2e)', () => {
  it('201 quando autenticado', async () => {
    const res = await request(app.getHttpServer())
      .post('/products').set('Cookie', authCookie)
      .send({ name: 'Prod', price: 10 })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
  })
  it('401 sem autenticação', async () => {
    const res = await request(app.getHttpServer()).post('/products').send({ name: 'X', price: 1 })
    expect(res.status).toBe(401)
  })
  it('400 com dados inválidos', async () => {
    const res = await request(app.getHttpServer())
      .post('/products').set('Cookie', authCookie)
      .send({ name: '', price: -1 })
    expect(res.status).toBe(400)
  })
})
```

### Teste de componente — React Testing Library
```typescript
// button.test.tsx
it('deve chamar onClick ao clicar', async () => {
  const fn = jest.fn()
  render(<Button onClick={fn}>Clique</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(fn).toHaveBeenCalledTimes(1)
})

it('deve estar desabilitado quando loading=true', () => {
  render(<Button loading>...</Button>)
  expect(screen.getByRole('button')).toBeDisabled()
})
```

### O que testar — obrigatório
1. Caminho feliz (criação, busca, atualização)
2. 404 — recurso inexistente ou de outro usuário
3. 401/403 — sem auth ou sem permissão
4. 400 — input inválido (campos obrigatórios, formatos)

### Checklist TDD por tarefa
- [ ] Escrevi o teste antes do código
- [ ] Vi o teste falhar pelo motivo certo
- [ ] Implementei o mínimo para passar
- [ ] Todos os testes passam sem erros ou warnings
- [ ] Cobri: sucesso, erro 404, erro 401/403, input inválido
