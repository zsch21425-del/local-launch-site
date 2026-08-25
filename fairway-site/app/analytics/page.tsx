'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const r = await fetch('/api/analytics');
    if (r.status === 401) { setAuthed(false); return; }
    if (r.ok) { setAuthed(true); setData(await r.json()); }
  };
  useEffect(() => { load(); }, []);

  if (authed === false) {
    const login = async () => {
      const r = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) });
      if (r.ok) { setAuthed(true); load(); } else { setErr('Incorrect password'); }
    };
    return (
      <div style={glass}>
        <div style={{width:56,height:56,borderRadius:16,background:'#eef2ff',display:'grid',placeItems:'center',fontSize:28,margin:'0 auto 18px'}}>📊</div>
        <h1 style={{margin:0,fontSize:24,fontWeight:800,color:'#0f172a'}}>Fairway Analytics</h1>
        <p style={{color:'#64748b',margin:'6px 0 24px',fontSize:14}}>Live traffic & dealership performance</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
          style={{width:'100%',padding:13,border:'1px solid #e2e8f0',borderRadius:10,marginBottom:12,fontSize:14}} onKeyDown={e=>{if(e.key==='Enter')login()}}/>
        <button onClick={login} style={{width:'100%',padding:13,background:'#337AB7',color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>View Dashboard</button>
        {err && <p style={{color:'#dc2626',marginTop:10,fontSize:13}}>{err}</p>}
      </div>
    );
  }

  if (!authed || !data) return <div style={{display:'grid',placeItems:'center',minHeight:'60vh'}}><div style={{color:'#64748b'}}>Loading dashboard…</div></div>;

  const pv = data.pageViews ?? 0;
  const clicks = data.clicks || [];
  const daily = data.daily || [];
  const totalClicks = clicks.reduce((a:number,c:any)=>a+(c.n||0),0);
  const last7 = daily.slice(-7);
  const maxDaily = Math.max(1, ...last7.map((d:any)=>d.n||0));

  const barColors = ['#337AB7','#2a6698','#1f4e79','#4a90c2','#63a5d4','#5b6b7c'];

  return (
    <div style={{minHeight:'100vh',background:'#f1f5f9',fontFamily:'system-ui',color:'#0f172a'}}>
      {/* top nav */}
      <header style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:'#337AB7',display:'grid',placeItems:'center',color:'#fff',fontWeight:800}}>F</div>
          <div>
            <div style={{fontWeight:800,letterSpacing:'.06em',color:'#0f172a'}}>Fairway Analytics</div>
            <div style={{fontSize:11,color:'#94a3b8'}}>Marketing dashboard</div>
          </div>
        </div>
        <div style={{display:'flex',gap:20}}>
          <a href="/" style={{color:'#337AB7',fontSize:13,fontWeight:600,textDecoration:'none'}}>View Site</a>
          <span style={{fontSize:13,color:'#94a3b8'}}>Updated just now</span>
        </div>
      </header>

      <div style={{maxWidth:1080,margin:'0 auto',padding:'30px 24px'}}>
        {/* KPI row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {[
            {label:'Total Page Views', value:pv, icon:'👁', up: last7.length>0 },
            {label:'Dealership Clicks', value:totalClicks, icon:'🎯', up: totalClicks>0 },
            {label:'Tracking Days', value:daily.length, icon:'📈', up:true},
            {label:'Avg / Day', value:daily.length?Math.round((pv/daily.length)*10)/10:0, icon:'🔄', up:true},
          ].map(k=>(
            <div key={k.label} style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:20,boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
              <div style={{fontSize:20,marginBottom:8}}>{k.icon}</div>
              <div style={{fontSize:30,fontWeight:800,color:'#0f172a',lineHeight:1}}>{k.value}</div>
              <div style={{color:'#64748b',fontSize:13,marginTop:6}}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:16}}>
          {/* Dealership clicks bar chart */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:22}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{fontSize:16,fontWeight:700,margin:0}}>Clicks to Each Dealership</h2>
              <span style={{fontSize:11,color:'#94a3b8'}}>{clicks.length} dealerships</span>
            </div>
            {clicks.length===0 ? (
              <div style={{textAlign:'center',color:'#94a3b8',padding:'40px 0',fontSize:14}}>
                <div style={{fontSize:32,marginBottom:8}}>🎯</div>
                No dealership clicks yet — save a link and revisit.
              </div>
            ) : (
              <div style={{height:260}}>
                <Bar data={{
                  labels: clicks.map((c:any)=>cap(c.slug)),
                  datasets:[{ label:'Clicks', data:clicks.map((c:any)=>c.n), backgroundColor:barColors.slice(0,clicks.length), borderRadius:6, maxBarThickness:48 }],
                }} options={{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,grid:{color:'#f1f5f9'}},x:{grid:{display:false}}} }} />
              </div>
            )}
          </div>

          {/* Doughnut: share of clicks */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:22}}>
            <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 12px'}}>Share of Traffic</h2>
            {totalClicks===0 ? (
              <div style={{textAlign:'center',color:'#94a3b8',padding:'44px 0',fontSize:14}}>
                <div style={{fontSize:32,marginBottom:8}}>📊</div>
                Waiting for first clicks.
              </div>
            ) : (
              <div style={{height:200,display:'grid',placeItems:'center'}}>
                <Doughnut data={{
                  labels: clicks.map((c:any)=>cap(c.slug)),
                  datasets:[{ data:clicks.map((c:any)=>c.n), backgroundColor:barColors, borderWidth:0 }],
                }} options={{plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}}}}} />
              </div>
            )}
            <div style={{textAlign:'center',marginTop:6,fontSize:13,color:'#64748b'}}>Total clicks: <b>{totalClicks}</b></div>
          </div>
        </div>

        {/* Daily views line chart */}
        <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:22,marginTop:16}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:'0 0 16px'}}>Views by Day</h2>
          {last7.length===0 ? (
            <div style={{textAlign:'center',color:'#94a3b8',padding:'40px 0',fontSize:14}}>
              <div style={{fontSize:32,marginBottom:8}}>📈</div>
              No daily traffic yet — the tracker is live, visits will appear here.
            </div>
          ) : (
            <div style={{height:200}}>
              <Line data={{
                labels: last7.map((d:any)=>fmtDay(d.d)),
                datasets:[{ label:'Views', data:last7.map((d:any)=>d.n), borderColor:'#337AB7', backgroundColor:'rgba(51,122,183,.12)', fill:true, tension:.35, pointRadius:4, pointBackgroundColor:'#337AB7' }],
              }} options={{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,grid:{color:'#f1f5f9'}},x:{grid:{display:false}}}}} />
            </div>
          )}
        </div>

        <p style={{color:'#94a3b8',fontSize:12,marginTop:20,textAlign:'center'}}>©2026 Fairway · Performance dashboard · Powered by Local Launch</p>
      </div>
    </div>
  );
}

const glass: React.CSSProperties = { maxWidth:380, margin:'12vh auto', textAlign:'center', fontFamily:'system-ui', background:'#fff', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,.08)', padding:36, border:'1px solid #e2e8f0' };
function cap(s: string){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
function fmtDay(d: string){ const [y,m,dd]=d.split('-'); return `${+m}/${+dd}`; }
