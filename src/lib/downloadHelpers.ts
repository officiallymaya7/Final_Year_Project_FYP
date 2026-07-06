import JSZip from "jszip";

export const downloadFile = async (url: string, filename: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

export const downloadAllAsZip = async (
  files: { url: string; filename: string }[],
  zipName: string,
  onProgress?: (done: number, total: number) => void
) => {
  const zip = new JSZip();
  for (let i = 0; i < files.length; i++) {
    const { url, filename } = files[i];
    const res = await fetch(url);
    const blob = await res.blob();
    zip.file(filename, blob);
    onProgress?.(i + 1, files.length);
  }
  const content = await zip.generateAsync({ type: "blob" });
  const blobUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};