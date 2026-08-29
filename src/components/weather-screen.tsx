import type {CSSProperties} from 'react'

type WeatherScreenProps = {generatedAt?: Date}

const panel: CSSProperties = {display: 'flex', border: '3px solid #000', background: '#fff'}
const metricLabel: CSSProperties = {fontSize: 12, fontWeight: 700, letterSpacing: 1.5}
const metricValue: CSSProperties = {fontSize: 29, fontWeight: 900, lineHeight: 1}
const forecast = [
	{time: '06:00', mark: 'CLEAR', temp: '+22°'},
	{time: '12:00', mark: 'SUN', temp: '+28°'},
	{time: '18:00', mark: 'CLOUD', temp: '+25°'},
	{time: '00:00', mark: 'CLEAR', temp: '+20°'},
]

function Metric({label, value}: {label: string; value: string}) {
	return <div style={{display: 'flex', flexDirection: 'column', gap: 5}}><div style={metricLabel}>{label}</div><div style={metricValue}>{value}</div></div>
}

export function WeatherScreen({generatedAt = new Date()}: WeatherScreenProps) {
	const date = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Moscow', weekday: 'short', day: '2-digit', month: 'short'}).format(generatedAt).toUpperCase()
	const time = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hour12: false}).format(generatedAt)

	return (
		<div style={{width: 800, height: 480, display: 'flex', flexDirection: 'column', background: '#fff', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif', border: '8px solid #000', boxSizing: 'border-box'}}>
			<header style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', background: '#000', color: '#fff'}}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 14}}><div style={{fontSize: 27, fontWeight: 900, letterSpacing: 1}}>MAKHACHKALA</div><div style={{fontSize: 12, fontWeight: 700, letterSpacing: 2}}>42.98 N / 47.50 E</div></div>
				<div style={{display: 'flex', alignItems: 'center', gap: 16}}><div style={{fontSize: 14, fontWeight: 800, letterSpacing: 1.5}}>{date}</div><div style={{fontSize: 25, fontWeight: 900}}>{time}</div></div>
			</header>

			<div style={{display: 'flex', height: 274, padding: 14, gap: 12}}>
				<section style={{...panel, width: 282, flexDirection: 'column', justifyContent: 'center', padding: '12px 18px'}}>
					<div style={{display: 'flex', alignItems: 'flex-start'}}><div style={{fontSize: 104, fontWeight: 900, lineHeight: 0.9, letterSpacing: -8}}>28</div><div style={{fontSize: 42, fontWeight: 900, lineHeight: 1}}>°</div></div>
					<div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 12}}><div style={{width: 52, height: 12, display: 'flex', background: '#000'}} /><div style={{fontSize: 17, fontWeight: 900, letterSpacing: 1}}>PARTLY CLOUDY</div></div>
					<div style={{fontSize: 13, fontWeight: 700, marginTop: 8}}>FEELS LIKE 29° · HIGH 30° / LOW 20°</div>
				</section>

				<section style={{...panel, width: 224, flexDirection: 'column', justifyContent: 'space-between', padding: '16px 18px'}}>
					<Metric label="HUMIDITY" value="54%" /><div style={{display: 'flex', height: 3, background: '#000'}} /><Metric label="PRESSURE" value="756 mm" /><div style={{display: 'flex', height: 3, background: '#000'}} /><Metric label="PRECIPITATION" value="10%" />
				</section>

				<section style={{...panel, flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14}}>
					<div style={{fontSize: 12, fontWeight: 800, letterSpacing: 2}}>WIND / NW</div><div style={{display: 'flex', alignItems: 'baseline', marginTop: 5}}><div style={{fontSize: 66, fontWeight: 900, lineHeight: 1}}>4</div><div style={{fontSize: 17, fontWeight: 900, marginLeft: 4}}>m/s</div></div><div style={{fontSize: 38, fontWeight: 900, transform: 'rotate(-45deg)'}}>↑</div><div style={{fontSize: 12, fontWeight: 700}}>GUSTS 7 m/s</div>
				</section>
			</div>

			<footer style={{display: 'flex', flex: 1, borderTop: '5px solid #000'}}>
				{forecast.map((item, index) => <div key={item.time} style={{display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderLeft: index === 0 ? 'none' : '3px solid #000'}}><div style={{display: 'flex', flexDirection: 'column', gap: 8}}><div style={{fontSize: 13, fontWeight: 900, letterSpacing: 1}}>{item.time}</div><div style={{fontSize: 11, fontWeight: 800, letterSpacing: 1.5}}>{item.mark}</div></div><div style={{fontSize: 31, fontWeight: 900}}>{item.temp}</div></div>)}
			</footer>
		</div>
	)
}
