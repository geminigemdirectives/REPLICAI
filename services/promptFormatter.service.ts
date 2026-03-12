export function formatPrompt(prompt: string): string {
  return `
Generate a real photograph captured with a physical camera in the real world.

${prompt}

The image must appear as a genuine photographic capture with natural lighting and realistic physical detail.
`.trim();
}
