/* eslint-disable @next/next/no-img-element */
import type {CSSProperties, ReactNode} from 'react'
import {DESIGN_HEIGHT, DESIGN_WIDTH} from '@/lib/display'
import {findEmptySlot,getCardGap,getCardRangeDays,getCornerRadius,getFontSize,getHeader,getScreenTheme,getShowBorder,packBlockGrid,type BlockId,type CardRowSpan,type CardSpan} from '@/lib/panel-config'
import {SCREEN_FONT_FAMILY} from '@/lib/screen-font'
import {WeatherIcon} from '@/components/weather-icons'
import type {WeatherDailyItem, WeatherHourlyPoint, WeatherScreenData} from '@/lib/weather'

type WeatherScreenProps = {
	weather: WeatherScreenData
	generatedAt?: Date
	generatedAtLocal?: string
	renderBlock?: (id:BlockId,content:ReactNode)=>ReactNode
	renderHeader?: (content:ReactNode)=>ReactNode
	addSlot?: ReactNode
}
function paint(weather:WeatherScreenData){
	const d=weather.display
	const theme=getScreenTheme(weather.layout)
	const radius=getCornerRadius(weather.layout)
	const inner=Math.max(0,Math.round(radius*.4))
	if(theme==='night')return {theme,radius,inner,paper:d.ink,ink:d.paper,accent:d.paper,fill:d.paper,headerBg:d.paper,headerFg:d.ink,cardBg:d.ink,cardFg:d.paper,sky:d.ink,ground:d.paper,frame:d.paper}
	if(theme==='poster')return {theme,radius,inner,paper:d.paper,ink:d.ink,accent:d.paper,fill:d.paper,headerBg:d.headerBg,headerFg:d.headerFg,cardBg:d.ink,cardFg:d.paper,sky:d.ink,ground:d.paper,frame:d.headerBg}
	return {theme,radius,inner,paper:d.paper,ink:d.ink,accent:d.accent,fill:d.fill,headerBg:d.headerBg,headerFg:d.headerFg,cardBg:d.paper,cardFg:d.ink,sky:d.sky,ground:d.ground,frame:d.headerBg}
}
function cardBorder(weather:WeatherScreenData):CSSProperties{
	if(!getShowBorder(weather.layout))return {border:'none'}
	const t=paint(weather)
	if(t.theme==='air')return {border:`1px solid ${t.ink}`}
	if(t.theme==='rail')return {border:`1px solid ${t.ink}`,borderLeft:`10px solid ${t.ink}`}
	return {border:`3px solid ${t.ink}`}
}
function panelBox(weather:WeatherScreenData, extra?:CSSProperties): CSSProperties {
	const t=paint(weather)
	return {display:'flex', flex:1, minWidth:0, minHeight:0, overflow:'hidden', background:t.cardBg, color:t.cardFg, borderRadius:t.radius, ...cardBorder(weather), ...extra}
}
let fontMul=1
function applyFontScale(weather:WeatherScreenData){fontMul=getFontSize(weather.layout)/100}
function fs(size:number){return `${Math.max(8,Math.round(size*fontMul))}px`}
const text = (size:number, weight:number=700): CSSProperties => ({display:'flex', fontSize:fs(size), fontWeight:weight})

function Metric({label,value,compact=false}:{label:string;value:string;compact?:boolean}) {
	return <div style={{display:'flex',flexDirection:'column',gap:compact?2:5}}><div style={{...text(compact?10:12),letterSpacing:compact?.8:1.4}}>{label}</div><div style={text(compact?24:28,900)}>{value}</div></div>
}

function CurrentCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',justifyContent:'center',padding:compact?'8px 10px 6px':'12px 18px',overflow:'hidden'}}>
		<div style={{display:'flex',alignItems:'flex-start',minWidth:0,overflow:'hidden'}}><div style={{...text(compact?52:86,900),lineHeight:.85,letterSpacing:compact?-2:-6}}>{weather.temperature}</div><div style={{...text(compact?22:36,900),lineHeight:1}}>°</div></div>
		<div style={{display:'flex',alignItems:'center',gap:compact?6:10,marginTop:compact?5:12,minWidth:0,overflow:'hidden'}}><div style={{width:compact?36:56,height:compact?10:16,flexShrink:0,display:'flex',background:paint(weather).accent}}/><div style={{...text(compact?11:15,900),letterSpacing:.7,color:paint(weather).accent,overflow:'hidden'}}>{weather.weatherLabel}</div></div>
		<div style={{...text(compact?9:12),marginTop:compact?5:8,overflow:'hidden'}}>{`${weather.labels.feels} ${weather.feelsLike}° · ${weather.labels.high} ${weather.high}° / ${weather.labels.low} ${weather.low}°`}</div>
	</div>
}

function isRu(weather:WeatherScreenData){return weather.labels.wind==='ВЕТЕР'}
function rangeCaption(days:number,ru:boolean){
	if(days<=1)return ru?'24 Ч':'24H'
	if(days===3)return ru?'3 ДНЯ':'3 DAYS'
	if(days<=7)return ru?'7 ДНЕЙ':'7 DAYS'
	if(days<=14)return ru?'14 ДНЕЙ':'14 DAYS'
	return ru?'16 ДНЕЙ':'16 DAYS'
}
function periodDays(weather:WeatherScreenData,id:BlockId){return weather.daily.slice(0,getCardRangeDays(weather.layout,id))}
function sampleHourly(hourly:WeatherHourlyPoint[],days:number,maxPoints=8){
	const slice=hourly.slice(0,Math.max(1,days)*24)
	if(!slice.length)return []
	const step=Math.max(1,Math.round((slice.length-1)/Math.max(1,maxPoints-1)))
	const points:WeatherHourlyPoint[]=[]
	for(let i=0;i<slice.length;i+=step)points.push(slice[i])
	const last=slice[slice.length-1]
	if(points[points.length-1]!==last)points.push(last)
	return points.length>maxPoints?[...points.slice(0,maxPoints-1),last]:points
}
function hourlyLabel(point:WeatherHourlyPoint,days:number){
	if(days<=1)return point.time
	return `${point.dayNum} ${point.time.slice(0,2)}`
}

function ForecastCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	const ru=isRu(weather)
	const days=getCardRangeDays(weather.layout,'forecast')
	const rows=days<=3
		? sampleHourly(weather.hourly,days,compact?4:days===3?6:4).map(row=>({key:`${row.date}-${row.time}`,left:days<=1?row.time:`${row.day} ${row.time}`,mark:row.mark,temp:`${row.temperature}°`}))
		: periodDays(weather,'forecast').slice(0,compact?4:Math.min(7,days)).map(day=>({key:day.date,left:days>7?`${day.day} ${day.dayNum}`:day.day,mark:day.weatherLabel,temp:`${day.high}°`}))
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 9px 7px':'14px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.7,marginBottom:compact?3:8}}>{`${ru?'ПРОГНОЗ':'FORECAST'} · ${rangeCaption(days,ru)}`}</div>
		{rows.map((item,index)=><div key={item.key} style={{display:'flex',alignItems:'center',gap:compact?4:7,flex:1,minHeight:0,borderTop:index===0?'3px solid currentColor':'2px solid currentColor'}}><div style={{...text(compact?8:10,900),width:compact?days>1?44:30:days>1?58:38,flexShrink:0,letterSpacing:.5}}>{item.left}</div><div style={{...text(compact?8:8,800),flex:1,minWidth:0,lineHeight:1.05}}>{item.mark}</div><div style={{...text(compact?14:19,900),flexShrink:0}}>{item.temp}</div></div>)}
	</div>
}

function FeelsCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',justifyContent:'center',padding:compact?'8px 12px 8px':'16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.feels}</div><div style={{...text(compact?42:72,900),lineHeight:1,marginTop:compact?4:10}}>{weather.feelsLike}°</div>
		<div style={{display:'flex',height:3,background:paint(weather).fill,margin:compact?'8px 0 6px':'20px 0 14px'}}/><div style={{display:'flex',justifyContent:'space-between',gap:8}}><Metric compact={compact} label={weather.labels.low} value={`${weather.low}°`}/><Metric compact={compact} label={weather.labels.high} value={`${weather.high}°`}/></div>
	</div>
}

function HumidityCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'8px 12px 8px':'16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.humidity}</div><div style={{display:'flex',alignItems:'baseline',marginTop:compact?5:13}}><div style={{...text(compact?44:72,900),lineHeight:1}}>{weather.humidity}</div><div style={text(compact?15:22,900)}>%</div></div>
		<div style={{display:'flex',width:'100%',height:compact?10:16,marginTop:compact?9:22,border:'3px solid currentColor',borderRadius:paint(weather).inner,overflow:'hidden'}}><div style={{display:'flex',width:`${weather.humidity}%`,background:paint(weather).fill}}/></div>
	</div>
}

function PressureCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	const [value,...unit]=weather.pressure.split(' ')
	return <div style={{...panelBox(weather),flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'8px 12px 8px':'16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.pressure}</div><div style={{...text(compact?40:62,900),lineHeight:1,marginTop:compact?6:16}}>{value}</div><div style={{...text(compact?10:14,900),marginTop:compact?3:8}}>{unit.join(' ')}</div>
		<div style={{width:compact?54:86,height:3,display:'flex',background:paint(weather).fill,marginTop:compact?9:24}}/>
	</div>
}

function PrecipitationCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'8px 12px 8px':'16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.precipitation}</div><div style={{display:'flex',alignItems:'baseline',marginTop:compact?5:14}}><div style={{...text(compact?44:72,900),lineHeight:1}}>{weather.precipitationProbability}</div><div style={text(compact?15:22,900)}>%</div></div>
		<div style={{display:'flex',gap:compact?3:5,marginTop:compact?9:24}}>{[20,40,60,80].map(level=><div key={level} style={{width:compact?12:19,height:compact?12:19,border:compact?'2px solid currentColor':'3px solid currentColor',borderRadius:paint(weather).inner,background:weather.precipitationProbability>=level?paint(weather).fill:paint(weather).paper}}/>)}</div>
	</div>
}

function MetricsCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',justifyContent:'space-between',padding:compact?'8px 12px 8px':'16px 18px'}}>
		<Metric compact={compact} label={weather.labels.humidity} value={`${weather.humidity}%`}/><div style={{display:'flex',height:compact?2:3,background:paint(weather).fill}}/>
		<Metric compact={compact} label={weather.labels.pressure} value={weather.pressure}/><div style={{display:'flex',height:compact?2:3,background:paint(weather).fill}}/>
		<Metric compact={compact} label={weather.labels.precipitation} value={`${weather.precipitationProbability}%`}/>
	</div>
}

function WindCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'8px 8px 6px':14}}>
		<div style={{...text(compact?8:11,800),letterSpacing:compact?1:2}}>{`${weather.labels.wind} / ${weather.windDirection}`}</div>
		<div style={{display:'flex',alignItems:'baseline',marginTop:compact?2:5}}><div style={{...text(compact?39:62,900),lineHeight:1}}>{weather.windSpeed}</div><div style={{...text(compact?10:15,900),marginLeft:4}}>{weather.windUnit}</div></div>
		<div style={{...text(compact?21:36,900),color:paint(weather).accent}}>↑</div><div style={text(compact?8:11)}>{`${weather.labels.gusts} ${weather.windGust} ${weather.windUnit}`}</div>
	</div>
}

function SunCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',justifyContent:'space-between',padding:compact?'8px 12px 8px':'18px'}}>
		<Metric compact={compact} label={weather.labels.sunrise} value={weather.sunrise}/><div style={{display:'flex',height:compact?2:3,background:paint(weather).fill}}/>
		<Metric compact={compact} label={weather.labels.sunset} value={weather.sunset}/><div style={{display:'flex',height:compact?2:3,background:paint(weather).fill}}/>
		<Metric compact={compact} label={weather.labels.uv} value={String(weather.uvIndex)}/>
	</div>
}

function CloudsCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <div style={{...panelBox(weather),flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'8px 9px 7px':16}}>
		<div style={{...text(compact?8:11,800),letterSpacing:compact?1:1.6}}>{weather.labels.clouds}</div><div style={{...text(compact?43:76,900),lineHeight:1,marginTop:compact?4:10}}>{weather.cloudCover}</div><div style={text(compact?15:24,900)}>%</div>
		<div style={{display:'flex',width:compact?58:90,height:compact?8:12,marginTop:compact?5:14,border:'2px solid currentColor',borderRadius:paint(weather).inner,overflow:'hidden'}}><div style={{display:'flex',width:`${weather.cloudCover}%`,background:paint(weather).fill}}/></div><div style={{...text(compact?8:11,800),marginTop:compact?4:10}}>{weather.weatherLabel}</div>
	</div>
}

function CardTitle({children,compact}:{children:ReactNode;compact:boolean}){return <div style={{...text(compact?10:12,900),letterSpacing:compact?.6:1.2,textTransform:'uppercase',overflow:'hidden',flexShrink:0}}>{children}</div>}

