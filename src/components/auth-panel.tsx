'use client'

import {FormEvent,useState} from 'react'
import {useRouter} from 'next/navigation'

export function AuthPanel({setup}:{setup:boolean}) {
	const router=useRouter(); const [error,setError]=useState(''); const [pending,setPending]=useState(false)
	async function submit(event:FormEvent<HTMLFormElement>) {
		event.preventDefault(); setPending(true); setError('')
		const form=new FormData(event.currentTarget)
		const response=await fetch(setup?'/api/auth/setup':'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.get('username'),password:form.get('password')})})
		const data=await response.json().catch(()=>({}))
		if(!response.ok){setError(data.error??'Запрос не выполнен');setPending(false);return}
		router.refresh()
	}
	return <main className="auth-shell"><section className="auth-card">
		<div className="auth-mark" aria-hidden="true"><span>800</span><i>×</i><span>480</span></div>
		<p className="eyebrow">E‑INK CONTROL DESK</p><h1>{setup?'Первый запуск':'Вход в панель'}</h1>
		<p className="auth-copy">{setup?'Создайте владельца дисплея. После этого открытая регистрация будет отключена.':'Настройки экрана и персональная ссылка доступны после входа.'}</p>
		<form onSubmit={submit} className="auth-form"><label>Логин<input name="username" autoComplete="username" minLength={3} required autoFocus/></label><label>Пароль<input name="password" type="password" autoComplete={setup?'new-password':'current-password'} minLength={setup?8:1} required/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={pending}>{pending?'Подождите…':setup?'Создать владельца':'Войти'}</button></form>
	</section></main>
}
