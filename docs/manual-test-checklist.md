# Manual QA checklist

Pokrenuti aplikaciju:

```bash
python3 -m http.server 8080
```

Otvoriti `http://127.0.0.1:8080`.

## Dashboard

- Prikazuje broj pitanja i cilj `150`.
- Prikazuje free/premium status sadržaja.
- Statistike su `0` na čistom browser storage-u.
- Reset napretka briše statistiku, historiju i premium demo unlock.

## Kvizovi

- Kviz po oblasti se pokreće za svaku oblast sa dostupnim free pitanjima.
- “Sva dostupna pitanja” miješa pitanja iz više oblasti.
- “Samo pogrešna pitanja” je zaključano dok ne postoji pogrešan odgovor.
- Nakon pogrešnog odgovora pitanje se pojavljuje u režimu pogrešnih pitanja.
- Nakon tačnog odgovora na isto pitanje uklanja se iz pogrešnih pitanja.

## Simulacija ispita

- U free verziji CTA vodi na Postavke.
- Demo kod `UIO-PREMIUM-2026` otključava simulaciju.
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
