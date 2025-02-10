import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';

import { AiCopilotChatProviders, AiCopilotChatStreamArgs } from '@noodl-models/AiAssistant/interfaces';

function toChatProvider(provider: AiCopilotChatProviders | undefined) {
  return {
    model: provider?.model || 'gpt-3.5-turbo',
    temperature: provider?.temperature,
    max_tokens: provider?.max_tokens
  };
}

async function directChatOpenAi({ messages, provider, abortController, onEnd, onStream }: AiCopilotChatStreamArgs) {
  const OPENAI_API_KEY = OpenAiStore.getApiKey();
  const controller = abortController || new AbortController();
  let endpoint = `https://api.openai.com/v1/chat/completions`;

  if (OpenAiStore.getVersion() === 'enterprise') {
    endpoint = OpenAiStore.getEndpoint();
  }

  let fullText = '';
  let completionTokenCount = 0;

  let tries = 2;
  await fetchEventSource(endpoint, {
    method: 'POST',
    openWhenHidden: true,
    headers: {
      Authorization: 'Bearer ' + OPENAI_API_KEY,
      'Content-Type': 'application/json'
    },
    signal: controller.signal,
    body: JSON.stringify({
      ...toChatProvider(provider),
      messages,
      stream: true
    }),
    async onopen(response) {
      if (response.ok && response.headers.get('content-type').includes(EventStreamContentType)) {
        return; // everything's good
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // client-side errors are usually non-retriable:
        throw 'FatalError';
      } else {
        throw 'RetriableError';
      }
    },
    onmessage(ev) {
      if (ev.data === '[DONE]') {
        controller.abort();
        return;
      }

      try {
        const json = JSON.parse(ev.data);
        const delta = json.choices[0].delta.content;
        if (delta) {
          completionTokenCount++;
          fullText += delta;
          console.debug('[stream]', fullText);
          onStream && onStream(fullText, delta);
        }
      } catch (error) {
        console.error(error);
      }
    },
    onclose() {
      onEnd && onEnd();
    },
    onerror(err) {
      const errText = err.toString();
      if (['FatalError'].includes(errText)) {
        throw err; // rethrow to stop the operation
      } else if (['RetriableError'].includes(errText)) {
        if (tries <= 0) {
          throw `Apologies, OpenAI is currently facing heavy traffic, causing delays in processing requests. Please be patient and try again later.`;
        }
        tries--;
      } else {
        // do nothing to automatically retry. You can also
        // return a specific retry interval here.
      }
    }
  });

  return {
    fullText,
    completionTokenCount
  };
}

export namespace Ai {
  export async function chatStream(args: AiCopilotChatStreamArgs): Promise<string> {
    let fullText = '';

    const version = OpenAiStore.getVersion();
    if (['full-beta', 'enterprise'].includes(version)) {
      const result = await directChatOpenAi(args);
      fullText = result.fullText;
    } else {
      throw 'Invalid AI version.';
    }

    return fullText;
  }
}
