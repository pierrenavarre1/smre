'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function AdminLogin(){
 const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');const r=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});if(r.ok)router.push('/admin');else setError((await r.json()).error||'Unable to sign in.');setBusy(false);}
 return <main className="admin-shell"><div className="admin-login"><p className="eyebrow">SMRE ADMIN</p><h1>Sign in.</h1><p>Private website administration.</p><form onSubmit={submit}><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<p className="admin-error">{error}</p>}<button className="button button-dark" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form></div></main>
}
