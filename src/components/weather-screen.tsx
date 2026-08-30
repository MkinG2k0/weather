/* eslint-disable @next/next/no-img-element */
import type {CSSProperties, ReactNode} from 'react'
import {getCardSpan,packBlockRows,type BlockId} from '@/lib/panel-config'
import {WeatherIcon} from '@/components/weather-icons'
import type {WeatherDailyItem, WeatherScreenData} from '@/lib/weather'

type WeatherScreenProps = {
	weather: WeatherScreenData
	generatedAt?: Date
	generatedAtLocal?: string
	renderBlock?: (id:BlockId,content:ReactNode)=>ReactNode
	addSlot?: ReactNode
}
const panel: CSSProperties = {display:'flex', flex:1, minWidth:0, border:'3px solid #000', background:'#fff'}
const text = (size:number, weight:number=700): CSSProperties => ({display:'flex', fontSize:size, fontWeight:weight})

function Metric({label,value,compact=false}:{label:string;value:string;compact?:boolean}) {
	return <div style={{display:'flex',flexDirection:'column',gap:compact?2:5}}><div style={{...text(compact?8:11),letterSpacing:compact?.8:1.4}}>{label}</div><div style={text(compact?19:28,900)}>{value}</div></div>
}

function CurrentCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'center',padding:compact?'26px 12px 8px':'12px 18px'}}>
		<div style={{display:'flex',alignItems:'flex-start'}}><div style={{...text(compact?54:98,900),lineHeight:.9,letterSpacing:compact?-4:-7}}>{weather.temperature}</div><div style={{...text(compact?24:40,900),lineHeight:1}}>°</div></div>
		<div style={{display:'flex',alignItems:'center',gap:compact?6:10,marginTop:compact?5:12}}><div style={{width:compact?27:42,height:compact?7:11,display:'flex',background:'#000'}}/><div style={{...text(compact?10:15,900),letterSpacing:.7}}>{weather.weatherLabel}</div></div>
		<div style={{...text(compact?8:12),marginTop:compact?5:8}}>{`${weather.labels.feels} ${weather.feelsLike}° · ${weather.labels.high} ${weather.high}° / ${weather.labels.low} ${weather.low}°`}</div>
	</section>
}

function ForecastCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	const label=weather.labels.wind==='ВЕТЕР'?'ПРОГНОЗ':'FORECAST'
	return <section style={{...panel,flexDirection:'column',padding:compact?'30px 9px 7px':'38px 14px 12px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.7,marginBottom:compact?3:8}}>{label}</div>
		{weather.forecast.map((item,index)=><div key={`${item.time}-${index}`} style={{display:'flex',alignItems:'center',gap:compact?4:7,flex:1,minHeight:0,borderTop:index===0?'3px solid #000':'2px solid #000'}}><div style={{...text(compact?8:10,900),width:compact?30:38,flexShrink:0,letterSpacing:.5}}>{item.time}</div><div style={{...text(compact?6:8,800),flex:1,minWidth:0,lineHeight:1.05}}>{item.mark}</div><div style={{...text(compact?14:19,900),flexShrink:0}}>{item.temp}</div></div>)}
	</section>
}

function FeelsCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'center',padding:compact?'28px 12px 8px':'28px 16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.feels}</div><div style={{...text(compact?42:72,900),lineHeight:1,marginTop:compact?4:10}}>{weather.feelsLike}°</div>
		<div style={{display:'flex',height:3,background:'#000',margin:compact?'8px 0 6px':'20px 0 14px'}}/><div style={{display:'flex',justifyContent:'space-between',gap:8}}><Metric compact={compact} label={weather.labels.low} value={`${weather.low}°`}/><Metric compact={compact} label={weather.labels.high} value={`${weather.high}°`}/></div>
	</section>
}

function HumidityCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'26px 12px 8px':'28px 16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.humidity}</div><div style={{display:'flex',alignItems:'baseline',marginTop:compact?5:13}}><div style={{...text(compact?44:72,900),lineHeight:1}}>{weather.humidity}</div><div style={text(compact?15:22,900)}>%</div></div>
		<div style={{display:'flex',width:'100%',height:compact?10:16,marginTop:compact?9:22,border:'3px solid #000'}}><div style={{display:'flex',width:`${weather.humidity}%`,background:'#000'}}/></div>
	</section>
}

function PressureCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	const [value,...unit]=weather.pressure.split(' ')
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'26px 12px 8px':'28px 16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.pressure}</div><div style={{...text(compact?40:62,900),lineHeight:1,marginTop:compact?6:16}}>{value}</div><div style={{...text(compact?10:14,900),marginTop:compact?3:8}}>{unit.join(' ')}</div>
		<div style={{width:compact?54:86,height:3,display:'flex',background:'#000',marginTop:compact?9:24}}/>
	</section>
}

function PrecipitationCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'26px 12px 8px':'28px 16px'}}>
		<div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.5}}>{weather.labels.precipitation}</div><div style={{display:'flex',alignItems:'baseline',marginTop:compact?5:14}}><div style={{...text(compact?44:72,900),lineHeight:1}}>{weather.precipitationProbability}</div><div style={text(compact?15:22,900)}>%</div></div>
		<div style={{display:'flex',gap:compact?3:5,marginTop:compact?9:24}}>{[20,40,60,80].map(level=><div key={level} style={{width:compact?12:19,height:compact?12:19,border:compact?'2px solid #000':'3px solid #000',background:weather.precipitationProbability>=level?'#000':'#fff'}}/>)}</div>
	</section>
}

function MetricsCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'space-between',padding:compact?'29px 12px 8px':'16px 18px'}}>
		<Metric compact={compact} label={weather.labels.humidity} value={`${weather.humidity}%`}/><div style={{display:'flex',height:compact?2:3,background:'#000'}}/>
		<Metric compact={compact} label={weather.labels.pressure} value={weather.pressure}/><div style={{display:'flex',height:compact?2:3,background:'#000'}}/>
		<Metric compact={compact} label={weather.labels.precipitation} value={`${weather.precipitationProbability}%`}/>
	</section>
}

function WindCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'25px 8px 6px':14}}>
		<div style={{...text(compact?8:11,800),letterSpacing:compact?1:2}}>{`${weather.labels.wind} / ${weather.windDirection}`}</div>
		<div style={{display:'flex',alignItems:'baseline',marginTop:compact?2:5}}><div style={{...text(compact?39:62,900),lineHeight:1}}>{weather.windSpeed}</div><div style={{...text(compact?10:15,900),marginLeft:4}}>{weather.windUnit}</div></div>
		<div style={text(compact?21:36,900)}>↑</div><div style={text(compact?8:11)}>{`${weather.labels.gusts} ${weather.windGust} ${weather.windUnit}`}</div>
	</section>
}

function SunCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',justifyContent:'space-between',padding:compact?'29px 12px 8px':'18px'}}>
		<Metric compact={compact} label={weather.labels.sunrise} value={weather.sunrise}/><div style={{display:'flex',height:compact?2:3,background:'#000'}}/>
		<Metric compact={compact} label={weather.labels.sunset} value={weather.sunset}/><div style={{display:'flex',height:compact?2:3,background:'#000'}}/>
		<Metric compact={compact} label={weather.labels.uv} value={String(weather.uvIndex)}/>
	</section>
}

function CloudsCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}) {
	return <section style={{...panel,flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'26px 9px 7px':16}}>
		<div style={{...text(compact?8:11,800),letterSpacing:compact?1:1.6}}>{weather.labels.clouds}</div><div style={{...text(compact?43:76,900),lineHeight:1,marginTop:compact?4:10}}>{weather.cloudCover}</div><div style={text(compact?15:24,900)}>%</div>
		<div style={{display:'flex',width:compact?58:90,height:compact?8:12,marginTop:compact?5:14,border:'2px solid #000'}}><div style={{display:'flex',width:`${weather.cloudCover}%`,background:'#000'}}/></div><div style={{...text(compact?8:11,800),marginTop:compact?4:10}}>{weather.weatherLabel}</div>
	</section>
}

function CardTitle({children,compact}:{children:ReactNode;compact:boolean}){return <div style={{...text(compact?8:11,900),letterSpacing:compact?1:1.6,textTransform:'uppercase'}}>{children}</div>}

function SparkChart({values,secondary,labels,unit='',bars=false}:{values:number[];secondary?:number[];labels:string[];unit?:string;bars?:boolean}){
	const all=[...values,...(secondary??[])];const min=Math.min(...all);const max=Math.max(...all);const range=Math.max(1,max-min)
	const points=(series:number[])=>series.map((value,index)=>`${8+index*(184/Math.max(1,series.length-1))},${78-(value-min)/range*60}`).join(' ')
	return <div style={{display:'flex',flex:1,minHeight:0,flexDirection:'column'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:8,fontWeight:900}}><span>{Math.round(max)}{unit}</span><span>{Math.round(min)}{unit} MIN</span></div><svg viewBox="0 0 200 78" preserveAspectRatio="none" style={{display:'flex',width:'100%',flex:1,minHeight:45}} aria-hidden="true">
		<line x1="8" y1="78" x2="192" y2="78" stroke="#000" strokeWidth="2" vectorEffect="non-scaling-stroke"/><line x1="8" y1="48" x2="192" y2="48" stroke="#000" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"/>
		{bars?values.map((value,index)=>{const height=Math.max(2,(value-min)/range*60);const width=166/values.length;return <rect key={index} x={12+index*(176/values.length)} y={78-height} width={width} height={height} fill="#000"/>}):<polyline points={points(values)} fill="none" stroke="#000" strokeWidth="5" strokeLinejoin="round" strokeLinecap="square" vectorEffect="non-scaling-stroke"/>}
		{secondary&&<polyline points={points(secondary)} fill="none" stroke="#000" strokeWidth="2" strokeDasharray="6 5" vectorEffect="non-scaling-stroke"/>}
	</svg><div style={{display:'flex',justifyContent:'space-between',fontSize:7,fontWeight:900}}>{labels.map((label,index)=><span key={`${label}-${index}`}>{label}</span>)}</div></div>
}

function ClockCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	const hour=Number(weather.observedAt.slice(11,13));const minute=Number(weather.observedAt.slice(14,16));const minuteAngle=minute*6;const hourAngle=(hour%12)*30+minute/2
	return <section style={{...panel,alignItems:'center',justifyContent:'center',gap:compact?8:18,padding:compact?'27px 8px 7px':'18px'}}><svg viewBox="0 0 120 120" style={{height:compact?116:150,maxWidth:'48%'}} aria-label={`${hour}:${String(minute).padStart(2,'0')}`}>
		<circle cx="60" cy="60" r="54" fill="#fff" stroke="#000" strokeWidth="5"/>{Array.from({length:12},(_,index)=><line key={index} x1="60" y1="10" x2="60" y2={index%3===0?'20':'16'} stroke="#000" strokeWidth={index%3===0?'4':'2'} transform={`rotate(${index*30} 60 60)`}/>)}
		<line x1="60" y1="60" x2="60" y2="31" stroke="#000" strokeWidth="6" transform={`rotate(${hourAngle} 60 60)`}/><line x1="60" y1="64" x2="60" y2="20" stroke="#000" strokeWidth="3" transform={`rotate(${minuteAngle} 60 60)`}/><circle cx="60" cy="60" r="5" fill="#000"/>
	</svg><div style={{display:'flex',flexDirection:'column'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'МЕСТНОЕ ВРЕМЯ':'LOCAL TIME'}</CardTitle><div style={{...text(compact?30:44,900),letterSpacing:-2}}>{weather.observedAt.slice(11,16)}</div><div style={{...text(compact?8:10),marginTop:5}}>{weather.timezone.replace('_',' ')}</div></div></section>
}

function PhotoCard({weather}:{weather:WeatherScreenData}){const photo=weather.layout.photoDataUrl;return <section style={{...panel,position:'relative',overflow:'hidden',alignItems:'center',justifyContent:'center'}}>{photo?<img src={photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:16,textAlign:'center'}}><b style={{fontSize:32}}>▧</b><span style={{fontSize:11,fontWeight:900}}>ЗАГРУЗИТЕ ФОТО В НАСТРОЙКАХ</span></div>}</section>}

function WeatherSceneCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const wet=weather.precipitation>0||weather.precipitationProbability>=45;const snowy=weather.snowfall>0;const cloudy=weather.cloudCover>=45
	return <section style={{...panel,position:'relative',overflow:'hidden',flexDirection:'column',padding:compact?'27px 10px 8px':'14px'}}><div style={{display:'flex',justifyContent:'space-between'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'ПОГОДНАЯ СЦЕНА':'WEATHER SCENE'}</CardTitle><div style={text(compact?8:10,900)}>{weather.isDay?'DAY':'NIGHT'}</div></div>
		<svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid meet" style={{position:'absolute',top:0,bottom:0,left:span>=3?'25%':0,width:span>=3?'50%':'100%',height:'100%'}} aria-hidden="true"><defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#000" strokeWidth="2" vectorEffect="non-scaling-stroke"/></pattern></defs>
		{weather.isDay?<circle cx="254" cy="44" r="23" fill={cloudy?'url(#hatch)':'#000'}/>:<><circle cx="254" cy="44" r="24" fill="#000"/><circle cx="264" cy="36" r="21" fill="#fff"/></>}
		{cloudy&&<g fill="#fff" stroke="#000" strokeWidth="5"><circle cx="136" cy="68" r="25"/><circle cx="169" cy="58" r="34"/><circle cx="207" cy="72" r="27"/><path d="M110 76 H230 V91 H110 Z"/></g>}
		{wet&&Array.from({length:7},(_,index)=><line key={index} x1={116+index*18} y1="98" x2={snowy?116+index*18:108+index*18} y2={snowy?108:121} stroke="#000" strokeWidth={snowy?6:4} strokeLinecap="square"/>)}
		<path d="M0 124 L50 98 L86 118 L142 88 L205 122 L254 101 L320 128 V150 H0 Z" fill="#000"/><path d="M0 135 L64 117 L112 138 L181 112 L235 136 L289 118 L320 128 V150 H0 Z" fill="#fff" stroke="#000" strokeWidth="4"/>
		</svg><div style={{marginTop:'auto',alignSelf:'flex-start',padding:'3px 6px',background:'#fff',border:'2px solid #000',...text(compact?8:11,900)}}>{weather.weatherLabel}</div></section>
}

function TemperatureChartCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const points=weather.hourly.filter((_,index)=>index%3===0).slice(0,8);return <section style={{...panel,flexDirection:'column',padding:compact?'28px 10px 7px':'14px'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'ТЕМПЕРАТУРА · 24 Ч':'TEMPERATURE · 24H'}</CardTitle><SparkChart values={points.map(point=>point.temperature)} secondary={points.map(point=>point.feelsLike)} labels={points.map(point=>point.time)} unit="°"/></section>}
function PrecipitationChartCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const points=weather.hourly.filter((_,index)=>index%3===0).slice(0,8);return <section style={{...panel,flexDirection:'column',padding:compact?'28px 10px 7px':'14px'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'ВЕРОЯТНОСТЬ ОСАДКОВ · 24 Ч':'PRECIPITATION · 24H'}</CardTitle><SparkChart values={points.map(point=>point.precipitationProbability)} labels={points.map(point=>point.time)} unit="%" bars/></section>}
function WindChartCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const points=weather.hourly.filter((_,index)=>index%3===0).slice(0,8);return <section style={{...panel,flexDirection:'column',padding:compact?'28px 10px 7px':'14px'}}><CardTitle compact={compact}>{weather.labels.wind} · 24 H</CardTitle><SparkChart values={points.map(point=>point.windSpeed)} secondary={points.map(point=>point.windGust)} labels={points.map(point=>point.time)} unit={weather.windUnit}/></section>}

function DailyForecastCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){return <section style={{...panel,flexDirection:'column',padding:compact?'28px 10px 7px':'14px'}}><CardTitle compact={compact}>{weather.labels.wind==='ВЕТЕР'?'ПРОГНОЗ · 7 ДНЕЙ':'7-DAY FORECAST'}</CardTitle><div style={{display:'flex',flex:1,minHeight:0,marginTop:5,borderTop:'3px solid #000'}}>{weather.daily.map((day,index)=><div key={`${day.day}-${index}`} style={{display:'flex',flex:1,minWidth:0,flexDirection:'column',alignItems:'center',justifyContent:'space-around',borderLeft:index?'2px solid #000':'none',padding:'4px 2px'}}><b style={{fontSize:compact?8:10}}>{day.day}</b><span style={{fontSize:compact?8:10,fontWeight:900,maxWidth:'100%',overflow:'hidden'}}>{day.weatherLabel.split(' ')[0]}</span><div style={{display:'flex',gap:4,fontSize:compact?12:16,fontWeight:900}}><span>{day.high}°</span><span style={{fontWeight:500}}>{day.low}°</span></div><small style={{fontSize:compact?7:9,fontWeight:800}}>{day.precipitationProbability}% · {day.windSpeedMax}</small></div>)}</div></section>}

function weekDays(weather:WeatherScreenData){return weather.daily.slice(0,7)}
function weekDayLabel(day:string){const clean=day.replace('.','').toLowerCase();return clean.charAt(0).toUpperCase()+clean.slice(1)}
function weekItemWidth(span:number){return span>=4?'14.28%':span===3?'25%':span===2?'50%':'100%'}
function weekIconSize(span:number,compact:boolean,list:boolean){
	if(list)return compact?28:36
	if(compact)return span>=4?62:span===3?52:44
	return span>=4?84:span===3?70:56
}
function isWeekList(span:number,compact:boolean){return span===1||(compact&&span===2)}
function WeekIconSlot({code,size}:{code:number;size:number}){
	return <div style={{display:'flex',flexGrow:1,flexBasis:0,width:'100%',minHeight:size,minWidth:0,alignItems:'center',justifyContent:'center'}}>
		<WeatherIcon code={code} size={size} fill/>
	</div>
}

function weekItemBox(span:number,list:boolean):CSSProperties{
	if(list)return {display:'flex',width:'100%'}
	if(span>=4)return {display:'flex',flexGrow:1,flexShrink:1,flexBasis:0,minWidth:0}
	return {display:'flex',width:weekItemWidth(span)}
}

function WeekDayColumn({day,compact,span,list=false,iconSize}:{day:WeatherDailyItem;compact:boolean;span:number;list?:boolean;iconSize:number}){
	const label=weekDayLabel(day.day)
	const temps=`${day.high}°|${day.low}°`
	if(list)return <div style={{display:'flex',width:'100%',alignItems:'center',padding:compact?'2px 0':'4px 0',borderTop:'2px solid #000'}}>
		<div style={{width:compact?28:36,fontSize:compact?10:13,fontWeight:700}}>{label}</div>
		<div style={{width:8}}/>
		<WeatherIcon code={day.weatherCode??3} size={iconSize}/>
		<div style={{display:'flex',flexGrow:1}}/>
		<div style={{fontSize:compact?11:14,fontWeight:600,letterSpacing:.2}}>{temps}</div>
	</div>
	return <div style={{...weekItemBox(span,false),flexDirection:'column',alignItems:'center',justifyContent:'space-between',padding:compact?'4px 1px':'8px 2px'}}>
		<div style={{fontSize:compact?10:span>=4?14:12,fontWeight:600,letterSpacing:.3}}>{label}</div>
		<WeekIconSlot code={day.weatherCode??3} size={iconSize}/>
		<div style={{fontSize:compact?10:span>=4?13:11,fontWeight:600}}>{temps}</div>
	</div>
}

function WeekStripCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const days=weekDays(weather);const list=isWeekList(span,compact)
	return <section style={{...panel,flexDirection:'column',justifyContent:list?'flex-start':'center',padding:compact?(list?'24px 8px 4px':'18px 4px 4px'):(list?'14px 14px 10px':'10px 8px 8px')}}>
		<div style={{display:'flex',flexWrap:'wrap',flex:1}}>
			{days.map((day,index)=><WeekDayColumn key={`${day.day}-${index}`} day={day} compact={compact} span={span} list={list} iconSize={weekIconSize(span,compact,list)}/>)}
		</div>
	</section>
}

function WeekTilesCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const days=weekDays(weather);const list=isWeekList(span,compact)
	return <section style={{...panel,flexDirection:'column',padding:compact?'18px 4px 4px':'8px 6px 6px'}}>
		<div style={{display:'flex',flexWrap:'wrap',flex:1}}>
			{days.map((day,index)=><div key={`${day.day}-${index}`} style={{...weekItemBox(span,list),boxSizing:'border-box',padding:compact?2:3}}>
				<div style={{display:'flex',flex:1,border:'2px solid #000',padding:compact?4:6,...(list?{alignItems:'center'}:{flexDirection:'column',alignItems:'center',justifyContent:'space-between'})}}>
					<div style={{fontSize:compact?9:12,fontWeight:700}}>{weekDayLabel(day.day)}</div>
					{list?<WeatherIcon code={day.weatherCode??3} size={weekIconSize(span,compact,list)}/>:<WeekIconSlot code={day.weatherCode??3} size={weekIconSize(span,compact,list)}/>}
					<div style={{fontSize:compact?9:12,fontWeight:600}}>{day.high}°|{day.low}°</div>
				</div>
			</div>)}
		</div>
	</section>
}

function WeekRangeCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){
	const days=weekDays(weather);const min=Math.min(...days.map(day=>day.low));const max=Math.max(...days.map(day=>day.high));const range=Math.max(1,max-min)
	const list=isWeekList(span,compact)
	return <section style={{...panel,flexDirection:'column',padding:compact?'18px 4px 4px':'8px 6px 6px'}}>
		<div style={{display:'flex',flexWrap:'wrap',flex:1}}>
			{days.map((day,index)=>{
				const top=((max-day.high)/range)*100;const bar=((day.high-day.low)/range)*100
				return <div key={`${day.day}-${index}`} style={{...weekItemBox(span,list),boxSizing:'border-box',padding:compact?2:4,flexDirection:list?'row':'column',alignItems:'center',justifyContent:'space-between'}}>
					<div style={{fontSize:compact?9:12,fontWeight:700}}>{weekDayLabel(day.day)}</div>
					{list?<WeatherIcon code={day.weatherCode??3} size={weekIconSize(span,compact,true)}/>:<WeekIconSlot code={day.weatherCode??3} size={Math.round(weekIconSize(span,compact,false)*.72)}/>}
					{list?<div style={{display:'flex',flex:1,height:10,marginLeft:6,marginRight:6,border:'2px solid #000'}}><div style={{marginLeft:`${top}%`,width:`${Math.max(8,bar)}%`,height:'100%',background:'#000'}}/></div>:<div style={{display:'flex',width:compact?10:12,flex:1,minHeight:36,border:'2px solid #000'}}><div style={{marginTop:`${top}%`,width:'100%',height:`${Math.max(10,bar)}%`,background:'#000'}}/></div>}
					<div style={{fontSize:compact?9:12,fontWeight:600}}>{day.high}°|{day.low}°</div>
				</div>
			})}
		</div>
	</section>
}

