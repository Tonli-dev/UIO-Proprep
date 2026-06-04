# Pravila za unos pitanja

Ovaj projekat nema admin panel u MVP fazi. Pitanja se ručno dodaju u `data/questions.json`, a `data/question-template.json` služi kao kopirni šablon.

## Schema pitanja

Svako pitanje mora imati:

- `id`: stabilan i jedinstven ID, npr. `uio-004`, `kanc-010`, `car-021`
- `categoryId`: jedna od postojećih oblasti: `uio`, `kanc`, `carine`
- `question`: jasan tekst pitanja
- `options`: tačno 4 ponuđena odgovora
- `answerIndex`: indeks tačnog odgovora, od `0` do `3`
- `rationale`: kratko objašnjenje tačnog odgovora
- `source`: propis, dokument, član, stranica ili napomena za provjeru
- `difficulty`: `easy`, `medium` ili `hard`
- `access`: `free` ili `premium`
- `keywords`: niz pojmova za pretragu

## Pravila kvaliteta

- Ne unositi pitanje bez izvora ili jasne napomene gdje se provjerava.
- Ne koristiti dva ista ponuđena odgovora u istom pitanju.
- Ne koristiti formulacije koje imaju više mogućih tačnih odgovora.
- Distraktori treba da budu uvjerljivi, ali nedvosmisleno netačni.
- Objašnjenje treba pomoći kandidatu da nauči pravilo, ne samo da zapamti slovo odgovora.
- Za produkcijsku verziju zamijeniti sve izvore koji sadrže “provjeriti” tačnim izvorom.

## Workflow

1. Kopirati `data/question-template.json`.
2. Umetnuti objekat u `questions` niz u `data/questions.json`.
3. Promijeniti `id`, `categoryId`, tekst, odgovore, `answerIndex`, `rationale`, `source`, `difficulty`, `access` i `keywords`.
4. Pokrenuti `node scripts/validate-content.mjs`.
5. Pokrenuti lokalni server i ručno testirati pitanje u kvizu i pretrazi.

## Preporučena raspodjela

- Free sadržaj: 15–25% ukupnih pitanja, dovoljno da korisnik vidi vrijednost.
- Premium sadržaj: ostatak pitanja, simulacija ispita i napredniji režimi.
- Težina: više `medium` pitanja nego `easy`; `hard` koristiti za detalje koji često ruše kandidate.
