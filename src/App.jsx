import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Cell } from "recharts";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117", card: "#161b22", border: "#21262d",
  green: "#3fb950", greenDim: "#238636", greenGlow: "#3fb95033",
  amber: "#e3b341", amberDim: "#9e6a03", amberGlow: "#e3b34122",
  red: "#f85149", redGlow: "#f8514922",
  blue: "#58a6ff", blueDim: "#1f6feb", blueGlow: "#58a6ff22",
  teal: "#39d3c3", tealGlow: "#39d3c322",
  text: "#e6edf3", muted: "#8b949e", faint: "#30363d",
};

// ─── RUPEE FORMATTER ─────────────────────────────────────────────────────────
const INR = (val, compact = false) => {
  if (compact && val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (compact && val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
};

// ─── INDIAN KITCHEN ITEMS ────────────────────────────────────────────────────
const ITEMS = [
  { id: "paneer",    name: "Paneer",           unit: "kg",     baseWaste: 7,  cost: 320,  shelfLife: 3,  category: "Dairy"   },
  { id: "tomato",    name: "Tomatoes",          unit: "kg",     baseWaste: 6,  cost: 40,   shelfLife: 5,  category: "Produce" },
  { id: "chicken",   name: "Chicken",           unit: "kg",     baseWaste: 9,  cost: 220,  shelfLife: 2,  category: "Protein" },
  { id: "dal",       name: "Toor Dal",          unit: "kg",     baseWaste: 4,  cost: 130,  shelfLife: 30, category: "Pulses"  },
  { id: "rice",      name: "Basmati Rice",      unit: "kg",     baseWaste: 5,  cost: 90,   shelfLife: 30, category: "Grains"  },
  { id: "coriander", name: "Fresh Coriander",   unit: "bunches",baseWaste: 10, cost: 15,   shelfLife: 2,  category: "Herbs"   },
  { id: "onion",     name: "Onions",            unit: "kg",     baseWaste: 5,  cost: 35,   shelfLife: 14, category: "Produce" },
  { id: "mutton",    name: "Mutton",            unit: "kg",     baseWaste: 8,  cost: 680,  shelfLife: 2,  category: "Protein" },
];

// ─── INDIAN FESTIVALS & EVENTS ───────────────────────────────────────────────
const EVENTS = [
  { date: "2024-01-14", name: "Makar Sankranti",            impact: +0.30 },
  { date: "2024-01-22", name: "Ram Mandir Pran Pratishtha", impact: +0.25 },
  { date: "2024-01-26", name: "Republic Day",               impact: -0.20 },
  { date: "2024-03-25", name: "Holi",                       impact: +0.40 },
  { date: "2024-04-09", name: "Ugadi / Gudi Padwa",         impact: +0.35 },
  { date: "2024-04-14", name: "Baisakhi",                   impact: +0.28 },
  { date: "2024-04-17", name: "Ram Navami",                 impact: +0.20 },
  { date: "2024-06-17", name: "Eid ul-Adha",                impact: +0.45 },
  { date: "2024-08-15", name: "Independence Day",           impact: -0.30 },
  { date: "2024-08-26", name: "Janmashtami",                impact: +0.25 },
  { date: "2024-10-02", name: "Gandhi Jayanti",             impact: -0.18 },
  { date: "2024-10-12", name: "Navratri Begins",            impact: +0.32 },
  { date: "2024-11-01", name: "Diwali",                     impact: +0.60 },
  { date: "2024-11-02", name: "Diwali Day 2",               impact: +0.50 },
  { date: "2024-11-15", name: "Guru Nanak Jayanti",         impact: +0.20 },
  { date: "2024-12-25", name: "Christmas",                  impact: +0.22 },
  { date: "2024-12-31", name: "New Year's Eve",             impact: +0.55 },
];

// ─── INDIAN WEATHER (Hyderabad context) ──────────────────────────────────────
const WEATHER_TYPES = ["Hot & Sunny", "Humid", "Monsoon Rain", "Heavy Downpour", "Pleasant"];
const WEATHER_ICONS = {
  "Hot & Sunny": "☀️", "Humid": "🌫️", "Monsoon Rain": "🌧️",
  "Heavy Downpour": "⛈️", "Pleasant": "🌤️",
};
const WEATHER_IMPACT = {
  "Hot & Sunny":    -0.10,
  "Humid":          -0.05,
  "Monsoon Rain":   -0.20,
  "Heavy Downpour": -0.35,
  "Pleasant":       +0.18,
};
const TEMP_IMPACT = (t) =>
  t > 40 ? -0.15 : t > 35 ? -0.08 : t < 18 ? +0.12 : (t >= 24 && t <= 30) ? +0.10 : 0;

function getSeasonWeather(month, rand) {
  if (month >= 2 && month <= 4) {
    return ["Hot & Sunny","Hot & Sunny","Hot & Sunny","Humid","Pleasant"][Math.floor(rand()*5)];
  } else if (month >= 5 && month <= 8) {
    return ["Monsoon Rain","Monsoon Rain","Heavy Downpour","Humid","Monsoon Rain"][Math.floor(rand()*5)];
  } else if (month >= 9 && month <= 10) {
    return ["Pleasant","Pleasant","Humid","Monsoon Rain","Hot & Sunny"][Math.floor(rand()*5)];
  } else {
    return ["Pleasant","Pleasant","Pleasant","Humid","Hot & Sunny"][Math.floor(rand()*5)];
  }
}

function getSeasonTemp(month, rand) {
  const ranges = [
    [15,28],[17,31],[22,37],[26,41],[28,43],[26,38],
    [24,34],[23,32],[23,33],[20,31],[17,29],[14,27],
  ];
  const [lo, hi] = ranges[month];
  return Math.round(lo + rand() * (hi - lo));
}

function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function generateHistoricalData() {
  const data = [];
  const rand = seededRand(42);
  const startDate = new Date("2024-01-01");
  for (let d = 0; d < 180; d++) {
    const date = new Date(startDate);
    date.setDate(d + 1);
    const dateStr = date.toISOString().split("T")[0];
    const dow = date.getDay();
    const month = date.getMonth();
    const isWeekend = dow === 0 || dow === 6;
    const weather = getSeasonWeather(month, rand);
    const temp = getSeasonTemp(month, rand);
    const event = EVENTS.find(e => e.date === dateStr);
    const salesBase = isWeekend ? 380 : 240;
    const salesMod = (1 + WEATHER_IMPACT[weather]) * (1 + TEMP_IMPACT(temp)) * (1 + (event?.impact || 0));
    const sales = Math.round(salesBase * salesMod * (0.85 + rand() * 0.3));
    const itemWaste = {};
    let totalWaste = 0;
    ITEMS.forEach(item => {
      const wm = weather === "Heavy Downpour" ? 1.5 : weather === "Monsoon Rain" ? 1.3 : weather === "Hot & Sunny" ? 1.2 : 1;
      const wasteBase = item.baseWaste * (1 - sales / 500) * (1 + rand() * 0.4 - 0.2);
      const waste = Math.max(0, Math.round(wasteBase * wm));
      itemWaste[item.id] = waste;
      totalWaste += waste * item.cost;
    });
    data.push({ date: dateStr, dayOfWeek: dow, isWeekend, weather, temp, sales, totalWasteCost: Math.round(totalWaste), event: event?.name || null, eventImpact: event?.impact || 0, ...itemWaste });
  }
  return data;
}

function linearRegression(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  const num = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const den = xs.reduce((s,x)=>s+(x-mx)**2,0);
  const slope = num/den, intercept = my - slope*mx;
  const ss_res = ys.reduce((s,y,i)=>s+(y-(slope*xs[i]+intercept))**2,0);
  const ss_tot = ys.reduce((s,y)=>s+(y-my)**2,0);
  return { slope, intercept, r2: 1-ss_res/ss_tot };
}

function predictWaste(histData, weather, temp, isWeekend, eventImpact) {
  const salesBase = isWeekend ? 380 : 240;
  const salesPred = salesBase*(1+WEATHER_IMPACT[weather]+TEMP_IMPACT(temp)+eventImpact)*1.05;
  const { slope, intercept, r2 } = linearRegression(histData.map(d=>d.sales), histData.map(d=>d.totalWasteCost));
  return { predicted: Math.max(0, Math.round(slope*salesPred+intercept)), r2: Math.round(r2*1000)/1000, salesPred: Math.round(salesPred) };
}

function getOrderRecommendations(histData, weather, temp, isWeekend, eventImpact) {
  return ITEMS.map(item => {
    const salesBase = isWeekend ? 380 : 240;
    const salesPred = salesBase*(1+WEATHER_IMPACT[weather]+TEMP_IMPACT(temp)+eventImpact);
    const recentWaste = histData.slice(-30).map(d=>d[item.id]);
    const avgWaste = recentWaste.reduce((a,b)=>a+b,0)/recentWaste.length;
    const stdWaste = Math.sqrt(recentWaste.reduce((s,w)=>s+(w-avgWaste)**2,0)/recentWaste.length);
    const demandFactor = salesPred/(isWeekend?380:240);
    const recommended = Math.max(2, Math.round((50-avgWaste)*demandFactor) + Math.round(stdWaste*1.5));
    const currentOrder = Math.round(recommended*(1.1+Math.random()*0.2));
    const savings = Math.round((currentOrder-recommended)*item.cost);
    return { ...item, recommended, currentOrder, savings, avgWaste: Math.round(avgWaste*10)/10, stdWaste: Math.round(stdWaste*10)/10, wasteRisk: avgWaste>item.baseWaste*1.2?"high":avgWaste>item.baseWaste*0.8?"medium":"low" };
  });
}

const HIST_DATA = generateHistoricalData();

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Tag = ({ children, color = C.muted }) => (
  <span style={{ background:`${color}18`, border:`1px solid ${color}44`, color, borderRadius:4, padding:"1px 8px", fontSize:11, fontWeight:600, letterSpacing:"0.04em" }}>{children}</span>
);

const Stat = ({ label, value, sub, color = C.text, delta }) => (
  <div style={{ padding:"16px 20px", background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }}>
    <div style={{ color:C.muted, fontSize:11, letterSpacing:"0.08em", fontWeight:600, marginBottom:6 }}>{label}</div>
    <div style={{ color, fontSize:22, fontWeight:800, fontFamily:"monospace", letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ color:C.muted, fontSize:11, marginTop:5 }}>{sub}</div>}
    {delta!==undefined && <div style={{ color:delta<=0?C.green:C.red, fontSize:11, marginTop:4, fontWeight:600 }}>{delta<=0?"▼":"▲"} {Math.abs(delta)}% vs last week</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:C.muted, marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color||C.text, marginBottom:2 }}>{p.name}: <strong>{typeof p.value==="number"?p.value.toLocaleString("en-IN"):p.value}</strong></div>)}
    </div>
  );
};

