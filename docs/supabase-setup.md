# Supabase i OAuth postavljanje

## Lokalna konfiguracija

Kreirajte Supabase projekt, kopirajte `.env.example` u `.env` i unesite Project URL te publishable key. Secret/service-role ključ nikada ne ide u browser, Vercel frontend varijable ili Git.

## SQL migracije

Pokrenite datoteke iz `supabase/migrations/` kroz Supabase CLI ili SQL editor. Migracija uključuje tablice, RLS politike, trigger za novi profil/free entitlement i početni premium sadržaj.

## Email i lozinka

- Uključite Email provider i ostavite obaveznu potvrdu emaila.
- Site URL postavite na `https://carina.tonli.dev/`, ne na localhost.
- Redirect allowlist mora sadržavati `http://localhost:5173/**`, `http://127.0.0.1:5173/**`, `https://carina.tonli.dev/**` i `https://uio-proprep.vercel.app/**`.
- U Vercelu postavite `VITE_PUBLIC_APP_URL=https://carina.tonli.dev`.
- U Auth email templateima koristite `{{ .ConfirmationURL }}` za dugme potvrde. Ako ručno sastavljate link, koristite `{{ .RedirectTo }}`, ne `{{ .SiteURL }}`.
- Prije javnog lansiranja postavite vlastiti SMTP, leaked password protection, CAPTCHA zaštitu i provjerite rate limits.

## Google OAuth

1. U Google Cloud Console kreirajte OAuth web client.
2. Dodajte `http://localhost:5173`, `http://127.0.0.1:5173`, `https://carina.tonli.dev` i `https://uio-proprep.vercel.app` kao dozvoljene origine.
3. Kao callback dodajte Supabase callback URL prikazan u Google provider postavkama.
4. Client ID i Client Secret unesite samo u Supabase Dashboard.

Google preview deployi ne rade automatski; svaki preview origin mora biti posebno dopušten.

## Prijave netačnih pitanja

Migracija `20260610141729_create_question_reports.sql` dodaje tablicu `question_reports`.
Samo prijavljeni korisnici mogu poslati prijavu i čitati vlastite prijave. Korisnik ne može
mijenjati status niti brisati prijavu. Pregled svih prijava radi se u Supabase Dashboardu:

1. Otvorite **Table Editor → question_reports**.
2. Filtrirajte `status = pending`.
3. Nakon ispravke pitanja postavite `status` na `resolved` i po želji popunite `resolution_note`.
4. Ako prijava nije osnovana, postavite `status` na `dismissed`.

## Premium pravo

Premium se dodjeljuje samo server-side izmjenom `public.entitlements`. Browser nema RLS policy za promjenu entitlementa niti premium pitanja.

```sql
update public.entitlements
set tier = 'premium', expires_at = now() + interval '30 days', updated_at = now()
where user_id = 'USER_UUID';
```

## Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Dodajte `VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Dodajte `VITE_PUBLIC_APP_URL=https://carina.tonli.dev`.
- Nakon prvog deploya ažurirajte Supabase Site URL, redirect allowlist i Google OAuth origin.
- Ako Vercel preusmjerava na `carina.tonli.dev`, ta domena mora imati DNS podešen prema Vercelu ili custom domain treba privremeno ukloniti iz Vercel projekta.

## Lemon Squeezy premium kupovina

Premium kupovina radi kroz dvije Edge Function rute:

- `create-premium-checkout`: poziva je prijavljeni korisnik iz browsera i zahtijeva validan Supabase JWT.
- `lemon-webhook`: poziva je Lemon Squeezy i ima `verify_jwt = false`; pristup štiti `x-signature` HMAC verifikacija.

Prije produkcije otvorite Lemon Squeezy account i provjerite onboarding za fizičko lice iz BiH. Ako account nije odobren, nemojte aktivirati payment flow; nastavite ručno dodjeljivanje entitlements dok ne izaberete fallback provider.

Kreirajte tri one-time varijante/proizvoda:

- `premium_30_days`: 20 KM
- `premium_90_days`: 35 KM
- `premium_lifetime`: 60 KM

Postavite Edge Function secrets:

```bash
npx supabase secrets set PUBLIC_APP_URL=https://carina.tonli.dev --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set LEMON_SQUEEZY_API_KEY=... --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set LEMON_SQUEEZY_STORE_ID=... --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set LEMON_SQUEEZY_VARIANT_30_DAYS=... --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set LEMON_SQUEEZY_VARIANT_90_DAYS=... --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set LEMON_SQUEEZY_VARIANT_LIFETIME=... --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set LEMON_SQUEEZY_WEBHOOK_SECRET=... --project-ref uzgmaxfzkbkmyjmylpow
```

Za test mode dodajte:

```bash
npx supabase secrets set LEMON_SQUEEZY_TEST_MODE=true --project-ref uzgmaxfzkbkmyjmylpow
```

Deploy funkcija:

```bash
npx supabase functions deploy create-premium-checkout --project-ref uzgmaxfzkbkmyjmylpow
npx supabase functions deploy lemon-webhook --no-verify-jwt --project-ref uzgmaxfzkbkmyjmylpow
```

Webhook URL:

```text
https://uzgmaxfzkbkmyjmylpow.supabase.co/functions/v1/lemon-webhook
```

Webhook mora slati evente za uspješnu kupovinu i refund. Nakon refund/chargeback eventa aplikacija rekalkuliše premium pravo iz preostalih validnih kupovina.

## Resend API i testna Edge Function

Resend API ključ nikada ne stavljajte u frontend, `.env` u korijenu aplikacije ili Git. Funkcija `send-test-email` čita ključ iz Supabase Edge Function secreta.

U [Resend API Keys](https://resend.com/api-keys) kreirajte ključ, zatim zamijenite `re_xxxxxxxxx` svojim stvarnim API ključem pri postavljanju secreta:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxx --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set RESEND_FROM_EMAIL=onboarding@resend.dev --project-ref uzgmaxfzkbkmyjmylpow
npx supabase secrets set RESEND_TEST_RECIPIENT=antonio@tonli.dev --project-ref uzgmaxfzkbkmyjmylpow
```

Za produkciju verificirajte svoju domenu u Resendu i zamijenite `onboarding@resend.dev` adresom s te domene.

Deploy funkcije:

```bash
npx supabase functions deploy send-test-email --project-ref uzgmaxfzkbkmyjmylpow
```

Funkcija zahtijeva prijavljenog Supabase korisnika. Poziv iz browser aplikacije:

```js
const { data, error } = await supabase.functions.invoke("send-test-email", {
  method: "POST"
});
```

Ova funkcija šalje samo testni email. Za potvrde registracije i reset lozinke koristite Resend SMTP u Supabase `Authentication → SMTP Settings`, ili posebno konfigurirajte Supabase Send Email Hook.
