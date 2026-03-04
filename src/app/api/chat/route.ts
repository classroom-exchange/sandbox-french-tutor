import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, number[]>();

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const now = Date.now();
    const hits = (rateLimitMap.get(ip) ?? []).filter(t => now - t < 60_000);
    if (hits.length >= 20) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  rateLimitMap.set(ip, [...hits, now]);
  try {
    const body = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'API call failed' }, { status: 500 });
  }
}