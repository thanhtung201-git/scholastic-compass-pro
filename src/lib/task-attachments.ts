import { supabase } from "@/lib/supabase";

export const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;
export const TASK_ATTACHMENTS_BUCKET = "task-attachments";

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function validateAttachmentFile(file: File) {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return `"${file.name}" exceeds the 50 MB limit.`;
  }
  return null;
}

export function isImageAttachment(fileType: string | null | undefined, fileName: string) {
  if (fileType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
}

export function canViewAttachmentInBrowser(
  fileType: string | null | undefined,
  fileName: string,
) {
  if (isImageAttachment(fileType, fileName)) return true;
  if (fileType === "application/pdf" || /\.pdf$/i.test(fileName)) return true;
  if (fileType?.startsWith("text/") || /\.(txt|md|csv|json|xml|log)$/i.test(fileName)) return true;
  if (fileType?.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(fileName)) return true;
  if (fileType?.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(fileName)) return true;
  return false;
}

export function viewAttachment(fileUrl: string) {
  window.open(fileUrl, "_blank", "noopener,noreferrer");
}

export async function downloadAttachment(attachment: {
  file_url: string;
  file_name: string;
}) {
  try {
    const response = await fetch(attachment.file_url);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    viewAttachment(attachment.file_url);
  }
}

export async function uploadTaskAttachment(taskId: string, file: File) {
  const safeName = file.name.replace(/[^\w.\-()+\s]/g, "_");
  const path = `${taskId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(TASK_ATTACHMENTS_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(TASK_ATTACHMENTS_BUCKET).getPublicUrl(path);
  return { fileUrl: data.publicUrl, path };
}
