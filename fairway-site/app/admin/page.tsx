'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [c, setC] = useState<any>(null);
  const [assets, setAssets] = useState<string[]>([]);
  const [saveMsg, setSaveMsg] = useState('');

  const [hero, setHero] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [about, setAbout] = useState<string[]>([]);

  const loadContent = async () => {
    const r = await fetch('/api/content');
    if (r.status === 401) { setAuthed(false); return; }
    if (r.ok) {
      const data = await r.json();
      setC(data);
      setHero(data.hero || {});
      setLocations(data.locations || []);
      setAbout(data.about || []);
      setAuthed(true);
    }
  };

  useEffect(() => {
    if (authed === true) {
      // load asset image list for the picker
      fetch('/api/assets').then(r=>r.json()).then(d=>setAssets(d.assets || [])).catch(()=>{});
    }
  }, [authed]);

  useEffect(() => { loadContent(); }, []);

  const login = async () => {
    const r = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password:pw}) });
    if (r.ok) { setAuthed(true); loadContent(); } else { setLoginErr('Incorrect password'); }
  };

  const save = async (id: string, value: any) => {
    const r = await fetch('/api/content', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id, value}) });
    setSaveMsg(r.ok ? 'Saved ✓' : 'Save failed');
    setTimeout(()=>setSaveMsg(''), 2000);
  };

  // ----- location helpers -----
  const setLoc = (i: number, l: any) => { const arr=[...locations]; arr[i]=l; setLocations(arr); };
  const addLoc = () => setLocations([...locations, { slug:'', brand:'NEW', name:'New Location', addr:'', url:'#', image: assets[1] || '/assets/dealership-1.jpg' }]);
  const removeLoc = (i: number) => setLocations(locations.filter((_,x)=>x!==i));
  const moveLoc = (i: number, dir: number) => {
    const j = i + dir; if (j<0 || j>=locations.length) return;
    const arr=[...locations]; [arr[i],arr[j]]=[arr[j],arr[i]]; setLocations(arr);
  };

  if (authed === false) {
    return (
      <div style={{maxWidth:360,margin:'10vh auto',textAlign:'center',fontFamily:'system-ui'}}>
        <h1 style={{color:'#1f4e79'}}>Fairway Site Editor</h1>
        <p style={{color:'#5b6b7c'}}>Enter the admin password to edit the site.</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
          style={{width:'100%',padding:12,margin:'12px 0',border:'1px solid #ccc',borderRadius:8}} />
        <button onClick={login} style={{width:'100%',padding:12,background:'#337AB7',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>Log In</button>
        {loginErr && <p style={{color:'#c00'}}>{loginErr}</p>}
      </div>
    );
  }

  if (!authed || !hero) return <div style={{textAlign:'center',padding:40,fontFamily:'system-ui'}}>Loading…</div>;

  const field = (label: string, val: string, set: (v:string)=>void, rows=1) => (
    <label style={{display:'block',marginBottom:14}}>
      <span style={{fontSize:12,color:'#5b6b7c',fontWeight:700}}>{label}</span>
      {rows>1 ? (
        <textarea value={val} onChange={e=>set(e.target.value)} rows={rows} style={inp}/>
      ) : (
        <input value={val} onChange={e=>set(e.target.value)} style={inp}/>
      )}
    </label>
  );

  // Image picker: choose from uploaded assets OR paste URL, with live preview
  const imgField = (label: string, val: string, set: (v:string)=>void) => (
    <div style={{marginBottom:14}}>
      <span style={{fontSize:12,color:'#5b6b7c',fontWeight:700}}>{label}</span>
      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
        <img src={val} alt="" style={{width:84,height:60,objectFit:'cover',borderRadius:6,border:'1px solid #e2e6ea',flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.opacity='0.2'}} />
        <select value={assets.includes(val)?val:''} onChange={e=>{ if(e.target.value) set(e.target.value); }} style={{...inp,width:220,marginTop:0}}>
          <option value="">— pick an uploaded photo —</option>
          {assets.map(a=><option key={a} value={a}>{a.split('/').pop()}</option>)}
        </select>
      </div>
      <input value={val} onChange={e=>set(e.target.value)} placeholder="or paste an image URL"
        style={{...inp,marginTop:6}}/>
    </div>
  );

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:32,fontFamily:'system-ui'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{color:'#1f4e79',margin:0}}>Edit the Fairway Group Site</h1>
        <div><a href="/" style={{color:'#337AB7',marginRight:16}}>View site</a><a href="/analytics" style={{color:'#337AB7'}}>Analytics</a></div>
      </div>
      <p style={{color:'#5b6b7c'}}>Changes below go live immediately on the public site when you Save.</p>
      <div style={{background:'#f7f8fa',border:'1px solid #eef0f3',borderRadius:14,padding:24,marginTop:8}}>{saveMsg && <span style={{color:'#2a9d8f',fontWeight:700}}>{saveMsg}</span>}</div>

      {/* HERO — now with image picker */}
      <section style={{background:'#fff',border:'1px solid #eef0f3',borderRadius:14,padding:24,marginTop:20}}>
        <h2 style={{color:'#1f4e79',margin:'0 0 16px',fontSize:18}}>Hero Section</h2>
        {field('Tagline', hero.tagline||'', v=>setHero({...hero,tagline:v}))}
        {field('Headline', hero.headline||'', v=>setHero({...hero,headline:v}))}
        {field('Sub-text', hero.sub||'', v=>setHero({...hero,sub:v}), 2)}
        {field('Phone number', hero.phone||'', v=>setHero({...hero,phone:v}))}
        {imgField('Hero image', hero.heroImage||'', v=>setHero({...hero,heroImage:v}))}
        <button onClick={()=>save('hero', hero)} style={btn}>Save Hero</button>
      </section>

      {/* ABOUT */}
      <section style={{background:'#fff',border:'1px solid #eef0f3',borderRadius:14,padding:24,marginTop:20}}>
        <h2 style={{color:'#1f4e79',margin:'0 0 16px',fontSize:18}}>About Paragraphs</h2>
        {about.map((p,i)=>
          field(`Paragraph ${i+1}`, p, v=>{const a=[...about];a[i]=v;setAbout(a);}, 2))}
        <div style={{marginTop:8}}>
          <button onClick={()=>setAbout([...about,''])} style={{...btn,background:'#5b6b7c'}}>+ Add paragraph</button>
        </div>
        <button onClick={()=>save('about', about)} style={btn}>Save About</button>
      </section>

      {/* LOCATIONS — now with add/remove/reorder + image picker */}
      <section style={{background:'#fff',border:'1px solid #eef0f3',borderRadius:14,padding:24,marginTop:20}}>
        <h2 style={{color:'#1f4e79',margin:'0 0 16px',fontSize:18}}>Dealership Locations</h2>
        {locations.map((loc,i)=>(
          <div key={i} style={{border:'1px solid #eef0f3',borderRadius:10,padding:16,marginBottom:14,background:'#fafbfc'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <h3 style={{margin:0,color:'#337AB7',fontSize:15}}>{loc.name}</h3>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>moveLoc(i,-1)} disabled={i===0} style={smBtn} title="Move up">↑</button>
                <button onClick={()=>moveLoc(i,1)} disabled={i===locations.length-1} style={smBtn} title="Move down">↓</button>
                <button onClick={()=>removeLoc(i)} style={{...smBtn,background:'#f0caca',color:'#a33'}} title="Remove">✕</button>
              </div>
            </div>
            {field('Brand label', loc.brand||'', v=>setLoc(i,{...loc,brand:v}))}
            {field('Name', loc.name||'', v=>setLoc(i,{...loc,name:v}))}
            {field('Address', loc.addr||'', v=>setLoc(i,{...loc,addr:v}))}
            {field('Website URL', loc.url||'', v=>setLoc(i,{...loc,url:v}))}
            {imgField('Card image', loc.image||'', v=>setLoc(i,{...loc,image:v}))}
          </div>
        ))}
        <button onClick={addLoc} style={{...btn,background:'#5b6b7c',marginBottom:12}}>+ Add location</button>
        <div><button onClick={()=>save('locations', locations)} style={btn}>Save Locations</button></div>
      </section>
    </div>
  );

}

const smBtn: React.CSSProperties = { padding:'4px 9px', borderRadius:6, border:'1px solid #ccc', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 };
const inp: React.CSSProperties = { width:'100%', padding:9, border:'1px solid #ccc', borderRadius:8, marginTop:4, fontSize:14, fontFamily:'system-ui' };
const btn: React.CSSProperties = { padding:'11px 22px', background:'#337AB7', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:14, marginTop:4 };
