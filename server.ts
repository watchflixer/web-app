import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { AttendanceStore, getLocalTimeString } from './src/server/store.ts';
import { createSessionToken, verifySessionToken } from './src/server/auth.ts';
import {
  validateEmailFormat,
  validatePasswordStrength,
  validateStudentInput,
} from './src/utils/attendanceLogic.ts';
import type { RemovalScope } from './src/types/attendance.ts';

dotenv.config();

const PORT = 3000;
const store = new AttendanceStore();

interface AuthenticatedRequest extends Request {
  adminEmail?: string;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

function verifyRequestAdmin(req: Request): string | null {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }
  const meta = store.getAuthMetadata();
  if (!meta.adminEmail) {
    return null;
  }
  const payload = verifySessionToken(token, meta.adminEmail, meta.tokenVersion);
  return payload ? payload.email : null;
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const email = verifyRequestAdmin(req);
  if (!email) {
    res.status(401).json({ error: 'Administrator sign-in required.' });
    return;
  }
  req.adminEmail = email;
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/auth/status', (req: Request, res: Response) => {
    const meta = store.getAuthMetadata();
    const verifiedEmail = verifyRequestAdmin(req);
    res.json({
      authenticated: Boolean(verifiedEmail),
      adminEmail: verifiedEmail ?? (meta.envManaged ? null : null),
      needsSetup: meta.needsSetup,
      envManaged: meta.envManaged,
    });
  });

  app.post('/api/auth/setup', (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || !validateEmailFormat(email)) {
      res.status(400).json({ error: 'Please provide a valid school administrator email address.' });
      return;
    }
    if (typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }
    const passError = validatePasswordStrength(password);
    if (passError) {
      res.status(400).json({ error: passError });
      return;
    }
    const result = store.setupInitialAdmin(email, password);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    const token = createSessionToken(result.email, result.tokenVersion);
    res.status(201).json({
      token,
      adminEmail: result.email,
      envManaged: false,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = store.verifyAdminCredentials(email, password);
    if (!result.ok) {
      res.status(401).json({ error: result.error });
      return;
    }
    const token = createSessionToken(result.email, result.tokenVersion);
    const meta = store.getAuthMetadata();
    res.json({
      token,
      adminEmail: result.email,
      envManaged: meta.envManaged,
    });
  });

  app.post('/api/auth/logout', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    store.invalidateAllTokens();
    res.json({ ok: true });
  });

  app.post('/api/auth/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    const passError = validatePasswordStrength(newPassword);
    if (passError) {
      res.status(400).json({ error: passError });
      return;
    }
    const result = store.changeAdminPassword(currentPassword, newPassword);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    const token = createSessionToken(result.email, result.tokenVersion);
    res.json({
      ok: true,
      token,
      adminEmail: result.email,
    });
  });

  app.get('/api/public/overview', (req: Request, res: Response) => {
    const isAuthenticated = Boolean(verifyRequestAdmin(req));
    res.json(store.getOverview(isAuthenticated));
  });

  app.get('/api/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.json({ auditLogs: store.getAuditLogs() });
  });

  app.post('/api/students', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { fullName, studentId, gradeSection, rfidUid, registrationMode, guardianContact } = req.body ?? {};
    if (
      typeof fullName !== 'string' ||
      typeof studentId !== 'string' ||
      typeof gradeSection !== 'string' ||
      (registrationMode !== 'rfid' && registrationMode !== 'manual')
    ) {
      res.status(400).json({ error: 'Invalid student payload.' });
      return;
    }

    const rfidStr = typeof rfidUid === 'string' ? rfidUid : '';
    const err = validateStudentInput(
      { fullName, studentId, gradeSection, rfidUid: rfidStr, registrationMode },
      store.getStudents()
    );
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const created = store.addStudent({
      studentId,
      fullName,
      gradeSection,
      rfidUid: rfidStr.trim().length > 0 ? rfidStr : null,
      registrationMode,
      guardianContact: typeof guardianContact === 'string' ? guardianContact : undefined,
    });
    res.status(201).json({ student: created });
  });

  app.patch('/api/students/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    const { fullName, studentId, gradeSection, rfidUid, registrationMode, guardianContact } = req.body ?? {};
    if (
      typeof fullName !== 'string' ||
      typeof studentId !== 'string' ||
      typeof gradeSection !== 'string' ||
      (registrationMode !== 'rfid' && registrationMode !== 'manual')
    ) {
      res.status(400).json({ error: 'Invalid student payload.' });
      return;
    }

    const rfidStr = typeof rfidUid === 'string' ? rfidUid : '';
    const err = validateStudentInput(
      { fullName, studentId, gradeSection, rfidUid: rfidStr, registrationMode },
      store.getStudents(),
      id
    );
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const updated = store.updateStudent(id, {
      studentId,
      fullName,
      gradeSection,
      rfidUid: rfidStr.trim().length > 0 ? rfidStr : null,
      registrationMode,
      guardianContact: typeof guardianContact === 'string' ? guardianContact : undefined,
    });
    if (!updated) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    res.json({ student: updated });
  });

  app.post('/api/attendance/rfid-tap', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { rfidUid, date, time } = req.body ?? {};
    if (typeof rfidUid !== 'string' || rfidUid.trim().length < 4) {
      res.status(400).json({ error: 'Please provide a valid RFID Card UID.' });
      return;
    }
    if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD expected).' });
      return;
    }
    if (time !== undefined && (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time))) {
      res.status(400).json({ error: 'Invalid time format (HH:mm expected).' });
      return;
    }

    const result = store.recordRfidTap({ rfidUid, date, time });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json(result);
  });

  app.post('/api/attendance/manual', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { studentInternalId, date, timeIn, timeOut, notes } = req.body ?? {};
    if (typeof studentInternalId !== 'string' || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Student and valid date (YYYY-MM-DD) are required.' });
      return;
    }
    const cleanIn = typeof timeIn === 'string' && /^\d{2}:\d{2}$/.test(timeIn) ? timeIn : null;
    const cleanOut = typeof timeOut === 'string' && /^\d{2}:\d{2}$/.test(timeOut) ? timeOut : null;
    if (!cleanIn && !cleanOut) {
      res.status(400).json({ error: 'Provide a valid Time In or Time Out (HH:mm).' });
      return;
    }

    const result = store.recordManualAttendance({
      studentInternalId,
      date,
      timeIn: cleanIn,
      timeOut: cleanOut,
      notes: typeof notes === 'string' ? notes : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json({ record: result.record });
  });

  app.patch('/api/attendance/:id/timeout', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    const rawTime = req.body?.timeOut;
    const timeOut =
      typeof rawTime === 'string' && /^\d{2}:\d{2}$/.test(rawTime)
        ? rawTime
        : getLocalTimeString();

    const updated = store.logQuickTimeOut(id, timeOut);
    if (!updated) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }
    res.json({ record: updated });
  });

  app.post('/api/attendance/:id/remove', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    const { scope, reason, notes } = req.body ?? {};
    const validScopes: RemovalScope[] = ['full', 'time_out', 'time_in'];
    if (!validScopes.includes(scope)) {
      res.status(400).json({ error: 'Invalid removal scope.' });
      return;
    }
    if (typeof reason !== 'string' || reason.trim().length < 3) {
      res.status(400).json({ error: 'Please specify a reason for removing this attendance entry.' });
      return;
    }

    const result = store.removeAttendanceRecord({
      recordId: id,
      scope,
      reason,
      notes: typeof notes === 'string' ? notes : undefined,
      removedByEmail: req.adminEmail ?? 'school-admin',
    });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusGate server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CampusGate server:', err);
  process.exit(1);
});
