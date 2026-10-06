export function toast(message: string, tone: "ok" | "bad" = "ok") {
  window.dispatchEvent(new CustomEvent("toast", { detail: { message, tone } }));
}
