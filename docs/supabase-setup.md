# Supabase i OAuth postavljanje

## Lokalna konfiguracija

Kreirajte Supabase projekt, kopirajte `.env.example` u `.env` i unesite Project URL te publishable key. Secret/service-role ključ nikada ne ide u browser, Vercel frontend varijable ili Git.

## SQL migracije

Pokrenite datoteke iz `supabase/migrations/` kroz Supabase CLI ili SQL editor. Migracija uključuje tablice, RLS politike, trigger za novi profil/free entitlement i početni premium sadržaj.

## Email i lozinka

- Uključite Email provider i ostavite obaveznu potvrdu emaila.
- Site URL postavite na konačni Vercel URL.
- Redirect allowlist mora sadržavati `http://localhost:5173/` i produkcijski root URL.
- Prije javnog lansiranja postavite vlastiti SMTP, CAPTCHA zaštitu i provjerite rate limits.

## Google OAuth

1. U Google Cloud Console kreirajte OAuth web client.
2. Dodajte `http://localhost:5173` i produkcijski Vercel origin.
3. Kao callback dodajte Supabase callback URL prikazan u Google provider postavkama.
4. Client ID i Client Secret unesite samo u Supabase Dashboard.

Google preview deployi ne rade automatski; svaki preview origin mora biti posebno dopušten.

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
- Nakon prvog deploya ažurirajte Supabase Site URL, redirect allowlist i Google OAuth origin.
