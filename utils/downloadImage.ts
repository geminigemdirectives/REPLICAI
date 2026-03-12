
export const downloadImage = (src: string, filename: string = `replicai_${Date.now()}.png`) => {
  const link = document.createElement('a');
  link.href = src;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
