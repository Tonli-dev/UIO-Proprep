# UIO ProPrep

Mobile-first HTML/CSS/JavaScript PWA za pripremu UIO stručnog ispita. Free sadržaj i napredak rade offline; Supabase prijava dodaje sinkronizaciju između uređaja i zaštićeni premium sadržaj.

## Tehnologije

- Vite, obični HTML/CSS/JavaScript moduli
- `vite-plugin-pwa` inject-manifest service worker
- Supabase Auth, Postgres i Row Level Security
- Vitest
- Vercel deploy

## Lokalno pokretanje

```bash
npm install
cp .env.example .env
npm run dev
```

Otvorite `http://localhost:5173`. Aplikacija radi kao gost i bez Supabase varijabli; prijava, cloud sync i premium dohvat tada su namjerno nedostupni.

## Skripte

```bash
npm run dev
npm run build
npm run preview
npm test
npm run validate:content
npm run import:questions -- "/putanja/do/PITANJA-SSS-OBJAVA-KONACNO.docx"
npm run split:premium
```

## Sadržaj

- Free pitanja: `public/data/questions.json`
- Premium pitanja: `public.premium_questions` u Supabaseu
- Početni premium seed i RLS: `supabase/migrations/20260604120000_auth_sync_and_premium.sql`
- Šablon pitanja: `data/question-template.json`
- Ponovljivi DOCX importer: `scripts/import-questions-docx.py`

Kompletni dostavljeni SSS set sadrži 180 pitanja. Importer čuva direktne odgovore bez izmišljanja ponuđenih odgovora:

```bash
npm run import:questions -- "/putanja/do/PITANJA-SSS-OBJAVA-KONACNO.docx"
npm run split:premium
npm run validate:content
```

Rezultat i poznate nejasnoće izvornog dokumenta opisani su u `docs/content-import-report.md`.

Workflow za free pitanje:

1. Dodajte provjereno pitanje u `public/data/questions.json`.
2. Pokrenite `npm run validate:content`.
3. Pokrenite `npm run dev` i ručno testirajte kviz, kartice i pretragu.

Premium pitanja se ne smiju vraćati u javni JSON. Dodaju se versioniranom SQL migracijom ili sigurnim server-side admin tokom u budućnosti.

## Supabase

Kopirajte `.env.example` u `.env` i unesite samo javne browser varijable:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PUBLIC_APP_URL=https://carina.tonli.dev
```

Detaljna konfiguracija email potvrde, Google OAutha, migracija, premium prava i Vercela opisana je u `docs/supabase-setup.md`.

Premium kupovina koristi Lemon Squeezy checkout preko Supabase Edge Functions:

- `create-premium-checkout` za prijavljene korisnike
- `lemon-webhook` za potpisane Lemon Squeezy webhook evente

Checkout se ne aktivira produkcijski dok Lemon Squeezy account, proizvodi, varijante i secrets nisu podešeni.

## Lokalni storage i sync

Storage v3 čuva legacy baseline, nepromjenjive answer evente, pokušaje, offline queue, zadnji sync i vremenski ograničen premium cache. Prva prijava pametno spaja lokalne i cloud podatke bez zbrajanja istog legacy baselinea.

## Sigurnost

- Secret/service-role ključ nikada ne ide u frontend ili repo.
- RLS ograničava korisnika na vlastiti profil, napredak i entitlement.
- Premium pitanja može čitati samo korisnik s aktivnim premium entitlementom.
- Service worker cacheira samo same-origin app shell/free sadržaj, ne Supabase Auth/API zahtjeve.

UIO ProPrep je nezavisni obrazovni alat i nije zvanično povezan s Upravom za indirektno oporezivanje BiH.
