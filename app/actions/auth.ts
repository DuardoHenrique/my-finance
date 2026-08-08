'use server';

import { registerUser, authenticateUser, setSessionCookie, clearSessionCookie, getSessionUser, SessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, preencha todos os campos.' };
  }

  const result = await authenticateUser(email, password);
  if (!result.success || !result.user) {
    return { error: result.error || 'Falha ao autenticar.' };
  }

  await setSessionCookie(result.user);
  redirect('/');
}

export async function registerAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'Por favor, preencha todos os campos.' };
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  const result = await registerUser(name, email, password);
  if (!result.success || !result.user) {
    return { error: result.error || 'Falha ao criar conta.' };
  }

  await setSessionCookie(result.user);
  redirect('/');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return await getSessionUser();
}
