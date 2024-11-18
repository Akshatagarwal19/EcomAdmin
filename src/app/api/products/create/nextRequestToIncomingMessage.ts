import { NextRequest } from 'next/server';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

export function nextRequestToIncomingMessage(req: NextRequest): IncomingMessage {
  // Create a new Readable stream from NextRequest's body if it's available
  const readableStream = new Readable();
  readableStream._read = () => {};
  
  // Read the request body as a stream
  req.body?.getReader().read().then(({ done, value }) => {
    if (!done) readableStream.push(Buffer.from(value));
    readableStream.push(null); // End the stream
  });

  // Create an IncomingMessage-like object
  const incomingMessage = Object.assign(readableStream, {
    headers: Object.fromEntries(req.headers), // Convert headers to an object
    url: req.url,
    method: req.method,
  });

  return incomingMessage as IncomingMessage;
}
