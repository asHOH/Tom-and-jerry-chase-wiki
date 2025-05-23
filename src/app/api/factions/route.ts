import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const factions = await prisma.faction.findMany();
    return NextResponse.json(factions);
  } catch (error) {
    console.error('Error fetching factions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch factions' },
      { status: 500 }
    );
  }
}
