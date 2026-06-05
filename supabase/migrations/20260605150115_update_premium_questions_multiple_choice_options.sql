alter table public.premium_questions
  drop constraint if exists premium_questions_shape_check;

-- These three rows were legacy premium seed rows that now also exist in public/data/questions.json.
-- Keeping them in premium_questions makes premium users load duplicate question IDs.
delete from public.premium_questions
where id in ('car-001', 'car-003', 'kanc-002');

do $$
declare
  updated_count integer;
begin
  with updates as (
    select *
    from jsonb_to_recordset($json$
[
  {
    "id": "car-026",
    "options": [
      "do jedne godine",
      "do tri godine",
      "do šest mjeseci",
      "do pet godina"
    ],
    "answer_index": 1,
    "answer": "do tri godine"
  },
  {
    "id": "car-027",
    "options": [
      "akt nadležne carinske kancelarije",
      "faktura dobavljača robe",
      "akt imaoca odobrenja za postupak unutrašnje obrade",
      "transportna isprava prevoznika"
    ],
    "answer_index": 2,
    "answer": "akt imaoca odobrenja za postupak unutrašnje obrade"
  },
  {
    "id": "car-028",
    "options": [
      "u roku od 15 dana od dana prihvatanja carinske deklaracije",
      "u roku od 30 dana od dana isteka roka za razduženje carinske deklaracije",
      "najkasnije do kraja kalendarske godine",
      "u roku od 60 dana od dana stavljanja robe u postupak"
    ],
    "answer_index": 1,
    "answer": "u roku od 30 dana od dana isteka roka za razduženje carinske deklaracije"
  },
  {
    "id": "car-029",
    "options": [
      "sporazum o zajedničkoj carinskoj tarifi",
      "konvencija o tranzitu na osnovu karneta TIR",
      "konvencija o privremenom uvozu na osnovu karneta ATA",
      "protokol o oslobađanju od poreza na dodatu vrijednost"
    ],
    "answer_index": 2,
    "answer": "konvencija o privremenom uvozu na osnovu karneta ATA"
  },
  {
    "id": "car-030",
    "options": [
      "prevoznik koji robu doprema do carinske kancelarije",
      "lice koje podnosi carinsku deklaraciju ili deklaraciju za privremeni smještaj u svoje ime ili lice u čije ime se podnosi carinska deklaracija ili deklaracija za privremeni smještaj",
      "imalac skladišta u kojem se roba privremeno nalazi",
      "službenik koji pregleda robu prije puštanja u postupak"
    ],
    "answer_index": 1,
    "answer": "lice koje podnosi carinsku deklaraciju ili deklaraciju za privremeni smještaj u svoje ime ili lice u čije ime se podnosi carinska deklaracija ili deklaracija za privremeni smještaj"
  },
  {
    "id": "car-031",
    "options": [
      "porez na dodatu vrijednost i akciza pri uvozu",
      "carina i druge dažbine sa jednakim efektom kao i carina",
      "troškovi prevoza i osiguranja do granice",
      "novčane kazne i troškovi postupka"
    ],
    "answer_index": 1,
    "answer": "carina i druge dažbine sa jednakim efektom kao i carina"
  },
  {
    "id": "car-032",
    "options": [
      "na komercijalnu robu bez obzira na njenu vrijednost",
      "na nekomercijalnu robu koja se nalazi u ličnom ptrljagu putnika, pod uslovom da carinska vrijednost robe koja podliježe plaćanju uvoznih dažbina ne prelazi 5.000,00 KM po putniku",
      "na svu robu koja se uvozi po redovnoj carinskoj deklaraciji",
      "na robu vrijednosti do 20.000,00 KM po putniku"
    ],
    "answer_index": 1,
    "answer": "na nekomercijalnu robu koja se nalazi u ličnom ptrljagu putnika, pod uslovom da carinska vrijednost robe koja podliježe plaćanju uvoznih dažbina ne prelazi 5.000,00 KM po putniku"
  },
  {
    "id": "car-033",
    "options": [
      "isključivo plaćanje carine prije puštanja robe",
      "radnje koje preduzimaju lica i carinski organ u cilju primjene carinskih propisa",
      "interni obračun troškova prevoza robe",
      "postupak zaključivanja poslovne dokumentacije u firmi"
    ],
    "answer_index": 1,
    "answer": "radnje koje preduzimaju lica i carinski organ u cilju primjene carinskih propisa"
  },
  {
    "id": "car-034",
    "options": [
      "konačno puštanje domaće robe u slobodan promet",
      "situacija u kojoj je strana roba privremeno smještena pod carinski nadzor u periodu između predočenja carinskoj kancelariji i stavljanja u carinski odobreno postupanje ili upotrebu",
      "skladištenje robe nakon završetka izvoznog postupka",
      "prevoz robe između dva domaća skladišta bez carinskog nadzora"
    ],
    "answer_index": 1,
    "answer": "situacija u kojoj je strana roba privremeno smještena pod carinski nadzor u periodu između predočenja carinskoj kancelariji i stavljanja u carinski odobreno postupanje ili upotrebu"
  },
  {
    "id": "car-035",
    "options": [
      "koje šalju pravna lica radi dalje prodaje u Bosni i Hercegovini",
      "koje šalju fizičke osobe iz inostranstva fizičkim osobama u Bosni i Hercegovini, pod uslovom da su pošiljke povremene i da ne sadrže komercijalnu robu, te da carinska vrijednost robe koja podliježe plaćanju uvoznih dažbina ne prelazi 5.000,00 KM po pošiljci i da ih pošiljalac šalje primaocu bez bilo kakvog plaćanja",
      "koje se svakodnevno šalju istom primaocu po osnovu kupoprodaje",
      "čija vrijednost prelazi 20.000,00 KM i koje se šalju uz avansno plaćanje"
    ],
    "answer_index": 1,
    "answer": "koje šalju fizičke osobe iz inostranstva fizičkim osobama u Bosni i Hercegovini, pod uslovom da su pošiljke povremene i da ne sadrže komercijalnu robu, te da carinska vrijednost robe koja podliježe plaćanju uvoznih dažbina ne prelazi 5.000,00 KM po pošiljci i da ih pošiljalac šalje primaocu bez bilo kakvog plaćanja"
  },
  {
    "id": "car-036",
    "options": [
      "obračun zatezne kamate",
      "pregled robe",
      "zaključivanje djelovodnika",
      "izdavanje putne isprave"
    ],
    "answer_index": 1,
    "answer": "pregled robe"
  },
  {
    "id": "car-037",
    "options": [
      "putniku izdaje račun prevoznika za međunarodni prevoz",
      "putniku izdaje potvrdu o naplati indirektnih poreza za robu prijavljenu usmenim putem (CPD)",
      "putniku izdaje uvjerenje o porijeklu robe",
      "putniku vraća robu bez evidentiranja i bez obračuna"
    ],
    "answer_index": 1,
    "answer": "putniku izdaje potvrdu o naplati indirektnih poreza za robu prijavljenu usmenim putem (CPD)"
  },
  {
    "id": "car-038",
    "options": [
      "lične predmete putnika koji su privremeno uneseni",
      "robu koja prema Zakonu o akcizama u Bosni i Hercegovini podliježe obavezi obilježavanja akciznim markicama",
      "nekomercijalnu robu male vrijednosti u ličnom prtljagu",
      "poklone koje fizička osoba šalje bez plaćanja"
    ],
    "answer_index": 1,
    "answer": "robu koja prema Zakonu o akcizama u Bosni i Hercegovini podliježe obavezi obilježavanja akciznim markicama"
  },
  {
    "id": "car-039",
    "options": [
      "ako robu prevozi ovlašteni međunarodni špediter",
      "ako primalac pošiljke ili putnik zahtijeva da se obračun uvoznih dažbina izvrši po carinskoj stopi propisanoj u Carinskoj tarifi za robu sadržanu u pošiljci ili ličnom prtljagu putnika",
      "ako se roba nalazi u originalnom fabričkom pakovanju",
      "ako se roba prijavljuje na izlaznom graničnom prelazu"
    ],
    "answer_index": 1,
    "answer": "ako primalac pošiljke ili putnik zahtijeva da se obračun uvoznih dažbina izvrši po carinskoj stopi propisanoj u Carinskoj tarifi za robu sadržanu u pošiljci ili ličnom prtljagu putnika"
  },
  {
    "id": "car-040",
    "options": [
      "predmete u vrijednosti do 300,00 KM po putniku i danu",
      "predmete u vrijednosti do 600,00 KM po putniku i danu, nezavisno od vrste prevoznog sredstva kojim putnik putuje",
      "predmete u vrijednosti do 5.000,00 KM po pošiljci",
      "predmete u vrijednosti do 20.000,00 KM po putniku"
    ],
    "answer_index": 1,
    "answer": "predmete u vrijednosti do 600,00 KM po putniku i danu, nezavisno od vrste prevoznog sredstva kojim putnik putuje"
  },
  {
    "id": "car-041",
    "options": [
      "u protivvrijednosti iznosa u konvertibilnim markama od 5.000,00 KM ili više",
      "u protivvrijednosti iznosa u konvertibilnim markama od 10.000,00 KM ili više",
      "u protivvrijednosti iznosa u konvertibilnim markama od 20.000,00 KM ili više",
      "u protivvrijednosti iznosa u konvertibilnim markama od 50.000,00 KM ili više"
    ],
    "answer_index": 2,
    "answer": "u protivvrijednosti iznosa u konvertibilnim markama od 20.000,00 KM ili više"
  },
  {
    "id": "car-042",
    "options": [
      "transportni karnet",
      "trgovački dokument",
      "bankarska garancija",
      "upravni zapisnik"
    ],
    "answer_index": 1,
    "answer": "trgovački dokument"
  },
  {
    "id": "car-043",
    "options": [
      "roba namijenjena daljoj prodaji",
      "roba nekomercijalnog karaktera",
      "roba koja podliježe zabrani ili ograničenju",
      "roba u postupku unutrašnje obrade"
    ],
    "answer_index": 1,
    "answer": "roba nekomercijalnog karaktera"
  },
  {
    "id": "car-044",
    "options": [
      "roba nekomercijalnog karaktera",
      "roba koja podliježe zabrani ili ograničenju",
      "lični predmeti putnika",
      "domaća roba koja se vraća iz inostranstva"
    ],
    "answer_index": 1,
    "answer": "roba koja podliježe zabrani ili ograničenju"
  },
  {
    "id": "car-045",
    "options": [
      "gotovinski depozit",
      "usmena izjava putnika",
      "kopija fakture",
      "izvod iz arhivske knjige"
    ],
    "answer_index": 0,
    "answer": "gotovinski depozit"
  },
  {
    "id": "car-046",
    "options": [
      "samo carine, bez poreza na dodatu vrijednost",
      "samo novčanih kazni i troškova skladištenja",
      "svih propisanih uvoznih dažbina, poreza na dodatu vrijednost i drugih indirektnih poreza kojima, u skladu sa carinskim i drugim propisima, podliježe roba koja se uvozi",
      "isključivo kompenzatorne kamate"
    ],
    "answer_index": 2,
    "answer": "svih propisanih uvoznih dažbina, poreza na dodatu vrijednost i drugih indirektnih poreza kojima, u skladu sa carinskim i drugim propisima, podliježe roba koja se uvozi"
  },
  {
    "id": "car-047",
    "options": [
      "su djelimično oslobođeni samo od plaćanja carine",
      "su potpuno oslobođeni od plaćanja uvoznih dažbina i poreza na dodatu vrijednost",
      "podliježu punom obračunu svih indirektnih poreza",
      "oslobođeni su samo ako se prodaju u roku od godinu dana"
    ],
    "answer_index": 1,
    "answer": "su potpuno oslobođeni od plaćanja uvoznih dažbina i poreza na dodatu vrijednost"
  },
  {
    "id": "car-048",
    "options": [
      "najduže šest mjeseci",
      "najduže jednu godinu",
      "najduže dvije godine",
      "najduže pet godina"
    ],
    "answer_index": 2,
    "answer": "najduže dvije godine"
  },
  {
    "id": "car-049",
    "options": [
      "svako lice koje robu koristi u lične svrhe",
      "samo lice koje ispunjava uslove propisane carinskim propisima Bosne i Hercegovine",
      "isključivo prevoznik koji robu unosi u zemlju",
      "svako pravno lice bez prethodnih uslova"
    ],
    "answer_index": 1,
    "answer": "samo lice koje ispunjava uslove propisane carinskim propisima Bosne i Hercegovine"
  },
  {
    "id": "car-050",
    "options": [
      "dokument za redovni izvoz robe uz naplatu carine",
      "međunarodni carinski dokument za privremeni uvoz uz potpuno oslobađanje od plaćanja uvoznih dažbina",
      "uvjerenje o porijeklu domaće robe",
      "garancija za plaćanje zatezne kamate"
    ],
    "answer_index": 1,
    "answer": "međunarodni carinski dokument za privremeni uvoz uz potpuno oslobađanje od plaćanja uvoznih dažbina"
  },
  {
    "id": "car-051",
    "options": [
      "prevozna isprava koja se koristi u međunarodnom prevozu robe željeznicom",
      "međunarodni carinski dokument za privremeni uvoz",
      "obrazac za prijavu gotovog novca",
      "odobrenje za pojednostavljeni postupak po fakturi"
    ],
    "answer_index": 0,
    "answer": "prevozna isprava koja se koristi u međunarodnom prevozu robe željeznicom"
  },
  {
    "id": "car-052",
    "options": [
      "Savjet ministara Bosne i Hercegovine",
      "Upravni odbor Uprave za indirektno oporezivanje",
      "Ministarstvo finansija i trezora BiH",
      "Direktor Uprave za indirektno oporezivanje"
    ],
    "answer_index": 1,
    "answer": "Upravni odbor Uprave za indirektno oporezivanje"
  },
  {
    "id": "car-053",
    "options": [
      "10%",
      "12%",
      "17%",
      "0,04 % za svaki dan zakašnjenja"
    ],
    "answer_index": 1,
    "answer": "12%"
  },
  {
    "id": "car-054",
    "options": [
      "12% godišnje",
      "0,04 % za svaki dan zakašnjenja",
      "10% ad valorem",
      "1% mjesečno"
    ],
    "answer_index": 1,
    "answer": "0,04 % za svaki dan zakašnjenja"
  },
  {
    "id": "car-055",
    "options": [
      "redovno prijavljivanje robe putem JCI obrasca",
      "pojednostavljeno prijavljivanje odobrene robe na graničnom prelazu",
      "postupak privremenog smještaja robe u skladištu",
      "usmeno prijavljivanje robe u unutrašnjoj carinskoj kancelariji"
    ],
    "answer_index": 1,
    "answer": "pojednostavljeno prijavljivanje odobrene robe na graničnom prelazu"
  },
  {
    "id": "car-056",
    "options": [
      "svake carinske kancelarije u Bosni i Hercegovini",
      "graničnih prelaza za međunarodni saobraćaj putnika i robe određenih odobrenjem",
      "isključivo preko poštanskih carinskih ispostava",
      "samo preko aerodromskih prelaza za putnike"
    ],
    "answer_index": 1,
    "answer": "graničnih prelaza za međunarodni saobraćaj putnika i robe određenih odobrenjem"
  },
  {
    "id": "car-057",
    "options": [
      "dužan je uvijek obezbjediti bankarsku garanciju",
      "nije dužan obezbjediti",
      "dužan je obezbjediti samo gotovinski depozit",
      "dužan je obezbjediti garanciju nakon svakog izvoza"
    ],
    "answer_index": 1,
    "answer": "nije dužan obezbjediti"
  },
  {
    "id": "car-058",
    "options": [
      "prema mjestu izlaska robe iz carinskog područja",
      "prema sjedištu podnosioca zahtjeva",
      "prema sjedištu primaoca robe u inostranstvu",
      "prema vrsti prevoznog sredstva"
    ],
    "answer_index": 1,
    "answer": "prema sjedištu podnosioca zahtjeva"
  },
  {
    "id": "car-059",
    "options": [
      "samo za postupak izvoza bez ikakvih izuzetaka",
      "za postupak izvoza, postupak puštanja robe u slobodan promet (osim za puštanje robe u slobodan promet: uz oslobađanje od plaćanja uvoznih dažbina i/ili drugih indirektnih poreza po bilo kom osnovu, uz povoljno tarifno postupanje i na osnovu tarifnih kvota)",
      "za postupak skladištenja i postupak uništenja robe",
      "za svaki carinski postupak, uključujući tarifne kvote i oslobađanja"
    ],
    "answer_index": 1,
    "answer": "za postupak izvoza, postupak puštanja robe u slobodan promet (osim za puštanje robe u slobodan promet: uz oslobađanje od plaćanja uvoznih dažbina i/ili drugih indirektnih poreza po bilo kom osnovu, uz povoljno tarifno postupanje i na osnovu tarifnih kvota)"
  },
  {
    "id": "car-060",
    "options": [
      "robu izvezenu/uvezenu po pojednostavljenim carinskim postupcima",
      "svu robu koja je prijavljena usmenom deklaracijom",
      "samo robu u postupku privremenog uvoza",
      "isključivo robu oslobođenu od plaćanja dažbina"
    ],
    "answer_index": 0,
    "answer": "robu izvezenu/uvezenu po pojednostavljenim carinskim postupcima"
  },
  {
    "id": "car-061",
    "options": [
      "samo neposredno",
      "neposredno ili posredno",
      "samo preko prevoznika",
      "isključivo putem banke garanta"
    ],
    "answer_index": 1,
    "answer": "neposredno ili posredno"
  },
  {
    "id": "car-062",
    "options": [
      "tarifno svrstavanje robe prema nomenklaturi",
      "određenje statusa robe u smislu carinskih propisa kao domaće ili strane robe",
      "utvrđivanje carinske vrijednosti robe",
      "dokaz o zemlji porijekla robe"
    ],
    "answer_index": 1,
    "answer": "određenje statusa robe u smislu carinskih propisa kao domaće ili strane robe"
  },
  {
    "id": "car-063",
    "options": [
      "domaća roba",
      "strana roba",
      "domaća i strana roba",
      "roba bez utvrđenog statusa"
    ],
    "answer_index": 1,
    "answer": "strana roba"
  },
  {
    "id": "car-064",
    "options": [
      "stranu robu koja se privremeno uvozi radi prodaje",
      "domaću robu koja se privremeno izvozi iz carinskog područja Bosne i Hercegovine radi procesa obrade",
      "robu nekomercijalnog karaktera u ličnom prtljagu",
      "gotov novac u domaćoj ili stranoj valuti"
    ],
    "answer_index": 1,
    "answer": "domaću robu koja se privremeno izvozi iz carinskog područja Bosne i Hercegovine radi procesa obrade"
  },
  {
    "id": "car-065",
    "options": [
      "10%",
      "12%",
      "17%",
      "0%"
    ],
    "answer_index": 2,
    "answer": "17%"
  },
  {
    "id": "car-066",
    "options": [
      "kao usmena deklaracija za putnički prtljag",
      "kao pisana (papirna) carinska deklaracija u redovnom postupku, u cilju stavljanja robe u neki od carinskih postupaka, kao i za ponovni izvoz robe iz carinskog područja Bosne i Hercegovine",
      "isključivo kao potvrda o naplati indirektnih poreza CPD",
      "samo kao transportna isprava u željezničkom saobraćaju"
    ],
    "answer_index": 1,
    "answer": "kao pisana (papirna) carinska deklaracija u redovnom postupku, u cilju stavljanja robe u neki od carinskih postupaka, kao i za ponovni izvoz robe iz carinskog područja Bosne i Hercegovine"
  },
  {
    "id": "car-067",
    "options": [
      "u svakoj unutrašnjoj carinskoj ispostavi nakon puštanja robe",
      "na ulaznom graničnom prelazu za međunarodni saobraćaj robe i putnika I kategorije",
      "isključivo u sjedištu uvoznika",
      "na izlaznom prelazu nakon završenog izvoza"
    ],
    "answer_index": 1,
    "answer": "na ulaznom graničnom prelazu za međunarodni saobraćaj robe i putnika I kategorije"
  },
  {
    "id": "car-068",
    "options": [
      "svako fizičko lice bez registracije",
      "lice registrovano kod nadležnog organa u Bosni i Hercegovini i upisano u Jednstveni registar obveznika indirektnih poreza kod Uprave za indirektno oporezivanje po osnovu obavljanja spoljnotrgovinskog prometa",
      "samo međunarodni prevoznik koji ima vozilo pod TIR karnetom",
      "isključivo diplomatsko-konzularno predstavništvo"
    ],
    "answer_index": 1,
    "answer": "lice registrovano kod nadležnog organa u Bosni i Hercegovini i upisano u Jednstveni registar obveznika indirektnih poreza kod Uprave za indirektno oporezivanje po osnovu obavljanja spoljnotrgovinskog prometa"
  },
  {
    "id": "car-069",
    "options": [
      "svako lice koje ima registrovanu djelatnost u Bosni i Hercegovini",
      "lice registrovano kod nadležnog organa u Bosni i Hercegovini i upisano u Jednstveni registar obveznika indirektnih poreza kod Uprave za indirektno oporezivanje po osnovu obavljanja spoljnotrgovinskog prometa i po osnovu obavljanja poslova međunarodne špedicije i da ima ovlaštenje te Uprave za pristup carinskom informacionom podsistemu",
      "samo prevoznik koji robu doprema na granični prelaz",
      "svako fizičko lice uz usmenu punomoć deklaranta"
    ],
    "answer_index": 1,
    "answer": "lice registrovano kod nadležnog organa u Bosni i Hercegovini i upisano u Jednstveni registar obveznika indirektnih poreza kod Uprave za indirektno oporezivanje po osnovu obavljanja spoljnotrgovinskog prometa i po osnovu obavljanja poslova međunarodne špedicije i da ima ovlaštenje te Uprave za pristup carinskom informacionom podsistemu"
  },
  {
    "id": "car-070",
    "options": [
      "za privremeni uvoz izložbene robe",
      "za privremeni uvoz prevoznih sredstava",
      "za privremeni uvoz profesionalne opreme",
      "za privremeni uvoz trgovačkih uzoraka"
    ],
    "answer_index": 1,
    "answer": "za privremeni uvoz prevoznih sredstava"
  },
  {
    "id": "car-071",
    "options": [
      "šest mjeseci od dana izdavanja",
      "godinu dana od dana izdavanja",
      "dvije godine od dana izdavanja",
      "do završetka svake pojedinačne prevozne operacije"
    ],
    "answer_index": 1,
    "answer": "godinu dana od dana izdavanja"
  },
  {
    "id": "car-072",
    "options": [
      "godinu dana od dana izdavanja",
      "do kraja prevozne operacije koja se odvija uz primjenu karneta TIR",
      "do prvog narednog tehničkog pregleda vozila",
      "samo do prelaska ulaznog graničnog prelaza"
    ],
    "answer_index": 1,
    "answer": "do kraja prevozne operacije koja se odvija uz primjenu karneta TIR"
  },
  {
    "id": "car-073",
    "options": [
      "dvije tačke jednistvenog carinskog područja, preko drugog carinskog područja i između dva ili više carinskih područja",
      "samo dvije tačke unutar istog carinskog skladišta",
      "isključivo dvije kancelarije u istom gradu",
      "samo mjesto utovara i mjesto istovara u domaćem prometu"
    ],
    "answer_index": 0,
    "answer": "dvije tačke jednistvenog carinskog područja, preko drugog carinskog područja i između dva ili više carinskih područja"
  },
  {
    "id": "car-074",
    "options": [
      "uz prethodnu naplatu svih uvoznih dažbina",
      "bez naplate carine i drugih dažbina, pod uslovom da se ispune svi propisani zahtjevi koji se odnose na poštivanje rokova, predočenje robe, osiguranje duga, carinska obilježja",
      "bez carinskog nadzora kada robu prati faktura",
      "isključivo nakon završetka postupka izvoza"
    ],
    "answer_index": 1,
    "answer": "bez naplate carine i drugih dažbina, pod uslovom da se ispune svi propisani zahtjevi koji se odnose na poštivanje rokova, predočenje robe, osiguranje duga, carinska obilježja"
  },
  {
    "id": "car-075",
    "options": [
      "samo domaće robe",
      "samo strane robe",
      "domaće i strane robe",
      "samo robe nekomercijalnog karaktera"
    ],
    "answer_index": 2,
    "answer": "domaće i strane robe"
  },
  {
    "id": "car-076",
    "options": [
      "isključivo JCI obrasca bez drugih dokumenata",
      "TIR i ATA karneta, JCI obrasca, CIM tovarnog lista, NATO 302 obrasca i svakog drugog dokumenta predviđenog međunarodnim sporazumom koji je prihvatila Bosna i Hercegovina",
      "samo fakture i otpremnice dobavljača",
      "isključivo potvrde o naplati indirektnih poreza CPD"
    ],
    "answer_index": 1,
    "answer": "TIR i ATA karneta, JCI obrasca, CIM tovarnog lista, NATO 302 obrasca i svakog drugog dokumenta predviđenog međunarodnim sporazumom koji je prihvatila Bosna i Hercegovina"
  },
  {
    "id": "car-077",
    "options": [
      "TIR",
      "ATA",
      "NCTS",
      "JCI"
    ],
    "answer_index": 2,
    "answer": "NCTS"
  },
  {
    "id": "car-078",
    "options": [
      "odredišnoj carinskoj kancelariji",
      "polaznoj carinskoj kancelariji",
      "provoznoj carinskoj kancelariji",
      "nadzornoj kancelariji prema sjedištu primaoca"
    ],
    "answer_index": 1,
    "answer": "polaznoj carinskoj kancelariji"
  },
  {
    "id": "car-079",
    "options": [
      "samo polaznoj i odredišnoj carinskoj kancelariji",
      "polaznoj, provoznoj i odredišnoj carinskoj kancelariji",
      "samo provoznoj carinskoj kancelariji",
      "nadzornoj i izlaznoj carinskoj kancelariji"
    ],
    "answer_index": 1,
    "answer": "polaznoj, provoznoj i odredišnoj carinskoj kancelariji"
  },
  {
    "id": "car-080",
    "options": [
      "polaznoj carinskoj kancelariji",
      "provoznoj carinskoj kancelariji",
      "odredišnoj carinskoj kancelariji",
      "nadzornoj carinskoj kancelariji"
    ],
    "answer_index": 2,
    "answer": "odredišnoj carinskoj kancelariji"
  },
  {
    "id": "car-081",
    "options": [
      "jamac koji je izdao garanciju",
      "korisnik postupka provoza",
      "primalac robe u odredištu",
      "vozač prevoznog sredstva"
    ],
    "answer_index": 1,
    "answer": "korisnik postupka provoza"
  },
  {
    "id": "car-082",
    "options": [
      "samo pojedinačno",
      "pojedinačno i sveobuhvatno",
      "samo sveobuhvatno",
      "privremeno i stalno"
    ],
    "answer_index": 1,
    "answer": "pojedinačno i sveobuhvatno"
  },
  {
    "id": "car-083",
    "options": [
      "samo jedan postupak provoza",
      "više postupaka provoza",
      "isključivo postupak izvoza",
      "samo dug nastao po jednoj fakturi"
    ],
    "answer_index": 1,
    "answer": "više postupaka provoza"
  },
  {
    "id": "car-084",
    "options": [
      "redovni elektronski postupak provoza",
      "rezervni postupak provoza",
      "pojednostavljeni postupak po fakturi",
      "postupak puštanja u slobodan promet"
    ],
    "answer_index": 1,
    "answer": "rezervni postupak provoza"
  },
  {
    "id": "car-085",
    "options": [
      "isključivo potpisom vozača na fakturi",
      "stavljanjem carinske plombe ili preciznim opisom robe u provoznoj carinskoj deklaraciji",
      "samo fotografisanjem robe prije otpreme",
      "upisom robe u arhivsku knjigu"
    ],
    "answer_index": 1,
    "answer": "stavljanjem carinske plombe ili preciznim opisom robe u provoznoj carinskoj deklaraciji"
  },
  {
    "id": "car-086",
    "options": [
      "datum kada je roba kupljena od dobavljača",
      "datum do kada roba i prateća dokumentacija trebaju biti predočeni odredišnoj carinskoj kancelariji",
      "datum isteka registracije prevoznog sredstva",
      "rok za plaćanje fakture dobavljaču"
    ],
    "answer_index": 1,
    "answer": "datum do kada roba i prateća dokumentacija trebaju biti predočeni odredišnoj carinskoj kancelariji"
  },
  {
    "id": "car-087",
    "options": [
      "kada se roba preda prevozniku u skladištu izvoznika",
      "kada roba stvarno fizički istupi iz carinskog područja Bosne i Hercegovine u nepromijenjenom stanju",
      "kada se izvozna deklaracija popuni u nacrtu",
      "kada kupac u inostranstvu plati fakturu"
    ],
    "answer_index": 1,
    "answer": "kada roba stvarno fizički istupi iz carinskog područja Bosne i Hercegovine u nepromijenjenom stanju"
  },
  {
    "id": "car-088",
    "options": [
      "u svakoj unutrašnjoj carinskoj kancelariji",
      "samo u izlaznoj carinskoj kancelariji",
      "samo kod polazne carinske kancelarije",
      "isključivo u sjedištu izvoznika"
    ],
    "answer_index": 1,
    "answer": "samo u izlaznoj carinskoj kancelariji"
  },
  {
    "id": "car-089",
    "options": [
      "samo potpuni",
      "potpuni ili djelimični",
      "samo djelimični",
      "redovni ili rezervni"
    ],
    "answer_index": 1,
    "answer": "potpuni ili djelimični"
  },
  {
    "id": "car-090",
    "options": [
      "isključivo prevoznik robe",
      "deklarant ili njegov ovlašteni zastupnik",
      "samo primalac robe",
      "jamac koji je dao osiguranje"
    ],
    "answer_index": 1,
    "answer": "deklarant ili njegov ovlašteni zastupnik"
  },
  {
    "id": "car-091",
    "options": [
      "u bilo kojem dijelu bh. aerodroma",
      "samo u onom dijelu bh. aerodroma određenom za tranzit ili odlazak putnika u međunarodnom vazdušnom saobraćaju",
      "na svakom graničnom prelazu za drumski saobraćaj",
      "isključivo u carinskom skladištu u unutrašnjosti"
    ],
    "answer_index": 1,
    "answer": "samo u onom dijelu bh. aerodroma određenom za tranzit ili odlazak putnika u međunarodnom vazdušnom saobraćaju"
  },
  {
    "id": "car-092",
    "options": [
      "broj fakture dobavljača koji prati robu",
      "glavni referentni broj je registarski broj koji dodjeljuje nadležna carinska kancelarija carinskoj deklaraciji",
      "licenca za pristup carinskom informacionom podsistemu",
      "oznaka carinske plombe na prevoznom sredstvu"
    ],
    "answer_index": 1,
    "answer": "glavni referentni broj je registarski broj koji dodjeljuje nadležna carinska kancelarija carinskoj deklaraciji"
  },
  {
    "id": "kanc-012",
    "options": [
      "Djelovodnik",
      "Arhivska knjiga",
      "Rokovnik predmeta",
      "Knjiga otpreme pošte"
    ],
    "answer_index": 1,
    "answer": "Arhivska knjiga"
  },
  {
    "id": "kanc-013",
    "options": [
      "Skraćeni djelovodnik",
      "Djelovodnik za povjerljivu i strogo povjerljivu poštu.",
      "Arhivska knjiga za završene predmete",
      "Rokovnik za predmete u radu"
    ],
    "answer_index": 1,
    "answer": "Djelovodnik za povjerljivu i strogo povjerljivu poštu."
  },
  {
    "id": "kanc-014",
    "options": [
      "Upisnik drugostepenih predmeta upravnog postupka",
      "Upisnik prvostepenih predmeta upravnog postupka.",
      "Knjiga primljene pošte",
      "Registar službenih pečata"
    ],
    "answer_index": 1,
    "answer": "Upisnik prvostepenih predmeta upravnog postupka."
  },
  {
    "id": "kanc-015",
    "options": [
      "Djelovodnik za povjerljivu poštu",
      "Upisnik drugostepenih predmeta upravnog postupka",
      "Upisnik prvostepenih predmeta upravnog postupka.",
      "Arhivska knjiga"
    ],
    "answer_index": 2,
    "answer": "Upisnik prvostepenih predmeta upravnog postupka."
  },
  {
    "id": "kanc-016",
    "options": [
      "Upisnik prvostepenih predmeta upravnog postupka",
      "Upisnik drugostepenih predmeta upravnog postupka",
      "Knjiga dostavnica",
      "Rokovnik povjerljive pošte"
    ],
    "answer_index": 1,
    "answer": "Upisnik drugostepenih predmeta upravnog postupka"
  },
  {
    "id": "kanc-017",
    "options": [
      "Sa mekim koricama.",
      "Sa tvrdim koricama.",
      "U obliku kartica bez korica.",
      "Samo u elektronskom obliku."
    ],
    "answer_index": 1,
    "answer": "Sa tvrdim koricama."
  },
  {
    "id": "kanc-018",
    "options": [
      "Sa tvrdim koricama.",
      "Sa mekim koricama.",
      "Kao neuvezani listovi.",
      "Isključivo u obliku registra pečata."
    ],
    "answer_index": 0,
    "answer": "Sa tvrdim koricama."
  },
  {
    "id": "kanc-019",
    "options": [
      "Identitet potpisnika.",
      "Vjerodostojnost isprave.",
      "Tačnost adrese primaoca.",
      "Datum otpreme pošiljke."
    ],
    "answer_index": 1,
    "answer": "Vjerodostojnost isprave."
  },
  {
    "id": "kanc-020",
    "options": [
      "Zaposlenik u pisarnici.",
      "Lice na čije ime glasi.",
      "Neposredni rukovodilac primaoca.",
      "Svaki ovlašteni dostavljač."
    ],
    "answer_index": 1,
    "answer": "Lice na čije ime glasi."
  },
  {
    "id": "kanc-021",
    "options": [
      "Rukovodilac organa uprave.",
      "Zaposlenik ovlašten za prijem pošte.",
      "Lice na koje pošta glasi.",
      "Radnik koji vodi arhivsku knjigu."
    ],
    "answer_index": 1,
    "answer": "Zaposlenik ovlašten za prijem pošte."
  },
  {
    "id": "kanc-022",
    "options": [
      "Oblika kvadrata.",
      "Oblika kruga.",
      "Oblika pravougaonika.",
      "Oblika elipse."
    ],
    "answer_index": 1,
    "answer": "Oblika kruga."
  },
  {
    "id": "kanc-023",
    "options": [
      "Jeziku zemlje prijema.",
      "Isključivo engleskom jeziku.",
      "Jeziku zemlje pošiljaoca.",
      "Samo na latiničnom pismu."
    ],
    "answer_index": 0,
    "answer": "Jeziku zemlje prijema."
  },
  {
    "id": "kanc-024",
    "options": [
      "S desne strane iznad potpisa rukovodioca",
      "S lijeve strane pored potpisa rukovodioca",
      "Na poleđini akta ispod prijemnog štambilja",
      "U zaglavlju akta pored broja predmeta"
    ],
    "answer_index": 1,
    "answer": "S lijeve strane pored potpisa rukovodioca"
  },
  {
    "id": "kanc-025",
    "options": [
      "Običnom otvorenom kovertom.",
      "Zapečaćeno.",
      "Putem javne oglasne table.",
      "Bez posebnog označavanja."
    ],
    "answer_index": 1,
    "answer": "Zapečaćeno."
  },
  {
    "id": "kanc-026",
    "options": [
      "Redovnom poštom narednog radnog dana.",
      "Putem dostavljača-kurira.",
      "Isključivo elektronskom poštom.",
      "Preko arhivske knjige bez dostave."
    ],
    "answer_index": 1,
    "answer": "Putem dostavljača-kurira."
  },
  {
    "id": "kanc-027",
    "options": [
      "Aktivirati predmet.",
      "Arhivirati predmet.",
      "Vratiti predmet podnosiocu.",
      "Izbrisati predmet iz evidencije."
    ],
    "answer_index": 1,
    "answer": "Arhivirati predmet."
  },
  {
    "id": "kanc-028",
    "options": [
      "S desne strane iznad teksta.",
      "S lijeve strane ispod teksta u visini potpisa.",
      "Na poleđini akta pri dnu stranice.",
      "U zaglavlju pored naziva organa."
    ],
    "answer_index": 1,
    "answer": "S lijeve strane ispod teksta u visini potpisa."
  },
  {
    "id": "kanc-029",
    "options": [
      "Sa završetkom mjeseca.",
      "Sa zvršetkom godine.",
      "Nakon svakog upisanog predmeta.",
      "Po isteku roka čuvanja predmeta."
    ],
    "answer_index": 1,
    "answer": "Sa zvršetkom godine."
  },
  {
    "id": "kanc-030",
    "options": [
      "Samo potpisom rukovodioca organa.",
      "Pečatom i potpisom radnika koji vodi djelovodnik.",
      "Samo službenim pečatom bez potpisa.",
      "Potpisom podnosioca zahtjeva."
    ],
    "answer_index": 1,
    "answer": "Pečatom i potpisom radnika koji vodi djelovodnik."
  },
  {
    "id": "kanc-031",
    "options": [
      "Završeni predmeti spremni za arhivu.",
      "Nepotpuni predmeti u vezi kojih se mora obaviti neka radnja.",
      "Predmeti za trajno uništenje.",
      "Samo finansijski izvještaji organa."
    ],
    "answer_index": 1,
    "answer": "Nepotpuni predmeti u vezi kojih se mora obaviti neka radnja."
  },
  {
    "id": "kanc-032",
    "options": [
      "Svakog dana bez izuzetka.",
      "Samo radnim danom.",
      "Samo subotom i nedjeljom.",
      "Isključivo petkom nakon radnog vremena."
    ],
    "answer_index": 1,
    "answer": "Samo radnim danom."
  },
  {
    "id": "kanc-033",
    "options": [
      "Samo prvog sata radnog vremena.",
      "Tokom cijelog radnog vremena.",
      "Samo nakon završetka radnog vremena.",
      "Isključivo u terminu koji odredi dostavljač."
    ],
    "answer_index": 1,
    "answer": "Tokom cijelog radnog vremena."
  },
  {
    "id": "kanc-034",
    "options": [
      "Broj bankovnog računa.",
      "Datum prijema.",
      "Ime podnosioca akta kao obavezni jedini podatak.",
      "Tarifnu oznaku robe."
    ],
    "answer_index": 1,
    "answer": "Datum prijema."
  },
  {
    "id": "kanc-035",
    "options": [
      "Službeni akt (dopis) institucija BiH mora da sadrži samo zaglavlje, broj predmeta i potpis referenta.",
      "Službeni akt (dopis) institucija BiH mora da sadrži: zaglavlje, naziv i adresu primaoca, kratku sadržinu predmeta, sadržaj akta, otisak službenog pečata i potpis ovlaštenog lica.",
      "Službeni akt mora da sadrži samo naziv primaoca, datum prijema i arhivski broj.",
      "Službeni akt mora da sadrži isključivo sadržaj akta i priloge bez pečata."
    ],
    "answer_index": 1,
    "answer": "Službeni akt (dopis) institucija BiH mora da sadrži: zaglavlje, naziv i adresu primaoca, kratku sadržinu predmeta, sadržaj akta, otisak službenog pečata i potpis ovlaštenog lica."
  },
  {
    "id": "kanc-036",
    "options": [
      "Zelenom bojom.",
      "Plavom bojom.",
      "Bijelom bojom.",
      "Žutom bojom."
    ],
    "answer_index": 1,
    "answer": "Plavom bojom."
  },
  {
    "id": "kanc-037",
    "options": [
      "Plavom bojom.",
      "Bijelom bojom.",
      "Zelenom bojom.",
      "Žutom bojom."
    ],
    "answer_index": 2,
    "answer": "Zelenom bojom."
  },
  {
    "id": "kanc-038",
    "options": [
      "Plavom bojom.",
      "Zelenom bojom.",
      "Bijelom bojom.",
      "Žutom bojom."
    ],
    "answer_index": 2,
    "answer": "Bijelom bojom."
  },
  {
    "id": "kanc-039",
    "options": [
      "Plavom bojom.",
      "Zelenom bojom.",
      "Bijelom bojom.",
      "Žutom bojom."
    ],
    "answer_index": 3,
    "answer": "Žutom bojom."
  },
  {
    "id": "uio-015",
    "options": [
      "Parlamentarnoj skupštini BiH.",
      "Predsjedništvu BiH.",
      "Savjetu ministara BiH.",
      "Ministarstvu finansija i trezora BiH."
    ],
    "answer_index": 2,
    "answer": "Savjetu ministara BiH."
  },
  {
    "id": "uio-016",
    "options": [
      "Sarajevu.",
      "Banja Luci.",
      "Mostaru.",
      "Tuzli."
    ],
    "answer_index": 1,
    "answer": "Banja Luci."
  }
]
$json$::jsonb) as item(id text, options jsonb, answer_index integer, answer text)
  )
  update public.premium_questions as question
  set
    question_type = 'multiple-choice',
    options = updates.options,
    answer_index = updates.answer_index,
    answer = updates.answer,
    updated_at = now()
  from updates
  where question.id = updates.id;

  get diagnostics updated_count = row_count;
  if updated_count <> 97 then
    raise exception 'Expected to update 97 premium questions, updated %', updated_count;
  end if;
end $$;

update public.premium_questions
set
  options = '["Direktor.", "Agencija za državnu službu BiH.", "Pomoćnik direktora.", "Upravni odbor Uprave za indirektno oporezivanje."]'::jsonb,
  answer_index = 0,
  question_type = 'multiple-choice',
  updated_at = now()
where id = 'uio-026';

alter table public.premium_questions
  add constraint premium_questions_shape_check
    check (
      (
        question_type = 'direct'
        and answer is not null
        and btrim(answer) <> ''
        and options is null
        and answer_index is null
      )
      or
      (
        question_type = 'multiple-choice'
        and jsonb_typeof(options) = 'array'
        and jsonb_array_length(options) = 4
        and answer_index is not null
        and answer_index >= 0
        and answer_index < jsonb_array_length(options)
        and (answer is null or btrim(answer) <> '')
      )
    );
