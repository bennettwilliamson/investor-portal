import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import fs from "fs/promises";
import path from "path";

export async function GET() {
  const dataDir = path.join(process.cwd(), "public", "data");
  try {
    const files: string[] = await fs.readdir(dataDir);
    const jsonFiles = files
      .filter((f: string) => f.endsWith(".json"))
      .map((f: string) => f.replace(/\.json$/, "")); // strip extension

    return NextResponse.json(jsonFiles);
  } catch (err) {
    console.error("[datasets API]", err);
    return NextResponse.json({ error: "Unable to read datasets" }, { status: 500 });
  }
} 