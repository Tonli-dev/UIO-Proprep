#!/usr/bin/env python3

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

NAMESPACE = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
QUESTION_NUMBERING = {1: "uio", 71: "kanc", 128: "carine"}
CORRECT_ANSWER_COLORS = {"0070C0", "C00000", "FF0000"}
STOP_WORDS = {
    "bosne",
    "bosni",
    "bosna",
    "hercegovine",
    "hercegovina",
    "koja",
    "koje",
    "koji",
    "kojim",
    "kada",
    "kako",
    "može",
    "mogu",
    "sljedeće",
    "sljedećih",
    "uprava",
    "indirektno",
    "oporezivanje",
    "odgovor",
}

CATEGORIES = [
    {
        "id": "uio",
        "title": "Organizacija UIO i zaposleni",
        "description": "Organizacija Uprave, nadležnosti te prava i obaveze zaposlenih.",
        "color": "blue",
        "numberingId": 1,
        "source": "PITANJA-SSS-OBJAVA-KONACNO: Organizacija UIO i prava i obaveze zaposlenih",
    },
    {
        "id": "kanc",
        "title": "Kancelarijsko poslovanje",
        "description": "Akti, evidencije, pisarnica, arhiva, dostava i pečati institucija BiH.",
        "color": "green",
        "numberingId": 71,
        "source": "PITANJA-SSS-OBJAVA-KONACNO: Kancelarijsko poslovanje",
    },
    {
        "id": "carine",
        "title": "Carinski postupci",
        "description": "Carinska politika, skladištenje, provoz, uvoz, izvoz, PDV i dokumenti.",
        "color": "purple",
        "numberingId": 128,
        "source": "PITANJA-SSS-OBJAVA-KONACNO: Pitanja iz oblasti carinskih postupaka",
    },
]

FALLBACK_LEGAL_SOURCES = {
    "uio": [
        "Zakon o sistemu indirektnog oporezivanja u Bosni i Hercegovini",
        "Zakon o Upravi za indirektno oporezivanje",
        "Pravilnik o unutrašnjoj organizaciji u Upravi za indirektno oporezivanje",
        "Kodeks ponašanja zaposlenih u Upravi za indirektno oporezivanje",
    ],
    "kanc": [
        "Odluka o kancelarijskom poslovanju ministarstava, službi, institucija i drugih tijela Vijeća ministara BiH",
        "Uputstvo o načinu vršenja kancelarijskog poslovanja",
        "Zakon o pečatu institucija BiH",
        "Uputstvo o postupku i načinu izrade i evidencije pečata institucija BiH",
    ],
    "carine": [
        "Konvencija o privremenom uvozu",
        "Zakon o carinskoj politici u Bosni i Hercegovini",
        "Zakon o porezu na dodatu vrijednost",
        "Odluka o sprovođenju Zakona o carinskoj politici u Bosni i Hercegovini",
        "Odluka o uslovima i postupku ostvarivanja prava na oslobađanje od plaćanja uvoznih i izvoznih dažbina",
        "Uputstvo o provođenju postupka po karnetu TIR",
        "Instrukcija o povratu poreza na dodatu vrijednost stranim državljanima",
    ],
}


def normalize_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def paragraph_data(paragraph):
    text_parts = []
    colors = set()
    for run in paragraph.findall("w:r", NAMESPACE):
        run_text = "".join(node.text or "" for node in run.findall(".//w:t", NAMESPACE))
        if run_text:
            text_parts.append(run_text)
        color = run.find("w:rPr/w:color", NAMESPACE)
        if color is not None:
            value = color.get(f"{{{NAMESPACE['w']}}}val")
            if value:
                colors.add(value.upper())

    num_id = None
    num_node = paragraph.find("w:pPr/w:numPr/w:numId", NAMESPACE)
    if num_node is not None:
        value = num_node.get(f"{{{NAMESPACE['w']}}}val")
        if value and value.isdigit():
            num_id = int(value)

    return {"text": normalize_text("".join(text_parts)), "numId": num_id, "colors": colors}


