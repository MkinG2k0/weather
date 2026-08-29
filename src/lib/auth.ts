import {createHash, randomBytes} from 'node:crypto'
import {cookies} from 'next/headers'
import {prisma} from './prisma'

export const SESSION_COOKIE = 'weather_session'
const SESSION_DAYS = 30

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function createSession(userId: string) {
	const token = randomBytes(32).toString('base64url')
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
	await prisma.session.create({data: {id: tokenHash(token), userId, expiresAt}})
	return {token, expiresAt}
}

export async function getSessionToken() {
	return (await cookies()).get(SESSION_COOKIE)?.value
}

export async function getCurrentUser() {
	const token = await getSessionToken()
	if (!token) return null
	const session = await prisma.session.findUnique({where: {id: tokenHash(token)}, include: {user: true}})
	if (!session) return null
	if (session.expiresAt <= new Date()) {
		await prisma.session.delete({where: {id: session.id}}).catch(() => undefined)
		return null
	}
	return session.user
}

export async function removeCurrentSession() {
	const token = await getSessionToken()
	if (token) await prisma.session.delete({where: {id: tokenHash(token)}}).catch(() => undefined)
}
