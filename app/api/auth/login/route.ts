import { NextResponse } from 'next/server';
import { authenticateUser, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Por favor, preencha todos os campos.' }, { status: 400 });
    }

    const result = await authenticateUser(email, password);
    if (!result.success || !result.user) {
      return NextResponse.json({ error: result.error || 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    await setSessionCookie(result.user);
    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error('Login API Error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
