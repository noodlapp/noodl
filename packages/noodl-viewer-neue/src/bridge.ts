/**
 * TODO: Define the different kind of inputs to the request node.
 */
export interface NoodlRequest {
  headers: {};
  body: string;
}

/**
 * TODO: Define the different kind of outputs on the response node.
 */
export interface NoodlResponse {
  statusCode: string;
  headers: {};
  body: string;
}
