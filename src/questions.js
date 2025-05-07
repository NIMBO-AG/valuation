// src/questions.js
async function loadQuestions() {
  const res = await fetch(QUESTIONS_URL);
  return res.json();
}
