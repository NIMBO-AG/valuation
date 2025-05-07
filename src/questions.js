// src/questions.js
async function loadQuestions() {
  const res = await fetch(QUESTIONS_URL);
  return res.json(); // Array of question objects with fields id, label, type, text, options, visible_if
}
