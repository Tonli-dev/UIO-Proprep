import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const contentPath = "public/data/questions.json";
const migrationPath = "supabase/migrations/20260605100000_move_130_questions_to_premium.sql";
const nextContentVersion = "2026.06.05-split-50-130";
const freeCountsByCategory = {
  uio: 14,
  kanc: 11,
  carine: 25
};

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlTextArray(values = []) {
  return `array[${values.map(sqlString).join(", ")}]::text[]`;
}

function sqlJson(value) {
  if (value === null || value === undefined) return "null";
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function selectFreeQuestions(questions) {
  const seenByCategory = {};
  const freeIds = new Set();

  questions.forEach((question) => {
    const allowed = freeCountsByCategory[question.categoryId] || 0;
    seenByCategory[question.categoryId] = seenByCategory[question.categoryId] || 0;
    if (seenByCategory[question.categoryId] < allowed) {
      freeIds.add(question.id);
      seenByCategory[question.categoryId] += 1;
    }
  });

  return freeIds;
}

function buildPremiumInsertRows(questions) {
  return questions.map((question) => {
    const questionType = question.questionType || "multiple-choice";
    return `  (
    ${sqlString(question.id)},
    ${sqlString(question.categoryId)},
    ${sqlString(questionType)},
    ${sqlString(question.question)},
    ${questionType === "direct" ? "null" : sqlJson(question.options)},
    ${questionType === "direct" ? "null" : question.answerIndex},
    ${questionType === "direct" ? sqlString(question.answer) : "null"},
    ${sqlString(question.rationale)},
    ${sqlString(question.source)},
    ${sqlString(question.difficulty)},
    ${sqlTextArray(question.keywords)},
    ${sqlString(nextContentVersion)}
  )`;
  });
}

function buildMigration(premiumQuestions) {
  return `alter table public.premium_questions
  add column if not exists question_type text not null default 'multiple-choice',
  add column if not exists answer text;

alter table public.premium_questions
  alter column options drop not null,
  alter column answer_index drop not null;

alter table public.premium_questions
  drop constraint if exists premium_questions_options_check,
  drop constraint if exists premium_questions_answer_index_check,
  drop constraint if exists premium_questions_question_type_check,
  drop constraint if exists premium_questions_shape_check;

alter table public.premium_questions
  add constraint premium_questions_question_type_check
    check (question_type in ('direct', 'multiple-choice')),
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
        and answer is null
        and jsonb_typeof(options) = 'array'
        and jsonb_array_length(options) >= 2
        and answer_index is not null
        and answer_index >= 0
        and answer_index < jsonb_array_length(options)
      )
    );

insert into public.premium_questions
  (id, category_id, question_type, question, options, answer_index, answer, rationale, source, difficulty, keywords, content_version)
values
${buildPremiumInsertRows(premiumQuestions).join(",\n")}
on conflict (id) do update set
  category_id = excluded.category_id,
  question_type = excluded.question_type,
  question = excluded.question,
  options = excluded.options,
  answer_index = excluded.answer_index,
  answer = excluded.answer,
  rationale = excluded.rationale,
  source = excluded.source,
  difficulty = excluded.difficulty,
  keywords = excluded.keywords,
  content_version = excluded.content_version,
  updated_at = now();
`;
}

const content = JSON.parse(await readFile(contentPath, "utf8"));
const allQuestions = content.questions;
const freeIds = selectFreeQuestions(allQuestions);
const freeQuestions = allQuestions
  .filter((question) => freeIds.has(question.id))
  .map((question) => ({ ...question, access: "free" }));
const premiumQuestions = allQuestions
  .filter((question) => !freeIds.has(question.id))
  .map((question) => ({ ...question, access: "premium" }));

if (freeQuestions.length !== 50 || premiumQuestions.length !== 130) {
  throw new Error(`Expected 50 free and 130 premium questions, got ${freeQuestions.length}/${premiumQuestions.length}.`);
}

const splitCounts = {
  free: freeQuestions.reduce((counts, question) => {
    counts[question.categoryId] = (counts[question.categoryId] || 0) + 1;
    return counts;
  }, {}),
  premium: premiumQuestions.reduce((counts, question) => {
    counts[question.categoryId] = (counts[question.categoryId] || 0) + 1;
    return counts;
  }, {})
};

const nextContent = {
  ...content,
  contentVersion: nextContentVersion,
  questions: freeQuestions,
  sourceDocument: {
    ...content.sourceDocument,
    split: {
      freeQuestionCount: freeQuestions.length,
      premiumQuestionCount: premiumQuestions.length,
      countsByCategory: splitCounts,
      strategy: "Prvih proporcionalnih 50 pitanja po oblastima ostaje u javnom JSON-u; preostalih 130 se učitava iz Supabase premium_questions."
    }
  }
};

await writeFile(contentPath, JSON.stringify(nextContent, null, 2) + "\n", "utf8");
await mkdir(path.dirname(migrationPath), { recursive: true });
await writeFile(migrationPath, buildMigration(premiumQuestions), "utf8");

console.log(`Free questions: ${freeQuestions.length}`, splitCounts.free);
console.log(`Premium questions: ${premiumQuestions.length}`, splitCounts.premium);
console.log(`Updated ${contentPath}`);
console.log(`Generated ${migrationPath}`);
