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

## Simulacija ispita

- U free verziji CTA vodi na Postavke.
- Premium simulacija je dostupna samo korisniku s aktivnim Supabase entitlementom.
- Timer se prikazuje i odbrojava.
- Rezultat prikazuje procenat, prolaz/pad status i pogrešna pitanja.

## Flashcards i priručnik

- Flashcard se okreće na klik/tap.
- Prethodna/sljedeća kartica rade bez preskakanja.
- Pretraga pronalazi guide sekcije i pitanja po keywordima.
- Premium pitanja su označena u pretrazi.

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
