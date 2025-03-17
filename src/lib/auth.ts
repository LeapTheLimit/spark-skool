import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface TeacherData {
  name: string;
  email: string;
  school: string;
  subject: string;
  isFirstLogin: boolean;
}

// Convert TeacherData to a proper JWTPayload
interface TeacherJWTPayload extends JWTPayload {
  teacherData: TeacherData;
}

export async function setTeacherData(data: TeacherData) {
  // Create a proper JWT payload
  const payload: TeacherJWTPayload = {
    teacherData: data,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(JWT_SECRET));

  cookies().set('teacher_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  });
}

export async function getTeacherData(): Promise<TeacherData | null> {
  const token = cookies().get('teacher_session')?.value;
  
  if (!token) return null;

  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    
    const payload = verified.payload as TeacherJWTPayload;
    return payload.teacherData;
  } catch {
    return null;
  }
} 