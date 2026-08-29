import {NextResponse} from 'next/server'
import {removeCurrentSession, SESSION_COOKIE} from '@/lib/auth'

export async function POST() {
	await removeCurrentSession()
	const response = NextResponse.json({ok: true})
	response.cookies.set(SESSION_COOKIE, '', {httpOnly: true, expires: new Date(0), path: '/'})
	return response
}
