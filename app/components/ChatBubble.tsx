'use client';
import { useState } from 'react';

export function ChatBubble(){
  const [open,setOpen]=useState(false);
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setSending(true);
    const f=new FormData(e.currentTarget);
    try{
      const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'chat',name:f.get('name'),contact:f.get('contact'),message:f.get('message')})});
      if(response.ok) setSent(true);
    }finally{
      setSending(false);
    }
  }

  return <div className="chat">
    {open&&<div className="chat-panel" role="dialog" aria-label="Contact SMRE">
      <div className="chat-panel-head">
        <div><p className="chat-panel-eyebrow">SMRE</p><strong>How can we help?</strong></div>
        <button type="button" className="chat-close" onClick={()=>setOpen(false)} aria-label="Close chat">×</button>
      </div>
      {sent
        ? <div className="chat-success"><span className="chat-success-mark">✓</span><strong>Message received.</strong><p>A member of the SMRE team will follow up shortly.</p></div>
        : <form onSubmit={submit}>
            <label><span>Name</span><input name="name" required autoComplete="name" placeholder="Your name" /></label>
            <label><span>Phone or email</span><input name="contact" required autoComplete="email" placeholder="How should we reach you?" /></label>
            <label><span>Message</span><textarea name="message" required placeholder="What can we help with?" /></label>
            <button className="button button-dark" disabled={sending}>{sending?'Sending…':'Send message'}</button>
          </form>}
    </div>}
    <button className={`chat-button${open?' is-open':''}`} onClick={()=>setOpen(!open)} aria-label={open?'Close chat':'Open chat'} aria-expanded={open}>
      <span className="chat-button-icon" aria-hidden="true">{open?'×':'✦'}</span>
      <span className="chat-button-label">{open?'Close':'Chat'}</span>
    </button>
  </div>
}