function shortTick(label:string){
	const time=label.match(/^(\d{2}):(\d{2})$/)
	if(time)return time[2]==='00'?time[1]:label
	return label
}

function roundedTopBar(x:number,y:number,width:number,height:number,radius:number){
	const r=Math.max(0,Math.min(radius,width/2,height))
	if(r<=0)return `M${x} ${y+height}H${x+width}V${y}H${x}Z`
	return `M${x} ${y+height}V${y+r}Q${x} ${y} ${x+r} ${y}H${x+width-r}Q${x+width} ${y} ${x+width} ${y+r}V${y+height}Z`
}

function SparkChart({values,secondary,labels,unit='',bars=false,stroke,mark,radius=0}:{values:number[];secondary?:number[];labels:string[];unit?:string;bars?:boolean;stroke:string;mark:string;radius?:number}){
	const all=[...values,...(secondary??[])];if(!all.length)return <div/>
	const min=Math.min(...all);const max=Math.max(...all);const range=Math.max(1,max-min)
	const ticks=labels.length<=5?labels:[labels[0],labels[Math.floor((labels.length-1)/3)],labels[Math.floor((labels.length-1)*2/3)],labels[labels.length-1]]
	const points=(series:number[])=>series.map((value,index)=>`${8+index*(184/Math.max(1,series.length-1))},${78-(value-min)/range*60}`).join(' ')
	const cap=radius>0?'round':'square'
	return <div style={{display:'flex',flex:1,minHeight:0,flexDirection:'column',overflow:'hidden'}}>
		<div style={{display:'flex',justifyContent:'space-between',gap:6,fontSize:fs(9),fontWeight:900,overflow:'hidden'}}>
			<span style={{flexShrink:0}}>{Math.round(max)}{unit}</span>
			<span style={{flexShrink:0,overflow:'hidden'}}>{Math.round(min)}{unit} MIN</span>
		</div>
		<svg viewBox="0 0 200 78" preserveAspectRatio="none" style={{display:'flex',width:'100%',flex:1,minHeight:36,overflow:'hidden'}} aria-hidden="true">
			<line x1="8" y1="78" x2="192" y2="78" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/><line x1="8" y1="48" x2="192" y2="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"/>
			{bars?values.map((value,index)=>{const height=Math.max(2,(value-min)/range*60);const width=166/values.length;const x=12+index*(176/values.length);const y=78-height;return <path key={index} d={roundedTopBar(x,y,width,height,Math.min(radius,width/2))} fill={stroke}/>}):<polyline points={points(values)} fill="none" stroke={stroke} strokeWidth="5" strokeLinejoin="round" strokeLinecap={cap} vectorEffect="non-scaling-stroke"/>}
			{secondary&&<polyline points={points(secondary)} fill="none" stroke={mark} strokeWidth="2" strokeDasharray="6 5" strokeLinecap={cap} vectorEffect="non-scaling-stroke"/>}
		</svg>
		<div style={{display:'flex',gap:2,overflow:'hidden'}}>{ticks.map((label,index)=><span key={`${label}-${index}`} style={{flex:1,minWidth:0,overflow:'hidden',fontSize:fs(8),fontWeight:900,textAlign:index===0?'left':index===ticks.length-1?'right':'center'}}>{shortTick(label)}</span>)}</div>
	</div>
}

function ClockCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	const hour=Number(weather.observedAt.slice(11,13));const minute=Number(weather.observedAt.slice(14,16));const minuteAngle=minute*6;const hourAngle=(hour%12)*30+minute/2
	return <div style={{...panelBox(weather),alignItems:'center',justifyContent:'center',gap:compact?6:18,padding:compact?'8px 8px 6px':'18px'}}><svg viewBox="0 0 120 120" style={{height:compact?'58%':150,maxHeight:compact?96:150,maxWidth:'48%',minHeight:0}} aria-label={`${hour}:${String(minute).padStart(2,'0')}`}>
		<circle cx="60" cy="60" r="54" fill={paint(weather).paper} stroke="currentColor" strokeWidth="5"/>{Array.from({length:12},(_,index)=><line key={index} x1="60" y1="10" x2="60" y2={index%3===0?'20':'16'} stroke="currentColor" strokeWidth={index%3===0?'4':'2'} transform={`rotate(${index*30} 60 60)`}/>)}
		<line x1="60" y1="60" x2="60" y2="31" stroke={paint(weather).accent} strokeWidth="6" transform={`rotate(${hourAngle} 60 60)`}/><line x1="60" y1="64" x2="60" y2="20" stroke="currentColor" strokeWidth="3" transform={`rotate(${minuteAngle} 60 60)`}/><circle cx="60" cy="60" r="5" fill={paint(weather).accent}/>
	</svg><div style={{display:'flex',flexDirection:'column'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'МЕСТНОЕ ВРЕМЯ':'LOCAL TIME'}</CardTitle><div style={{...text(compact?30:44,900),letterSpacing:-2}}>{weather.observedAt.slice(11,16)}</div><div style={{...text(compact?8:10),marginTop:5}}>{weather.timezone.replace('_',' ')}</div></div></div>
}

function PhotoCard({weather}:{weather:WeatherScreenData}){
	const photo=weather.layout.photoDataUrl
	return <div style={{...panelBox(weather),position:'relative',overflow:'hidden',alignItems:'center',justifyContent:'center'}}>
		{photo
			?<img src={photo} alt="" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>
			:<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:16,textAlign:'center'}}>
				<b style={{fontSize:fs(32)}}>▧</b>
				<span style={{fontSize:fs(11),fontWeight:900}}>ЗАГРУЗИТЕ ФОТО СПРАВА</span>
			</div>}
	</div>
}

function WeatherSceneCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const wet=weather.precipitation>0||weather.precipitationProbability>=45;const snowy=weather.snowfall>0;const cloudy=weather.cloudCover>=45
	const t=paint(weather)
	return <div style={{...panelBox(weather),position:'relative',overflow:'hidden',flexDirection:'column',padding:compact?'8px 10px 8px':'14px'}}><div style={{display:'flex',justifyContent:'space-between'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'ПОГОДНАЯ СЦЕНА':'WEATHER SCENE'}</CardTitle><div style={text(compact?8:10,900)}>{weather.isDay?'DAY':'NIGHT'}</div></div>
		<svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid meet" style={{position:'absolute',top:0,bottom:0,left:span>=3?'25%':0,width:span>=3?'50%':'100%',height:'100%'}} aria-hidden="true"><defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke={t.ink} strokeWidth="2" vectorEffect="non-scaling-stroke"/></pattern></defs>
		<rect x="0" y="0" width="320" height="124" fill={t.sky}/>
		{weather.isDay?<circle cx="254" cy="44" r="23" fill={cloudy?'url(#hatch)':t.accent}/>:<><circle cx="254" cy="44" r="24" fill={t.ink}/><circle cx="264" cy="36" r="21" fill={t.sky}/></>}
		{cloudy&&<g fill={t.paper} stroke={t.ink} strokeWidth="5"><circle cx="136" cy="68" r="25"/><circle cx="169" cy="58" r="34"/><circle cx="207" cy="72" r="27"/><path d="M110 76 H230 V91 H110 Z"/></g>}
		{wet&&Array.from({length:7},(_,index)=><line key={index} x1={116+index*18} y1="98" x2={snowy?116+index*18:108+index*18} y2={snowy?108:121} stroke={t.fill} strokeWidth={snowy?6:4} strokeLinecap="square"/>)}
		<path d="M0 124 L50 98 L86 118 L142 88 L205 122 L254 101 L320 128 V150 H0 Z" fill={t.ground}/><path d="M0 135 L64 117 L112 138 L181 112 L235 136 L289 118 L320 128 V150 H0 Z" fill={t.paper} stroke={t.ink} strokeWidth="4"/>
		</svg><div style={{marginTop:'auto',alignSelf:'flex-start',padding:'3px 6px',background:t.paper,border:`2px solid ${t.ink}`,borderRadius:t.inner,...text(compact?8:11,900)}}>{weather.weatherLabel}</div></div>
}

function chartColors(weather:WeatherScreenData){const t=paint(weather);return {stroke:t.fill,mark:t.accent,radius:Math.max(t.inner,t.radius?Math.round(t.radius*.55):0)}}
function chartSeries(weather:WeatherScreenData,id:BlockId){
	const days=getCardRangeDays(weather.layout,id)
	if(days<=3){
		const points=sampleHourly(weather.hourly,days,8)
		return {days,points,labels:points.map(point=>hourlyLabel(point,days)),temps:points.map(p=>p.temperature),feels:points.map(p=>p.feelsLike),precip:points.map(p=>p.precipitationProbability),wind:points.map(p=>p.windSpeed),gust:points.map(p=>p.windGust)}
	}
	const daysList=periodDays(weather,id)
	return {days,points:daysList,labels:daysList.map(day=>days>7?day.dayNum:day.day),temps:daysList.map(d=>d.high),feels:daysList.map(d=>d.low),precip:daysList.map(d=>d.precipitationProbability),wind:daysList.map(d=>d.windSpeedMax),gust:daysList.map(d=>d.windSpeedMax)}
}
function TemperatureChartCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const series=chartSeries(weather,'temperatureChart');return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'6px 8px 5px':'12px',overflow:'hidden'}}><CardTitle compact={compact}>{`${isRu(weather)?'ТЕМПЕРАТУРА':'TEMPERATURE'} · ${rangeCaption(series.days,isRu(weather))}`}</CardTitle><SparkChart {...chartColors(weather)} values={series.temps} secondary={series.feels} labels={series.labels} unit="°"/></div>}
function PrecipitationChartCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const series=chartSeries(weather,'precipitationChart');return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'6px 8px 5px':'12px',overflow:'hidden'}}><CardTitle compact={compact}>{`${isRu(weather)?'ОСАДКИ':'PRECIPITATION'} · ${rangeCaption(series.days,isRu(weather))}`}</CardTitle><SparkChart {...chartColors(weather)} values={series.precip} labels={series.labels} unit="%" bars/></div>}
function WindChartCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const series=chartSeries(weather,'windChart');return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'6px 8px 5px':'12px',overflow:'hidden'}}><CardTitle compact={compact}>{`${weather.labels.wind} · ${rangeCaption(series.days,isRu(weather))}`}</CardTitle><SparkChart {...chartColors(weather)} values={series.wind} secondary={series.gust} labels={series.labels} unit={weather.windUnit}/></div>}

function DailyForecastCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	const days=periodDays(weather,'dailyForecast')
	const wrap=days.length>7
	const cols=wrap?Math.ceil(days.length/2):Math.max(1,days.length)
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 8px 4px':'14px'}}>
		<CardTitle compact={compact}>{`${isRu(weather)?'ПРОГНОЗ':'FORECAST'} · ${rangeCaption(days.length,isRu(weather))}`}</CardTitle>
		<div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden',flexWrap:wrap?'wrap':'nowrap',marginTop:5,borderTop:'3px solid currentColor'}}>
			{days.map((day,index)=><div key={day.date} style={{display:'flex',width:wrap?`${100/cols}%`:'auto',flex:wrap?undefined:1,height:wrap?'50%':'auto',minWidth:0,minHeight:0,overflow:'hidden',flexDirection:'column',alignItems:'center',justifyContent:'space-around',borderLeft:index%cols?'2px solid currentColor':'none',borderTop:wrap&&index>=cols?'2px solid currentColor':'none',padding:'4px 2px'}}>
				<b style={{fontSize:fs(compact?10:12),overflow:'hidden'}}>{days.length>7?`${day.day} ${day.dayNum}`:day.day}</b>
				<span style={{fontSize:fs(compact?9:11),fontWeight:900,maxWidth:'100%',overflow:'hidden'}}>{day.weatherLabel.split(' ')[0]}</span>
				<div style={{display:'flex',gap:4,fontSize:fs(compact?13:16),fontWeight:900}}><span>{day.high}°</span><span style={{fontWeight:500}}>{day.low}°</span></div>
				<div style={{display:'flex',fontSize:fs(compact?8:10),fontWeight:800,overflow:'hidden'}}>{day.precipitationProbability}%</div>
			</div>)}
		</div>
	</div>
}

