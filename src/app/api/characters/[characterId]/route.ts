import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { characterId: string } }
) {
  try {
    const character = await prisma.character.findUnique({
      where: {
        id: params.characterId,
      },
      include: {
        faction: true,
        skills: {
          include: {
            skillLevels: true,
          },
        },
      },
    });
    
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(character);
  } catch (error) {
    console.error(`Error fetching character ${params.characterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}
