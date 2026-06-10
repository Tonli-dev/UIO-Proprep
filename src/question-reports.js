import { requireSupabase } from "./supabase-client.js";

export function buildQuestionReportPayload({
  session,
  question,
  suggestedAnswer,
  note = "",
  contentVersion = null
}) {
  const userId = session?.user?.id;
  if (!userId) throw new Error("Prijavite se prije slanja prijave.");
  if (!question?.id || !question?.question) throw new Error("Pitanje nije dostupno za prijavu.");

  const normalizedAnswer = String(suggestedAnswer || "").trim();
  if (!normalizedAnswer) throw new Error("Upišite predloženi tačan odgovor.");

  const options = Array.isArray(question.options) ? question.options : [];
  const reportedAnswer = Number.isInteger(question.answerIndex)
    ? options[question.answerIndex] || question.answer || null
    : question.answer || null;

  return {
    user_id: userId,
    question_id: question.id,
    category_id: question.categoryId || null,
    question_text: question.question,
    options,
    reported_answer: reportedAnswer,
    suggested_answer: normalizedAnswer,
    note: String(note || "").trim() || null,
    source: question.source || null,
    question_access: question.access || "free",
    content_version: contentVersion
  };
}

export async function submitQuestionReport(input) {
  const payload = buildQuestionReportPayload(input);
  const { data, error } = await requireSupabase()
    .from("question_reports")
    .insert(payload)
    .select("id, status, created_at")
    .single();

  if (error) throw error;
  return data;
}
