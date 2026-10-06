'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function AdminLogin(){
 const [mode,setMode]=useState<'login'|'reset'>('login');
 const [password,setPassword]=useState('');
 const [resetCode,setResetCode]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const router=useRouter();

 async function submit(e:React.FormEvent){
  e.preventDefault();
  setBusy(true);setError('');setMessage('');
  const endpoint=mode==='login'?'/api/admin/login':'/api/admin/reset';
  const body=mode==='login'?{password}:{resetCode,newPassword};
  const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(r.ok){
    if(mode==='login') router.push('/admin');
    else {setMode('login');setPassword('');setResetCode('');setNewPassword('');setMessage('Password reset. You can sign in with your new password.');}
  }else setError(data.error||'Unable to complete the request.');
  setBusy(false);
 }

 return <main className="admin-shell"><div className="admin-login">
  <p className="eyebrow">SMRE ADMIN</p>
  <h1>{mode==='login'?'Sign in.':'Reset password.'}</h1>
  <p>{mode==='login'?'Private website administration.':'Use your admin reset code to choose a new password.'}</p>
  <form onSubmit={submit}>
   {mode==='login'?<label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>:<>
    <label>Reset code<input type="password" value={resetCode} onChange={e=>setResetCode(e.target.value)} autoComplete="off" required/></label>
    <label>New password<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={10} autoComplete="new-password" required/></label>
   </>}
   {error&&<p className="admin-error">{error}</p>}
   {message&&<p className="admin-success">{message}</p>}
   <button className="button button-dark" disabled={busy}>{busy?(mode==='login'?'Signing in…':'Resetting…'):(mode==='login'?'Sign in':'Reset password')}</button>
  </form>
  <button type="button" className="admin-login-toggle" onClick={()=>{setMode(mode==='login'?'reset':'login');setError('');setMessage('')}}>{mode==='login'?'Forgot your password?':'Back to sign in'}</button>
 </div></main>
}