function weekDays(weather:WeatherScreenData,id:BlockId='weekStrip'){return periodDays(weather,id)}
function weekDayLabel(day:string){const clean=day.replace('.','').toLowerCase();return clean.charAt(0).toUpperCase()+clean.slice(1)}
function weekIconSize(span:number,compact:boolean,list:boolean){
	if(list)return compact?14:20
	if(compact)return span>=4?48:span===3?36:28
	return span>=4?72:span===3?58:46
}
function isWeekList(span:number,compact:boolean){return span===1||(compact&&span===2)}
function WeekIconSlot({code,size,ink,accent}:{code:number;size:number;ink:string;accent:string}){
	return <div style={{display:'flex',flexGrow:1,flexBasis:0,width:'100%',minHeight:0,minWidth:0,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
		<WeatherIcon code={code} size={size} fill color={ink} accent={accent}/>
	</div>
}

function weekBody(list:boolean):CSSProperties{
	return {display:'flex',flex:1,minHeight:0,minWidth:0,overflow:'hidden',flexDirection:list?'column':'row',flexWrap:list?'nowrap':'wrap',alignContent:list?'stretch':'stretch'}
}

function weekItemBox(span:number,list:boolean,count:number):CSSProperties{
	if(list)return {display:'flex',width:'100%',flex:'1 1 0',minHeight:0,overflow:'hidden'}
	if(count<=3||(count<=7&&span>=4))return {display:'flex',flexGrow:1,flexShrink:1,flexBasis:0,minWidth:0,minHeight:0}
	if(span===3&&count<=8)return {display:'flex',width:'25%',height:'50%',minHeight:0,overflow:'hidden'}
	if(span<=2&&count<=8)return {display:'flex',width:'50%',height:'25%',minHeight:0,overflow:'hidden'}
	const perRow=span>=4?Math.min(7,count):span===3?Math.min(4,count):2
	const rows=Math.max(1,Math.ceil(count/perRow))
	return {display:'flex',width:`${100/perRow}%`,height:`${100/rows}%`,minHeight:0,overflow:'hidden'}
}

function WeekDayColumn({day,compact,span,list=false,iconSize,ink,accent,count}:{day:WeatherDailyItem;compact:boolean;span:number;list?:boolean;iconSize:number;ink:string;accent:string;count:number}){
	const label=count>7?`${weekDayLabel(day.day)} ${day.dayNum}`:weekDayLabel(day.day)
	const temps=`${day.high}°|${day.low}°`
	if(list)return <div style={{...weekItemBox(span,true,count),alignItems:'center',padding:compact?'0 2px':'2px 0',borderTop:'2px solid currentColor'}}>
		<div style={{width:compact?22:32,flexShrink:0,fontSize:fs(compact?9:12),fontWeight:700}}>{label}</div>
		<WeatherIcon code={day.weatherCode??3} size={iconSize} color={ink} accent={accent}/>
		<div style={{display:'flex',flexGrow:1}}/>
		<div style={{display:'flex',fontSize:fs(compact?10:13),fontWeight:600,letterSpacing:.2}}>{temps}</div>
	</div>
	return <div style={{...weekItemBox(span,false,count),flexDirection:'column',alignItems:'center',justifyContent:'space-between',padding:compact?'2px 1px':'6px 2px'}}>
		<div style={{display:'flex',fontSize:fs(compact?9:span>=4?14:12),fontWeight:600,letterSpacing:.3}}>{label}</div>
		<WeekIconSlot code={day.weatherCode??3} size={iconSize} ink={ink} accent={accent}/>
		<div style={{fontSize:fs(compact?9:span>=4?13:11),fontWeight:600}}>{temps}</div>
	</div>
}

function WeekStripCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const days=weekDays(weather,'weekStrip');const list=isWeekList(span,compact)
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'6px 6px 4px':(list?'12px 12px 8px':'8px 8px 6px')}}>
		<div style={weekBody(list)}>
			{days.map(day=><WeekDayColumn key={day.date} day={day} compact={compact} span={span} list={list} count={days.length} iconSize={weekIconSize(span,compact,list)} ink={paint(weather).ink} accent={paint(weather).accent}/>)}
		</div>
	</div>
}

function WeekTilesCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const days=weekDays(weather,'weekTiles');const list=isWeekList(span,compact)
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'6px 4px 4px':'6px'}}>
		<div style={weekBody(list)}>
			{days.map(day=><div key={day.date} style={{...weekItemBox(span,list,days.length),boxSizing:'border-box',padding:compact?1:3}}>
				<div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden',border:'2px solid currentColor',padding:compact?2:4,...(list?{alignItems:'center'}:{flexDirection:'column',alignItems:'center',justifyContent:'space-between'})}}>
					<div style={{fontSize:fs(compact?8:11),fontWeight:700}}>{days.length>7?`${weekDayLabel(day.day)} ${day.dayNum}`:weekDayLabel(day.day)}</div>
					{list?<WeatherIcon code={day.weatherCode??3} size={weekIconSize(span,compact,list)} color={paint(weather).ink} accent={paint(weather).accent}/>:<WeekIconSlot code={day.weatherCode??3} size={weekIconSize(span,compact,list)} ink={paint(weather).ink} accent={paint(weather).accent}/>}
					<div style={{fontSize:fs(compact?8:11),fontWeight:600}}>{`${day.high}°|${day.low}°`}</div>
				</div>
			</div>)}
		</div>
	</div>
}

function WeekRangeCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const days=weekDays(weather,'weekRange');if(!days.length)return <div style={panelBox(weather)}/>
	const min=Math.min(...days.map(day=>day.low));const max=Math.max(...days.map(day=>day.high));const range=Math.max(1,max-min)
	const list=isWeekList(span,compact)
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'6px 4px 4px':'6px'}}>
		<div style={weekBody(list)}>
			{days.map(day=>{
				const top=((max-day.high)/range)*100;const bar=((day.high-day.low)/range)*100
				return <div key={day.date} style={{...weekItemBox(span,list,days.length),boxSizing:'border-box',padding:compact?1:3,flexDirection:list?'row':'column',alignItems:'center',justifyContent:'space-between'}}>
					<div style={{fontSize:fs(compact?8:11),fontWeight:700,flexShrink:0}}>{days.length>7?day.dayNum:weekDayLabel(day.day)}</div>
					{list?<WeatherIcon code={day.weatherCode??3} size={weekIconSize(span,compact,true)} color={paint(weather).ink} accent={paint(weather).accent}/>:<WeekIconSlot code={day.weatherCode??3} size={Math.round(weekIconSize(span,compact,false)*.72)} ink={paint(weather).ink} accent={paint(weather).accent}/>}
					{list?<div style={{display:'flex',flex:1,height:compact?6:10,minWidth:12,marginLeft:4,marginRight:4,border:'2px solid currentColor',borderRadius:paint(weather).inner,overflow:'hidden'}}><div style={{marginLeft:`${top}%`,width:`${Math.max(8,bar)}%`,height:'100%',background:paint(weather).fill}}/></div>:<div style={{display:'flex',width:compact?8:12,flex:1,minHeight:0,border:'2px solid currentColor',borderRadius:paint(weather).inner,overflow:'hidden'}}><div style={{marginTop:`${top}%`,width:'100%',height:`${Math.max(10,bar)}%`,background:paint(weather).fill}}/></div>}
					<div style={{fontSize:fs(compact?8:11),fontWeight:600,flexShrink:0}}>{`${day.high}°|${day.low}°`}</div>
				</div>
			})}
		</div>
	</div>
}

