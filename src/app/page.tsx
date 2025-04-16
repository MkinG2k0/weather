import { BASE_API } from '@/shared/config/env'

export default async function Home() {
	// const data: any = await fetch(`${BASE_API}/weather`, {
	// 	next: {revalidate: 120},
	// }).then((value) => value.json())

	return (
		<div
			className="flex flex-col p-5 text-2xl gap-4">
			<div>
				Weather
			</div>
			{/*{data?.current?.temp}*/}
			{/*<div>{JSON.stringify(data?.current, null, '\n')}</div>*/}
		</div>
	)
}