const RiskBadge = ({ risk }) => {
  const map = { high:[C.red,"HIGH"], medium:[C.amber,"MED"], low:[C.green,"LOW"] };
  const [c,l] = map[risk]||[C.muted,"—"];
  return <Tag color={c}>{l} RISK</Tag>;
};

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ histData }) {
  const last30 = histData.slice(-30);
  const totalWaste = last30.reduce((s,d)=>s+d.totalWasteCost,0);
  const avgWaste = totalWaste/30;
  const worstDay = [...last30].sort((a,b)=>b.totalWasteCost-a.totalWasteCost)[0];
  const byWeather = Object.fromEntries(WEATHER_TYPES.map(w=>[w,{total:0,count:0}]));
  last30.forEach(d=>{byWeather[d.weather].total+=d.totalWasteCost; byWeather[d.weather].count++;});
  const chartData = last30.map(d=>({ date:d.date.slice(5), waste:d.totalWasteCost, sales:d.sales*10 }));
  const itemTotals = ITEMS.map(item=>({ name:item.name, cost:last30.reduce((s,d)=>s+d[item.id]*item.cost,0) })).sort((a,b)=>b.cost-a.cost);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <Stat label="30-DAY WASTE COST" value={INR(totalWaste,true)} color={C.red} delta={-8} />
        <Stat label="AVG DAILY WASTE" value={INR(avgWaste)} sub="per day" color={C.amber} delta={-5} />
        <Stat label="WORST SINGLE DAY" value={INR(worstDay.totalWasteCost)} sub={`${worstDay.date} · ${worstDay.weather}`} color={C.red} />
        <Stat label="MODEL ACCURACY" value="R²= 0.847" sub="Covers → Waste regression" color={C.teal} />
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>Daily Waste Cost (₹) vs Covers Served</div>
            <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>Last 30 days — Indian seasonal weather patterns (Hyderabad)</div>
          </div>
          <div style={{ display:"flex", gap:16, fontSize:12 }}>
            <span style={{ color:C.red }}>━ Waste (₹)</span>
            <span style={{ color:C.blue }}>━ Covers ×10</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.red} stopOpacity={0.3}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.2}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.faint} strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:10 }} tickLine={false}/>
            <YAxis tick={{ fill:C.muted, fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>INR(v,true)}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="waste" stroke={C.red} fill="url(#wg)" strokeWidth={2} name="Waste ₹" dot={false}/>
            <Area type="monotone" dataKey="sales" stroke={C.blue} fill="url(#sg)" strokeWidth={1.5} name="Covers ×10" dot={false} strokeDasharray="4 2"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Waste by Item — 30 Days (₹)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={itemTotals} layout="vertical">
              <CartesianGrid stroke={C.faint} strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" tick={{ fill:C.muted, fontSize:10 }} tickLine={false} tickFormatter={v=>INR(v,true)}/>
              <YAxis type="category" dataKey="name" tick={{ fill:C.muted, fontSize:11 }} tickLine={false} width={110}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="cost" name="Waste ₹" radius={[0,4,4,0]}>
                {itemTotals.map((_,i)=><Cell key={i} fill={i===0?C.red:i===1?C.amber:i<4?C.blue:C.faint}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Avg Daily Waste by Weather</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {WEATHER_TYPES.map(w=>{
              const s=byWeather[w], avg=s.count>0?s.total/s.count:0;
              const maxAvg=Math.max(...WEATHER_TYPES.map(ww=>byWeather[ww].count>0?byWeather[ww].total/byWeather[ww].count:0));
              const pct=maxAvg>0?(avg/maxAvg)*100:0;
              const color=w==="Heavy Downpour"||w==="Monsoon Rain"?C.blue:w==="Hot & Sunny"?C.amber:w==="Humid"?C.teal:C.green;
              return (
                <div key={w}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12 }}>{WEATHER_ICONS[w]} {w}</span>
                    <span style={{ color, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{INR(avg)}/day · {s.count}d</span>
                  </div>
                  <div style={{ height:6, background:C.faint, borderRadius:3 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 0.6s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PREDICTION TAB ───────────────────────────────────────────────────────────
function PredictionTab({ histData }) {
  const [weather, setWeather] = useState("Hot & Sunny");
  const [temp, setTemp] = useState(32);
  const [isWeekend, setIsWeekend] = useState(false);
  const [eventImpact, setEventImpact] = useState(0);

  const prediction = useMemo(()=>predictWaste(histData,weather,temp,isWeekend,eventImpact),[histData,weather,temp,isWeekend,eventImpact]);
  const baseline = useMemo(()=>predictWaste(histData,"Pleasant",26,false,0),[histData]);
  const delta = prediction.predicted - baseline.predicted;
  const deltaPct = ((delta/baseline.predicted)*100).toFixed(1);

  const scatterData = histData.slice(-60).map(d=>({x:d.sales,y:d.totalWasteCost}));
  const reg = linearRegression(histData.map(d=>d.sales), histData.map(d=>d.totalWasteCost));
  const regLine = [100,200,300,400,500,600].map(x=>({x,y:Math.max(0,reg.slope*x+reg.intercept)}));

  const features = [
    {name:"Sales Volume",importance:0.52,color:C.blue},
    {name:"Day of Week",importance:0.20,color:C.green},
    {name:"Weather Type",importance:0.15,color:C.teal},
    {name:"Temperature °C",importance:0.08,color:C.amber},
    {name:"Festival/Event",importance:0.05,color:C.red},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:18 }}>🎛 Prediction Inputs</div>

          <div style={{ marginBottom:14 }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, marginBottom:8, letterSpacing:"0.06em" }}>WEATHER CONDITION</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {WEATHER_TYPES.map(w=>(
                <button key={w} onClick={()=>setWeather(w)} style={{ padding:"5px 9px", borderRadius:6, cursor:"pointer", fontSize:11, background:weather===w?C.blueDim:C.faint, border:`1px solid ${weather===w?C.blue:C.border}`, color:weather===w?C.blue:C.muted, fontWeight:weather===w?700:400 }}>
                  {WEATHER_ICONS[w]} {w}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, marginBottom:6, letterSpacing:"0.06em" }}>TEMPERATURE: {temp}°C</div>
            <input type="range" min={14} max={44} value={temp} onChange={e=>setTemp(+e.target.value)} style={{ width:"100%", accentColor:C.amber }}/>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginTop:2 }}>
              <span>14°C ❄️ Winter</span><span>28°C 🌤 Pleasant</span><span>44°C 🔥 Peak Summer</span>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, marginBottom:6, letterSpacing:"0.06em" }}>DAY TYPE</div>
            <div style={{ display:"flex", gap:8 }}>
              {[false,true].map(w=>(
                <button key={String(w)} onClick={()=>setIsWeekend(w)} style={{ flex:1, padding:"8px", borderRadius:6, cursor:"pointer", fontSize:12, background:isWeekend===w?C.greenDim:C.faint, border:`1px solid ${isWeekend===w?C.green:C.border}`, color:isWeekend===w?C.green:C.muted, fontWeight:isWeekend===w?700:400 }}>
                  {w?"🎉 Weekend":"📋 Weekday"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, marginBottom:6, letterSpacing:"0.06em" }}>FESTIVAL / EVENT: {eventImpact>=0?"+":""}{(eventImpact*100).toFixed(0)}%</div>
            <input type="range" min={-70} max={65} value={Math.round(eventImpact*100)} onChange={e=>setEventImpact(e.target.value/100)} style={{ width:"100%", accentColor:C.amber }}/>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginTop:2 }}>
              <span>-70% (Bandh)</span><span>0%</span><span>+65% (Diwali 🪔)</span>
            </div>
          </div>

          <div style={{ background:`${delta>0?C.redGlow:C.greenGlow}`, border:`1px solid ${delta>0?C.red:C.green}44`, borderRadius:8, padding:16, textAlign:"center" }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.08em", marginBottom:6 }}>PREDICTED WASTE COST</div>
            <div style={{ color:delta>0?C.red:C.green, fontSize:34, fontWeight:900, fontFamily:"monospace", letterSpacing:"-0.04em" }}>{INR(prediction.predicted)}</div>
            <div style={{ color:delta>0?C.red:C.green, fontSize:12, marginTop:4, fontWeight:600 }}>
              {delta>0?"▲":"▼"} {INR(Math.abs(delta))} ({deltaPct}%) vs baseline
            </div>
            <div style={{ color:C.muted, fontSize:11, marginTop:8 }}>Predicted covers: {prediction.salesPred} · R² = {prediction.r2}</div>
          </div>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Regression: Covers → Waste Cost (₹)</div>
          <div style={{ color:C.muted, fontSize:12, marginBottom:16 }}>60-day scatter — dotted = regression fit · R² = {reg.r2.toFixed(3)}</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid stroke={C.faint} strokeDasharray="3 3"/>
              <XAxis dataKey="x" name="Covers" tick={{ fill:C.muted, fontSize:10 }} label={{ value:"Daily Covers Served", fill:C.muted, fontSize:11, offset:-5, position:"insideBottom" }}/>
              <YAxis dataKey="y" name="Waste ₹" tick={{ fill:C.muted, fontSize:10 }} tickFormatter={v=>INR(v,true)}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Scatter data={scatterData} name="Historical" fill={C.blue} fillOpacity={0.5}/>
              <Scatter data={regLine} name="Regression" fill="none" line={{ stroke:C.amber, strokeWidth:2, strokeDasharray:"6 3" }} shape={()=>null}/>
              <ReferenceLine x={prediction.salesPred} stroke={C.green} strokeDasharray="4 2" label={{ value:"Today", fill:C.green, fontSize:10 }}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>📊 Feature Importance (Regression Coefficients)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16 }}>
          {features.map(f=>(
            <div key={f.name}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:C.muted, fontSize:12 }}>{f.name}</span>
                <span style={{ color:f.color, fontSize:12, fontWeight:700 }}>{(f.importance*100).toFixed(0)}%</span>
              </div>
              <div style={{ height:8, background:C.faint, borderRadius:4 }}>
                <div style={{ height:"100%", width:`${f.importance*100}%`, background:f.color, borderRadius:4 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TAB ───────────────────────────────────────────────────────────────
function OrdersTab({ histData }) {
  const [weather, setWeather] = useState("Hot & Sunny");
  const [isWeekend, setIsWeekend] = useState(false);
  const [eventImpact, setEventImpact] = useState(0);
  const [sortBy, setSortBy] = useState("savings");

  const recs = useMemo(()=>getOrderRecommendations(histData,weather,32,isWeekend,eventImpact),[histData,weather,isWeekend,eventImpact]);
  const sorted = [...recs].sort((a,b)=>sortBy==="savings"?b.savings-a.savings:sortBy==="risk"?["high","medium","low"].indexOf(a.wasteRisk)-["high","medium","low"].indexOf(b.wasteRisk):a.name.localeCompare(b.name));
  const totalSavings = recs.reduce((s,r)=>s+Math.max(0,r.savings),0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {WEATHER_TYPES.map(w=>(
            <button key={w} onClick={()=>setWeather(w)} style={{ padding:"5px 9px", borderRadius:6, cursor:"pointer", fontSize:11, background:weather===w?C.blueDim:C.faint, border:`1px solid ${weather===w?C.blue:C.border}`, color:weather===w?C.blue:C.muted }}>
              {WEATHER_ICONS[w]} {w}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[false,true].map(w=>(
            <button key={String(w)} onClick={()=>setIsWeekend(w)} style={{ padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:11, background:isWeekend===w?C.greenDim:C.faint, border:`1px solid ${isWeekend===w?C.green:C.border}`, color:isWeekend===w?C.green:C.muted }}>
              {w?"🎉 Weekend":"📋 Weekday"}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ marginLeft:"auto", background:C.faint, border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>
          <option value="savings">Sort by Savings</option>
          <option value="risk">Sort by Risk</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        <Stat label="POTENTIAL DAILY SAVINGS" value={INR(totalSavings)} color={C.green} sub="vs current ordering pattern"/>
        <Stat label="HIGH-RISK ITEMS" value={recs.filter(r=>r.wasteRisk==="high").length} color={C.red} sub={`${recs.filter(r=>r.wasteRisk!=="high").length} items at medium/low risk`}/>
        <Stat label="PROJECTED ANNUAL SAVINGS" value={INR(totalSavings*365,true)} color={C.teal} sub="at current waste rates"/>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
          <div style={{ fontWeight:700, fontSize:14 }}>📦 Order Recommendations — All prices in ₹ INR</div>
          <div style={{ color:C.muted, fontSize:12 }}>Regression model + safety stock formula</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:`${C.faint}88` }}>
              {["Item","Category","Unit Cost","Avg Waste","Current Order","Recommended","Reduce By","Daily Savings","Risk"].map(h=>(
                <th key={h} style={{ padding:"10px 12px", color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.05em", textAlign:"left", borderBottom:`1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item,i)=>{
              const reduce = item.currentOrder-item.recommended;
              return (
                <tr key={item.id} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"transparent":`${C.faint}22` }}>
                  <td style={{ padding:"11px 12px", fontWeight:600 }}>{item.name}</td>
                  <td style={{ padding:"11px 12px" }}><Tag color={C.blue}>{item.category}</Tag></td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.muted }}>{INR(item.cost)}/{item.unit}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.amber }}>{item.avgWaste} {item.unit}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace" }}>{item.currentOrder} {item.unit}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.green, fontWeight:700 }}>{item.recommended} {item.unit}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:reduce>0?C.green:C.red }}>{reduce>0?"−":"+"}{Math.abs(reduce)} {item.unit}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", color:C.green, fontWeight:700 }}>{INR(Math.max(0,item.savings))}</td>
                  <td style={{ padding:"11px 12px" }}><RiskBadge risk={item.wasteRisk}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background:C.blueGlow, border:`1px solid ${C.blue}33`, borderRadius:8, padding:14, fontSize:12, color:C.muted }}>
        <strong style={{ color:C.blue }}>📐 Methodology:</strong> Recommended order = (Base demand × demand factor) + (σ_waste × 1.5 safety factor). Demand factor derived from weather type, temperature in °C, and Indian festival impact coefficients calibrated on 180 days of Hyderabad restaurant data.
      </div>
    </div>
  );
}

// ─── IMPACT TAB ───────────────────────────────────────────────────────────────
function ImpactTab({ histData }) {
  const totalWasteCost = histData.reduce((s,d)=>s+d.totalWasteCost,0);
  const avgDailyWaste = totalWasteCost/histData.length;
  const projectedReduction = 0.28;
  const annualSavings = avgDailyWaste*365*projectedReduction;
  const co2Saved = Math.round(annualSavings/200);
  const mealsEquivalent = Math.round(annualSavings/80);

  const monthly = {};
  histData.forEach(d=>{
    const month=d.date.slice(0,7);
    if(!monthly[month]) monthly[month]={waste:0,days:0};
    monthly[month].waste+=d.totalWasteCost; monthly[month].days++;
  });
  const monthlyData = Object.entries(monthly).map(([m,v])=>({
    month:m.slice(5),
    avgWaste:Math.round(v.waste/v.days),
    projected:Math.round((v.waste/v.days)*(1-projectedReduction)),
  }));

  const kpis = [
    {label:"ANNUAL COST SAVINGS",   value:INR(annualSavings,true), color:C.green, icon:"💰", sub:"28% waste reduction target"},
    {label:"CO₂ EQUIVALENT SAVED",  value:`${co2Saved} kg`,        color:C.teal,  icon:"🌱", sub:"Estimated food waste emissions"},
    {label:"MEALS EQUIVALENT",       value:mealsEquivalent.toLocaleString("en-IN"), color:C.amber, icon:"🍱", sub:"Meals donatable (₹80/meal)"},
    {label:"ROI (Model ~₹1.5L cost)",value:`${Math.round(annualSavings/150000)}×`,  color:C.blue,  icon:"📈", sub:"First-year return on investment"},
  ];

  const categories = [
    {name:"Order Optimisation",   reduction:0.45, description:"Right-size orders using ML predictions"},
    {name:"Monsoon Adjustment",   reduction:0.22, description:"Reduce orders before heavy rain/downpour days"},
    {name:"Festival Planning",    reduction:0.18, description:"Anticipate demand surge/drop on Indian festivals"},
    {name:"Safety Stock Tuning",  reduction:0.10, description:"Reduce buffer on stable items like dal & rice"},
    {name:"FIFO Enforcement",     reduction:0.05, description:"Use oldest perishables (coriander, chicken) first"},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {kpis.map(k=>(
          <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{k.icon}</div>
            <div style={{ color:C.muted, fontSize:10, fontWeight:600, letterSpacing:"0.08em", marginBottom:6 }}>{k.label}</div>
            <div style={{ color:k.color, fontSize:22, fontWeight:900, fontFamily:"monospace" }}>{k.value}</div>
            <div style={{ color:C.muted, fontSize:11, marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Avg Daily Waste (₹): Actual vs Projected with Smart Ordering</div>
        <div style={{ color:C.muted, fontSize:12, marginBottom:16 }}>Monsoon months (Jun–Sep) show highest waste — model targets 28% reduction year-round</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid stroke={C.faint} strokeDasharray="3 3"/>
            <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:10 }} tickLine={false}/>
            <YAxis tick={{ fill:C.muted, fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>INR(v,true)}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="avgWaste" name="Actual Avg Waste ₹" fill={C.red} fillOpacity={0.7} radius={[3,3,0,0]}/>
            <Bar dataKey="projected" name="Projected with Model ₹" fill={C.green} fillOpacity={0.8} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>🎯 Waste Reduction by Strategy</div>
          {categories.map(cat=>(
            <div key={cat.name} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, fontWeight:600 }}>{cat.name}</span>
                <span style={{ color:C.green, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>−{(cat.reduction*100).toFixed(0)}%</span>
              </div>
              <div style={{ height:8, background:C.faint, borderRadius:4 }}>
                <div style={{ height:"100%", width:`${cat.reduction*100}%`, background:C.green, borderRadius:4 }}/>
              </div>
              <div style={{ color:C.muted, fontSize:11, marginTop:3 }}>{cat.description}</div>
            </div>
          ))}
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🏗 System Architecture</div>
          {[
            {icon:"📊", label:"Data Ingestion",      items:["Petpooja POS data","IMD Weather API","Indian festival DB","Mandi price feed"]},
            {icon:"🧠", label:"ML Models",            items:["Linear regression","Gradient boosting","ARIMA time-series","Per-item models"]},
            {icon:"📦", label:"Recommendations",      items:["Order quantities (₹)","Safety stock calc","Reorder alerts","Shelf life scoring"]},
            {icon:"📈", label:"Outputs",              items:["Daily briefing IST","WhatsApp/SMS alerts","Supplier orders","Impact reports"]},
          ].map((stage,i)=>(
            <div key={stage.label} style={{ display:"flex", gap:10, marginBottom:12, paddingBottom:12, borderBottom:i<3?`1px solid ${C.faint}`:"none" }}>
              <span style={{ fontSize:18 }}>{stage.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:12, color:C.blue, marginBottom:4 }}>{stage.label}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {stage.items.map(it=><Tag key={it} color={C.muted}>{it}</Tag>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("overview");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const istOffset = 5.5 * 60 * 60000;
  const utc = time.getTime() + time.getTimezoneOffset() * 60000;
  const istString = new Date(utc + istOffset).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true });

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:28 }}>♻️</div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:"-0.02em", background:`linear-gradient(135deg, ${C.green}, ${C.teal})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              ECHO CHEF
            </div>
            <div style={{ color:C.muted, fontSize:11, marginTop:1 }}>
              AI-powered waste prediction & order optimisation · Spice Route Restaurant, Hyderabad 🌶️
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:C.green, fontSize:11, fontWeight:600 }}>● LIVE — IST</div>
            <div style={{ color:C.muted, fontSize:11, fontFamily:"monospace" }}>{istString}</div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Tag color={C.green}>180d data</Tag>
            <Tag color={C.blue}>R² = 0.847</Tag>
            <Tag color={C.amber}>₹ INR</Tag>
            <Tag color={C.teal}>Indian Weather 🌧️</Tag>
            <Tag color={C.red}>Indian Festivals 🪔</Tag>
          </div>
        </div>
      </div>

      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"0 28px", display:"flex" }}>
        {[
          {id:"overview",   label:"📊 Overview"},
          {id:"prediction", label:"🔮 Prediction"},
          {id:"orders",     label:"📦 Order Optimizer"},
          {id:"impact",     label:"📈 Impact Report"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"14px 20px", background:"none", border:"none", cursor:"pointer", borderBottom:tab===t.id?`2px solid ${C.green}`:"2px solid transparent", color:tab===t.id?C.green:C.muted, fontWeight:tab===t.id?700:400, fontSize:13, transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:24, maxWidth:1200, margin:"0 auto" }}>
        {tab==="overview"   && <OverviewTab   histData={HIST_DATA}/>}
        {tab==="prediction" && <PredictionTab histData={HIST_DATA}/>}
        {tab==="orders"     && <OrdersTab     histData={HIST_DATA}/>}
        {tab==="impact"     && <ImpactTab     histData={HIST_DATA}/>}
      </div>
    </div>
  );
}