def read_paragraphs(docx_path):
    with zipfile.ZipFile(docx_path) as archive:
        root = ElementTree.fromstring(archive.read("word/document.xml"))
    return [paragraph_data(node) for node in root.findall(".//w:body/w:p", NAMESPACE)]


def extract_legal_sources(paragraphs):
    section_markers = [
        ("uio", "ORGANIZACIJA UPRAVE"),
        ("kanc", "II KANCELARIJSKO"),
        ("carine", "III PITANJA"),
    ]
    starts = []
    for category_id, marker in section_markers:
        index = next(
            (index for index, paragraph in enumerate(paragraphs) if paragraph["text"].upper().startswith(marker)),
            None,
        )
        if index is not None:
            starts.append((index, category_id))

    sources = {}
    for position, (start, category_id) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(paragraphs)
        source_start = next(
            (
                index
                for index in range(start, end)
                if paragraphs[index]["text"].lower().startswith("pravni izvori")
            ),
            None,
        )
        question_start = next(
            (
                index
                for index in range(source_start + 1 if source_start is not None else start, end)
                if paragraphs[index]["text"].lower().startswith("pitanja")
            ),
            None,
        )
        if source_start is None or question_start is None:
            sources[category_id] = FALLBACK_LEGAL_SOURCES[category_id]
            continue
        sources[category_id] = [
            paragraphs[index]["text"]
            for index in range(source_start + 1, question_start)
            if paragraphs[index]["text"]
        ]
    return sources


def make_keywords(question, answer, category_id):
    words = re.findall(r"[A-Za-zČĆŽŠĐčćžšđ]{4,}|[A-Z]{2,}|[A-ZČĆŽŠĐ]{2,}(?:-[A-Z0-9]+)+", f"{question} {answer}")
    keywords = [category_id]
    for word in words:
        normalized = word.lower()
        if normalized in STOP_WORDS or normalized in keywords:
            continue
        keywords.append(normalized)
        if len(keywords) == 9:
            break
    return keywords


def parse_questions(paragraphs):
    starts = [
        (index, QUESTION_NUMBERING[paragraph["numId"]])
        for index, paragraph in enumerate(paragraphs)
        if paragraph["numId"] in QUESTION_NUMBERING
    ]
    category_counts = {category["id"]: 0 for category in CATEGORIES}
    questions = []

    for position, (start, category_id) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(paragraphs)
        next_category = starts[position + 1][1] if position + 1 < len(starts) else category_id
        if next_category != category_id:
            for index in range(start + 1, end):
                text = paragraphs[index]["text"].upper()
                if text.startswith("II KANCELARIJSKO") or text.startswith("III PITANJA"):
                    end = index
                    break

        block = [paragraph for paragraph in paragraphs[start + 1 : end] if paragraph["text"]]
        question_text = paragraphs[start]["text"]
        category_counts[category_id] += 1
        question_id = f"{'car' if category_id == 'carine' else category_id}-{category_counts[category_id]:03d}"
        source = next(category["source"] for category in CATEGORIES if category["id"] == category_id)
        answer_marker = next(
            (index for index, paragraph in enumerate(block) if paragraph["text"].lower().startswith("odgovor:")),
            None,
        )

        if answer_marker is None:
            options = [paragraph["text"] for paragraph in block]
            correct_indexes = [
                index
                for index, paragraph in enumerate(block)
                if paragraph["colors"].intersection(CORRECT_ANSWER_COLORS)
            ]
            if len(options) < 2 or len(correct_indexes) != 1:
                raise ValueError(f"Ne mogu pouzdano parsirati ponuđene odgovore za {question_id}: {question_text}")
            answer_index = correct_indexes[0]
            answer = options[answer_index].rstrip(" ,")
            questions.append(
                {
                    "id": question_id,
                    "categoryId": category_id,
                    "questionType": "multiple-choice",
                    "question": question_text,
                    "options": options,
                    "answerIndex": answer_index,
                    "rationale": f"Tačan odgovor prema izvornom dokumentu: {answer}",
                    "source": source,
                    "difficulty": "medium",
                    "access": "free",
                    "keywords": make_keywords(question_text, answer, category_id),
                }
            )
            continue

        marker_text = block[answer_marker]["text"]
        marker_suffix = normalize_text(marker_text.split(":", 1)[1]) if ":" in marker_text else ""
        answer_parts = [paragraph["text"] for paragraph in block[answer_marker + 1 :]]
        if marker_suffix and not (answer_parts and answer_parts[0].lower().startswith(marker_suffix.lower())):
            answer_parts.insert(0, marker_suffix)
        answer = normalize_text(" ".join(answer_parts)).rstrip(" ,")
        if not answer:
            raise ValueError(f"Nedostaje odgovor za {question_id}: {question_text}")
        questions.append(
            {
                "id": question_id,
                "categoryId": category_id,
                "questionType": "direct",
                "question": question_text,
                "answer": answer,
                "rationale": f"Tačan odgovor prema izvornom dokumentu: {answer}",
                "source": source,
                "difficulty": "medium",
                "access": "free",
                "keywords": make_keywords(question_text, answer, category_id),
            }
        )

    return questions


