import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { factionId: string } }
) {
  try {
    const characters = await prisma.character.findMany({
      where: {
        factionId: params.factionId,
      },
    });
    
    return NextResponse.json(characters);
  } catch (error) {
    console.error(`Error fetching characters for faction ${params.factionId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
