import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import fs from "fs/promises";
import path from "path";

interface Params {
  params: { name: string };
}

export async function GET(_req: Request, { params }: Params) {
  const { name } = params;
  const filePath = path.join(process.cwd(), "public", "data", `${name}.json`);
  try {
    const data = await fs.readFile(filePath, "utf8");
    // Return raw json string with correct content-type
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error(`[dataset API] Failed to read ${filePath}`, err);
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }
} 