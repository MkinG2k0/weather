import {compare} from 'bcryptjs'
import {NextResponse} from 'next/server'
import {z} from 'zod'
import {createSession, SESSION_COOKIE} from '@/lib/auth'
import {prisma} from '@/lib/prisma'

const schema = z.object({username: z.string().trim().min(1), password: z.string().min(1)})

export async function POST(request: Request) {
	try {
		const input = schema.parse(await request.json())
		const user = await prisma.user.findUnique({where: {username: input.username}})
		if (!user || !(await compare(input.password, user.passwordHash))) return Response.json({error: 'Неверный логин или пароль'}, {status: 401})
		const session = await createSession(user.id)
		const response = NextResponse.json({ok: true})
		response.cookies.set(SESSION_COOKIE, session.token, {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: session.expiresAt})
		return response
	} catch (error) {
		if (error instanceof z.ZodError) return Response.json({error: 'Введите логин и пароль'}, {status: 400})
		console.error('Login failed:', error)
		return Response.json({error: 'Не удалось выполнить вход'}, {status: 500})
	}
}
