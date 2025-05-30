class Response {
  constructor(body: BodyInit | null, init?: ResponseInit) {
    this.body = body;
    this.init = init;
  }
  body: BodyInit | null;
  init?: ResponseInit;
}

export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
}

export class NextResponse extends Response {
  static json(body: any, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }

  static redirect(url: string | URL, status?: number) {
    return new Response(null, {
      status: status || 302,
      headers: {
        Location: url.toString(),
      },
    });
  }
} 