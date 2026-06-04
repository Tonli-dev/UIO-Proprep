# Izvještaj uvoza SSS pitanja

Iz dokumenta `PITANJA-SSS-OBJAVA-KONACNO (1).docx` uvezeno je ukupno 180 pitanja:

- Organizacija UIO i zaposleni: 49
- Kancelarijsko poslovanje: 39
- Carinski postupci: 92

Dokument sadrži 179 pitanja s direktnim tačnim odgovorom i jedno pitanje s tri ponuđena odgovora. Aplikacija zato podržava:

- `direct`: korisnik se prvo prisjeti odgovora, otkrije ga i sam označi da li ga je znao
- `multiple-choice`: korisnik bira jedan od ponuđenih odgovora

Nisu generirani niti izmišljeni dodatni ponuđeni odgovori. Svako pitanje automatski postaje i kartica za brzo ponavljanje.

## Uočeni duplikati

Izvorni dokument sadrži 13 ponovljenih formulacija pitanja s različitim tačnim odgovorima. Tekst je sačuvan bez izmjena jer svaka stavka predstavlja zasebno pitanje u dostavljenom setu. Validator ih prijavljuje kao upozorenja:

- `uio-008`, `uio-009`, `uio-010`, `uio-011`
- `uio-020`, `uio-021`
- `uio-032`, `uio-033`
- `uio-036`
- `kanc-013`, `kanc-014`, `kanc-015`, `kanc-016`

Kod ovih pitanja samoprocjena može biti dvosmislena jer korisnik može znati drugi tačan odgovor iz iste grupe. Prije javnog lansiranja preporučeno je provjeriti da li originalni test uz njih prikazuje ponuđene odgovore.
