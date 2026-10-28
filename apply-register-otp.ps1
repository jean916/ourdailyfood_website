$ErrorActionPreference = 'Stop'
if (-not [System.IO.File]::Exists((Join-Path (Get-Location).Path 'package.json'))) { throw "Run this from the project root." }
$utf8 = New-Object System.Text.UTF8Encoding($false)
$root = (Get-Location).Path
if (Test-Path .git) { git add -A | Out-Null; git commit -m "backup before register OTP" 2>&1 | Out-Null }

function Write-Utf8([string]$rel, [string]$text) {
  $full = Join-Path $root $rel
  $dir = Split-Path $full -Parent
  if (-not [System.IO.Directory]::Exists($dir)) { [System.IO.Directory]::CreateDirectory($dir) | Out-Null }
  [System.IO.File]::WriteAllText($full, $text, $utf8)
  Write-Host "written: $rel" -ForegroundColor Green
}
function Patch([string]$rel, [string]$old, [string]$new, [string]$label) {
  $full = Join-Path $root $rel
  if (-not [System.IO.File]::Exists($full)) { Write-Warning "$label : file not found ($rel)"; return }
  $t = [System.IO.File]::ReadAllText($full)
  if ($t.Contains($new)) { Write-Host "already applied: $label" -ForegroundColor DarkGray; return }
  $i = $t.IndexOf($old)
  if ($i -lt 0) { Write-Warning "ANCHOR NOT FOUND: $label (edit $rel by hand)"; return }
  [System.IO.File]::WriteAllText($full, $t.Substring(0,$i) + $new + $t.Substring($i + $old.Length), $utf8)
  Write-Host "patched: $label" -ForegroundColor Green
}

# 1. phone format check on the server
Patch 'lib\validators.ts' 'phone: z.string().trim().max(30).optional().or(z.literal(""))' 'phone: z.string().trim().regex(/^07[2389]\d{7}$/).optional().or(z.literal(""))' 'validator: phone like 0788123456'

# 2. register API with OTP
$c = @'
import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {createHash,randomInt} from "crypto";
import {prisma} from "@/lib/prisma";
import {createSession} from "@/lib/auth";
import {registerSchema} from "@/lib/validators";

const hash=(userId:string,code:string)=>createHash('sha256').update(userId+':'+code).digest('hex');

// New customers confirm their account with the same one-time code used at login.
// LOGIN_OTP in .env: "demo" (default) shows the code on screen, "off" signs in directly.
export async function POST(req:Request){
  try{
    const parsed=registerSchema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Please provide a valid name, email, password (8+ characters) and, if you add a phone, a number like 0788123456."},{status:400});
    const {name,email,phone,password}=parsed.data;
    const exists=await prisma.user.findUnique({where:{email}});
    if(exists)return NextResponse.json({error:"An account with this email already exists."},{status:409});
    const user=await prisma.user.create({data:{name,email,phone:phone||null,passwordHash:await bcrypt.hash(password,12),role:"CUSTOMER"}});
    const publicUser={id:user.id,name:user.name,email:user.email,role:user.role};

    const mode=process.env.LOGIN_OTP||'demo';
    if(mode==='off'){
      await createSession(publicUser);
      return NextResponse.json({user:publicUser},{status:201});
    }
    if(mode!=='demo')return NextResponse.json({error:'OTP delivery is not configured. Set LOGIN_OTP to "demo" or "off" in .env.'},{status:500});

    const otp=String(randomInt(100000,1000000));
    await prisma.user.update({where:{id:user.id},data:{otpHash:hash(user.id,otp),otpExpiresAt:new Date(Date.now()+5*60*1000),otpAttempts:0}});
    console.log('[DEMO OTP] '+user.email+' : '+otp);
    return NextResponse.json({otpRequired:true,email:user.email,expiresInMinutes:5,demoCode:otp,message:'Demo mode: no SMS or email is sent, so the code is shown here.'},{status:201});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Registration failed. Check the server configuration."},{status:500});
  }
}
'@
Write-Utf8 'app\api\auth\register\route.ts' $c

# 3. register page with code step and "next" support
$c = @'
"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

async function post(url:string,body:Record<string,unknown>){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||'Request failed');
  return d;
}

