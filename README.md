# Mail Service — tumhari apni reusable mail bhejne wali service

Ek chhota sa project. Iska sirf ek kaam hai: **mail bhejna**.
PlayTube, EventPass, ya koi bhi future project isko HTTPS par call karega,
aur ye tumhare **apne Gmail SMTP** se mail bhej degi.

## Kyun alag service? (problem yaad karo)

- Gmail SMTP port **587** par chalta hai.
- **Render free** port 587 block karta hai — isliye PlayTube (Render) se
  Gmail SMTP kabhi connect hi nahi hota. Localhost par sab chalta hai.
- **Vercel** port 587 block nahi karta. Isliye ye service Vercel par rahegi.
- Tumhare projects is service ko **port 443 (HTTPS)** par call karte hai —
  443 kahin block nahi hota.

Flow:
```
PlayTube (Render) --HTTPS 443--> Mail Service (Vercel) --SMTP 587--> Gmail --> user ka inbox
```

## Files

| File | Kaam |
|---|---|
| `api/send-mail.js` | POST `/api/send-mail` — secret key check, fir Gmail SMTP se mail |
| `api/health.js` | GET `/api/health` — service live hai ya nahi, bina mail bheje test |
| `client-example/playtube-sendMail.js` | PlayTube me lagane wali ready file (neeche dekho) |

## Deploy steps (isi order me)

### Step 1 — Secret key banao
Ek lamba random text banao, jaise 32+ characters (password generator use kar sakte ho).
Ye key 2 jagah SAME rahegi: is service me aur har project me jo isko call karega.
**Key mujhe ya kisi ko chat me mat bhejna** — seedha env me dalna hai.

### Step 2 — GitHub par repo banao
Is folder ko ek naye repo (jaise `mail-service`) me push karo.
`.env` file commit mat karna — `.gitignore` me pehle se hai.

### Step 3 — Vercel par import karo
vercel.com → Add New Project → apna `mail-service` repo select → Deploy.
Framework preset: **Other** (kuch select karne ki zarurat nahi, `api/` folder apne aap functions ban jayega).

### Step 4 — Vercel env vars dalo
Project → Settings → Environment Variables:
- `MAIL_USER` — tumhara Gmail
- `MAIL_APP_PASSWORD` — Gmail App Password (jo PlayTube ke liye banaya tha; wahi chalega)
- `MAIL_SERVICE_API_KEY` — Step 1 wali secret key
- `FROM_NAME` — `PlayTube` (optional)

Env dalne ke baad ek baar **Redeploy** karo (Deployments → ... → Redeploy),
taaki naye vars lagein.

### Step 5 — PEHLA TEST (sabse important)
Browser me kholo: `https://<your-service>.vercel.app/api/health`
→ `smtpConfigured: true` aur `keyConfigured: true` aana chahiye.

Fir ek asli mail test — apne computer se ye command chalao
(`YOUR_KEY` aur apna email badal kar):
```
curl -X POST https://<your-service>.vercel.app/api/send-mail -H "content-type: application/json" -H "x-api-key: YOUR_KEY" -d "{\"to\":\"your-email@example.com\",\"subject\":\"Mail service test\",\"html\":\"<h2>It works</h2>\"}"
```
Mail inbox me aayi → **SMTP Vercel se kaam kar raha hai, problem solved.**
Mail nahi aayi aur error aaya → wo error mujhe bhejo, wahi se aage debug hoga.
**Ye test pass hue bina PlayTube me kuch mat badalna.**

## PlayTube me lagana (Step 5 pass hone ke BAAD)

1. `client-example/playtube-sendMail.js` ko PlayTube backend me
   `src/utils/sendMail.js` ki jagah rakho (purani file replace).
2. PlayTube ke env (local `.env` + Render dono) me dalo:
   - `MAIL_SERVICE_URL=https://<your-service>.vercel.app`
   - `MAIL_SERVICE_API_KEY=` wahi secret key
3. Git push → Render auto-deploy → live site par register karke OTP test karo.
4. Bas. Koi controller, Redis, frontend — kuch change nahi.
   Purane `MAIL_USER` / `MAIL_APP_PASSWORD` PlayTube ke Render env se hata sakte ho
   (wo ab sirf mail-service me chahiye).

## Kisi naye project me use karna

Apne backend se bas itna call karo:
```js
await fetch(`${process.env.MAIL_SERVICE_URL}/api/send-mail`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": process.env.MAIL_SERVICE_API_KEY },
  body: JSON.stringify({ to, subject, html, fromName: "MyProject" }),
});
```

## Dhyan rahe

- Secret key **kabhi frontend me mat dalna** — sirf backend se call hoga.
- Gmail ki limit ~500 mail/day hai (free Gmail) — OTP use ke liye kaafi hai.
- OTP banana aur Redis me rakhna har project apne paas hi rakhega.
  Ye service sirf mail bhejti hai, OTP ka logic isme nahi hai.
