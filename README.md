# UIO ProPrep

Statička HTML/CSS/JS PWA aplikacija za učenje pitanja za stručni ispit.

## Šta je uključeno

- Kviz po oblastima
- Režimi učenja: sva dostupna pitanja, pogrešna pitanja i simulacija ispita
- Kartice za ponavljanje
- Lokalni priručnik sa pretragom
- Lokalno čuvanje napretka preko `localStorage`
- PWA manifest i service worker za offline rad
- Pitanja u `data/questions.json`, bez baze podataka
- Free/premium MVP razdvajanje sadržaja bez prave naplatne zaštite

## Pokretanje lokalno

```bash
python3 -m http.server 8080
```

Zatim otvoriti:

```text
http://localhost:8080
```

## Validacija sadržaja

```bash
node scripts/validate-content.mjs
```

Validator provjerava stabilni schema pitanja: `id`, `categoryId`, 4 odgovora, `answerIndex`, `rationale`, `source`, `difficulty`, `access`, duple odgovore i duple tekstove pitanja.

## Workflow za dodavanje pitanja

1. Otvoriti `data/question-template.json`.
2. Kopirati šablon u `questions` niz u `data/questions.json`.
3. Popuniti tekst pitanja, 4 odgovora, `answerIndex`, objašnjenje, izvor, težinu i keyworde.
4. Pokrenuti `node scripts/validate-content.mjs`.
5. Pokrenuti `python3 -m http.server 8080`.
6. Ručno testirati novo pitanje u kvizu i pretrazi.

Detaljna pravila su u `docs/content-guidelines.md`, a ručna provjera aplikacije je u `docs/manual-test-checklist.md`.

## Struktura

```text
.
├── assets/icons/icon.svg
├── css/styles.css
├── data/questions.json
├── data/question-template.json
├── docs/content-guidelines.md
├── docs/manual-test-checklist.md
├── js/app.js
├── js/storage.js
├── scripts/validate-content.mjs
├── index.html
├── manifest.webmanifest
└── service-worker.js
```

## Sljedeći koraci

1. Unijeti svih ~150 provjerenih UIO pitanja.
2. Zamijeniti privremene izvore tačnim propisima i članovima.
3. Testirati PWA offline ponašanje na Androidu i iPhoneu.
4. Validirati spremnost korisnika na plaćanje prije backend-a.
5. Razmotriti backend tek kada se validira potražnja.

## Napomena

Demo premium kod je `UIO-PREMIUM-2026`. To nije sigurnosni sistem niti prava naplata; služi samo za testiranje ponude u MVP fazi.