function SimpleValueCard({weather,label,value,detail,compact}:{weather:WeatherScreenData;label:string;value:string;detail:string;compact:boolean}){
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 11px 8px':'18px'}}>
		<CardTitle compact={compact}>{label}</CardTitle>
		<div style={{display:'flex',flex:1,minHeight:0,flexDirection:'column',justifyContent:'center'}}>
			<div style={{...text(compact?42:62,900),lineHeight:.9,letterSpacing:-2}}>{value}</div>
			<div style={{display:'flex',height:3,background:paint(weather).fill,margin:'10px 0 8px'}}/>
			<div style={{...text(compact?12:14,800),lineHeight:1.15}}>{detail}</div>
		</div>
	</div>
}
function OverviewCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	const ru=weather.labels.wind==='ВЕТЕР'
	const values:[string,string][][]=[
		[[ru?'ТЕМП.':'TEMP',`${weather.temperature}°`],[weather.labels.feels,`${weather.feelsLike}°`],[weather.labels.dewPoint,`${weather.dewPoint}°`],[weather.labels.humidity,`${weather.humidity}%`]],
		[[weather.labels.pressure,weather.pressure],[ru?'УРОВЕНЬ МОРЯ':'SEA LEVEL',weather.seaLevelPressure],[weather.labels.visibility,`${weather.visibility} ${weather.visibilityUnit}`],[weather.labels.clouds,`${weather.cloudCover}%`]],
		[[ru?'ОСАДКИ / ДЕНЬ':'PRECIP / DAY',`${weather.precipitationSum} ${weather.precipitationUnit}`],[weather.labels.wind,`${weather.windSpeed} ${weather.windUnit}`],[weather.labels.gusts,`${weather.windGust} ${weather.windUnit}`],[weather.labels.uv,String(weather.uvIndex)]],
		[[weather.labels.sunrise,weather.sunrise],[weather.labels.daylight,weather.daylightDuration],[weather.labels.radiation,`${weather.shortwaveRadiationSum} MJ`],[weather.labels.airQuality,weather.airQuality?String(weather.airQuality.europeanAqi):'—']],
	]
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 6px 4px':'14px'}}>
		<CardTitle compact={compact}>{ru?'ПОЛНАЯ ПОГОДНАЯ СВОДКА':'COMPLETE WEATHER OVERVIEW'}</CardTitle>
		<div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden',marginTop:4,borderTop:'3px solid currentColor',borderLeft:'2px solid currentColor'}}>
			{values.map((row,rowIndex)=><div key={rowIndex} style={{display:'flex',flex:1,minHeight:0,minWidth:0}}>
				{row.map(([label,value])=><div key={label} style={{display:'flex',flex:1,minWidth:0,minHeight:0,boxSizing:'border-box',flexDirection:'column',justifyContent:'center',overflow:'hidden',padding:compact?'1px 4px':'5px 8px',borderRight:'2px solid currentColor',borderBottom:'2px solid currentColor'}}>
					<div style={{fontSize:fs(compact?7:8),fontWeight:800,letterSpacing:.4}}>{label}</div>
					<div style={{fontSize:fs(compact?11:18),fontWeight:700}}>{value}</div>
				</div>)}
			</div>)}
		</div>
	</div>
}
function PrecipitationDetailCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const values=[[weather.labels.wind==='ВЕТЕР'?'ВСЕГО':'TOTAL',weather.precipitationSum],[weather.labels.wind==='ВЕТЕР'?'ДОЖДЬ':'RAIN',weather.rainSum],[weather.labels.wind==='ВЕТЕР'?'ЛИВНИ':'SHOWERS',weather.showersSum],[weather.labels.wind==='ВЕТЕР'?'СНЕГ':'SNOW',weather.snowfallSum]];return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 11px 8px':'16px'}}><CardTitle compact={compact}>{weather.labels.precipitation} · {weather.labels.wind==='ВЕТЕР'?'ЗА ДЕНЬ':'TODAY'}</CardTitle><div style={{display:'flex',flexWrap:'wrap',flex:1,marginTop:5,border:'2px solid currentColor',borderRadius:paint(weather).inner,overflow:'hidden'}}>{values.map(([label,value],index)=><div key={String(label)} style={{display:'flex',width:'50%',boxSizing:'border-box',flexDirection:'column',justifyContent:'center',padding:'4px 8px',borderLeft:index%2?'2px solid currentColor':'none',borderTop:index>1?'2px solid currentColor':'none'}}><span style={{fontSize:fs(compact?7:9),fontWeight:800}}>{label}</span><b style={{fontSize:fs(compact?18:25)}}>{value} {weather.precipitationUnit}</b></div>)}</div><div style={{...text(compact?7:9),marginTop:4}}>{weather.precipitationHours} h · {weather.labels.wind==='ВЕТЕР'?'СЕЙЧАС':'NOW'} {weather.precipitation} / {weather.rain} / {weather.showers} / {weather.snowfall}</div></div>}
function DaylightCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 11px 8px':'17px'}}>
		<CardTitle compact={compact}>{weather.labels.daylight}</CardTitle>
		<div style={{display:'flex',flexDirection:'column',justifyContent:'center',flex:1}}>
			<div style={{display:'flex',fontSize:fs(compact?32:36),fontWeight:900,lineHeight:1}}>{weather.daylightDuration}</div>
			<div style={{display:'flex',fontSize:fs(compact?11:13),fontWeight:800,marginTop:6}}>{`${weather.labels.sunshine}: ${weather.sunshineDuration}`}</div>
			<div style={{display:'flex',fontSize:fs(compact?11:13),fontWeight:800,marginTop:4}}>{`${weather.sunrise}—${weather.sunset}`}</div>
		</div>
	</div>
}
function CloudLayersCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const layers=[[weather.labels.wind==='ВЕТЕР'?'ВЫСОКО':'HIGH',weather.cloudCoverHigh],[weather.labels.wind==='ВЕТЕР'?'СРЕДНЕ':'MID',weather.cloudCoverMid],[weather.labels.wind==='ВЕТЕР'?'НИЗКО':'LOW',weather.cloudCoverLow]];return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 11px 8px':'16px'}}><CardTitle compact={compact}>{weather.labels.clouds} · {weather.labels.wind==='ВЕТЕР'?'СЛОИ':'LAYERS'}</CardTitle><div style={{display:'flex',flexDirection:'column',justifyContent:'space-around',flex:1}}>{layers.map(([label,value])=><div key={String(label)} style={{display:'flex',alignItems:'center',gap:6,fontSize:fs(compact?8:10),fontWeight:900}}><span style={{width:48}}>{label}</span><div style={{display:'flex',flex:1,height:compact?11:16,border:'2px solid currentColor',borderRadius:paint(weather).inner,overflow:'hidden'}}><div style={{display:'flex',width:`${value}%`,height:'100%',background:paint(weather).fill}}/></div><b style={{width:34}}>{value}%</b></div>)}</div></div>}
function RadiationCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 10px 6px':'17px'}}><CardTitle compact={compact}>{weather.labels.radiation}</CardTitle><div style={{display:'flex',alignItems:'center',gap:12,flex:1,minHeight:0,overflow:'hidden'}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',width:compact?48:88,height:compact?48:88,flexShrink:0,border:'5px solid currentColor',borderRadius:'50%',fontSize:fs(compact?18:34),fontWeight:900}}>☀</div><div style={{display:'flex',flexDirection:'column'}}><b style={{fontSize:fs(compact?22:42)}}>{weather.shortwaveRadiationSum}</b><div style={{fontSize:fs(compact?8:11),fontWeight:900}}>MJ / m²</div><div style={{fontSize:fs(compact?8:11),fontWeight:800,marginTop:5}}>{`ET₀ ${weather.evapotranspiration} ${weather.precipitationUnit}`}</div></div></div></div>}
function AirQualityCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const aq=weather.airQuality;if(!aq)return <SimpleValueCard weather={weather} compact={compact} label={weather.labels.airQuality} value="—" detail={weather.labels.wind==='ВЕТЕР'?'ДАННЫЕ НЕДОСТУПНЫ':'NO DATA'}/>;return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 11px 8px':'16px'}}><CardTitle compact={compact}>{weather.labels.airQuality}</CardTitle><div style={{display:'flex',alignItems:'baseline',gap:7}}><b style={{fontSize:fs(compact?40:58),lineHeight:1}}>{aq.europeanAqi}</b><span style={{fontSize:fs(compact?8:11),fontWeight:900}}>EU AQI · US {aq.usAqi}</span></div><div style={{display:'flex',gap:3,marginTop:'auto'}}>{[['PM₂.₅',aq.pm25],['PM₁₀',aq.pm10],['NO₂',aq.nitrogenDioxide],['O₃',aq.ozone],['CO',aq.carbonMonoxide],['SO₂',aq.sulphurDioxide]].map(([label,value])=><div key={String(label)} style={{display:'flex',flex:1,flexDirection:'column',borderTop:'2px solid currentColor',paddingTop:3}}><span style={{fontSize:fs(compact?8:8),fontWeight:800}}>{label}</span><b style={{fontSize:fs(compact?11:16)}}>{value}</b></div>)}</div></div>}

function SensorCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	const ru=weather.labels.wind==='ВЕТЕР'
	const sensor=weather.sensor
	const title=ru?'В КОМНАТЕ':'INDOOR'
	if(!sensor)return <SimpleValueCard weather={weather} compact={compact} label={title} value="—" detail={ru?'НЕТ ДАННЫХ С УСТРОЙСТВА':'NO DATA FROM DEVICE'}/>
	const extras:[[string,string],[string,string],...[string,string][]]=[
		[weather.labels.pressure,sensor.pressure],
		[ru?'ВЫСОТА':'ALTITUDE',sensor.altitude],
		...(sensor.hasHumidity&&sensor.humidity?[[weather.labels.humidity,sensor.humidity] as [string,string]]:[]),
	]
	return <div style={{...panelBox(weather),flexDirection:'column',padding:compact?'8px 10px 6px':'14px 16px',overflow:'hidden'}}>
		<CardTitle compact={compact}>{title}</CardTitle>
		<div style={{display:'flex',flex:1,minHeight:0,alignItems:'center'}}>
			<div style={{...text(compact?36:52,900),lineHeight:.9}}>{sensor.temperature}</div>
		</div>
		<div style={{display:'flex',flexShrink:0,gap:compact?8:14}}>{extras.map(([label,value])=>
			<div key={label} style={{display:'flex',flex:1,minWidth:0,flexDirection:'column',borderTop:'2px solid currentColor',paddingTop:compact?4:8}}>
				<div style={{...text(compact?8:10,800)}}>{label}</div>
				<div style={{...text(compact?13:18,900),lineHeight:1.1,marginTop:2}}>{value}</div>
			</div>
		)}</div>
	</div>
}

export function renderPanelCard(id:BlockId,weather:WeatherScreenData,compact:boolean,span:CardSpan){
	applyFontScale(weather)
	return cardRenderers[id](weather,compact,span)
}

const cardRenderers: Record<BlockId,(weather:WeatherScreenData,compact:boolean,span:number)=>ReactNode> = {
	current:(weather,compact)=><CurrentCard weather={weather} compact={compact}/>,overview:(weather,compact)=><OverviewCard weather={weather} compact={compact}/>,photo:weather=><PhotoCard weather={weather}/>,weatherScene:(weather,compact,span)=><WeatherSceneCard weather={weather} compact={compact} span={span}/>,clock:(weather,compact)=><ClockCard weather={weather} compact={compact}/>,forecast:(weather,compact)=><ForecastCard weather={weather} compact={compact}/>,dailyForecast:(weather,compact)=><DailyForecastCard weather={weather} compact={compact}/>,weekStrip:(weather,compact,span)=><WeekStripCard weather={weather} compact={compact} span={span}/>,weekTiles:(weather,compact,span)=><WeekTilesCard weather={weather} compact={compact} span={span}/>,weekRange:(weather,compact,span)=><WeekRangeCard weather={weather} compact={compact} span={span}/>,temperatureChart:(weather,compact)=><TemperatureChartCard weather={weather} compact={compact}/>,precipitationChart:(weather,compact)=><PrecipitationChartCard weather={weather} compact={compact}/>,windChart:(weather,compact)=><WindChartCard weather={weather} compact={compact}/>,feels:(weather,compact)=><FeelsCard weather={weather} compact={compact}/>,humidity:(weather,compact)=><HumidityCard weather={weather} compact={compact}/>,pressure:(weather,compact)=><PressureCard weather={weather} compact={compact}/>,precipitation:(weather,compact)=><PrecipitationCard weather={weather} compact={compact}/>,precipitationDetail:(weather,compact)=><PrecipitationDetailCard weather={weather} compact={compact}/>,metrics:(weather,compact)=><MetricsCard weather={weather} compact={compact}/>,wind:(weather,compact)=><WindCard weather={weather} compact={compact}/>,sun:(weather,compact)=><SunCard weather={weather} compact={compact}/>,daylight:(weather,compact)=><DaylightCard weather={weather} compact={compact}/>,clouds:(weather,compact)=><CloudsCard weather={weather} compact={compact}/>,cloudLayers:(weather,compact)=><CloudLayersCard weather={weather} compact={compact}/>,visibility:(weather,compact)=><SimpleValueCard weather={weather} compact={compact} label={weather.labels.visibility} value={`${weather.visibility} ${weather.visibilityUnit}`} detail={`${weather.labels.clouds} ${weather.cloudCover}%`}/>,dewPoint:(weather,compact)=><SimpleValueCard weather={weather} compact={compact} label={weather.labels.dewPoint} value={`${weather.dewPoint}°`} detail={`${weather.labels.humidity} ${weather.humidity}%`}/>,	uv:(weather,compact)=><SimpleValueCard weather={weather} compact={compact} label={weather.labels.uv} value={String(weather.uvIndex)} detail={`${weather.labels.wind==='ВЕТЕР'?'ПРИ ЯСНОМ НЕБЕ':'CLEAR SKY'} ${weather.uvIndexClearSky}`}/>,radiation:(weather,compact)=><RadiationCard weather={weather} compact={compact}/>,airQuality:(weather,compact)=><AirQualityCard weather={weather} compact={compact}/>,sensor:(weather,compact)=><SensorCard weather={weather} compact={compact}/>,
}

