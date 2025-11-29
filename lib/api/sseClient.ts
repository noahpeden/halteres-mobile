// SSE Client for React Native
// React Native doesn't have EventSource, so we use fetch with ReadableStream

export type SSEEvent = {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
};

export type SSECallback = (event: SSEEvent) => void;
export type SSEErrorCallback = (error: Error) => void;

export interface SSEClientOptions {
  onMessage: SSECallback;
  onError?: SSEErrorCallback;
  onOpen?: () => void;
  onClose?: () => void;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Creates an SSE client for React Native
 * Uses fetch with ReadableStream to handle Server-Sent Events
 */
export async function createSSEClient(
  url: string,
  options: SSEClientOptions,
): Promise<void> {
  const { onMessage, onError, onOpen, onClose, headers = {}, signal } = options;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...headers,
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Call onOpen callback
    onOpen?.();

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newline)
        const messages = buffer.split("\n\n");
        // Keep the last incomplete message in the buffer
        buffer = messages.pop() || "";

        // Parse and emit each complete message
        for (const message of messages) {
          if (message.trim()) {
            const event = parseSSEMessage(message);
            if (event) {
              onMessage(event);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      onClose?.();
    }
  } catch (error) {
    if (error instanceof Error) {
      // Don't treat abort as an error
      if (error.name === "AbortError") {
        onClose?.();
        return;
      }
      onError?.(error);
    } else {
      onError?.(new Error("Unknown error occurred"));
    }
  }
}

/**
 * Parses a single SSE message into an SSEEvent
 * Format: "event: eventName\ndata: jsonData\nid: messageId\n"
 */
function parseSSEMessage(message: string): SSEEvent | null {
  const lines = message.split("\n");
  const event: Partial<SSEEvent> = {
    data: "",
  };

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event.event = line.substring(6).trim();
    } else if (line.startsWith("data:")) {
      // Accumulate data lines (there can be multiple)
      const dataLine = line.substring(5).trim();
      event.data = event.data ? `${event.data}\n${dataLine}` : dataLine;
    } else if (line.startsWith("id:")) {
      event.id = line.substring(3).trim();
    } else if (line.startsWith("retry:")) {
      const retry = parseInt(line.substring(6).trim(), 10);
      if (!isNaN(retry)) {
        event.retry = retry;
      }
    }
  }

  // Only return if we have data
  return event.data ? (event as SSEEvent) : null;
}

/**
 * Helper to create SSE client with POST request
 * Useful for endpoints that require request body
 *
 * Note: React Native's fetch doesn't support ReadableStream.body
 * We use a workaround that reads the full response as text and polls for updates
 * For true streaming in RN, consider using react-native-sse or EventSource polyfill
 */
export async function createSSEClientWithPost(
  url: string,
  body: Record<string, unknown>,
  options: SSEClientOptions,
): Promise<void> {
  const { onMessage, onError, onOpen, onClose, headers = {}, signal } = options;

  console.log("[SSE] Starting POST request to:", url);

  try {
    // Use XMLHttpRequest for streaming support in React Native
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let buffer = "";
      let lastIndex = 0;

      xhr.open("POST", url, true);
      xhr.setRequestHeader("Accept", "text/event-stream");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Cache-Control", "no-cache");

      // Add custom headers
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      // Handle abort signal
      if (signal) {
        signal.addEventListener("abort", () => {
          console.log("[SSE] Aborting XHR request");
          xhr.abort();
        });
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
          console.log("[SSE] Response status:", xhr.status);
          if (xhr.status !== 200) {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
            return;
          }
          onOpen?.();
        }

        if (
          xhr.readyState === XMLHttpRequest.LOADING ||
          xhr.readyState === XMLHttpRequest.DONE
        ) {
          // Get new data since last check
          const newData = xhr.responseText.substring(lastIndex);
          lastIndex = xhr.responseText.length;

          if (newData) {
            buffer += newData;

            // Process complete SSE messages (separated by double newline)
            const messages = buffer.split("\n\n");
            // Keep the last incomplete message in the buffer
            buffer = messages.pop() || "";

            // Parse and emit each complete message
            for (const message of messages) {
              if (message.trim()) {
                const event = parseSSEMessage(message);
                if (event) {
                  onMessage(event);
                }
              }
            }
          }
        }

        if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log("[SSE] Request completed");
          onClose?.();
          resolve();
        }
      };

      xhr.onerror = () => {
        console.error("[SSE] XHR error");
        reject(new Error("Network error"));
      };

      xhr.onabort = () => {
        console.log("[SSE] XHR aborted");
        onClose?.();
        resolve();
      };

      xhr.send(JSON.stringify(body));
    });
  } catch (error) {
    console.error("[SSE] Caught error:", error);
    if (error instanceof Error) {
      // Don't treat abort as an error
      if (error.name === "AbortError" || error.message.includes("abort")) {
        console.log("[SSE] Request was aborted");
        onClose?.();
        return;
      }
      onError?.(error);
    } else {
      onError?.(new Error("Unknown error occurred"));
    }
  }
}
