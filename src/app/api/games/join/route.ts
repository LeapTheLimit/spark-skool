import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for active games (in production, use a database)
const activeGames = new Map<string, {
  gameId: string;
  gameType: string;
  teacherId: string;
  students: Array<{
    name: string;
    joinedAt: Date;
  }>;
  createdAt: Date;
  expiresAt: Date;
}>();

// Generate a random 6-character access code
function generateAccessCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create a new game session
export async function POST(request: NextRequest) {
  try {
    const { accessCode, studentName } = await request.json();

    if (!accessCode || !studentName) {
      return NextResponse.json(
        { message: 'Access code and student name are required' },
        { status: 400 }
      );
    }

    // Get game session
    const gameSession = activeGames.get(accessCode);

    if (!gameSession) {
      return NextResponse.json(
        { message: 'Invalid access code or expired game session' },
        { status: 404 }
      );
    }

    // Check if game session has expired
    if (gameSession.expiresAt < new Date()) {
      activeGames.delete(accessCode);
      return NextResponse.json(
        { message: 'Game session has expired' },
        { status: 410 }
      );
    }

    // Add student to game session
    gameSession.students.push({
      name: studentName,
      joinedAt: new Date()
    });

    return NextResponse.json({
      gameId: gameSession.gameId,
      gameType: gameSession.gameType
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new game session (called by teacher)
export async function PUT(request: NextRequest) {
  try {
    const { gameId, gameType, teacherId } = await request.json();

    if (!gameId || !gameType || !teacherId) {
      return NextResponse.json(
        { message: 'Game ID, type, and teacher ID are required' },
        { status: 400 }
      );
    }

    // Generate unique access code
    let accessCode: string;
    do {
      accessCode = generateAccessCode();
    } while (activeGames.has(accessCode));

    // Create game session
    const gameSession = {
      gameId,
      gameType,
      teacherId,
      students: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    };

    activeGames.set(accessCode, gameSession);

    return NextResponse.json({ accessCode });
  } catch (error) {
    console.error('Error creating game session:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get game session info
export async function GET(request: NextRequest) {
  try {
    const accessCode = request.nextUrl.searchParams.get('accessCode');

    if (!accessCode) {
      return NextResponse.json(
        { message: 'Access code is required' },
        { status: 400 }
      );
    }

    const gameSession = activeGames.get(accessCode);

    if (!gameSession) {
      return NextResponse.json(
        { message: 'Game session not found' },
        { status: 404 }
      );
    }

    // Don't expose teacher ID in response
    const { teacherId, ...sessionInfo } = gameSession;

    return NextResponse.json(sessionInfo);
  } catch (error) {
    console.error('Error getting game session:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 