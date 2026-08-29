import {randomBytes} from 'node:crypto'
import {hash} from 'bcryptjs'
import {NextResponse} from 'next/server'
import {z} from 'zod'
import {createSession, SESSION_COOKIE} from '@/lib/auth'
import {DEFAULT_LAYOUT} from '@/lib/panel-config'
import {prisma} from '@/lib/prisma'

const schema = z.object({username: z.string().trim().min(3).max(64), password: z.string().min(8).max(128)})

export async function POST(request: Request) {
	try {
		const input = schema.parse(await request.json())
		if (await prisma.user.count()) return Response.json({error: 'Первичная настройка уже выполнена'}, {status: 409})
		const passwordHash = await hash(input.password, 12)
		const user = await prisma.user.create({
			data: {
				username: input.username,
				passwordHash,
				panels: {create: {slug: randomBytes(18).toString('base64url'), layout: DEFAULT_LAYOUT}},
			},
		})
		const session = await createSession(user.id)
		const response = NextResponse.json({ok: true})
		response.cookies.set(SESSION_COOKIE, session.token, {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: session.expiresAt})
		return response
	} catch (error) {
		if (error instanceof z.ZodError) return Response.json({error: 'Логин: от 3 символов, пароль: от 8 символов'}, {status: 400})
		console.error('Setup failed:', error)
		return Response.json({error: 'Не удалось создать пользователя'}, {status: 500})
	}
}