export default function RegisterPage(){
  const router=useRouter();
  const [step,setStep]=useState<'details'|'otp'>('details');
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");
  const [demoCode,setDemoCode]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [qs,setQs]=useState("");

  useEffect(()=>{
    const n=new URLSearchParams(window.location.search).get('next');
    setQs(n?'?next='+encodeURIComponent(n):'');
  },[]);

  function finish(){
    const next=new URLSearchParams(window.location.search).get('next');
    const safe=next&&next.startsWith('/')&&!next.startsWith('//')?next:null;
    router.push(safe||'/menu');
    router.refresh();
  }

  async function submitDetails(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{
      const d=await post('/api/auth/register',{name,email,phone,password});
      if(d.otpRequired){setDemoCode(d.demoCode||"");setCode("");setStep('otp')}
      else finish();
    }catch(err){setError(err instanceof Error?err.message:'Registration failed')}
    finally{setBusy(false)}
  }

  async function submitCode(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{
      await post('/api/auth/verify-otp',{email,code});
      finish();
    }catch(err){setError(err instanceof Error?err.message:'Verification failed')}
    finally{setBusy(false)}
  }

  if(step==='otp'){
    return <>
      <h1>Confirm your account</h1>
      <p className="muted">Your account was created. Enter the 6-digit code (OTP) for {email} to finish. It expires in 5 minutes.</p>
      <form className="form" onSubmit={submitCode}>
        {demoCode&&<div className="notice"><strong>Demo OTP: {demoCode}</strong><br/>A real system sends this by SMS or email.</div>}
        <div className="field"><label htmlFor="code">6-digit code</label>
          <input id="code" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={e=>setCode(e.target.value)}/>
        </div>
        {error&&<p className="form-error">{error}</p>}
        <button disabled={busy||code.length!==6}>{busy?'Checking...':'Verify and continue'}</button>
        <p className="muted small">Code lost or expired? <Link href={'/login'+qs}>Sign in</Link> to get a new one.</p>
      </form>
    </>;
  }

  return <>
    <h1>Create your account</h1>
    <p className="muted">Registration creates a customer account. Staff roles are assigned by an administrator.</p>
    <form className="form" onSubmit={submitDetails}>
      <div className="field"><label htmlFor="name">Full name</label>
        <input id="name" required minLength={2} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/>
      </div>
      <div className="field"><label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
      </div>
      <div className="field"><label htmlFor="phone">Phone (optional, for example 0788123456)</label>
        <input id="phone" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" inputMode="numeric" maxLength={10} placeholder="0788123456"/>
      </div>
      <div className="field"><label htmlFor="password">Password (at least 8 characters)</label>
        <input id="password" type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/>
      </div>
      {error&&<p className="form-error">{error}</p>}
      <button disabled={busy}>{busy?'Creating account...':'Create account'}</button>
      <p>Already registered? <Link href={'/login'+qs}>Sign in</Link></p>
    </form>
  </>;
}
'@
Write-Utf8 'app\register\page.tsx' $c

# 4. login page keeps "next" when linking to register
Patch 'app\login\page.tsx' 'import {useState} from "react";' 'import {useEffect,useState} from "react";' 'login page: import useEffect'
Patch 'app\login\page.tsx' 'const [busy,setBusy]=useState(false);' 'const [busy,setBusy]=useState(false);const [qs,setQs]=useState("");useEffect(()=>{const n=new URLSearchParams(window.location.search).get(''next'');setQs(n?''?next=''+encodeURIComponent(n):'''')},[]);' 'login page: remember next'
Patch 'app\login\page.tsx' '<p>New here? <Link href="/register">Create a customer account</Link></p>' '<p>New here? <Link href={''/register''+qs}>Create a customer account</Link></p>' 'login page: register link keeps next'

# 5. pay box fills in the phone saved in the profile
Patch 'components\PayNowButton.tsx' 'import {useState} from "react";' 'import {useEffect,useState} from "react";' 'pay box: import useEffect'
Patch 'components\PayNowButton.tsx' 'const [msg,setMsg]=useState("");' 'const [msg,setMsg]=useState("");useEffect(()=>{fetch(''/api/profile'').then(r=>r.json()).then(d=>{if(d.user&&d.user.phone&&/^07[2389]\d{7}$/.test(d.user.phone))setPhone(d.user.phone)}).catch(()=>{})},[]);' 'pay box: prefill phone from profile'

npm run typecheck
Write-Host "`nDone. Restart npm run dev, then Ctrl+F5." -ForegroundColor Green