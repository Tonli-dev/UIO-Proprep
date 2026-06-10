# Manual QA checklist

## Račun i sinkronizacija

- [ ] Gost može koristiti free sadržaj bez `.env` konfiguracije.
- [ ] Email registracija traži potvrdu emaila.
- [ ] Google i email prijava vraćaju korisnika na root aplikacije.
- [ ] Prvi login prenosi lokalni napredak u cloud bez dupliranja.
- [ ] Offline odgovori ostaju lokalno i sinkroniziraju se nakon povratka mreže.
- [ ] Ručni sync, odjava, promjena imena i reset lozinke rade.
- [ ] Reset prijavljenog korisnika briše lokalni i cloud napredak.
- [ ] Free korisnik direktnim Supabase upitom ne može dohvatiti premium pitanja.
- [ ] Manipulacija localStorage-a ne dodjeljuje premium pravo.
- [ ] Premium cache prestaje vrijediti nakon isteka entitlementa.
- [ ] Supabase Auth leaked password protection je uključen.
- [ ] Supabase Auth SMTP koristi verificirani Resend sender na `tonli.dev`.

Pokrenuti aplikaciju:

```bash
npm run dev
```

Otvoriti `http://localhost:5173`.

## Dashboard

- Prikazuje broj pitanja i cilj `180`.
- Prikazuje `50/180` pitanja za gosta i `180/180` za premium korisnika.
- Prikazuje free/premium status sadržaja.
- Statistike su `0` na čistom browser storage-u.
- Reset napretka gosta briše lokalnu statistiku i historiju.

## Kvizovi

- Direktno pitanje prvo prikazuje poziv na prisjećanje, zatim tačan odgovor i samoprocjenu.
- Pitanje s ponuđenim odgovorima prikazuje sve odgovore iz izvornog dokumenta.
- Kviz po oblasti se pokreće za svaku oblast sa dostupnim free pitanjima.
- “Sva dostupna pitanja” miješa pitanja iz više oblasti.
- “Samo pogrešna pitanja” je zaključano dok ne postoji pogrešan odgovor.
- Nakon pogrešnog odgovora pitanje se pojavljuje u režimu pogrešnih pitanja.
- Nakon tačnog odgovora na isto pitanje uklanja se iz pogrešnih pitanja.
- Crvena zastavica “Prijavi pitanje” je vidljiva uz svako pitanje.
- Gost koji pokuša prijaviti pitanje dobije poruku i modal za prijavu.
- Prijavljen korisnik može upisati predloženi tačan odgovor i dodatnu napomenu.
- Poslana prijava se vidi u Supabase `question_reports` sa statusom `pending`.
- Ponovna prijava istog pitanja prije obrade prikazuje poruku da report već čeka pregled.

## Simulacija ispita

- U free verziji CTA vodi na Postavke.
- Premium simulacija je dostupna samo korisniku s aktivnim Supabase entitlementom.
- Timer se prikazuje i odbrojava.
- Rezultat prikazuje procenat, prolaz/pad status i pogrešna pitanja.

## Flashcards i priručnik

- Flashcard se okreće na klik/tap.
- Kartice se generiraju u setovima od 10 nasumičnih pitanja.
- Nakon 10/10 kartice aktivira se “Generiraj novih 10”.
- Beskonačni mod automatski dodaje novi set i nastavlja bez reload-a.
- Duga pitanja i odgovori ne izlaze iz kartice na mobilnom prikazu.
- Prethodna/sljedeća kartica rade bez preskakanja.
- Pretraga pronalazi guide sekcije i pitanja po keywordima.
- Premium pitanja su označena u pretrazi.

## Premium checkout

- Gost na Račun stranici vidi pricing, ali CTA otvara login modal.
- Prijavljeni free korisnik vidi pakete 30 dana / 90 dana / zauvijek.
- Klik na paket kreira Lemon checkout za ispravan package id.
- Checkout return `?checkout=success` prikazuje toast i osvježava account stanje.
- Lemon webhook s nevalidnim potpisom vraća grešku i ne mijenja bazu.
- Lemon paid event upisuje `premium_purchases` i aktivira entitlement.
- 30/90 dana se produžavaju od trenutnog aktivnog isteka.
- Lifetime paket postavlja premium bez datuma isteka.
- Refund/chargeback event označava kupovinu i rekalkuliše entitlement.

## PWA/offline

- Header prikazuje offline status.
- Nakon prvog učitavanja aplikacija radi nakon reload-a bez mreže.
- Service worker update prikazuje “Nova verzija dostupna” i dugme za osvježavanje.
- Android/iPhone upute su vidljive u Postavkama.

## Mobilni prikaz

- Sidebar navigacija se horizontalno skrola.
- Kviz akcije su vidljive i dostupne pri dnu ekrana.
- Answer kartice ne izlaze van širine ekrana.
- Result score i pogrešna pitanja su čitljivi na mobitelu.
- Premium pricing kartice su čitljive i CTA dugmad imaju dovoljan razmak.

## Legal i launch

- `carina.tonli.dev` je primarna Vercel domena.
- Supabase Site URL, redirect allowlist i Google OAuth origin uključuju `carina.tonli.dev`.
- Terms, Privacy i Refund policy linkovi rade iz signup modala.
- Footer/legal napomena jasno kaže da aplikacija nije zvanična UIO aplikacija i ne garantuje prolaz.
- Prije launcha ručno su pregledana sva pitanja iz `docs/content-import-report.md`, posebno duplirane formulacije.