function SimpleValueCard({label,value,detail,compact}:{label:string;value:string;detail:string;compact:boolean}){return <section style={{...panel,flexDirection:'column',justifyContent:'center',padding:compact?'27px 11px 8px':'18px'}}><CardTitle compact={compact}>{label}</CardTitle><div style={{...text(compact?38:62,900),lineHeight:1,marginTop:compact?5:12,letterSpacing:-2}}>{value}</div><div style={{display:'flex',height:3,background:'#000',margin:'9px 0 7px'}}/><div style={text(compact?8:11)}>{detail}</div></section>}
function OverviewCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const ru=weather.labels.wind==='ВЕТЕР';const values:[[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string],[string,string]]=[
	[ru?'ТЕМП.':'TEMP',`${weather.temperature}°`],[weather.labels.feels,`${weather.feelsLike}°`],[weather.labels.dewPoint,`${weather.dewPoint}°`],[weather.labels.humidity,`${weather.humidity}%`],
	[weather.labels.pressure,weather.pressure],[ru?'УРОВЕНЬ МОРЯ':'SEA LEVEL',weather.seaLevelPressure],[weather.labels.visibility,`${weather.visibility} ${weather.visibilityUnit}`],[weather.labels.clouds,`${weather.cloudCover}%`],
	[ru?'ОСАДКИ / ДЕНЬ':'PRECIP / DAY',`${weather.precipitationSum} ${weather.precipitationUnit}`],[weather.labels.wind,`${weather.windSpeed} ${weather.windUnit}`],[weather.labels.gusts,`${weather.windGust} ${weather.windUnit}`],[weather.labels.uv,String(weather.uvIndex)],
	[weather.labels.sunrise,weather.sunrise],[weather.labels.daylight,weather.daylightDuration],[weather.labels.radiation,`${weather.shortwaveRadiationSum} MJ`],[weather.labels.airQuality,weather.airQuality?String(weather.airQuality.europeanAqi):'—'],
];return <section style={{...panel,flexDirection:'column',padding:compact?'28px 9px 7px':'14px'}}><CardTitle compact={compact}>{ru?'ПОЛНАЯ ПОГОДНАЯ СВОДКА':'COMPLETE WEATHER OVERVIEW'}</CardTitle><div style={{display:'flex',flexWrap:'wrap',flex:1,marginTop:4,borderTop:'3px solid #000',borderLeft:'2px solid #000'}}>{values.map(([label,value])=><div key={label} style={{display:'flex',width:'25%',boxSizing:'border-box',flexDirection:'column',justifyContent:'center',padding:compact?'2px 6px':'5px 8px',borderRight:'2px solid #000',borderBottom:'2px solid #000'}}><span style={{fontSize:compact?6:8,fontWeight:800,letterSpacing:.5}}>{label}</span><b style={{fontSize:compact?13:18}}>{value}</b></div>)}</div></section>}
function PrecipitationDetailCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const values=[[weather.labels.wind==='ВЕТЕР'?'ВСЕГО':'TOTAL',weather.precipitationSum],[weather.labels.wind==='ВЕТЕР'?'ДОЖДЬ':'RAIN',weather.rainSum],[weather.labels.wind==='ВЕТЕР'?'ЛИВНИ':'SHOWERS',weather.showersSum],[weather.labels.wind==='ВЕТЕР'?'СНЕГ':'SNOW',weather.snowfallSum]];return <section style={{...panel,flexDirection:'column',padding:compact?'29px 11px 8px':'16px'}}><CardTitle compact={compact}>{weather.labels.precipitation} · {weather.labels.wind==='ВЕТЕР'?'ЗА ДЕНЬ':'TODAY'}</CardTitle><div style={{display:'flex',flexWrap:'wrap',flex:1,marginTop:5,border:'2px solid #000'}}>{values.map(([label,value],index)=><div key={String(label)} style={{display:'flex',width:'50%',boxSizing:'border-box',flexDirection:'column',justifyContent:'center',padding:'4px 8px',borderLeft:index%2?'2px solid #000':'none',borderTop:index>1?'2px solid #000':'none'}}><span style={{fontSize:compact?7:9,fontWeight:800}}>{label}</span><b style={{fontSize:compact?18:25}}>{value} {weather.precipitationUnit}</b></div>)}</div><div style={{...text(compact?7:9),marginTop:4}}>{weather.precipitationHours} h · {weather.labels.wind==='ВЕТЕР'?'СЕЙЧАС':'NOW'} {weather.precipitation} / {weather.rain} / {weather.showers} / {weather.snowfall}</div></section>}
function DaylightCard({weather,compact,span}:{weather:WeatherScreenData;compact:boolean;span:number}){return <section style={{...panel,flexDirection:'column',padding:compact?'29px 11px 8px':'17px'}}><CardTitle compact={compact}>{weather.labels.daylight}</CardTitle><div style={{display:'flex',alignItems:'center',justifyContent:span>=3?'center':'flex-start',gap:12,flex:1}}><svg viewBox="0 0 150 75" preserveAspectRatio="xMidYMid meet" style={{width:span>=3?230:'48%'}} aria-hidden="true"><path d="M8 68 A67 67 0 0 1 142 68" fill="none" stroke="#000" strokeWidth="5" vectorEffect="non-scaling-stroke"/><circle cx="75" cy="25" r="13" fill="#000"/><line x1="8" y1="68" x2="142" y2="68" stroke="#000" strokeWidth="4" vectorEffect="non-scaling-stroke"/></svg><div><b style={{fontSize:compact?25:36}}>{weather.daylightDuration}</b><div style={{fontSize:compact?8:11,fontWeight:800}}>{weather.labels.sunshine}: {weather.sunshineDuration}</div><div style={{fontSize:compact?8:11,fontWeight:800}}>{weather.sunrise}—{weather.sunset}</div></div></div></section>}
function CloudLayersCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const layers=[[weather.labels.wind==='ВЕТЕР'?'ВЫСОКО':'HIGH',weather.cloudCoverHigh],[weather.labels.wind==='ВЕТЕР'?'СРЕДНЕ':'MID',weather.cloudCoverMid],[weather.labels.wind==='ВЕТЕР'?'НИЗКО':'LOW',weather.cloudCoverLow]];return <section style={{...panel,flexDirection:'column',padding:compact?'29px 11px 8px':'16px'}}><CardTitle compact={compact}>{weather.labels.clouds} · {weather.labels.wind==='ВЕТЕР'?'СЛОИ':'LAYERS'}</CardTitle><div style={{display:'flex',flexDirection:'column',justifyContent:'space-around',flex:1}}>{layers.map(([label,value])=><div key={String(label)} style={{display:'flex',alignItems:'center',gap:6,fontSize:compact?8:10,fontWeight:900}}><span style={{width:48}}>{label}</span><div style={{display:'flex',flex:1,height:compact?11:16,border:'2px solid #000'}}><div style={{display:'flex',width:`${value}%`,height:'100%',background:'#000'}}/></div><b style={{width:34}}>{value}%</b></div>)}</div></section>}
function RadiationCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){return <section style={{...panel,flexDirection:'column',padding:compact?'29px 11px 8px':'17px'}}><CardTitle compact={compact}>{weather.labels.radiation}</CardTitle><div style={{display:'flex',alignItems:'center',gap:12,flex:1}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',width:compact?64:88,height:compact?64:88,border:'5px solid #000',borderRadius:'50%',fontSize:compact?24:34,fontWeight:900}}>☀</div><div><b style={{fontSize:compact?29:42}}>{weather.shortwaveRadiationSum}</b><div style={{fontSize:compact?8:11,fontWeight:900}}>MJ / m²</div><div style={{fontSize:compact?8:11,fontWeight:800,marginTop:5}}>ET₀ {weather.evapotranspiration} {weather.precipitationUnit}</div></div></div></section>}
function AirQualityCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){const aq=weather.airQuality;if(!aq)return <SimpleValueCard compact={compact} label={weather.labels.airQuality} value="—" detail={weather.labels.wind==='ВЕТЕР'?'ДАННЫЕ НЕДОСТУПНЫ':'NO DATA'}/>;return <section style={{...panel,flexDirection:'column',padding:compact?'29px 11px 8px':'16px'}}><CardTitle compact={compact}>{weather.labels.airQuality}</CardTitle><div style={{display:'flex',alignItems:'baseline',gap:7}}><b style={{fontSize:compact?40:58,lineHeight:1}}>{aq.europeanAqi}</b><span style={{fontSize:compact?8:11,fontWeight:900}}>EU AQI · US {aq.usAqi}</span></div><div style={{display:'flex',gap:3,marginTop:'auto'}}>{[['PM₂.₅',aq.pm25],['PM₁₀',aq.pm10],['NO₂',aq.nitrogenDioxide],['O₃',aq.ozone],['CO',aq.carbonMonoxide],['SO₂',aq.sulphurDioxide]].map(([label,value])=><div key={String(label)} style={{display:'flex',flex:1,flexDirection:'column',borderTop:'2px solid #000',paddingTop:3}}><span style={{fontSize:compact?6:8,fontWeight:800}}>{label}</span><b style={{fontSize:compact?11:16}}>{value}</b></div>)}</div></section>}

function SensorCard({weather,compact}:{weather:WeatherScreenData;compact:boolean}){
	const ru=weather.labels.wind==='ВЕТЕР'
	const sensor=weather.sensor
	const title=`${ru?'ДАТЧИК':'SENSOR'} ${sensor?.chip??'BMP280'}`
	if(!sensor)return <SimpleValueCard compact={compact} label={title} value="—" detail={ru?'НЕТ ДАННЫХ С УСТРОЙСТВА':'NO DATA FROM DEVICE'}/>
	const extras:[[string,string],[string,string],...[string,string][]]=[
		[weather.labels.pressure,sensor.pressure],
		[ru?'ВЫСОТА':'ALTITUDE',sensor.altitude],
		...(sensor.hasHumidity&&sensor.humidity?[[weather.labels.humidity,sensor.humidity] as [string,string]]:[]),
	]
	return <section style={{...panel,flexDirection:'column',padding:compact?'27px 11px 8px':'16px'}}>
		<CardTitle compact={compact}>{title}</CardTitle>
		<div style={{display:'flex',alignItems:'baseline',marginTop:compact?4:8}}><div style={{...text(compact?36:56,900),lineHeight:1}}>{sensor.temperature}</div></div>
		<div style={{...text(compact?7:9,800),marginTop:compact?2:4}}>{ru?'В КОМНАТЕ':'INDOOR'}</div>
		<div style={{display:'flex',gap:compact?6:10,marginTop:'auto'}}>{extras.map(([label,value])=><div key={label} style={{display:'flex',flex:1,flexDirection:'column',borderTop:'2px solid #000',paddingTop:compact?3:6}}><span style={{fontSize:compact?6:8,fontWeight:800,letterSpacing:.4}}>{label}</span><b style={{fontSize:compact?13:18}}>{value}</b></div>)}</div>
	</section>
}

const cardRenderers: Record<BlockId,(weather:WeatherScreenData,compact:boolean,span:number)=>ReactNode> = {
	current:(weather,compact)=><CurrentCard weather={weather} compact={compact}/>,overview:(weather,compact)=><OverviewCard weather={weather} compact={compact}/>,photo:weather=><PhotoCard weather={weather}/>,weatherScene:(weather,compact,span)=><WeatherSceneCard weather={weather} compact={compact} span={span}/>,clock:(weather,compact)=><ClockCard weather={weather} compact={compact}/>,forecast:(weather,compact)=><ForecastCard weather={weather} compact={compact}/>,dailyForecast:(weather,compact)=><DailyForecastCard weather={weather} compact={compact}/>,weekStrip:(weather,compact,span)=><WeekStripCard weather={weather} compact={compact} span={span}/>,weekTiles:(weather,compact,span)=><WeekTilesCard weather={weather} compact={compact} span={span}/>,weekRange:(weather,compact,span)=><WeekRangeCard weather={weather} compact={compact} span={span}/>,temperatureChart:(weather,compact)=><TemperatureChartCard weather={weather} compact={compact}/>,precipitationChart:(weather,compact)=><PrecipitationChartCard weather={weather} compact={compact}/>,windChart:(weather,compact)=><WindChartCard weather={weather} compact={compact}/>,feels:(weather,compact)=><FeelsCard weather={weather} compact={compact}/>,humidity:(weather,compact)=><HumidityCard weather={weather} compact={compact}/>,pressure:(weather,compact)=><PressureCard weather={weather} compact={compact}/>,precipitation:(weather,compact)=><PrecipitationCard weather={weather} compact={compact}/>,precipitationDetail:(weather,compact)=><PrecipitationDetailCard weather={weather} compact={compact}/>,metrics:(weather,compact)=><MetricsCard weather={weather} compact={compact}/>,wind:(weather,compact)=><WindCard weather={weather} compact={compact}/>,sun:(weather,compact)=><SunCard weather={weather} compact={compact}/>,daylight:(weather,compact,span)=><DaylightCard weather={weather} compact={compact} span={span}/>,clouds:(weather,compact)=><CloudsCard weather={weather} compact={compact}/>,cloudLayers:(weather,compact)=><CloudLayersCard weather={weather} compact={compact}/>,visibility:(weather,compact)=><SimpleValueCard compact={compact} label={weather.labels.visibility} value={`${weather.visibility} ${weather.visibilityUnit}`} detail={`${weather.labels.clouds} ${weather.cloudCover}%`}/>,dewPoint:(weather,compact)=><SimpleValueCard compact={compact} label={weather.labels.dewPoint} value={`${weather.dewPoint}°`} detail={`${weather.labels.humidity} ${weather.humidity}%`}/>,	uv:(weather,compact)=><SimpleValueCard compact={compact} label={weather.labels.uv} value={String(weather.uvIndex)} detail={`${weather.labels.wind==='ВЕТЕР'?'ПРИ ЯСНОМ НЕБЕ':'CLEAR SKY'} ${weather.uvIndexClearSky}`}/>,radiation:(weather,compact)=><RadiationCard weather={weather} compact={compact}/>,airQuality:(weather,compact)=><AirQualityCard weather={weather} compact={compact}/>,sensor:(weather,compact)=><SensorCard weather={weather} compact={compact}/>,
}

export function WeatherScreen({weather,generatedAt,generatedAtLocal,renderBlock,addSlot}:WeatherScreenProps) {
	const locale = weather.labels.wind === 'ВЕТЕР' ? 'ru-RU' : 'en-GB'
	const localTimestamp=generatedAtLocal ? new Date(`${generatedAtLocal}Z`) : (generatedAt ?? new Date())
	const displayTimezone=generatedAtLocal ? 'UTC' : weather.timezone
	const date = new Intl.DateTimeFormat(locale,{timeZone:displayTimezone,weekday:'short',day:'2-digit',month:'short'}).format(localTimestamp).toUpperCase()
	const time = new Intl.DateTimeFormat('en-GB',{timeZone:displayTimezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(localTimestamp)
	const rows=packBlockRows(weather.layout).map(row=>({...row}))
	if(addSlot&&rows.length<2&&rows.at(-1)?.used===4)rows.push({blocks:[],used:0})
	const hasSecondRow=rows.length>1
	const renderCard=(id:BlockId)=>{const span=getCardSpan(weather.layout,id);const content=cardRenderers[id](weather,hasSecondRow,span);return <div key={id} style={{display:'flex',flexGrow:span,flexShrink:1,flexBasis:0,minWidth:0}}>{renderBlock?renderBlock(id,content):content}</div>}
	return <div style={{width:800,height:480,display:'flex',flexDirection:'column',background:'#fff',color:'#000',fontFamily:'Arial, sans-serif',border:'8px solid #000',boxSizing:'border-box'}}>
		<header style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 22px',background:'#000',color:'#fff'}}>
			<div style={{display:'flex',alignItems:'baseline',gap:14}}><div style={{...text(25,900),letterSpacing:.7}}>{weather.city}</div><div style={{...text(10),letterSpacing:1.5}}>{weather.coordinates}</div></div>
			<div style={{display:'flex',alignItems:'center',gap:16}}><div style={{...text(12,800),letterSpacing:1}}>{date}</div><div style={text(24,900)}>{time}</div></div>
		</header>
		<div style={{display:'flex',flex:1,minHeight:0,flexDirection:'column',padding:14,gap:10}}>{rows.map((row,rowIndex)=>{const remaining=4-row.used;return <div key={rowIndex} style={{display:'flex',flex:1,minHeight:0,gap:10}}>{row.blocks.map(renderCard)}{rowIndex===rows.length-1&&addSlot&&remaining>0?<div style={{display:'flex',flex:remaining,minWidth:0}}>{addSlot}</div>:remaining>0?<div style={{display:'flex',flex:remaining}}/>:null}</div>})}</div>
	</div>
}