def build_content(questions, source_filename, legal_sources):
    categories = [{key: value for key, value in category.items() if key not in {"numberingId", "source"}} for category in CATEGORIES]
    guide = [
        {
            "id": f"guide-{category['id']}",
            "title": category["title"],
            "keywords": " ".join([category["id"], *make_keywords(category["title"], category["description"], category["id"])]),
            "body": f"{category['description']} Pravni izvori: {'; '.join(legal_sources[category['id']])}.",
        }
        for category in CATEGORIES
    ]
    return {
        "contentVersion": "2026.06.04-sss-final",
        "contentTarget": len(questions),
        "exam": {"questionCount": 30, "durationMinutes": 45, "passingPercent": 70},
        "sourceDocument": {
            "filename": source_filename,
            "questionCount": len(questions),
            "note": "Pitanja i tačni odgovori uvezeni su bez generiranja dodatnih ponuđenih odgovora.",
            "legalSources": legal_sources,
        },
        "schemaDocumentation": {
            "directQuestion": {
                "questionType": "direct",
                "answer": "Tačan odgovor koji korisnik otkriva i sam ocjenjuje.",
            },
            "multipleChoiceQuestion": {
                "questionType": "multiple-choice",
                "options": "Ponuđeni odgovori iz izvornog dokumenta.",
                "answerIndex": "Indeks tačnog odgovora.",
            },
        },
        "categories": categories,
        "questions": questions,
        "flashcards": [],
        "guide": guide,
        "disclaimer": "UIO ProPrep je nezavisni obrazovni alat i nije zvanično povezan sa Upravom za indirektno oporezivanje BiH. Pitanja i odgovori uvezeni su iz dostavljenog dokumenta; važeće propise uvijek provjerite u zvaničnim izvorima.",
    }


def main():
    if len(sys.argv) not in {2, 3}:
        print("Upotreba: python3 scripts/import-questions-docx.py <pitanja.docx> [izlaz.json]", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1]).expanduser().resolve()
    output_path = Path(sys.argv[2]).expanduser().resolve() if len(sys.argv) == 3 else Path("public/data/questions.json").resolve()
    paragraphs = read_paragraphs(input_path)
    questions = parse_questions(paragraphs)
    content = build_content(questions, input_path.name, extract_legal_sources(paragraphs))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    counts = {category["id"]: 0 for category in CATEGORIES}
    for question in questions:
        counts[question["categoryId"]] += 1
    direct = sum(question["questionType"] == "direct" for question in questions)
    multiple_choice = len(questions) - direct
    print(f"Uvezeno {len(questions)} pitanja ({direct} direktnih, {multiple_choice} s ponuđenim odgovorima): {counts}")
    print(f"Zapisano u {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
