import type {CSSProperties, ReactNode} from 'react'
import type {BlockId} from '@/lib/panel-config'
import type {WeatherScreenData} from '@/lib/weather'

type WeatherScreenProps = {weather: WeatherScreenData; generatedAt?: Date}
const panel: CSSProperties = {display:'flex', flex:1, minWidth:0, border:'3px solid #000', background:'#fff'}
const text = (size:number, weight:number=700): CSSProperties => ({display:'flex', fontSize:size, fontWeight:weight})

function Metric({label,value}:{label:string;value:string}) {
	return <div style={{display:'flex',flexDirection:'column',gap:5}}><div style={{...text(11),letterSpacing:1.4}}>{label}</div><div style={text(28,900)}>{value}</div></div>
}

function CurrentCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'center',padding:'12px 18px'}}>
		<div style={{display:'flex',alignItems:'flex-start'}}><div style={{...text(98,900),lineHeight:.9,letterSpacing:-7}}>{weather.temperature}</div><div style={{...text(40,900),lineHeight:1}}>°</div></div>
		<div style={{display:'flex',alignItems:'center',gap:10,marginTop:12}}><div style={{width:42,height:11,display:'flex',background:'#000'}}/><div style={{...text(15,900),letterSpacing:.7}}>{weather.weatherLabel}</div></div>
		<div style={{...text(12),marginTop:8}}>{`${weather.labels.feels} ${weather.feelsLike}° · ${weather.labels.high} ${weather.high}° / ${weather.labels.low} ${weather.low}°`}</div>
	</section>
}

function MetricsCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'space-between',padding:'16px 18px'}}>
		<Metric label={weather.labels.humidity} value={`${weather.humidity}%`}/><div style={{display:'flex',height:3,background:'#000'}}/>
		<Metric label={weather.labels.pressure} value={weather.pressure}/><div style={{display:'flex',height:3,background:'#000'}}/>
		<Metric label={weather.labels.precipitation} value={`${weather.precipitationProbability}%`}/>
	</section>
}

function WindCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:14}}>
		<div style={{...text(11,800),letterSpacing:2}}>{`${weather.labels.wind} / ${weather.windDirection}`}</div>
		<div style={{display:'flex',alignItems:'baseline',marginTop:5}}><div style={{...text(62,900),lineHeight:1}}>{weather.windSpeed}</div><div style={{...text(15,900),marginLeft:4}}>{weather.windUnit}</div></div>
		<div style={text(36,900)}>↑</div><div style={text(11)}>{`${weather.labels.gusts} ${weather.windGust} ${weather.windUnit}`}</div>
	</section>
}

function SunCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'space-between',padding:'18px'}}>
		<Metric label={weather.labels.sunrise} value={weather.sunrise}/><div style={{display:'flex',height:3,background:'#000'}}/>
		<Metric label={weather.labels.sunset} value={weather.sunset}/><div style={{display:'flex',height:3,background:'#000'}}/>
		<Metric label={weather.labels.uv} value={String(weather.uvIndex)}/>
	</section>
}

function CloudsCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:16}}>
		<div style={{...text(11,800),letterSpacing:1.6}}>{weather.labels.clouds}</div><div style={{...text(76,900),lineHeight:1,marginTop:10}}>{weather.cloudCover}</div><div style={text(24,900)}>%</div>
		<div style={{display:'flex',width:90,height:12,marginTop:14,border:'2px solid #000'}}><div style={{display:'flex',width:`${weather.cloudCover}%`,background:'#000'}}/></div><div style={{...text(11,800),marginTop:10}}>{weather.weatherLabel}</div>
	</section>
}

const cardRenderers: Record<BlockId,(weather:WeatherScreenData)=>ReactNode> = {
	current:weather=><CurrentCard weather={weather}/>,metrics:weather=><MetricsCard weather={weather}/>,wind:weather=><WindCard weather={weather}/>,sun:weather=><SunCard weather={weather}/>,clouds:weather=><CloudsCard weather={weather}/>,
}

export function WeatherScreen({weather,generatedAt=new Date()}:WeatherScreenProps) {
	const locale = weather.labels.wind === 'ВЕТЕР' ? 'ru-RU' : 'en-GB'
	const date = new Intl.DateTimeFormat(locale,{timeZone:weather.timezone,weekday:'short',day:'2-digit',month:'short'}).format(generatedAt).toUpperCase()
	const time = new Intl.DateTimeFormat('en-GB',{timeZone:weather.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(generatedAt)
	const visibleCards=weather.layout.blocks
	return <div style={{width:800,height:480,display:'flex',flexDirection:'column',background:'#fff',color:'#000',fontFamily:'Arial, sans-serif',border:'8px solid #000',boxSizing:'border-box'}}>
		<header style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 22px',background:'#000',color:'#fff'}}>
			<div style={{display:'flex',alignItems:'baseline',gap:14}}><div style={{...text(25,900),letterSpacing:.7}}>{weather.city}</div><div style={{...text(10),letterSpacing:1.5}}>{weather.coordinates}</div></div>
			<div style={{display:'flex',alignItems:'center',gap:16}}><div style={{...text(12,800),letterSpacing:1}}>{date}</div><div style={text(24,900)}>{time}</div></div>
		</header>
		<div style={{display:'flex',flex:1,padding:14,gap:12}}>{visibleCards.map(id => <div key={id} style={{display:'flex',flex:1,minWidth:0}}>{cardRenderers[id](weather)}</div>)}</div>
		{weather.layout.showForecast && <footer style={{display:'flex',height:126,borderTop:'5px solid #000'}}>{weather.forecast.map((item,index)=><div key={`${item.time}-${index}`} style={{display:'flex',flex:1,minWidth:0,alignItems:'center',justifyContent:'space-between',gap:6,padding:'10px 12px',borderLeft:index===0?'none':'3px solid #000'}}><div style={{display:'flex',width:100,minWidth:0,flexDirection:'column',gap:8}}><div style={{...text(12,900),letterSpacing:1}}>{item.time}</div><div style={{...text(8,800),lineHeight:1.15,letterSpacing:.7}}>{item.mark}</div></div><div style={{...text(27,900),flexShrink:0}}>{item.temp}</div></div>)}</footer>}
	</div>
}