export function WeatherScreen({weather,generatedAt,generatedAtLocal,renderBlock,renderHeader,addSlot}:WeatherScreenProps) {
	applyFontScale(weather)
	const locale = weather.labels.wind === 'ВЕТЕР' ? 'ru-RU' : 'en-GB'
	const localTimestamp=generatedAtLocal ? new Date(`${generatedAtLocal}Z`) : (generatedAt ?? new Date())
	const displayTimezone=generatedAtLocal ? 'UTC' : weather.timezone
	const date = new Intl.DateTimeFormat(locale,{timeZone:displayTimezone,weekday:'short',day:'2-digit',month:'short'}).format(localTimestamp).toUpperCase()
	const time = new Intl.DateTimeFormat('en-GB',{timeZone:displayTimezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(localTimestamp)
	const packed=packBlockGrid(weather.layout)??[]
	const empty=addSlot?findEmptySlot(weather.layout):null
	const rowCount=Math.max(1,...packed.map(item=>item.row+item.rowSpan-1),empty?empty.row+empty.rowSpan-1:1)
	const hasSecondRow=rowCount>1
	const size=weather.display
	const chrome=paint(weather)
	const header=getHeader(weather.layout)
	const screenW=size.width
	const screenH=size.height
	const sizeMul=header.size==='s'?0.72:header.size==='l'?1.22:1
	const headerH=header.visible?Math.max(36,Math.round(64*sizeMul*Math.min(screenW/DESIGN_WIDTH,screenH/DESIGN_HEIGHT,1.15))):0
	const innerW=screenW-16
	const bodyH=screenH-16-headerH
	const pad=Math.max(8,Math.round(14*Math.min(screenW/DESIGN_WIDTH,1)))
	const gap=getCardGap(weather.layout)
	const cellW=(innerW-pad*2-gap*3)/4
	const cellH=(bodyH-pad*2-gap*Math.max(0,rowCount-1))/rowCount
	const cellStyle=(col:number,row:number,colSpan:CardSpan,rowSpan:CardRowSpan)=>({
		display:'flex' as const,
		position:'absolute' as const,
		left:pad+(col-1)*(cellW+gap),
		top:pad+(row-1)*(cellH+gap),
		width:colSpan*cellW+(colSpan-1)*gap,
		height:rowSpan*cellH+(rowSpan-1)*gap,
		minWidth:0,
		minHeight:0,
		overflow:'visible' as const,
	})
	const filled=header.style==='fill'
	const headerBg=filled?chrome.headerBg:chrome.paper
	const headerFg=filled?chrome.headerFg:chrome.ink
	const title=(header.title??weather.city).toUpperCase()
	const showLeft=header.showCity||header.showCoords
	const showRight=header.showDate||header.showTime
	const radius=chrome.radius
	const frame=8
	const innerRadius=Math.max(0,radius-frame)
	const headerBar=header.visible?<div style={{height:headerH,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',background:headerBg,color:headerFg,boxSizing:'border-box',overflow:'hidden',borderTopLeftRadius:innerRadius,borderTopRightRadius:innerRadius,...(header.style==='line'?{borderBottom:`3px solid ${chrome.ink}`}:{})}}>
			{showLeft?<div style={{display:'flex',alignItems:'baseline',gap:10,minWidth:0}}>{header.showCity?<div style={{...text(Math.max(14,Math.round((header.size==='s'?20:header.size==='l'?28:25)*Math.min(screenW/DESIGN_WIDTH,1))),900),letterSpacing:.7}}>{title}</div>:null}{header.showCoords?<div style={{...text(Math.max(8,Math.round(10*Math.min(screenW/DESIGN_WIDTH,1)))),letterSpacing:1.5}}>{weather.coordinates}</div>:null}</div>:<div/>}
			{showRight?<div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>{header.showDate?<div style={{...text(Math.max(9,Math.round(12*Math.min(screenW/DESIGN_WIDTH,1))),800),letterSpacing:1}}>{date}</div>:null}{header.showTime?<div style={text(Math.max(14,Math.round((header.size==='s'?20:header.size==='l'?28:24)*Math.min(screenW/DESIGN_WIDTH,1))),900)}>{time}</div>:null}</div>:null}
		</div>:null
	return <div style={{width:screenW,height:screenH,display:'flex',background:chrome.frame,color:chrome.ink,fontFamily:renderBlock?undefined:SCREEN_FONT_FAMILY,fontSize:fs(16),borderRadius:radius,overflow:'hidden',boxSizing:'border-box',padding:frame}}>
		<div style={{display:'flex',flexDirection:'column',flex:1,minWidth:0,minHeight:0,background:chrome.paper,color:chrome.ink,borderRadius:innerRadius,overflow:'hidden'}}>
			{renderHeader?renderHeader(headerBar):headerBar}
			<div style={{display:'flex',flex:1,minHeight:0,position:'relative'}}>
				{packed.map(item=>{const compact=hasSecondRow&&item.rowSpan===1;const content=renderPanelCard(item.id,weather,compact,item.colSpan);return <div key={item.id} className="screen-cell" style={cellStyle(item.col,item.row,item.colSpan,item.rowSpan)}>{renderBlock?renderBlock(item.id,content):content}</div>})}
				{empty&&addSlot?<div style={cellStyle(empty.col,empty.row,empty.colSpan,empty.rowSpan)}>{addSlot}</div>:null}
			</div>
		</div>
	</div>
}
