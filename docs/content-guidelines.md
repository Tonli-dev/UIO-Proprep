# Pravila za unos pitanja

Ovaj projekat nema admin panel u MVP fazi. Free pitanja se ručno dodaju u `public/data/questions.json`, a `data/question-template.json` služi kao kopirni šablon. Premium pitanja se dodaju kroz versioniranu Supabase SQL migraciju.

## Schema pitanja

Svako pitanje mora imati:

- `id`: stabilan i jedinstven ID, npr. `uio-004`, `kanc-010`, `car-021`
- `categoryId`: jedna od postojećih oblasti: `uio`, `kanc`, `carine`
- `questionType`: `direct` ili `multiple-choice`
- `question`: jasan tekst pitanja
- `answer`: obavezan tačan odgovor za `direct` pitanje
- `options`: najmanje 2 ponuđena odgovora za `multiple-choice` pitanje
- `answerIndex`: indeks tačnog odgovora za `multiple-choice` pitanje
- `rationale`: kratko objašnjenje tačnog odgovora
- `source`: propis, dokument, član, stranica ili napomena za provjeru
- `difficulty`: `easy`, `medium` ili `hard`
- `access`: `free` ili `premium`
- `keywords`: niz pojmova za pretragu

## Pravila kvaliteta

- Ne unositi pitanje bez izvora ili jasne napomene gdje se provjerava.
- Ne izmišljati ponuđene odgovore kada izvor daje samo pitanje i tačan odgovor; koristiti `direct` tip.
- Ne koristiti dva ista ponuđena odgovora u istom pitanju.
- Ne koristiti formulacije koje imaju više mogućih tačnih odgovora.
- Distraktori treba da budu uvjerljivi, ali nedvosmisleno netačni.
- Objašnjenje treba pomoći kandidatu da nauči pravilo, ne samo da zapamti slovo odgovora.
- Za produkcijsku verziju zamijeniti sve izvore koji sadrže “provjeriti” tačnim izvorom.

## Workflow

1. Kopirati `data/question-template.json`.
2. Umetnuti objekat u `questions` niz u `public/data/questions.json`.
3. Promijeniti `id`, `categoryId`, `questionType`, tekst, odgovor ili ponuđene odgovore, `rationale`, `source`, `difficulty`, `access` i `keywords`.
4. Pokrenuti `node scripts/validate-content.mjs`.
5. Pokrenuti lokalni server i ručno testirati pitanje u kvizu i pretrazi.

Za ponovni uvoz kompletnog DOCX seta:

```bash
python3 scripts/import-questions-docx.py "/putanja/do/PITANJA-SSS-OBJAVA-KONACNO.docx"
```

## Preporučena raspodjela

- Free sadržaj: 15–25% ukupnih pitanja, dovoljno da korisnik vidi vrijednost.
- Premium sadržaj: ostatak pitanja, simulacija ispita i napredniji režimi.
- Težina: više `medium` pitanja nego `easy`; `hard` koristiti za detalje koji često ruše kandidate.
