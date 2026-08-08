---
name: padroes-de-codigo
description: Referência de padrões para frontend (Next.js, React, Tailwind) e backend (NestJS, TypeORM, MySQL). Consulte durante qualquer implementação de componente, página, módulo ou entidade.
---

# Padrões de Código

---

## FRONTEND — Next.js + React + Tailwind

### Server vs Client Component
- Server Component por padrão — sem `'use client'`
- Adicione `'use client'` apenas quando usar: `useState`, `useEffect`, event handlers, hooks de libs
- Isole a interatividade em componentes pequenos; a página pai permanece Server

### Estrutura de componente
```typescript
// components/ui/button.tsx
import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button
      className={cn('rounded-lg px-4 py-2 font-medium transition-colors focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="animate-spin inline-block">⏳</span> : children}
    </button>
  )
}
```

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
// npm install clsx tailwind-merge
```

### Tailwind
- Mobile-first obrigatório: `w-full md:w-1/3`, nunca o contrário
- Use `cn()` para classes condicionais — nunca template literals com ternários inline
- Defina tokens de cor em `tailwind.config.ts` — não use valores arbitrários (ex: `mt-[13px]`)
- Ordem de classes: layout → dimensões → espaçamento → tipografia → cores → bordas → interação → responsivo

### Data fetching
```typescript
// Server Component — fetch direto (preferido)
export default async function Page() {
  const { data } = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    headers: { Cookie: (await cookies()).toString() },
    cache: 'no-store',
  }).then(r => r.json())
  return <ProductList products={data} />
}
```

```typescript
// lib/api.ts — centralizar todas as chamadas
const API = process.env.NEXT_PUBLIC_API_URL
async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}
export const api = {
  get: <T>(p: string) => req<T>(p),
  post: <T>(p: string, b: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(b) }),
  patch: <T>(p: string, b: unknown) => req<T>(p, { method: 'PATCH', body: JSON.stringify(b) }),
  delete: <T>(p: string) => req<T>(p, { method: 'DELETE' }),
}
```

### Formulários
```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// npm install react-hook-form @hookform/resolvers zod

const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
type F = z.infer<typeof schema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })
  return (
    <form onSubmit={handleSubmit(data => api.post('/auth/login', data))} className="space-y-4">
      <input {...register('email')} type="email" className="w-full rounded border px-3 py-2" />
      {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      <Button type="submit" loading={isSubmitting} className="w-full">Entrar</Button>
    </form>
  )
}
```

### Estados de UI obrigatórios
Todo componente com dados assíncronos deve tratar os três estados:
```typescript
if (isLoading) return <Skeleton />          // animate-pulse com divs cinzas
if (error) return <ErrorState onRetry={...} />   // mensagem + botão "tentar novamente"
if (!data?.length) return <EmptyState />    // mensagem + ação principal
return <DataList items={data} />
```

### Regras de performance
- Nunca defina componentes dentro de componentes
- `import { Button } from '@/components/ui/button'` — não use barrel index
- Use `next/image` para todas as imagens
- `Promise.all([...])` para fetches independentes — nunca sequential await

---

## BACKEND — NestJS + TypeORM + MySQL

### Entidade TypeORM
```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ length: 200 }) name: string
  @Column({ type: 'decimal', precision: 10, scale: 2 }) price: number
  @Column({ default: true }) isActive: boolean
  @Column() userId: string
  @ManyToOne(() => User) @JoinColumn({ name: 'userId' }) user: User
  @CreateDateColumn() createdAt: Date
  @UpdateDateColumn() updatedAt: Date
  @DeleteDateColumn() deletedAt: Date | null
}
```
- Sempre UUID como PK
- `{ select: false }` em `passwordHash`
- `@DeleteDateColumn()` para soft delete em entidades de negócio

### DTOs
```typescript
export class CreateProductDto {
  @IsString() @MinLength(3) @MaxLength(200) name: string
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Transform(({ value }) => parseFloat(value)) price: number
  @IsString() @IsOptional() @MaxLength(2000) description?: string
}
export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### Service
```typescript
@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  create(dto: CreateProductDto, userId: string) {
    return this.repo.save(this.repo.create({ ...dto, userId }))
  }

  findAll(userId: string, page = 1, limit = 20) {
    return this.repo.findAndCount({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    })
  }

  async findOne(id: string, userId: string) {
    const item = await this.repo.findOne({ where: { id, userId } })
    if (!item) throw new NotFoundException(`Produto ${id} não encontrado`)
    return item
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const item = await this.findOne(id, userId)
    return this.repo.save(Object.assign(item, dto))
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    await this.repo.softDelete(id)
  }
}
```

### Controller
```typescript
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private svc: ProductsService) {}

  @Post() @HttpCode(201)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.id)
  }

  @Get()
  async findAll(@CurrentUser() user: User, @Query('page') page = '1', @Query('limit') limit = '20') {
    const [data, total] = await this.svc.findAll(user.id, +page, +limit)
    return { data, total, page: +page, limit: +limit }
  }

  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) { return this.svc.findOne(id, user.id) }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: User) { return this.svc.update(id, dto, user.id) }
  @Delete(':id') @HttpCode(204) remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) { return this.svc.remove(id, user.id) }
}
```

### main.ts — configuração global obrigatória
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  await app.listen(process.env.PORT ?? 3001)
}
```

### JWT em httpOnly Cookie
```typescript
// auth.service.ts — login
res.cookie('token', this.jwtService.sign({ sub: user.id, role: user.role }), {
  httpOnly: true, secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
})

// jwt.strategy.ts — extrair do cookie
jwtFromRequest: ExtractJwt.fromExtractors([(req) => req?.cookies?.token ?? null])
```

### database.config.ts
```typescript
export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST, port: +process.env.DB_PORT,
  username: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,   // NUNCA true em produção
  logging: process.env.NODE_ENV === 'development',
})
```

### Rate limiting
```typescript
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
// Endpoints sensíveis (login, register):
@Throttle({ default: { limit: 5, ttl: 60000 } })
```
