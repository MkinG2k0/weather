import type {CSSProperties, ReactNode} from 'react'
import type {BlockId} from '@/lib/panel-config'
import type {WeatherScreenData} from '@/lib/weather'

type WeatherScreenProps = {
	weather: WeatherScreenData
	generatedAt?: Date
	generatedAtLocal?: string
	renderBlock?: (id:BlockId,content:ReactNode)=>ReactNode
	addSlot?: ReactNode
}
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

function ForecastCard({weather}:{weather:WeatherScreenData}) {
	const label=weather.labels.wind==='ВЕТЕР'?'ПРОГНОЗ':'FORECAST'
	return <section style={{...panel,flexDirection:'column',padding:'38px 14px 12px'}}>
		<div style={{...text(11,900),letterSpacing:1.7,marginBottom:8}}>{label}</div>
		{weather.forecast.map((item,index)=><div key={`${item.time}-${index}`} style={{display:'flex',alignItems:'center',gap:7,flex:1,minHeight:0,borderTop:index===0?'3px solid #000':'2px solid #000'}}><div style={{...text(10,900),width:38,flexShrink:0,letterSpacing:.7}}>{item.time}</div><div style={{...text(8,800),flex:1,minWidth:0,lineHeight:1.1}}>{item.mark}</div><div style={{...text(19,900),flexShrink:0}}>{item.temp}</div></div>)}
	</section>
}

function FeelsCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'center',padding:'28px 16px'}}>
		<div style={{...text(11,900),letterSpacing:1.5}}>{weather.labels.feels}</div><div style={{...text(72,900),lineHeight:1,marginTop:10}}>{weather.feelsLike}°</div>
		<div style={{display:'flex',height:3,background:'#000',margin:'20px 0 14px'}}/><div style={{display:'flex',justifyContent:'space-between',gap:8}}><Metric label={weather.labels.low} value={`${weather.low}°`}/><Metric label={weather.labels.high} value={`${weather.high}°`}/></div>
	</section>
}

function HumidityCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 16px'}}>
		<div style={{...text(11,900),letterSpacing:1.5}}>{weather.labels.humidity}</div><div style={{display:'flex',alignItems:'baseline',marginTop:13}}><div style={{...text(72,900),lineHeight:1}}>{weather.humidity}</div><div style={text(22,900)}>%</div></div>
		<div style={{display:'flex',width:'100%',height:16,marginTop:22,border:'3px solid #000'}}><div style={{display:'flex',width:`${weather.humidity}%`,background:'#000'}}/></div>
	</section>
}

function PressureCard({weather}:{weather:WeatherScreenData}) {
	const [value,...unit]=weather.pressure.split(' ')
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 16px'}}>
		<div style={{...text(11,900),letterSpacing:1.5}}>{weather.labels.pressure}</div><div style={{...text(62,900),lineHeight:1,marginTop:16}}>{value}</div><div style={{...text(14,900),marginTop:8}}>{unit.join(' ')}</div>
		<div style={{width:86,height:3,display:'flex',background:'#000',marginTop:24}}/>
	</section>
}

function PrecipitationCard({weather}:{weather:WeatherScreenData}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 16px'}}>
		<div style={{...text(11,900),letterSpacing:1.5}}>{weather.labels.precipitation}</div><div style={{display:'flex',alignItems:'baseline',marginTop:14}}><div style={{...text(72,900),lineHeight:1}}>{weather.precipitationProbability}</div><div style={text(22,900)}>%</div></div>
		<div style={{display:'flex',gap:5,marginTop:24}}>{[20,40,60,80].map(level=><div key={level} style={{width:19,height:19,border:'3px solid #000',background:weather.precipitationProbability>=level?'#000':'#fff'}}/>)}</div>
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
	current:weather=><CurrentCard weather={weather}/>,forecast:weather=><ForecastCard weather={weather}/>,feels:weather=><FeelsCard weather={weather}/>,humidity:weather=><HumidityCard weather={weather}/>,pressure:weather=><PressureCard weather={weather}/>,precipitation:weather=><PrecipitationCard weather={weather}/>,metrics:weather=><MetricsCard weather={weather}/>,wind:weather=><WindCard weather={weather}/>,sun:weather=><SunCard weather={weather}/>,clouds:weather=><CloudsCard weather={weather}/>,
}

export function WeatherScreen({weather,generatedAt,generatedAtLocal,renderBlock,addSlot}:WeatherScreenProps) {
	const locale = weather.labels.wind === 'ВЕТЕР' ? 'ru-RU' : 'en-GB'
	const localTimestamp=generatedAtLocal ? new Date(`${generatedAtLocal}Z`) : (generatedAt ?? new Date())
	const displayTimezone=generatedAtLocal ? 'UTC' : weather.timezone
	const date = new Intl.DateTimeFormat(locale,{timeZone:displayTimezone,weekday:'short',day:'2-digit',month:'short'}).format(localTimestamp).toUpperCase()
	const time = new Intl.DateTimeFormat('en-GB',{timeZone:displayTimezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(localTimestamp)
	const visibleCards=weather.layout.blocks
	return <div style={{width:800,height:480,display:'flex',flexDirection:'column',background:'#fff',color:'#000',fontFamily:'Arial, sans-serif',border:'8px solid #000',boxSizing:'border-box'}}>
		<header style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 22px',background:'#000',color:'#fff'}}>
			<div style={{display:'flex',alignItems:'baseline',gap:14}}><div style={{...text(25,900),letterSpacing:.7}}>{weather.city}</div><div style={{...text(10),letterSpacing:1.5}}>{weather.coordinates}</div></div>
			<div style={{display:'flex',alignItems:'center',gap:16}}><div style={{...text(12,800),letterSpacing:1}}>{date}</div><div style={text(24,900)}>{time}</div></div>
		</header>
		<div style={{display:'flex',flex:1,padding:14,gap:10}}>{visibleCards.map(id => renderBlock ? renderBlock(id,cardRenderers[id](weather)) : <div key={id} style={{display:'flex',flex:1,minWidth:0}}>{cardRenderers[id](weather)}</div>)}{addSlot}</div>
	</div>
}
