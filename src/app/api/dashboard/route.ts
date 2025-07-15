import { NextResponse } from 'next/server';
import dashboardData from '@/data/dashboardData';

export async function GET() {
  return NextResponse.json(dashboardData);
}
