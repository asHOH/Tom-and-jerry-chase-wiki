import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ factionId: string }> }
) {
  const resolvedParams = await params;
  try {
    const characters = await prisma.character.findMany({
      where: {
        factionId: resolvedParams.factionId,
      },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error(`Error fetching characters for faction ${resolvedParams.factionId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
