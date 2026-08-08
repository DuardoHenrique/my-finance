import { NextResponse } from 'next/server';
import { registerUser, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Por favor, preencha todos os campos.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const result = await registerUser(name, email, password);
    if (!result.success || !result.user) {
      return NextResponse.json({ error: result.error || 'Falha ao criar conta.' }, { status: 400 });
    }

    await setSessionCookie(result.user);
    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error('Register API Error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
