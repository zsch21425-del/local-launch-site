// Strip DeepSeek reasoning-mode "Thinking: ..." preamble before grading.
// DeepSeek v4 reasoning models prepend "Thinking: <internal monologue>\n\n"
// to the actual answer. The grader must see only the real email, not the
// model's private reasoning (which reads as AI-speak to a rubric judge).
module.exports = (output) => {
  if (typeof output !== 'string') return output;
  const m = output.match(/^Thinking:[\s\S]*?\n\s*\n/);
  if (m) return output.slice(m[0].length).trim();
  return output;
};
