async function fetchQuestion(topic, description = '', difficulty = 'medium') {
  const response = await fetch('/api/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, description, difficulty })
  });
  return response.json();
}