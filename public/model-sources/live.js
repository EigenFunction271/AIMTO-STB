/**
 * LIVE MODEL SOURCE
 * Sends a workflow operation to the local server and returns the provider's text.
 * This file chooses where text comes from; it does not decide what the workflow does.
 */
export async function completeFromLive(operation, input, { provider, apiKey, onModel } = {}) {
  const response = await fetch("/api/save-the-build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ provider, apiKey, operation, input }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "The provider request failed.");
    console.error("[save-the-build] completeFromLive failed", { operation, status: response.status, error: result.error });
    throw error;
  }
  if (typeof result.output !== "string") {
    console.error("[save-the-build] completeFromLive unexpected response", { operation, result });
    throw new Error("The provider returned an unexpected response.");
  }
  if (typeof result.model === "string" && result.model.length <= 100) onModel?.(result.model);
  return result.output;
}
