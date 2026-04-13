import { useState, useEffect } from "react";
 
const PROJECT_ID = "kittag-90274";
const API_KEY = "AIzaSyBA-G01eLC4Qoyv2GdPXzVMFZhZEP79-5Q";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
 
const toFS = (obj) => {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "number") fields[k] = { integerValue: String(v) };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
  }
  return { fields };
};
 
const fromFS = (doc) => {
  const obj = { id: doc.name.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields || {})) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.integerValue !== undefined) obj[k] = Number(v.integerValue);
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.nullValue !== undefined) obj[k] = null;
  }
  return obj;
};
 
const fsGet = (col) => fetch(`${BASE_URL}/${col}?key=${API_KEY}`).then(r => r.json()).then(d => d.documents ? d.documents.map(fromFS) : []);
const fsAdd = (col, data) => fetch(`${BASE_URL}/${col}?key=${API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toFS(data)) });
const fsPatch = (col, id, data) => fetch(`${BASE_URL}/${col}/${id}?updateMask.fieldPaths=${Object.keys(data).join("&updateMask.fieldPaths=")}&key=${API_KEY}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toFS(data)) });
 
const BADGES = [
  { id: "estreante", icon: "🥉", name: "Estreante", desc: "Cadastrou a primeira camisa", check: (s, u) => s.filter(x => x.addedBy === u).length >= 1 },
  { id: "torcedor_fiel", icon: "🎽", name: "Torcedor Fiel", desc: "10 camisas do mesmo time", check: (s, u) => { const c = {}; s.filter(x => x.addedBy===u).forEach(x => c[x.team]=(c[x.team]||0)+1); return Object.values(c).some(v=>v>=10); } },
  { id: "ultras", icon: "🏟️", name: "Ultras", desc: "20 camisas do mesmo time", check: (s, u) => { const c = {}; s.filter(x => x.addedBy===u).forEach(x => c[x.team]=(c[x.team]||0)+1); return Object.values(c).some(v=>v>=20); } },
  { id: "viajante", icon: "✈️", name: "Viajante", desc: "Camisas de 5 países diferentes", check: (s, u) => new Set(s.filter(x=>x.addedBy===u).map(x=>x.country)).size >= 5 },
  { id: "global_scout", icon: "🌍", name: "Global Scout", desc: "Camisas de 10 países diferentes", check: (s, u) => new Set(s.filter(x=>x.addedBy===u).map(x=>x.country)).size >= 10 },
  { id: "multi_clube", icon: "⚽", name: "Multi-Clube", desc: "Camisas de 10 times diferentes", check: (s, u) => new Set(s.filter(x=>x.addedBy===u).map(x=>x.team)).size >= 10 },
  { id: "arquivista", icon: "📚", name: "Arquivista", desc: "50 camisas cadastradas", check: (s, u) => s.filter(x=>x.addedBy===u).length >= 50 },
  { id: "lenda", icon: "🏆", name: "Lenda", desc: "100 camisas cadastradas", check: (s, u) => s.filter(x=>x.addedBy===u).length >= 100 },
  { id: "nike_expert", icon: "✔️", name: "Nike Expert", desc: "20 camisas Nike", check: (s, u) => s.filter(x=>x.addedBy===u&&x.brand==="Nike").length >= 20 },
  { id: "adidas_expert", icon: "3️⃣", name: "Adidas Expert", desc: "20 camisas Adidas", check: (s, u) => s.filter(x=>x.addedBy===u&&x.brand==="Adidas").length >= 20 },
];
 
const countries = ["Brasil", "Portugal", "Alemanha", "Inglaterra", "Itália", "Espanha", "Tailândia", "China", "Outro"];
const brands = ["Nike", "Adidas"];
 
const TagIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
const PlusIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const ChevronIcon = ({ up }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>);
const XIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const LoadingIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
 
