import { PromiseUtils, RandomUtils } from '@noodl/platform';

// NOTE: Would be nice to have a text buffer class where we can write text blocks,
//       perhaps with streaming and then fake stream out the text as it becomes ready.
//       This will create a really nice UX flow while the LLM is processing.
//       Maybe call it something like StreamingTextBuffer?

export namespace AiUtils {
  export function generateSnowflakeId() {
    const timestamp = Date.now().toString(16).padStart(12, '0');
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}`;
  }

  /**
   * Alias for fakeTokenStream, just with a smaller delay.
   *
   * @param inputString
   * @param callback
   * @param options
   * @returns
   */
  export function fakeTokenStreamFast(
    inputString: string,
    callback: (delta: string, fullText: string) => void,
    options?: {
      delay?: [number, number];
      signal?: AbortSignal;
    }
  ) {
    return fakeTokenStream(inputString, callback, { delay: [10, 25], ...(options || {}) });
  }

  export async function fakeTokenStream(
    inputString: string,
    callback: (delta: string, fullText: string) => void,
    options?: {
      delay?: [number, number];
      signal?: AbortSignal;
    }
  ) {
    // Split the input string into smaller chunks (tokens) of 2 to 3 characters
    const tokens = [];
    let tokenLength: number;
    for (let i = 0; i < inputString.length; i += tokenLength) {
      tokenLength = Math.floor(Math.random() * 2 + 2);
      tokens.push(inputString.slice(i, i + tokenLength));
    }

    const delayMin = options?.delay?.length === 2 ? Number(options.delay[0]) : 50;
    const delayMax = options?.delay?.length === 2 ? Number(options.delay[1]) : 100;

    let fullText = '';

    // Iterate through the tokens and call the callback function with each token
    for (let i = 0; i < tokens.length; i++) {
      if (options?.signal?.aborted) {
        return;
      }

      fullText += tokens[i];
      callback(tokens[i], fullText);
      await PromiseUtils.sleep(RandomUtils.range(delayMin, delayMax));
    }
  }
}
