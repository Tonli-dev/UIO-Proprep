do $$
declare
  updated_count integer;
begin
  with updates as (
    select *
    from jsonb_to_recordset($json$
[
  {
    "id": "uio-017",
    "options": [
      "Izdavanja ličnih dokumenata, vođenja matičnih knjiga i kontrole prebivališta građana.",
      "Carinskog nadzora, carinjenja robe, kontrole putnika i prevoznih sredstava, revizija i kontrola naplate prihoda.",
      "Planiranja budžeta institucija BiH i kontrole javnih nabavki.",
      "Inspekcijskog nadzora u oblasti rada, zapošljavanja i socijalne zaštite."
    ],
    "answer_index": 1,
    "answer": "Carinskog nadzora, carinjenja robe, kontrole putnika i prevoznih sredstava, revizija i kontrola naplate prihoda."
  },
  {
    "id": "uio-018",
    "options": [
      "Samo Država Bosna i Hercegovina i Federacija BiH.",
      "Država Bosna i Hercegovina, Federacija BiH, Republika Srpska i Brčko distrikt BiH.",
      "Opštine, gradovi i kantonalne uprave za indirektno oporezivanje.",
      "Isključivo Uprava za indirektno oporezivanje i Ministarstvo finansija BiH."
    ],
    "answer_index": 1,
    "answer": "Država Bosna i Hercegovina, Federacija BiH, Republika Srpska i Brčko distrikt BiH."
  },
  {
    "id": "uio-019",
    "options": [
      "obavlja neposrednu kontrolu putnika na svim graničnim prelazima.",
      "vodi drugostepeni upravni postupak i prvostepeni upravni postupak kad je to određeno zakonom.",
      "izdaje putne isprave zaposlenima i članovima njihovih porodica.",
      "vodi matične knjige i evidenciju prebivališta građana."
    ],
    "answer_index": 1,
    "answer": "vodi drugostepeni upravni postupak i prvostepeni upravni postupak kad je to određeno zakonom."
  },
  {
    "id": "uio-020",
    "options": [
      "Vodi račune poslovnih banaka i vrši raspodjelu direktnih poreza kantonima.",
      "Vodi jedinstveni račun i vrši naplatu prihoda po osnovu indirektnih poreza, doznačavenje i raspodjelu prihoda po osnovu indirektnih poreza na način regulisan zakonom.",
      "Dodjeljuje registarske oznake prevoznim sredstvima i izdaje saobraćajne dozvole.",
      "Odlučuje o svim radnim sporovima zaposlenih u prvom stepenu."
    ],
    "answer_index": 1,
    "answer": "Vodi jedinstveni račun i vrši naplatu prihoda po osnovu indirektnih poreza, doznačavenje i raspodjelu prihoda po osnovu indirektnih poreza na način regulisan zakonom."
  },
  {
    "id": "uio-021",
    "options": [
      "Vodi jedinstveni registar obveznika indirektnih poreza i dodjeljuje im odgovarajući identifikacioni broj u postupku registracije",
      "Vodi registar motornih vozila i dodjeljuje registarske oznake.",
      "Vodi evidenciju državljanstva i dodjeljuje jedinstveni matični broj građana.",
      "Vodi imenik državnih službenika u svim institucijama BiH."
    ],
    "answer_index": 0,
    "answer": "Vodi jedinstveni registar obveznika indirektnih poreza i dodjeljuje im odgovarajući identifikacioni broj u postupku registracije"
  },
  {
    "id": "uio-022",
    "options": [
      "Donošenja kodeksa ponašanja i odluka o premještaju zaposlenih.",
      "Carinjenja robe, obračun i naplatu prihoda.",
      "Vođenja jedinstvenog računa i raspodjele prihoda korisnicima.",
      "Izdavanja putnih isprava i ovjere međunarodnih dokumenata."
    ],
    "answer_index": 1,
    "answer": "Carinjenja robe, obračun i naplatu prihoda."
  },
  {
    "id": "uio-023",
    "options": [
      "Državnog službenika.",
      "Zaposlenika.",
      "Pripravnika bez radnog odnosa.",
      "Člana Upravnog odbora."
    ],
    "answer_index": 1,
    "answer": "Zaposlenika."
  },
  {
    "id": "uio-024",
    "options": [
      "Samo državni službenici.",
      "Državni službenici i zaposlenici.",
      "Samo zaposlenici sa srednjom stručnom spremom.",
      "Direktor, pomoćnici direktora i članovi Upravnog odbora."
    ],
    "answer_index": 1,
    "answer": "Državni službenici i zaposlenici."
  },
  {
    "id": "uio-025",
    "options": [
      "Zakona o državnoj službi u institucijama BiH.",
      "Zakona o radu u institucijama BiH.",
      "Zakona o upravnom postupku BiH.",
      "Zakona o carinskoj tarifi BiH."
    ],
    "answer_index": 1,
    "answer": "Zakona o radu u institucijama BiH."
  },
  {
    "id": "uio-026",
    "options": [
      "Direktor,",
      "Agencija za državnu službu BiH,",
      "Pomoćnik direktora.",
      "Upravni odbor Uprave za indirektno oporezivanje."
    ],
    "answer_index": 0,
    "answer": null
  },
  {
    "id": "uio-027",
    "options": [
      "Svi kandidati prije zasnivanja radnog odnosa u Upravi.",
      "Zaposleni koji je zasnovao radni odnos na neodređeno vrijeme i raspoređen je na radno mjesto za obavljanje poslova iz osnovne djelatnosti.",
      "Samo državni službenici sa visokom stručnom spremom.",
      "Zaposleni koji radi isključivo administrativne poslove podrške."
    ],
    "answer_index": 1,
    "answer": "Zaposleni koji je zasnovao radni odnos na neodređeno vrijeme i raspoređen je na radno mjesto za obavljanje poslova iz osnovne djelatnosti."
  },
  {
    "id": "uio-028",
    "options": [
      "Samo direktor i pomoćnici direktora.",
      "Zaposleni koji obavlja poslove i zadatke iz osnovne djelatnosti i drugi zaposleni kad to zahtijeva priroda posla",
      "Svi zaposleni bez obzira na opis radnog mjesta.",
      "Samo zaposleni koji rade u Glavnoj kancelariji."
    ],
    "answer_index": 1,
    "answer": "Zaposleni koji obavlja poslove i zadatke iz osnovne djelatnosti i drugi zaposleni kad to zahtijeva priroda posla"
  },
  {
    "id": "uio-029",
    "options": [
      "Zaposleni koji obavljaju pregled robe u prevoznim i prenosnim sredstvima, carinskim skladištima i drugim prostorima, carinskim laboratorijama, uređajima za kontrolu robe i putnika i vrše druge stručno-tehničke poslove.",
      "Svi zaposleni koji obavljaju isključivo kancelarijske i arhivske poslove.",
      "Članovi Upravnog odbora i eksterni saradnici Uprave.",
      "Zaposleni koji rade samo na izradi finansijskih izvještaja."
    ],
    "answer_index": 0,
    "answer": "Zaposleni koji obavljaju pregled robe u prevoznim i prenosnim sredstvima, carinskim skladištima i drugim prostorima, carinskim laboratorijama, uređajima za kontrolu robe i putnika i vrše druge stručno-tehničke poslove."
  },
  {
    "id": "uio-030",
    "options": [
      "Svako lice koje je zaposleno u bilo kojoj instituciji Bosne i Hercegovine.",
      "Lice koje obavlja poslove iz osnovne djelatnosti UIO i lica koja imaju određena ovlašćenja u skladu sa zakonima koji regulišu krivične postupke u Bosni i Hercegovini.",
      "Isključivo direktor Uprave i članovi Upravnog odbora.",
      "Samo zaposleni koji imaju status državnog službenika bez dodatnih ovlašćenja."
    ],
    "answer_index": 1,
    "answer": "Lice koje obavlja poslove iz osnovne djelatnosti UIO i lica koja imaju određena ovlašćenja u skladu sa zakonima koji regulišu krivične postupke u Bosni i Hercegovini."
  },
  {
    "id": "uio-031",
    "options": [
      "Izvrši pretres lica bez postojanja bilo kakvog osnova sumnje.",
      "Izvrši pretres lica koja dolaze ili napuštaju carinsko područje slobodnu zonu ili carinsko skladište ili ostaju u tranzitnom području luka ili aerodroma, ako postoje osnovi sumnje o prikrivanju robe koja podliježe carinskom nadzoru.",
      "Trajno oduzme lične dokumente putnika bez pokretanja postupka.",
      "Odredi pritvor licu u trajanju do 30 dana."
    ],
    "answer_index": 1,
    "answer": "Izvrši pretres lica koja dolaze ili napuštaju carinsko područje slobodnu zonu ili carinsko skladište ili ostaju u tranzitnom području luka ili aerodroma, ako postoje osnovi sumnje o prikrivanju robe koja podliježe carinskom nadzoru."
  },
  {
    "id": "uio-032",
    "options": [
      "Privremeno zadrži robu i prevozno sredstvo nad kojim nije sproveden postupak ili nije sproveden u skladu sa zakonskim propisima.",
      "Trajno prenese vlasništvo nad robom na Upravu bez posebnog postupka.",
      "Proda prevozno sredstvo prije evidentiranja nepravilnosti.",
      "Vrati robu deklarantu bez obavljanja carinskih formalnosti."
    ],
    "answer_index": 0,
    "answer": "Privremeno zadrži robu i prevozno sredstvo nad kojim nije sproveden postupak ili nije sproveden u skladu sa zakonskim propisima."
  },
  {
    "id": "uio-033",
    "options": [
      "Vrši kontrolu lica koja dolaze ili napuštaju carinsko područje, slobodnu zonu ili carinsko skladište ili ostaju u tranzitnom području luka ili aerodroma, vrši identifikaciju lica, zahtijeva prijavu i predočavanje njihovog ličnog prtljaga, izvrši pregled ličnog prtljaga, a po potrebi i njegov pretres.",
      "Vrši kontrolu samo zaposlenih u UIO prilikom dolaska na posao.",
      "Zahtijeva predočavanje ličnog prtljaga samo nakon pravosnažne sudske presude.",
      "Obavlja kontrolu lica isključivo u unutrašnjim kancelarijama, a nikada u lukama ili aerodromima."
    ],
    "answer_index": 0,
    "answer": "Vrši kontrolu lica koja dolaze ili napuštaju carinsko područje, slobodnu zonu ili carinsko skladište ili ostaju u tranzitnom području luka ili aerodroma, vrši identifikaciju lica, zahtijeva prijavu i predočavanje njihovog ličnog prtljaga, izvrši pregled ličnog prtljaga, a po potrebi i njegov pretres."
  },
  {
    "id": "uio-034",
    "options": [
      "Da svaku radnju preduzme najstrožim mogućim sredstvima bez obzira na posljedice.",
      "Da vodi računa da ne prouzrokuje veću štetu nego što je neophodno da bi se postigla njegova svrha.",
      "Da o svakoj radnji prethodno zatraži odobrenje Upravnog odbora.",
      "Da radnju odloži dok stranka ne pribavi sve finansijske izvještaje."
    ],
    "answer_index": 1,
    "answer": "Da vodi računa da ne prouzrokuje veću štetu nego što je neophodno da bi se postigla njegova svrha."
  },
  {
    "id": "uio-035",
    "options": [
      "Da vrši poslove koji su mu predviđeni opisom radnog mjesta, te druge zadatke povjerene od rukovodioca.",
      "Da samostalno bira službene zadatke izvan opisa radnog mjesta.",
      "Da izvršava samo zadatke koje mu povjeri Agencija za državnu službu BiH.",
      "Da odbije svaki zadatak koji nije unaprijed naveden u godišnjem planu rada."
    ],
    "answer_index": 0,
    "answer": "Da vrši poslove koji su mu predviđeni opisom radnog mjesta, te druge zadatke povjerene od rukovodioca."
  },
  {
    "id": "uio-036",
    "options": [
      "Da koristi radno vrijeme za privatne aktivnosti ako ne postoji neposredna kontrola.",
      "Da poštuje radno vrijeme i da ga koristi za izvršavanje svojih službenih dužnosti.",
      "Da samostalno određuje početak i kraj radnog vremena.",
      "Da radno vrijeme evidentira samo na kraju kalendarske godine."
    ],
    "answer_index": 1,
    "answer": "Da poštuje radno vrijeme i da ga koristi za izvršavanje svojih službenih dužnosti."
  },
  {
    "id": "uio-037",
    "options": [
      "Upravni odbor Uprave za indirektno oporezivanje.",
      "Direktor.",
      "Agencija za državnu službu BiH.",
      "Savjet ministara BiH."
    ],
    "answer_index": 1,
    "answer": "Direktor."
  },
  {
    "id": "uio-038",
    "options": [
      "Utvrđuju samo pravila oblačenja zaposlenih u vrijeme službenih sastanaka.",
      "Utvrđuju pravila ponašanja zaposlenih u UIO, tokom i van radnog vremena.",
      "Propisuju isključivo način obračuna plata i naknada zaposlenih.",
      "Uređuju samo postupak registracije obveznika indirektnih poreza."
    ],
    "answer_index": 1,
    "answer": "Utvrđuju pravila ponašanja zaposlenih u UIO, tokom i van radnog vremena."
  },
  {
    "id": "uio-039",
    "options": [
      "Direktor Uprave.",
      "Neposredni rukovodilac.",
      "Agencija za državnu službu BiH.",
      "Radnik koji vodi djelovodnik."
    ],
    "answer_index": 1,
    "answer": "Neposredni rukovodilac."
  },
  {
    "id": "uio-040",
    "options": [
      "Nakon isteka probnog rada.",
      "Odmah po zasnivanju radnog odnosa.",
      "Tek nakon pokretanja disciplinskog postupka.",
      "Jednom na kraju svake kalendarske godine."
    ],
    "answer_index": 1,
    "answer": "Odmah po zasnivanju radnog odnosa."
  },
  {
    "id": "uio-041",
    "options": [
      "Direktor Uprave.",
      "Neposredni rukovodilac.",
      "Upravni odbor Uprave.",
      "Svaki zaposleni pojedinačno bez nadzora."
    ],
    "answer_index": 1,
    "answer": "Neposredni rukovodilac."
  },
  {
    "id": "uio-042",
    "options": [
      "Smije obavljati svaku dodatnu aktivnost van UIO ako je obavlja poslije radnog vremena.",
      "Ne smije obavljati dodatnu aktivnost van UIO, bez obzira da li za to ostvaruje naknadu ili ne, ako obavljanje takvih aktivnosti dovodi u pitanje nepristrasnost u obavljanju službenih dužnosti.",
      "Mora prijaviti samo dodatne aktivnosti za koje ostvaruje novčanu naknadu.",
      "Smije obavljati dodatnu aktivnost ako je odobri neposredni rukovodilac usmenim putem."
    ],
    "answer_index": 1,
    "answer": "Ne smije obavljati dodatnu aktivnost van UIO, bez obzira da li za to ostvaruje naknadu ili ne, ako obavljanje takvih aktivnosti dovodi u pitanje nepristrasnost u obavljanju službenih dužnosti."
  },
  {
    "id": "uio-043",
    "options": [
      "Na početku svake kalendarske godine i prilikom odlaska u penziju.",
      "Prilikom zasnivanja radnog odnosa u Upravi i na zahtjev direktora.",
      "Samo nakon pokretanja disciplinskog postupka.",
      "Isključivo nakon premještaja u drugu organizacionu jedinicu."
    ],
    "answer_index": 1,
    "answer": "Prilikom zasnivanja radnog odnosa u Upravi i na zahtjev direktora."
  },
  {
    "id": "uio-044",
    "options": [
      "Prilikom zasnivanja radnog odnosa i na početku svake kalendarske godine.",
      "Samo na zahtjev neposrednog rukovodioca.",
      "Jednom u pet godina, bez obzira na promjene imovine.",
      "Samo prije prestanka radnog odnosa u Upravi."
    ],
    "answer_index": 0,
    "answer": "Prilikom zasnivanja radnog odnosa i na početku svake kalendarske godine."
  },
  {
    "id": "uio-045",
    "options": [
      "Svi zaposleni UIO kada komuniciraju sa medijima u privatno vrijeme.",
      "Zaposleni iz Odjeljenja za komunikacije i međunarodnu saradnju koji su posebno ovlašćeni i zaposleni iz drugih organizacionih jedinica uz posebno odobrenje direktora.",
      "Samo neposredni rukovodioci organizacionih jedinica bez posebnog odobrenja.",
      "Predstavnici sindikata i svi zaposleni u regionalnim centrima."
    ],
    "answer_index": 1,
    "answer": "Zaposleni iz Odjeljenja za komunikacije i međunarodnu saradnju koji su posebno ovlašćeni i zaposleni iz drugih organizacionih jedinica uz posebno odobrenje direktora."
  },
  {
    "id": "uio-046",
    "options": [
      "Svim zaposlenim UIO tokom cijelog radnog vremena, bez izuzetka.",
      "Zaposlenim u carinskim referatima na graničnim prelazima prilikom kontrole ulaska i izlaska vozila i putnika iz carinskog područja BiH.",
      "Samo vozačima službenih vozila nakon završetka smjene.",
      "Isključivo zaposlenima u Glavnoj kancelariji za vrijeme sastanaka."
    ],
    "answer_index": 1,
    "answer": "Zaposlenim u carinskim referatima na graničnim prelazima prilikom kontrole ulaska i izlaska vozila i putnika iz carinskog područja BiH."
  },
  {
    "id": "uio-047",
    "options": [
      "Samo podatke o godišnjem odmoru i internim obukama.",
      "Informacije do kojih su došli prilikom vršenja službene dužnosti, fotografije nastale na radnom mjestu i u objektima UIO, fotografije dokumenata, sadržaje koji imaju karakter govora mržnje, rasne, nacionalne, vjerske, rodne i druge netrpeljivosti.",
      "Isključivo fotografije privatnog karaktera nastale van radnog mjesta.",
      "Samo komentare o vremenskim uslovima i javno dostupnim obavještenjima."
    ],
    "answer_index": 1,
    "answer": "Informacije do kojih su došli prilikom vršenja službene dužnosti, fotografije nastale na radnom mjestu i u objektima UIO, fotografije dokumenata, sadržaje koji imaju karakter govora mržnje, rasne, nacionalne, vjerske, rodne i druge netrpeljivosti."
  },
  {
    "id": "uio-048",
    "options": [
      "Usmeno obavještava bilo kojeg kolegu u organizacionoj jedinici.",
      "Pismeno obavještava direktora UIO.",
      "Ne preduzima ništa dok se zahtjev ne ponovi tri puta.",
      "Obavještava isključivo sredstva javnog informisanja."
    ],
    "answer_index": 1,
    "answer": "Pismeno obavještava direktora UIO."
  },
  {
    "id": "uio-049",
    "options": [
      "Krivičnu odgovornost u svakom slučaju bez posebnog postupka.",
      "Disciplinsku odgovornost.",
      "Automatski prestanak radnog odnosa bez odlučivanja nadležnog organa.",
      "Nema nikakvu posljedicu ako nije nastala materijalna šteta."
    ],
    "answer_index": 1,
    "answer": "Disciplinsku odgovornost."
  }
]
$json$::jsonb) as item(id text, options jsonb, answer_index integer, answer text)
  )
  update public.premium_questions as question
  set
    question_type = 'multiple-choice',
    options = updates.options,
    answer_index = updates.answer_index,
    answer = coalesce(nullif(btrim(updates.answer), ''), updates.options ->> updates.answer_index),
    updated_at = now()
  from updates
  where question.id = updates.id;

  get diagnostics updated_count = row_count;
  if updated_count <> 33 then
    raise exception 'Expected to update 33 premium questions, updated %', updated_count;
  end if;
end $$;