export default function KitTag() {
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("catalog");
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [voted, setVoted] = useState({});
  const [saving, setSaving] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [form, setForm] = useState({ team:"", year:"", version:"", model:"", brand:"", country:"", sku:"", shirtImg:null, tagImg:null, forSale:false });
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
 
  useEffect(() => {
    const hasModal = selected || showForm || showLogin;
    document.body.style.overflow = hasModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected, showForm, showLogin]);
 
  const loadShirts = async () => {
    try { const data = await fsGet("shirts"); setShirts(data.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };
 
  useEffect(() => { loadShirts(); }, []);
  useEffect(() => { const s = localStorage.getItem("kittag_user"); if(s) setUser(JSON.parse(s)); }, []);
 
  const handleLogin = () => {
    if (!loginName.trim()) return;
    const u = { name: loginName.trim() };
    setUser(u); localStorage.setItem("kittag_user", JSON.stringify(u));
    setShowLogin(false); setLoginName("");
  };
  const handleLogout = () => { setUser(null); localStorage.removeItem("kittag_user"); setView("catalog"); };
 
  const filtered = shirts.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.team.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q))
      && (!filterBrand || s.brand===filterBrand)
      && (!filterYear || String(s.year)===filterYear);
  });
 
  const handleVote = async (id, dir) => {
    if (voted[id]) return;
    const shirt = shirts.find(s=>s.id===id); if(!shirt) return;
    const nv = (shirt.votes||0)+(dir==="up"?1:-1);
    setShirts(prev=>prev.map(s=>s.id===id?{...s,votes:nv}:s));
    setVoted(prev=>({...prev,[id]:dir}));
    if(selected?.id===id) setSelected(prev=>({...prev,votes:nv}));
    await fsPatch("shirts", id, {votes:nv});
  };
 
  const handleSubmit = async () => {
    if(!user){setFormError("Faça login para cadastrar.");return;}
    if(!form.team||!form.year||!form.brand||!form.version||!form.model||!form.country||!form.sku){setFormError("Preencha todos os campos obrigatórios.");return;}
    setSaving(true);
    try {
      await fsAdd("shirts",{team:form.team,year:Number(form.year),version:form.version,model:form.model,brand:form.brand,country:form.country,sku:form.sku,tag:form.shirtImg||`https://placehold.co/400x300/1a1a2e/e8e0d0?text=${encodeURIComponent(form.team)}+${form.year}`,tagImg:form.tagImg||"",addedBy:user.name,forSale:form.forSale,votes:0,createdAt:Date.now()});
      await loadShirts();
      setForm({team:"",year:"",version:"",model:"",brand:"",country:"",sku:"",shirtImg:null,tagImg:null,forSale:false});
      setFormError(""); setShowForm(false);
      setSuccessMsg("Camisa cadastrada!"); setTimeout(()=>setSuccessMsg(""),3500);
    } catch(e){setFormError("Erro ao salvar.");}
    setSaving(false);
  };
 
  const years = [...new Set(shirts.map(s=>s.year))].sort((a,b)=>b-a);
 
  const userRanking = () => { const c={}; shirts.forEach(s=>c[s.addedBy]=(c[s.addedBy]||0)+1); return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10); };
  const teamRanking = () => { const c={}; shirts.forEach(s=>c[s.team]=(c[s.team]||0)+1); return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10); };
  const popularShirts = () => {
    const c={};
    shirts.forEach(s=>{
      const k=`${s.team}|${s.year}|${s.brand}`;
      if(!c[k]) c[k]=new Set();
      c[k].add(s.addedBy);
    });
    return Object.entries(c)
      .map(([k,users])=>{const[team,year,brand]=k.split("|");return{team,year,brand,count:users.size,users:[...users]};})
      .sort((a,b)=>b.count-a.count)
      .slice(0,5);
  };
 
  const myShirts = (u) => shirts.filter(s=>s.addedBy===u);
  const myBadges = (u) => BADGES.filter(b=>b.check(shirts,u));
  const myStats = (u) => { const m=myShirts(u); return {total:m.length,teams:new Set(m.map(s=>s.team)).size,countries:new Set(m.map(s=>s.country)).size,forSale:m.filter(s=>s.forSale).length}; };
 
  const openProfile = (u) => { setProfileUser(u); setView("profile"); };
 
  return (
    <div style={{fontFamily:"'Georgia',serif",background:"#0d0d0d",minHeight:"100vh",color:"#e8e0d0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        .kt-header{background:#0d0d0d;border-bottom:1px solid #2a2a2a;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;gap:12px;flex-wrap:wrap}
        .kt-logo{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:#e8e0d0;letter-spacing:-0.5px;cursor:pointer} .kt-logo span{color:#c8a84b}
        .kt-tagline{font-family:'DM Mono',monospace;font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
        .kt-nav{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
        .kt-nav-btn{background:none;border:1px solid #2a2a2a;color:#666;padding:6px 12px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
        .kt-nav-btn:hover,.kt-nav-btn.active{border-color:#c8a84b;color:#c8a84b}
        .kt-btn-primary{background:#c8a84b;color:#0d0d0d;border:none;padding:9px 16px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s}
        .kt-btn-primary:hover{background:#e0bc5a} .kt-btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .kt-btn-ghost{background:none;border:1px solid #2a2a2a;color:#666;padding:8px 12px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s;text-transform:uppercase}
        .kt-btn-ghost:hover{border-color:#555;color:#e8e0d0}
        .kt-user-chip{display:flex;align-items:center;gap:7px;background:#141414;border:1px solid #2a2a2a;padding:6px 10px;cursor:pointer;transition:border-color 0.2s}
        .kt-user-chip:hover{border-color:#c8a84b}
        .kt-user-name{font-family:'DM Mono',monospace;font-size:11px;color:#e8e0d0}
        .kt-hero{padding:52px 32px 36px;border-bottom:1px solid #1e1e1e;background:linear-gradient(180deg,#111 0%,#0d0d0d 100%)}
        .kt-hero-label{font-family:'DM Mono',monospace;font-size:10px;color:#c8a84b;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px}
        .kt-hero h1{font-family:'Playfair Display',serif;font-size:clamp(24px,5vw,48px);font-weight:900;line-height:1.1;color:#e8e0d0;max-width:580px;margin-bottom:14px}
        .kt-stats{display:flex;gap:32px;margin-top:24px;flex-wrap:wrap}
        .kt-stat{border-left:2px solid #c8a84b;padding-left:14px}
        .kt-stat-num{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:#e8e0d0}
        .kt-stat-label{font-family:'DM Mono',monospace;font-size:9px;color:#555;letter-spacing:1px;text-transform:uppercase}
        .kt-filters{padding:14px 32px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #1a1a1a;flex-wrap:wrap}
        .kt-search-wrap{position:relative;flex:1;min-width:160px;max-width:320px}
        .kt-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#444}
        .kt-input{background:#141414;border:1px solid #2a2a2a;color:#e8e0d0;padding:9px 12px 9px 36px;font-family:'DM Mono',monospace;font-size:16px;width:100%;outline:none;transition:border-color 0.2s}
        .kt-input:focus{border-color:#c8a84b} .kt-input::placeholder{color:#3a3a3a}
        .kt-select{background:#141414;border:1px solid #2a2a2a;color:#e8e0d0;padding:9px 12px;font-family:'DM Mono',monospace;font-size:16px;outline:none;cursor:pointer;min-width:120px}
        .kt-count{font-family:'DM Mono',monospace;font-size:10px;color:#444;margin-left:auto;letter-spacing:1px}
        .kt-grid{padding:24px 32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1px;background:#1a1a1a}
        .kt-card{background:#0d0d0d;cursor:pointer;transition:background 0.15s;overflow:hidden;display:flex;flex-direction:column;animation:fadeIn 0.3s ease}
        .kt-card:hover{background:#111}
        .kt-card-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;filter:grayscale(20%);transition:filter 0.3s;border-bottom:1px solid #1a1a1a}
        .kt-card:hover .kt-card-img{filter:grayscale(0%)}
        .kt-card-body{padding:13px 16px 16px;flex:1;display:flex;flex-direction:column}
        .kt-card-team{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#e8e0d0;margin-bottom:3px}
        .kt-card-meta{font-family:'DM Mono',monospace;font-size:9px;color:#555;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
        .kt-card-sku{font-family:'DM Mono',monospace;font-size:10px;color:#c8a84b;background:#1a1600;padding:3px 7px;display:inline-flex;align-items:center;gap:4px;margin-bottom:8px;letter-spacing:1px}
        .kt-sale-badge{font-family:'DM Mono',monospace;font-size:9px;color:#4a8a00;background:#1a2a00;border:1px solid #2a4a00;padding:2px 6px;display:inline-block;letter-spacing:1px;margin-bottom:8px}
        .kt-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:9px;border-top:1px solid #1a1a1a}
        .kt-card-by{font-family:'DM Mono',monospace;font-size:9px;color:#3a3a3a;cursor:pointer;transition:color 0.2s}
        .kt-card-by:hover{color:#c8a84b}
        .kt-votes{display:flex;align-items:center;gap:4px}
        .kt-vote-btn{background:none;border:1px solid #222;color:#555;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .kt-vote-btn:hover{border-color:#c8a84b;color:#c8a84b} .kt-vote-btn.active-up{border-color:#c8a84b;color:#c8a84b;background:#1a1600} .kt-vote-btn.active-down{border-color:#552222;color:#aa4444;background:#1a0000}
        .kt-vote-count{font-family:'DM Mono',monospace;font-size:10px;color:#888;min-width:18px;text-align:center}
        .kt-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:28px 14px;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;backdrop-filter:blur(4px)}
        .kt-modal{background:#111;border:1px solid #2a2a2a;width:100%;max-width:680px;animation:slideUp 0.25s ease;max-height:90vh;overflow-y:auto}
        .kt-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #2a2a2a}
        .kt-modal-title{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#e8e0d0}
        .kt-close{background:none;border:1px solid #2a2a2a;color:#555;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .kt-close:hover{border-color:#555;color:#e8e0d0}
        .kt-modal-img{width:100%;max-height:260px;object-fit:cover;display:block}
        .kt-modal-body{padding:22px;padding-bottom:32px}
        .kt-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:18px}
        .kt-field label{font-family:'DM Mono',monospace;font-size:9px;color:#555;letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:3px}
        .kt-field-val{font-family:'DM Mono',monospace;font-size:12px;color:#e8e0d0}
        .kt-sku-big{font-family:'DM Mono',monospace;font-size:14px;color:#c8a84b;background:#1a1600;padding:6px 11px;display:inline-block;letter-spacing:2px;border:1px solid #2a1f00;margin-top:5px}
        .kt-form-field{margin-bottom:13px}
        .kt-form-label{font-family:'DM Mono',monospace;font-size:10px;color:#555;letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:5px}
        .kt-form-input{background:#0d0d0d;border:1px solid #2a2a2a;color:#e8e0d0;padding:9px 12px;font-family:'DM Mono',monospace;font-size:16px;width:100%;outline:none;transition:border-color 0.2s}
        .kt-form-input:focus{border-color:#c8a84b} .kt-form-input::placeholder{color:#333}
        .kt-required{color:#c8a84b;margin-left:2px}
        .kt-error{font-family:'DM Mono',monospace;font-size:11px;color:#aa4444;margin-top:10px;padding:8px 11px;background:#1a0000;border-left:2px solid #aa4444}
        .kt-success{position:fixed;bottom:28px;right:28px;background:#1a2a00;border:1px solid #4a8a00;color:#a0d060;font-family:'DM Mono',monospace;font-size:11px;padding:12px 18px;z-index:300;letter-spacing:1px;animation:slideUp 0.3s ease}
        .kt-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 28px;gap:14px}
        .kt-loading-text{font-family:'DM Mono',monospace;font-size:10px;color:#444;letter-spacing:2px;text-transform:uppercase}
        .kt-empty{padding:60px 28px;text-align:center;font-family:'DM Mono',monospace;color:#333;font-size:12px;letter-spacing:1px;background:#0d0d0d}
        .kt-page{padding:32px}
        .kt-page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#e8e0d0;margin-bottom:6px}
        .kt-page-sub{font-family:'DM Mono',monospace;font-size:10px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px}
        .kt-profile-header{background:#111;border:1px solid #2a2a2a;padding:24px;margin-bottom:24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .kt-avatar{width:56px;height:56px;background:#1a1600;border:2px solid #c8a84b;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:#c8a84b;flex-shrink:0}
        .kt-profile-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#e8e0d0}
        .kt-profile-stats{display:flex;gap:20px;margin-top:8px;flex-wrap:wrap}
        .kt-profile-stat{text-align:center}
        .kt-profile-stat-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#c8a84b}
        .kt-profile-stat-label{font-family:'DM Mono',monospace;font-size:9px;color:#555;letter-spacing:1px;text-transform:uppercase}
        .kt-section-title{font-family:'DM Mono',monospace;font-size:10px;color:#c8a84b;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1a1a1a}
        .kt-badges{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px}
        .kt-badge{background:#141414;border:1px solid #2a2a2a;padding:10px 14px;display:flex;align-items:center;gap:8px}
        .kt-badge-icon{font-size:20px}
        .kt-badge-name{font-family:'DM Mono',monospace;font-size:11px;color:#e8e0d0;letter-spacing:1px}
        .kt-badge-desc{font-family:'DM Mono',monospace;font-size:9px;color:#555;margin-top:2px}
        .kt-badge.locked{opacity:0.25;filter:grayscale(1)}
        .kt-ranking-item{display:flex;align-items:center;gap:14px;padding:12px 16px;background:#111;border:1px solid #1a1a1a;margin-bottom:6px}
        .kt-rank-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#2a2a2a;min-width:28px}
        .kt-rank-num.top{color:#c8a84b}
        .kt-rank-name{font-family:'DM Mono',monospace;font-size:12px;color:#e8e0d0;flex:1;cursor:pointer}
        .kt-rank-name:hover{color:#c8a84b}
        .kt-rank-count{font-family:'DM Mono',monospace;font-size:11px;color:#555;letter-spacing:1px}
        .kt-checkbox-row{display:flex;align-items:center;gap:10px;padding:12px;background:#0d0d0d;border:1px solid #2a2a2a;cursor:pointer;margin-bottom:14px}
        .kt-checkbox{width:16px;height:16px;border:1px solid #2a2a2a;background:#0d0d0d;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .kt-checkbox.checked{background:#1a2a00;border-color:#4a8a00}
        .kt-checkbox-label{font-family:'DM Mono',monospace;font-size:11px;color:#888;letter-spacing:1px}
        .kt-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid #1a1a1a}
        .kt-tab{font-family:'DM Mono',monospace;font-size:10px;color:#555;letter-spacing:1.5px;text-transform:uppercase;padding:10px 16px;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s}
        .kt-tab.active{color:#c8a84b;border-bottom-color:#c8a84b}
        @media(max-width:600px){
          .kt-header{padding:12px 16px} .kt-hero{padding:36px 16px 24px} .kt-filters{padding:12px 16px}
          .kt-grid{padding:16px;grid-template-columns:1fr} .kt-field-grid{grid-template-columns:1fr}
          .kt-stats{gap:20px} .kt-modal{margin:0} .kt-overlay{padding:0;align-items:flex-end}
          .kt-page{padding:16px} .kt-profile-header{padding:16px}
        }
      `}</style>
 
      {/* HEADER */}
      <header className="kt-header">
        <div onClick={()=>setView("catalog")} style={{cursor:"pointer"}}>
          <div className="kt-logo">Kit<span>Tag</span></div>
          <div className="kt-tagline">Catálogo colaborativo de camisas de futebol.</div>
        </div>
        <div className="kt-nav">
          <button className={`kt-nav-btn ${view==="catalog"?"active":""}`} onClick={()=>setView("catalog")}>Catálogo</button>
          <button className={`kt-nav-btn ${view==="ranking"?"active":""}`} onClick={()=>setView("ranking")}>Ranking</button>
          {user && <button className={`kt-nav-btn ${view==="profile"&&profileUser===user.name?"active":""}`} onClick={()=>{setProfileUser(user.name);setView("profile");}}>Meu perfil</button>}
          {user
            ? <div className="kt-user-chip" onClick={handleLogout} title="Sair">
                <div style={{width:24,height:24,background:"#1a1600",border:"1px solid #c8a84b",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:11,color:"#c8a84b",fontWeight:900}}>{user.name[0].toUpperCase()}</div>
                <span className="kt-user-name">{user.name}</span>
              </div>
            : <button className="kt-btn-ghost" onClick={()=>setShowLogin(true)}>Entrar</button>
          }
          <button className="kt-btn-primary" onClick={()=>{ if(!user){setShowLogin(true);}else{setShowForm(true);} }}>
            <PlusIcon /> Cadastrar
          </button>
        </div>
      </header>
 
      {/* CATALOG VIEW */}
      {view==="catalog" && <>
        <section className="kt-hero">
          <div className="kt-hero-label">⚽ Arquivo aberto · Comunidade global</div>
          <h1>Cada camisa carrega uma história.</h1>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#c8a84b",letterSpacing:"0.5px",marginBottom:"16px",lineHeight:1.8}}>Um arquivo colaborativo de camisas de futebol.</p>
          <p style={{maxWidth:"540px",lineHeight:1.9,fontSize:"13px",color:"#888",marginBottom:"12px"}}>Por trás de cada camisa que amamos existe um detalhe invisível à maioria — a etiqueta. Ela revela a origem, o ano, onde foi produzida e o código original de tudo que tenta imitá-la.</p>
          <p style={{maxWidth:"540px",lineHeight:1.9,fontSize:"13px",color:"#666"}}>O KitTag nasceu da obsessão de colecionadores sérios que entendem que preservar uma camisa é também preservar a memória do futebol.</p>
          <div className="kt-stats">
            <div className="kt-stat"><div className="kt-stat-num">{shirts.length}</div><div className="kt-stat-label">Camisas</div></div>
            <div className="kt-stat"><div className="kt-stat-num">{new Set(shirts.map(s=>s.team)).size}</div><div className="kt-stat-label">Times</div></div>
            <div className="kt-stat"><div className="kt-stat-num">{new Set(shirts.map(s=>s.country)).size}</div><div className="kt-stat-label">Países</div></div>
            <div className="kt-stat"><div className="kt-stat-num">{new Set(shirts.map(s=>s.addedBy)).size}</div><div className="kt-stat-label">Colecionadores</div></div>
          </div>
        </section>
 
        <div className="kt-filters">
          <div className="kt-search-wrap"><span className="kt-search-icon"><SearchIcon/></span><input className="kt-input" placeholder="Time, marca ou SKU..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="kt-select" value={filterBrand} onChange={e=>setFilterBrand(e.target.value)}><option value="">Todas as marcas</option>{brands.map(b=><option key={b}>{b}</option>)}</select>
          <select className="kt-select" value={filterYear} onChange={e=>setFilterYear(e.target.value)}><option value="">Todos os anos</option>{years.map(y=><option key={y}>{y}</option>)}</select>
          <div className="kt-count">{filtered.length} resultado{filtered.length!==1?"s":""}</div>
        </div>
 
        {loading ? (<div className="kt-loading"><LoadingIcon/><span className="kt-loading-text">Carregando catálogo...</span></div>)
        : filtered.length===0 ? (<div className="kt-empty">Nenhuma camisa encontrada. Seja o primeiro a cadastrar!</div>)
        : (<div className="kt-grid">{filtered.map(shirt=>(<div key={shirt.id} className="kt-card" onClick={()=>setSelected(shirt)}>
            <img className="kt-card-img" src={shirt.tag} alt={shirt.team}/>
            <div className="kt-card-body">
              <div className="kt-card-team">{shirt.team}</div>
              <div className="kt-card-meta">{shirt.year} · {shirt.version} · {shirt.model} · {shirt.brand}</div>
              <div className="kt-card-sku"><TagIcon/> {shirt.sku}</div>
              {shirt.forSale && <div className="kt-sale-badge">✦ À VENDA</div>}
              <div className="kt-card-footer">
                <div className="kt-card-by" onClick={e=>{e.stopPropagation();openProfile(shirt.addedBy);}}>por {shirt.addedBy}</div>
                <div className="kt-votes" onClick={e=>e.stopPropagation()}>
                  <button className={`kt-vote-btn ${voted[shirt.id]==="up"?"active-up":""}`} onClick={()=>handleVote(shirt.id,"up")}><ChevronIcon up/></button>
                  <span className="kt-vote-count">{shirt.votes||0}</span>
                  <button className={`kt-vote-btn ${voted[shirt.id]==="down"?"active-down":""}`} onClick={()=>handleVote(shirt.id,"down")}><ChevronIcon/></button>
                </div>
              </div>
            </div>
          </div>))}</div>)}
      </>}
 
      {/* RANKING VIEW */}
      {view==="ranking" && <div className="kt-page">
        <div className="kt-page-title">Ranking</div>
        <div className="kt-page-sub">A comunidade KitTag em números</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24}}>
          <div>
            <div className="kt-section-title">🏅 Colecionadores mais ativos</div>
            {userRanking().map(([name,count],i)=>(
              <div key={name} className="kt-ranking-item">
                <div className={`kt-rank-num ${i<3?"top":""}`}>{i+1}</div>
                <div className="kt-rank-name" onClick={()=>openProfile(name)}>{name}</div>
                <div className="kt-rank-count">{count} camisa{count!==1?"s":""}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="kt-section-title">⚽ Times com mais registros</div>
            {teamRanking().map(([team,count],i)=>(
              <div key={team} className="kt-ranking-item">
                <div className={`kt-rank-num ${i<3?"top":""}`}>{i+1}</div>
                <div className="kt-rank-name">{team}</div>
                <div className="kt-rank-count">{count} camisa{count!==1?"s":""}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="kt-section-title">🔥 Camisas mais populares</div>
            {popularShirts().map((s,i)=>(
              <div key={i} className="kt-ranking-item">
                <div className={`kt-rank-num ${i<3?"top":""}`}>{i+1}</div>
                <div className="kt-rank-name">{s.team} {s.year} · {s.brand}</div>
                <div className="kt-rank-count">{s.count} colecionador{s.count!==1?"es":""}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}
 
      {/* PROFILE VIEW */}
      {view==="profile" && profileUser && <div className="kt-page">
        <div className="kt-profile-header">
          <div className="kt-avatar">{profileUser[0].toUpperCase()}</div>
          <div style={{flex:1}}>
            <div className="kt-profile-name">{profileUser}</div>
            <div className="kt-profile-stats">
              {[["total","Camisas"],["teams","Times"],["countries","Países"],["forSale","À venda"]].map(([k,l])=>(
                <div key={k} className="kt-profile-stat">
                  <div className="kt-profile-stat-num">{myStats(profileUser)[k]}</div>
                  <div className="kt-profile-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="kt-section-title">🏅 Conquistas</div>
        <div className="kt-badges">
          {BADGES.map(b=>{
            const earned = b.check(shirts, profileUser);
            return (<div key={b.id} className={`kt-badge ${earned?"":"locked"}`} title={b.desc}>
              <div className="kt-badge-icon">{b.icon}</div>
              <div><div className="kt-badge-name">{b.name}</div><div className="kt-badge-desc">{b.desc}</div></div>
            </div>);
          })}
        </div>
 
        <div className="kt-section-title">👕 Coleção ({myShirts(profileUser).length})</div>
        {myShirts(profileUser).length===0
          ? <div className="kt-empty" style={{padding:"32px 0"}}>Nenhuma camisa cadastrada ainda.</div>
          : <div className="kt-grid" style={{padding:0,marginTop:0}}>
              {myShirts(profileUser).map(shirt=>(
                <div key={shirt.id} className="kt-card" onClick={()=>setSelected(shirt)}>
                  <img className="kt-card-img" src={shirt.tag} alt={shirt.team}/>
                  <div className="kt-card-body">
                    <div className="kt-card-team">{shirt.team}</div>
                    <div className="kt-card-meta">{shirt.year} · {shirt.version} · {shirt.brand}</div>
                    <div className="kt-card-sku"><TagIcon/> {shirt.sku}</div>
                    {shirt.forSale && <div className="kt-sale-badge">✦ À VENDA</div>}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>}
 
      {/* DETAIL MODAL */}
      {selected && (<div className="kt-overlay" onClick={()=>setSelected(null)}>
        <div className="kt-modal" onClick={e=>e.stopPropagation()}>
          <div className="kt-modal-header">
            <div className="kt-modal-title">{selected.team} {selected.year}</div>
            <button className="kt-close" onClick={()=>setSelected(null)}><XIcon/></button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:selected.tagImg?"1fr 1fr":"1fr",gap:"1px"}}>
            <img className="kt-modal-img" src={selected.tag} alt="Camisa"/>
            {selected.tagImg && <img className="kt-modal-img" src={selected.tagImg} alt="Etiqueta"/>}
          </div>
          <div className="kt-modal-body">
            <div className="kt-field-grid">
              <div className="kt-field"><label>Time</label><div className="kt-field-val">{selected.team}</div></div>
              <div className="kt-field"><label>Ano</label><div className="kt-field-val">{selected.year}</div></div>
              <div className="kt-field"><label>Marca</label><div className="kt-field-val">{selected.brand}</div></div>
              <div className="kt-field"><label>Modelo</label><div className="kt-field-val">{selected.version}</div></div>
              <div className="kt-field"><label>Versão</label><div className="kt-field-val">{selected.model}</div></div>
              <div className="kt-field"><label>País de fabricação</label><div className="kt-field-val">{selected.country}</div></div>
              <div className="kt-field"><label>Cadastrado por</label><div className="kt-field-val" style={{cursor:"pointer",color:"#c8a84b"}} onClick={()=>{setSelected(null);openProfile(selected.addedBy);}}>{selected.addedBy}</div></div>
              {selected.forSale && <div className="kt-field"><label>Disponibilidade</label><div className="kt-field-val" style={{color:"#4a8a00"}}>✦ À venda</div></div>}
            </div>
            <div className="kt-field"><label>SKU / Código do produto</label><div className="kt-sku-big">{selected.sku}</div></div>
            <div style={{marginTop:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="kt-votes">
                <button className={`kt-vote-btn ${voted[selected.id]==="up"?"active-up":""}`} onClick={()=>handleVote(selected.id,"up")}><ChevronIcon up/></button>
                <span className="kt-vote-count">{selected.votes||0}</span>
                <button className={`kt-vote-btn ${voted[selected.id]==="down"?"active-down":""}`} onClick={()=>handleVote(selected.id,"down")}><ChevronIcon/></button>
              </div>
              <span style={{fontFamily:"DM Mono",fontSize:9,color:"#333",letterSpacing:1}}>VOTOS DA COMUNIDADE</span>
            </div>
          </div>
        </div>
      </div>)}
 
      {/* LOGIN MODAL */}
      {showLogin && (<div className="kt-overlay" onClick={()=>setShowLogin(false)}>
        <div className="kt-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
          <div className="kt-modal-header">
            <div className="kt-modal-title">Entrar no KitTag</div>
            <button className="kt-close" onClick={()=>setShowLogin(false)}><XIcon/></button>
          </div>
          <div className="kt-modal-body">
            <div className="kt-form-field">
              <label className="kt-form-label">Seu nome de usuário</label>
              <input className="kt-form-input" placeholder="Ex: kit_hunter_br" value={loginName} onChange={e=>setLoginName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            </div>
            <p style={{fontFamily:"DM Mono,monospace",fontSize:"10px",color:"#444",lineHeight:1.7,marginBottom:16}}>Este nome aparecerá no seu perfil e nas camisas que você cadastrar.</p>
            <button className="kt-btn-primary" style={{width:"100%",justifyContent:"center",padding:13}} onClick={handleLogin}>Entrar</button>
          </div>
        </div>
      </div>)}
 
      {/* FORM MODAL */}
      {showForm && (<div className="kt-overlay" onClick={()=>setShowForm(false)}>
        <div className="kt-modal" onClick={e=>e.stopPropagation()}>
          <div className="kt-modal-header">
            <div className="kt-modal-title">Cadastrar camisa</div>
            <button className="kt-close" onClick={()=>setShowForm(false)}><XIcon/></button>
          </div>
          <div className="kt-modal-body">
            <div className="kt-form-field"><label className="kt-form-label">Time <span className="kt-required">*</span></label><input className="kt-form-input" placeholder="Ex: Flamengo" value={form.team} onChange={e=>setForm(f=>({...f,team:e.target.value}))}/></div>
            <div className="kt-form-field"><label className="kt-form-label">Ano de lançamento <span className="kt-required">*</span></label><input className="kt-form-input" placeholder="Ex: 2002" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}/></div>
            <div className="kt-form-field"><label className="kt-form-label">Marca <span className="kt-required">*</span></label><select className="kt-form-input" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}><option value="">Selecionar...</option>{brands.map(b=><option key={b}>{b}</option>)}</select></div>
            <div className="kt-form-field"><label className="kt-form-label">Modelo <span className="kt-required">*</span></label><select className="kt-form-input" value={form.version} onChange={e=>setForm(f=>({...f,version:e.target.value}))}><option value="">Selecionar...</option><option>Home</option><option>Away</option><option>Third</option><option>Goleiro</option><option>Especial</option></select></div>
            <div className="kt-form-field"><label className="kt-form-label">Versão <span className="kt-required">*</span></label><select className="kt-form-input" value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))}><option value="">Selecionar...</option><option>Jogador</option><option>Torcedor</option></select></div>
            <div className="kt-form-field"><label className="kt-form-label">País onde foi fabricada <span className="kt-required">*</span></label><select className="kt-form-input" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}><option value="">Selecionar...</option>{countries.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="kt-form-field"><label className="kt-form-label">SKU / Código do produto <span className="kt-required">*</span></label><input className="kt-form-input" placeholder="Ex: IP8388" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))}/></div>
 
            <div className="kt-checkbox-row" onClick={()=>setForm(f=>({...f,forSale:!f.forSale}))}>
              <div className={`kt-checkbox ${form.forSale?"checked":""}`}>{form.forSale&&<span style={{color:"#4a8a00",fontSize:11}}>✓</span>}</div>
              <span className="kt-checkbox-label">Esta camisa está disponível para venda</span>
            </div>
 
            <div style={{borderTop:"1px solid #1a1a1a",marginTop:"18px",paddingTop:"18px"}}>
              <p style={{fontFamily:"DM Mono,monospace",fontSize:"10px",color:"#555",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"14px"}}>Fotos</p>
              <div className="kt-form-field">
                <label className="kt-form-label">Foto da camisa</label>
                <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1px dashed #2a2a2a",padding:"20px",cursor:"pointer",gap:"8px",background:form.shirtImg?"#0a1a0a":"#0d0d0d",minHeight:"100px"}}>
                  {form.shirtImg?<img src={form.shirtImg} style={{width:"100%",maxHeight:"140px",objectFit:"contain"}} alt="camisa"/>:<><span style={{fontSize:"24px"}}>👕</span><span style={{fontFamily:"DM Mono,monospace",fontSize:"10px",color:"#444",letterSpacing:"1px",textAlign:"center"}}>Clique para adicionar</span></>}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){const u=URL.createObjectURL(f);setForm(p=>({...p,shirtImg:u}));}}}/>
                </label>
              </div>
              <div className="kt-form-field" style={{marginTop:"12px"}}>
                <label className="kt-form-label">Foto da etiqueta interna</label>
                <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1px dashed #2a2a2a",padding:"20px",cursor:"pointer",gap:"8px",background:form.tagImg?"#1a1600":"#0d0d0d",minHeight:"100px"}}>
                  {form.tagImg?<img src={form.tagImg} style={{width:"100%",maxHeight:"140px",objectFit:"contain"}} alt="etiqueta"/>:<><span style={{fontSize:"24px"}}>🏷️</span><span style={{fontFamily:"DM Mono,monospace",fontSize:"10px",color:"#444",letterSpacing:"1px",textAlign:"center"}}>Clique para adicionar</span></>}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){const u=URL.createObjectURL(f);setForm(p=>({...p,tagImg:u}));}}}/>
                </label>
              </div>
            </div>
 
            {formError&&<div style={{fontFamily:"DM Mono,monospace",fontSize:"11px",color:"#aa4444",marginTop:"10px",padding:"8px 11px",background:"#1a0000",borderLeft:"2px solid #aa4444"}}>{formError}</div>}
            <div style={{marginTop:18}}>
              <button className="kt-btn-primary" style={{width:"100%",justifyContent:"center",padding:13}} onClick={handleSubmit} disabled={saving}>
                {saving?<><LoadingIcon/> Salvando...</>:"Cadastrar camisa"}
              </button>
            </div>
          </div>
        </div>
      </div>)}
 
      {successMsg&&<div style={{position:"fixed",bottom:24,right:24,background:"#1a2a00",border:"1px solid #4a8a00",color:"#a0d060",fontFamily:"DM Mono,monospace",fontSize:"11px",padding:"12px 16px",zIndex:300,letterSpacing:"1px",animation:"slideUp 0.3s ease"}}>✓ {successMsg}</div>}
    </div>
  );
}
 
