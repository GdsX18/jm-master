import { NextRequest, NextResponse } from 'next/server';
import { BLOG_ONLY_ROLE, SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

// Rotas de API acessíveis sem login
// /api/cron/billing se autentica com o CRON_SECRET da Vercel
const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/logout', '/api/leads', '/api/cron/billing'];

// O perfil "Criador de Blog" só acessa estas rotas
const BLOG_ROLE_API_PREFIXES = ['/api/blog', '/api/upload', '/api/auth'];

function isPublicApi(pathname: string, method: string) {
  if (pathname === '/api/leads') return method === 'POST';
  return PUBLIC_API_ROUTES.includes(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (pathname === '/painel/login' || (isApi && isPublicApi(pathname, req.method))) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const loginUrl = new URL('/painel/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role === BLOG_ONLY_ROLE) {
    if (isApi && !BLOG_ROLE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    if (!isApi && pathname !== '/painel/blog') {
      return NextResponse.redirect(new URL('/painel/blog', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/painel/:path*', '/api/:path*'],
};
