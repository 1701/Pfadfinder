// Hands a file made on this device to the browser as a download (Blob URL, no network).

export function downloadTextFile(name: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari starts the download asynchronously; release the URL a little later.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
