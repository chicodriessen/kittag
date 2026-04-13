import { useState, useEffect } from "react";

const PROJECT_ID = "kittag-90274";
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts`;
const API_KEY = "AIzaSyBA-G01eLC4Qoyv2GdPXzVMFZhZEP79-5Q";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Firebase Auth REST ─────────────────────────────────────────
const GOOGLE_PROVIDER_ID = "google.com";
const authSignUp = async (email, password, username) => {
  const res = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { ...data, username };
};

const authSignIn = async (email, password) => {
  const res = await fetch(`${AUTH_URL}:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
};

const authResetPassword = async (email) => {
  const res = await fetch(`${AUTH_URL}:sendOobCode?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
};

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

const ADMINS = ["chicodriessen", "franciscodriessen"]; // adicione moderadores aqui
const isAdmin = (username) => ADMINS.includes(username?.toLowerCase());

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
  const [view, setView] = useState("catalog"); // catalog | profile | ranking | admin
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login | signup | forgot
  const [authForm, setAuthForm] = useState({ email: "", password: "", username: "", confirmPassword: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [voted, setVoted] = useState({});
  const [saving, setSaving] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [profileForm, setProfileForm] = useState({ bio: "", instagram: "", photo: null });
  const [form, setForm] = useState({ team:"", year:"", version:"", model:"", brand:"", country:"", sku:"", shirtImg:null, tagImg:null, forSale:false });
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const hasModal = selected || showForm || showLogin;
    document.body.style.overflow = hasModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected, showForm, showLogin]);

  const loadProfiles = async () => {
    try {
      const data = await fsGet("profiles");
      const map = {};
      data.forEach(p => map[p.id] = p);
      setProfiles(map);
    } catch(e) { console.error(e); }
  };

  const loadShirts = async () => {
    try { const data = await fsGet("shirts"); setShirts(data.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadShirts(); loadProfiles(); }, []);
  useEffect(() => { const s = localStorage.getItem("kittag_user"); if(s) setUser(JSON.parse(s)); }, []);

  const handleAuth = async () => {
    setAuthError(""); setAuthLoading(true);
    try {
      if (authMode === "forgot") {
        await authResetPassword(authForm.email);
        setAuthError("✓ Email de recuperação enviado!");
        setAuthLoading(false); return;
      }
      if (authMode === "signup") {
        if (!authForm.username.trim()) { setAuthError("Digite um nome de usuário."); setAuthLoading(false); return; }
        if (authForm.password !== authForm.confirmPassword) { setAuthError("As senhas não coincidem."); setAuthLoading(false); return; }
        if (authForm.password.length < 6) { setAuthError("A senha precisa ter pelo menos 6 caracteres."); setAuthLoading(false); return; }
        const data = await authSignUp(authForm.email, authForm.password, authForm.username);
        const u = { name: authForm.username.trim(), email: authForm.email, uid: data.localId };
        setUser(u); localStorage.setItem("kittag_user", JSON.stringify(u));
        // Salvar perfil inicial
        await fetch(`${BASE_URL}/profiles/${authForm.username.trim()}?key=${API_KEY}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toFS({ username: authForm.username.trim(), email: authForm.email, bio: "", instagram: "", photo: "" })),
        });
      } else {
        const data = await authSignIn(authForm.email, authForm.password);
        // Buscar username pelo email
        const allProfiles = await fsGet("profiles");
        const profile = allProfiles.find(p => p.email === authForm.email);
        const username = profile?.username || authForm.email.split("@")[0];
        const u = { name: username, email: authForm.email, uid: data.localId };
        setUser(u); localStorage.setItem("kittag_user", JSON.stringify(u));
      }
      setShowLogin(false);
      setAuthForm({ email: "", password: "", username: "", confirmPassword: "" });
    } catch(e) {
      const msgs = { "EMAIL_EXISTS": "Este email já está cadastrado.", "INVALID_PASSWORD": "Senha incorreta.", "EMAIL_NOT_FOUND": "Email não encontrado.", "WEAK_PASSWORD : Password should be at least 6 characters": "A senha precisa ter pelo menos 6 caracteres.", "INVALID_EMAIL": "Email inválido." };
      setAuthError(msgs[e.message] || "Erro ao autenticar. Tente novamente.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem("kittag_user"); setView("catalog"); };

  const handleGoogleLogin = async () => {
    setAuthError(""); setAuthLoading(true);
    try {
      // Inicia o fluxo OAuth do Google via Firebase
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestUri: window.location.href,
          returnSecureToken: true,
          providerId: "google.com",
        }),
      });
      const data = await res.json();
      if (data.error) {
        // Fallback: abrir popup OAuth do Google
        const clientId = "798455431528-web.apps.googleusercontent.com";
        const redirectUri = encodeURIComponent(window.location.href);
        const scope = encodeURIComponent("email profile");
        const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
        window.open(googleUrl, "_blank", "width=500,height=600");
        setAuthError("Use o popup que abriu para entrar com Google.");
        setAuthLoading(false); return;
      }
      const username = data.displayName || data.email.split("@")[0];
      const u = { name: username, email: data.email, uid: data.localId };
      setUser(u); localStorage.setItem("kittag_user", JSON.stringify(u));
      // Salvar perfil
      await fetch(`${BASE_URL}/profiles/${username}?key=${API_KEY}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFS({ username, email: data.email, bio: "", instagram: "", photo: data.photoUrl || "" })),
      });
      await loadProfiles();
      setShowLogin(false);
    } catch(e) {
      setAuthError("Erro ao entrar com Google. Tente email e senha.");
    }
    setAuthLoading(false);
  };

  const filtered = shirts.filter(s => s.status !== "rejected").filter(s => {
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
      await fsAdd("shirts",{team:form.team,year:Number(form.year),version:form.version,model:form.model,brand:form.brand,country:form.country,sku:form.sku,tag:form.shirtImg||`https://placehold.co/400x300/1a1a2e/e8e0d0?text=${encodeURIComponent(form.team)}+${form.year}`,tagImg:form.tagImg||"",addedBy:user.name,forSale:form.forSale,votes:0,createdAt:Date.now(),status:"pending"});
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

  const saveProfile = async () => {
    if (!user) return;
    const data = { bio: profileForm.bio, instagram: profileForm.instagram, photo: profileForm.photo || "", username: user.name };
    await fetch(`${BASE_URL}/profiles/${user.name}?key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toFS(data)),
    });
    setProfiles(prev => ({ ...prev, [user.name]: { ...data, id: user.name } }));
    setEditingProfile(false);
    setSuccessMsg("Perfil atualizado!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const startEditProfile = () => {
    const p = profiles[user.name] || {};
    setProfileForm({ bio: p.bio || "", instagram: p.instagram || "", photo: p.photo || null });
    setEditingProfile(true);
  };

  const approveShirt = async (id) => {
    await fsPatch("shirts", id, { status: "approved" });
    setShirts(prev => prev.map(s => s.id===id ? {...s, status:"approved"} : s));
  };

  const rejectShirt = async (id) => {
    await fsPatch("shirts", id, { status: "rejected" });
    setShirts(prev => prev.map(s => s.id===id ? {...s, status:"rejected"} : s));
  };

  const pendingShirts = shirts.filter(s => !s.status || s.status === "pending");
  const approvedShirts = shirts.filter(s => s.status === "approved");
  const rejectedShirts = shirts.filter(s => s.status === "rejected");

  return (
    <div style={{fontFamily:"'Georgia',serif",background:"#0d0d0d",minHeight:"100vh",color:"#e8e0d0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        .kt-header{background:#fff;border-bottom:2px solid #1c4a2a;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;gap:12px;flex-wrap:wrap}
        .kt-logo{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:#1c4a2a;letter-spacing:-0.5px;cursor:pointer} .kt-logo span{color:#1c4a2a}
        .kt-tagline{font-family:'DM Mono',monospace;font-size:9px;color:#2a6a3a;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
        .kt-nav{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
        .kt-nav-btn{background:none;border:1px solid #d0dcd4;color:#4a4a4a;padding:6px 14px;font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.5px;cursor:pointer;transition:all 0.2s}
        .kt-nav-btn:hover,.kt-nav-btn.active{border-color:#1c4a2a;color:#1c4a2a}
        .kt-btn-primary{background:#1c4a2a;color:#fff;border:none;padding:9px 16px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s}
        .kt-btn-primary:hover{background:#2a6a3a} .kt-btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .kt-btn-ghost{background:none;border:1px solid #1c4a2a;color:#1c4a2a;padding:8px 12px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s;text-transform:uppercase}
        .kt-btn-ghost:hover{border-color:#2a6a3a;color:#2a6a3a;background:#f0f7f2}
        .kt-user-chip{display:flex;align-items:center;gap:7px;background:#f5f5f0;border:1px solid #c8d8cc;padding:6px 10px;cursor:pointer;transition:border-color 0.2s}
        .kt-user-chip:hover{border-color:#1c4a2a}
        .kt-user-name{font-family:'Inter',sans-serif;font-size:12px;color:#111;font-weight:500}
        .kt-hero{padding:52px 32px 36px;border-bottom:1px solid #e0e8e2;background:linear-gradient(180deg,#1c4a2a 0%,#2a6a3a 100%)} .kt-btn-label{} body{padding-bottom:70px}
        .kt-hero-label{font-family:'DM Mono',monospace;font-size:10px;color:#a8d4b4;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px}
        .kt-hero h1{font-family:'Playfair Display',serif;font-size:clamp(26px,5vw,52px);font-weight:900;line-height:1.05;color:#fff;max-width:580px;margin-bottom:16px;letter-spacing:-0.5px}
        .kt-stats{display:flex;gap:32px;margin-top:24px;flex-wrap:wrap}
        .kt-stat{border-left:3px solid #a8d4b4;padding-left:14px}
        .kt-stat-num{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:#fff}
        .kt-stat-label{font-family:'DM Mono',monospace;font-size:9px;color:#a8d4b4;letter-spacing:1px;text-transform:uppercase}
        .kt-filters{padding:14px 32px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #e0e8e2;flex-wrap:wrap;background:#fff}
        .kt-search-wrap{position:relative;flex:1;min-width:160px;max-width:320px}
        .kt-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#444}
        .kt-input{background:#fff;border:1px solid #d0dcd4;color:#111;padding:10px 12px 10px 36px;font-family:'Inter',sans-serif;font-size:14px;width:100%;outline:none;transition:all 0.2s}
        .kt-input:focus{border-color:#1c4a2a} .kt-input::placeholder{color:#9ca3af}
        .kt-select{background:#fff;border:1px solid #d0dcd4;color:#111;padding:10px 12px;font-family:'Inter',sans-serif;font-size:14px;outline:none;cursor:pointer;min-width:120px}
        .kt-count{font-family:'Inter',sans-serif;font-size:11px;color:#6b6b6b;margin-left:auto;font-weight:500}
        .kt-grid{padding:24px 32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;background:#f7f7f5}
        .kt-card{background:#fff;border:1px solid #e0e8e2;cursor:pointer;transition:all 0.2s;overflow:hidden;display:flex;flex-direction:column;animation:fadeIn 0.3s ease;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .kt-card:hover{background:#fff;border-color:#1c4a2a;transform:translateY(-2px);box-shadow:0 4px 16px rgba(28,74,42,0.1)}
        .kt-card-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;filter:grayscale(10%);transition:filter 0.3s;border-bottom:1px solid #e0e8e2}
        .kt-card:hover .kt-card-img{filter:grayscale(0%)}
        .kt-card-body{padding:14px 16px 16px;flex:1;display:flex;flex-direction:column}
        .kt-card-team{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#111;margin-bottom:4px}
        .kt-card-meta{font-family:'Inter',sans-serif;font-size:10px;color:#6b6b6b;font-weight:500;letter-spacing:0.3px;text-transform:uppercase;margin-bottom:8px}
        .kt-card-sku{font-family:'DM Mono',monospace;font-size:10px;color:#1c4a2a;background:#e8f4ec;padding:3px 7px;display:inline-flex;align-items:center;gap:4px;margin-bottom:8px;letter-spacing:1px;border:1px solid #c8e0cc}
        .kt-sale-badge{font-family:'Inter',sans-serif;font-size:9px;color:#fff;background:#1c4a2a;padding:3px 8px;display:inline-block;letter-spacing:0.5px;margin-bottom:8px;font-weight:600;text-transform:uppercase}
        .kt-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:9px;border-top:1px solid #e0e8e2}
        .kt-card-by{font-family:'Inter',sans-serif;font-size:11px;color:#6b6b6b;cursor:pointer;transition:color 0.2s;font-weight:500}
        .kt-card-by:hover{color:#1c4a2a}
        .kt-votes{display:flex;align-items:center;gap:4px}
        .kt-vote-btn{background:none;border:1px solid #dde8e2;color:#888;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .kt-vote-btn:hover{border-color:#1c4a2a;color:#1c4a2a} .kt-vote-btn.active-up{border-color:#1c4a2a;color:#1c4a2a;background:#e8f4ec} .kt-vote-btn.active-down{border-color:#aa4444;color:#aa4444;background:#fdf0f0}
        .kt-vote-count{font-family:'Inter',sans-serif;font-size:11px;color:#4a4a4a;min-width:18px;text-align:center;font-weight:600}
        .kt-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:28px 14px;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;backdrop-filter:blur(4px)}
        .kt-modal{background:#fff;border:1px solid #e0e8e2;width:100%;max-width:680px;animation:slideUp 0.25s ease;max-height:90vh;overflow-y:auto}
        .kt-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:2px solid #1c4a2a}
        .kt-modal-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#111}
        .kt-close{background:none;border:1px solid #e0e8e2;color:#888;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .kt-close:hover{border-color:#1c4a2a;color:#1c4a2a}
        .kt-modal-img{width:100%;max-height:260px;object-fit:cover;display:block}
        .kt-modal-body{padding:22px;padding-bottom:32px}
        .kt-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:18px}
        .kt-field label{font-family:'DM Mono',monospace;font-size:9px;color:#888;letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:3px}
        .kt-field-val{font-family:'Inter',sans-serif;font-size:13px;color:#111;font-weight:500}
        .kt-sku-big{font-family:'DM Mono',monospace;font-size:14px;color:#1c4a2a;background:#e8f4ec;padding:6px 11px;display:inline-block;letter-spacing:2px;border:1px solid #c8e0cc;margin-top:5px;font-weight:700}
        .kt-form-field{margin-bottom:13px}
        .kt-form-label{font-family:'Inter',sans-serif;font-size:11px;color:#333;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;display:block;margin-bottom:6px}
        .kt-form-input{background:#fff;border:1px solid #d0dcd4;color:#111;padding:11px 14px;font-family:'Inter',sans-serif;font-size:15px;width:100%;outline:none;transition:all 0.2s;font-weight:400}
        .kt-form-input:focus{border-color:#1c4a2a;background:#fff;box-shadow:0 0 0 3px rgba(28,74,42,0.08)} .kt-form-input::placeholder{color:#aaa}
        .kt-required{color:#1c4a2a;margin-left:2px} @media(max-width:600px){.kt-btn-label{display:none}}
        .kt-error{font-family:'Inter',sans-serif;font-size:12px;color:#b91c1c;margin-top:10px;padding:10px 14px;background:#fef2f2;border-left:3px solid #b91c1c;font-weight:500}
        .kt-success{position:fixed;bottom:28px;right:28px;background:#1c4a2a;border:1px solid #2a6a3a;color:#fff;font-family:'DM Mono',monospace;font-size:11px;padding:12px 18px;z-index:300;letter-spacing:1px;animation:slideUp 0.3s ease}
        .kt-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 28px;gap:14px}
        .kt-loading-text{font-family:'Inter',sans-serif;font-size:12px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase;font-weight:500}
        .kt-empty{padding:60px 28px;text-align:center;font-family:'Inter',sans-serif;color:#6b6b6b;font-size:13px;background:#f7f7f5}
        .kt-page{padding:32px}
        .kt-page-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:#111;margin-bottom:6px}
        .kt-page-sub{font-family:'Inter',sans-serif;font-size:12px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px;font-weight:500}
        .kt-profile-header{background:#fff;border:1px solid #e0e8e2;border-left:4px solid #1c4a2a;padding:24px;margin-bottom:24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .kt-avatar{width:56px;height:56px;background:#e8f4ec;border:2px solid #1c4a2a;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:#c8a84b;flex-shrink:0}
        .kt-profile-name{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:#111}
        .kt-profile-stats{display:flex;gap:20px;margin-top:8px;flex-wrap:wrap}
        .kt-profile-stat{text-align:center}
        .kt-profile-stat-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#1c4a2a}
        .kt-profile-stat-label{font-family:'Inter',sans-serif;font-size:10px;color:#6b6b6b;letter-spacing:0.5px;text-transform:uppercase;font-weight:500}
        .kt-section-title{font-family:'Inter',sans-serif;font-size:11px;color:#1c4a2a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #e0e8e2;font-weight:700}
        .kt-badges{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px}
        .kt-badge{background:#f5f5f0;border:1px solid #e0e8e2;padding:10px 14px;display:flex;align-items:center;gap:8px}
        .kt-badge-icon{font-size:20px}
        .kt-badge-name{font-family:'Inter',sans-serif;font-size:12px;color:#111;font-weight:600}
        .kt-badge-desc{font-family:'Inter',sans-serif;font-size:11px;color:#6b6b6b;margin-top:2px}
        .kt-badge.locked{opacity:0.25;filter:grayscale(1)}
        .kt-ranking-item{display:flex;align-items:center;gap:14px;padding:12px 16px;background:#fff;border:1px solid #e0e8e2;margin-bottom:6px;transition:border-color 0.2s} .kt-ranking-item:hover{border-color:#1c4a2a}
        .kt-rank-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#ccc;min-width:28px}
        .kt-rank-num.top{color:#1c4a2a}
        .kt-rank-name{font-family:'Inter',sans-serif;font-size:13px;color:#111;flex:1;cursor:pointer;font-weight:500}
        .kt-rank-name:hover{color:#1c4a2a}
        .kt-rank-count{font-family:'Inter',sans-serif;font-size:12px;color:#6b6b6b;font-weight:600}
        .kt-checkbox-row{display:flex;align-items:center;gap:10px;padding:12px;background:#f5f5f0;border:1px solid #c8d8cc;cursor:pointer;margin-bottom:14px}
        .kt-checkbox{width:16px;height:16px;border:1px solid #c8d8cc;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .kt-checkbox.checked{background:#1c4a2a;border-color:#1c4a2a}
        .kt-checkbox-label{font-family:'Inter',sans-serif;font-size:13px;color:#333;font-weight:500}
        .kt-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #e0e8e2}
        .kt-tab{font-family:'Inter',sans-serif;font-size:12px;color:#6b6b6b;letter-spacing:0.5px;text-transform:uppercase;padding:12px 18px;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;font-weight:500}
        .kt-tab.active{color:#1c4a2a;border-bottom-color:#1c4a2a}
        @media(max-width:600px){
          .kt-header{padding:12px 16px} .kt-hero{padding:36px 16px 24px} .kt-filters{padding:12px 16px}
          .kt-grid{padding:16px;grid-template-columns:1fr} .kt-field-grid{grid-template-columns:1fr}
          .kt-stats{gap:20px} .kt-modal{margin:0} .kt-overlay{padding:0;align-items:flex-end}
          .kt-page{padding:16px} .kt-profile-header{padding:16px}
        }
      `}</style>

      {/* HEADER */}
      <header className="kt-header">
        <div onClick={()=>setView("catalog")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"#1c4a2a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
          <div>
            <div className="kt-logo">Kit<span>Tag</span></div>
            <div className="kt-tagline">Catálogo colaborativo</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {user && isAdmin(user.name) && (
            <button onClick={()=>setView("admin")} title="Painel Admin" style={{position:"relative",background:view==="admin"?"#1a1600":"none",border:`1px solid ${view==="admin"?"#c8a84b":"#2a2a2a"}`,color:view==="admin"?"#c8a84b":"#666",width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {pendingShirts.length>0 && <span style={{position:"absolute",top:-4,right:-4,background:"#1c4a2a",color:"#fff",fontSize:8,fontFamily:"DM Mono,monospace",fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{pendingShirts.length}</span>}
            </button>
          )}
          {user ? (
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div onClick={()=>{setProfileUser(user.name);setView("profile");}} title="Meu perfil" style={{cursor:"pointer",width:38,height:38,background:"#e8f4ec",border:"2px solid #1c4a2a",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                {profiles[user.name]?.photo
                  ? <img src={profiles[user.name].photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="perfil"/>
                  : <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#1c4a2a",fontWeight:900}}>{user.name[0].toUpperCase()}</span>
                }
              </div>
              <button onClick={handleLogout} title="Sair" style={{background:"none",border:"1px solid #2a2a2a",color:"#4a4a4a",width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <button className="kt-btn-ghost" onClick={()=>setShowLogin(true)} style={{height:38,padding:"0 14px"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Entrar
            </button>
          )}
          <button className="kt-btn-primary" onClick={()=>{ if(!user){setShowLogin(true);}else{setShowForm(true);} }} style={{height:38,padding:"0 14px"}}>
            <PlusIcon />
            <span className="kt-btn-label">Cadastrar</span>
          </button>
        </div>
      </header>

      {/* BOTTOM NAV — mobile */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"2px solid #1c4a2a",display:"flex",zIndex:150,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[
          { id:"catalog", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, label:"Catálogo", action:()=>setView("catalog") },
          { id:"ranking", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, label:"Ranking", action:()=>setView("ranking") },
          { id:"add", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, label:"Cadastrar", action:()=>{ if(!user){setShowLogin(true);}else{setShowForm(true);} }, highlight: true },
          { id:"profile", icon: profiles[user?.name]?.photo
              ? <img src={profiles[user?.name].photo} style={{width:24,height:24,objectFit:"cover",borderRadius:"50%"}} alt="perfil"/>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
            label: user ? "Perfil" : "Entrar", action:()=>{ if(!user){setShowLogin(true);}else{setProfileUser(user.name);setView("profile");} }
          },
        ].map(item => (
          <button key={item.id} onClick={item.action} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"10px 0 8px",background:item.highlight?"#1c4a2a":view===item.id?"#f0f7f2":"none",border:"none",color:item.highlight?"#fff":view===item.id?"#1c4a2a":"#aaa",cursor:"pointer",transition:"all 0.15s",borderTop:view===item.id&&!item.highlight?"2px solid #1c4a2a":"2px solid transparent"}}>
            {item.icon}
            <span style={{fontFamily:"DM Mono,monospace",fontSize:"8px",letterSpacing:"0.5px",textTransform:"uppercase"}}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CATALOG VIEW */}
      {view==="catalog" && <>
        <section className="kt-hero">
          <div className="kt-hero-label">⚽ Arquivo aberto · Comunidade global</div>
          <h1>Cada camisa carrega uma história.</h1>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#c8a84b",letterSpacing:"0.5px",marginBottom:"16px",lineHeight:1.8}}>Um arquivo colaborativo de camisas de futebol.</p>
          <p style={{maxWidth:"540px",lineHeight:1.7,fontSize:"15px",color:"#ffffff",fontFamily:"Inter,sans-serif",marginBottom:"14px"}}>Por trás de cada camisa que amamos existe um detalhe invisível à maioria — a etiqueta. Ela revela a origem, o ano, onde foi produzida e o código original de tudo que tenta imitá-la.</p>
          <p style={{maxWidth:"540px",lineHeight:1.7,fontSize:"15px",color:"#ffffff",fontFamily:"Inter,sans-serif"}}>O KitTag nasceu da obsessão de colecionadores sérios que entendem que preservar uma camisa é também preservar a memória do futebol.</p>
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
              {(!shirt.status || shirt.status === "pending") && <div style={{fontFamily:"DM Mono,monospace",fontSize:"9px",color:"#6b6b6b",background:"#1a1a1a",border:"1px solid #2a2a2a",padding:"2px 6px",display:"inline-block",letterSpacing:"1px",marginBottom:"8px"}}>⏳ AGUARDANDO APROVAÇÃO</div>}
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
          {profiles[profileUser]?.photo
            ? <img src={profiles[profileUser].photo} style={{width:64,height:64,objectFit:"cover",borderRadius:"50%",border:"2px solid #c8a84b",flexShrink:0}} alt="perfil"/>
            : <div className="kt-avatar">{profileUser[0].toUpperCase()}</div>
          }
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div className="kt-profile-name">{profileUser}</div>
              {profiles[profileUser]?.instagram && (
                <a href={`https://instagram.com/${profiles[profileUser].instagram}`} target="_blank" rel="noreferrer" style={{fontFamily:"DM Mono,monospace",fontSize:"10px",color:"#c8a84b",textDecoration:"none",letterSpacing:"1px"}}>
                  @{profiles[profileUser].instagram} ↗
                </a>
              )}
            </div>
            {profiles[profileUser]?.bio && (
              <p style={{fontFamily:"DM Mono,monospace",fontSize:"11px",color:"#666",marginTop:6,lineHeight:1.6,maxWidth:480}}>{profiles[profileUser].bio}</p>
            )}
            <div className="kt-profile-stats" style={{marginTop:12}}>
              {[["total","Camisas"],["teams","Times"],["countries","Países"],["forSale","À venda"]].map(([k,l])=>(
                <div key={k} className="kt-profile-stat">
                  <div className="kt-profile-stat-num">{myStats(profileUser)[k]}</div>
                  <div className="kt-profile-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
          {user && user.name === profileUser && (
            <button className="kt-btn-ghost" onClick={startEditProfile} style={{alignSelf:"flex-start"}}>✏️ Editar perfil</button>
          )}
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
              {(!shirt.status || shirt.status === "pending") && <div style={{fontFamily:"DM Mono,monospace",fontSize:"9px",color:"#6b6b6b",background:"#1a1a1a",border:"1px solid #2a2a2a",padding:"2px 6px",display:"inline-block",letterSpacing:"1px",marginBottom:"8px"}}>⏳ AGUARDANDO APROVAÇÃO</div>}
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

      {/* LOGIN/SIGNUP MODAL */}
      {showLogin && (
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>{setShowLogin(false);setAuthError("");setAuthMode("login");}}>
          <div style={{position:"absolute",inset:0,background:"rgba(28,74,42,0.85)",backdropFilter:"blur(8px)"}}/>
          <div style={{position:"relative",width:"100%",maxWidth:460,background:"#fff",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>

            {/* Header verde */}
            <div style={{background:"linear-gradient(135deg,#1c4a2a 0%,#2a6a3a 100%)",padding:"32px 32px 0",position:"relative"}}>
              <button onClick={()=>{setShowLogin(false);setAuthError("");setAuthMode("login");}} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><XIcon/></button>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                <div style={{width:32,height:32,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#fff"}}>KitTag</span>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:8}}>
                {authMode==="login"&&"Bem-vindo de volta."}{authMode==="signup"&&"Crie sua conta."}{authMode==="forgot"&&"Recuperar acesso."}
              </div>
              <div style={{fontFamily:"Inter,sans-serif",fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.5,marginBottom:24}}>
                {authMode==="login"&&"Entre para acessar sua coleção e o catálogo completo."}
                {authMode==="signup"&&"Junte-se à maior comunidade de camisas originais do mundo."}
                {authMode==="forgot"&&"Enviaremos um link de recuperação para o seu email."}
              </div>
              {authMode!=="forgot"&&(
                <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.2)"}}>
                  {[["login","Entrar"],["signup","Criar conta"]].map(([mode,label])=>(
                    <button key={mode} onClick={()=>{setAuthMode(mode);setAuthError("");}} style={{padding:"10px 20px",background:"none",border:"none",borderBottom:authMode===mode?"2px solid #fff":"2px solid transparent",fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:authMode===mode?700:400,color:authMode===mode?"#fff":"rgba(255,255,255,0.55)",cursor:"pointer",transition:"all 0.2s",marginBottom:"-1px"}}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Corpo */}
            <div style={{padding:"28px 32px 32px"}}>
              {authMode!=="forgot"&&(
                <>
                  <button onClick={handleGoogleLogin} style={{width:"100%",background:"#fff",border:"1.5px solid #e0e8e2",color:"#333",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:500,padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20,transition:"border-color 0.2s"}}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.6-4.2-13.5-10l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
                    Continuar com Google
                  </button>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                    <div style={{flex:1,height:"1px",background:"#e0e8e2"}}/>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#9ca3af",fontWeight:500,letterSpacing:"1px"}}>OU</span>
                    <div style={{flex:1,height:"1px",background:"#e0e8e2"}}/>
                  </div>
                </>
              )}

              {authMode==="signup"&&(
                <div style={{marginBottom:14}}>
                  <label style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#333",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",display:"block",marginBottom:6}}>Nome de usuário *</label>
                  <input style={{width:"100%",background:"#f7f7f5",border:"1.5px solid #e0e8e2",color:"#111",padding:"12px 14px",fontFamily:"Inter,sans-serif",fontSize:15,outline:"none"}} placeholder="Ex: kit_hunter_br" value={authForm.username} onChange={e=>setAuthForm(f=>({...f,username:e.target.value}))}/>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#9ca3af",marginTop:4}}>Aparecerá no seu perfil público</div>
                </div>
              )}

              <div style={{marginBottom:14}}>
                <label style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#333",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",display:"block",marginBottom:6}}>Email *</label>
                <input style={{width:"100%",background:"#f7f7f5",border:"1.5px solid #e0e8e2",color:"#111",padding:"12px 14px",fontFamily:"Inter,sans-serif",fontSize:15,outline:"none"}} placeholder="seu@email.com" type="email" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
              </div>

              {authMode!=="forgot"&&(
                <div style={{marginBottom:authMode==="signup"?14:20}}>
                  <label style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#333",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",display:"block",marginBottom:6}}>Senha *</label>
                  <input style={{width:"100%",background:"#f7f7f5",border:"1.5px solid #e0e8e2",color:"#111",padding:"12px 14px",fontFamily:"Inter,sans-serif",fontSize:15,outline:"none"}} placeholder="Mínimo 6 caracteres" type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
                </div>
              )}

              {authMode==="signup"&&(
                <div style={{marginBottom:20}}>
                  <label style={{fontFamily:"Inter,sans-serif",fontSize:11,color:"#333",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",display:"block",marginBottom:6}}>Confirmar senha *</label>
                  <input style={{width:"100%",background:"#f7f7f5",border:"1.5px solid #e0e8e2",color:"#111",padding:"12px 14px",fontFamily:"Inter,sans-serif",fontSize:15,outline:"none"}} placeholder="Repita a senha" type="password" value={authForm.confirmPassword} onChange={e=>setAuthForm(f=>({...f,confirmPassword:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
                </div>
              )}

              {authError&&(
                <div style={{fontFamily:"Inter,sans-serif",fontSize:12,color:authError.startsWith("✓")?"#166534":"#b91c1c",padding:"12px 16px",background:authError.startsWith("✓")?"#f0fdf4":"#fef2f2",borderLeft:`3px solid ${authError.startsWith("✓")?"#16a34a":"#ef4444"}`,marginBottom:16,fontWeight:500}}>
                  {authError}
                </div>
              )}

              <button style={{width:"100%",background:"#1c4a2a",color:"#fff",border:"none",padding:"15px 20px",fontFamily:"Inter,sans-serif",fontSize:14,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"background 0.2s"}} onClick={handleAuth} disabled={authLoading}>
                {authLoading?<><LoadingIcon/> Aguarde...</>:authMode==="login"?"→  Entrar na minha conta":authMode==="signup"?"→  Criar minha conta":"→  Enviar link de recuperação"}
              </button>

              {authMode==="login"&&(
                <div style={{textAlign:"center",marginTop:16}}>
                  <button onClick={()=>{setAuthMode("forgot");setAuthError("");}} style={{background:"none",border:"none",fontFamily:"Inter,sans-serif",fontSize:12,color:"#6b6b6b",cursor:"pointer",textDecoration:"underline",fontWeight:500}}>
                    Esqueci minha senha
                  </button>
                </div>
              )}
              {authMode==="forgot"&&(
                <div style={{textAlign:"center",marginTop:16}}>
                  <button onClick={()=>{setAuthMode("login");setAuthError("");}} style={{background:"none",border:"none",fontFamily:"Inter,sans-serif",fontSize:12,color:"#6b6b6b",cursor:"pointer",textDecoration:"underline",fontWeight:500}}>
                    ← Voltar para login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

            {/* EDIT PROFILE MODAL */}
      {editingProfile && user && (<div className="kt-overlay" onClick={()=>setEditingProfile(false)}>
        <div className="kt-modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
          <div className="kt-modal-header">
            <div className="kt-modal-title">Editar perfil</div>
            <button className="kt-close" onClick={()=>setEditingProfile(false)}><XIcon/></button>
          </div>
          <div className="kt-modal-body">
            <div className="kt-form-field">
              <label className="kt-form-label">Foto de perfil</label>
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1px dashed #2a2a2a",padding:"20px",cursor:"pointer",gap:"10px",background:profileForm.photo?"#0a1a0a":"#0d0d0d",minHeight:"100px"}}>
                {profileForm.photo
                  ? <img src={profileForm.photo} style={{width:80,height:80,objectFit:"cover",borderRadius:"50%",border:"2px solid #c8a84b"}} alt="perfil"/>
                  : <><span style={{fontSize:"32px"}}>📷</span><span style={{fontFamily:"DM Mono,monospace",fontSize:"10px",color:"#4a4a4a",letterSpacing:"1px"}}>Clique para adicionar foto</span></>
                }
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){const u=URL.createObjectURL(f);setProfileForm(p=>({...p,photo:u}));}}}/>
              </label>
            </div>
            <div className="kt-form-field">
              <label className="kt-form-label">Bio curta</label>
              <input className="kt-form-input" placeholder="Ex: Colecionador desde 2010, foco em camisas europeias" value={profileForm.bio} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} maxLength={120}/>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:"9px",color:"#4a4a4a",marginTop:4,textAlign:"right"}}>{profileForm.bio.length}/120</div>
            </div>
            <div className="kt-form-field">
              <label className="kt-form-label">Instagram</label>
              <div style={{display:"flex",alignItems:"center",gap:0}}>
                <span style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRight:"none",padding:"10px 10px",fontFamily:"DM Mono,monospace",fontSize:"13px",color:"#4a4a4a"}}>@</span>
                <input className="kt-form-input" style={{borderLeft:"none"}} placeholder="seu_perfil" value={profileForm.instagram} onChange={e=>setProfileForm(p=>({...p,instagram:e.target.value.replace("@","")}))}/>
              </div>
            </div>
            <div style={{marginTop:18}}>
              <button className="kt-btn-primary" style={{width:"100%",justifyContent:"center",padding:13}} onClick={saveProfile}>Salvar perfil</button>
            </div>
          </div>
        </div>
      </div>)}

      {/* ADMIN VIEW */}
      {view==="admin" && user && isAdmin(user.name) && <div className="kt-page">
        <div className="kt-page-title">Painel Admin</div>
        <div className="kt-page-sub">Moderação de camisas · KitTag</div>

        <div className="kt-tabs">
          <div className="kt-tab active">⏳ Pendentes ({pendingShirts.length})</div>
          <div className="kt-tab" style={{color:"#4a8a00"}}>✓ Aprovadas ({approvedShirts.length})</div>
          <div className="kt-tab" style={{color:"#aa4444"}}>✗ Rejeitadas ({rejectedShirts.length})</div>
        </div>

        {pendingShirts.length === 0
          ? <div className="kt-empty" style={{padding:"40px 0"}}>Nenhuma camisa aguardando aprovação.</div>
          : <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {pendingShirts.map(shirt=>(
                <div key={shirt.id} style={{background:"#111",border:"1px solid #2a2a2a",display:"flex",gap:16,overflow:"hidden",alignItems:"stretch"}}>
                  <img src={shirt.tag} alt={shirt.team} style={{width:120,height:90,objectFit:"cover",flexShrink:0}}/>
                  <div style={{flex:1,padding:"12px 0",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#e8e0d0",marginBottom:4}}>{shirt.team} {shirt.year}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#4a4a4a",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{shirt.brand} · {shirt.version} · {shirt.model} · {shirt.country}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#c8a84b"}}>{shirt.sku}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"#4a4a4a",marginTop:4}}>por {shirt.addedBy}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,padding:12,justifyContent:"center"}}>
                    <button onClick={()=>approveShirt(shirt.id)} style={{background:"#1a2a00",border:"1px solid #4a8a00",color:"#a0d060",fontFamily:"DM Mono,monospace",fontSize:10,letterSpacing:1,padding:"7px 14px",cursor:"pointer",textTransform:"uppercase"}}>✓ Aprovar</button>
                    <button onClick={()=>rejectShirt(shirt.id)} style={{background:"#1a0000",border:"1px solid #552222",color:"#aa4444",fontFamily:"DM Mono,monospace",fontSize:10,letterSpacing:1,padding:"7px 14px",cursor:"pointer",textTransform:"uppercase"}}>✗ Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>}
    </div>
  );
}
