import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, SystemConfigModel } from './models';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'evacu3d_dev_secret';

const validatePassword = (pw: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(pw);
};

export const initializeAdminSystem = async () => {
  try {
    let adminCount = await UserModel.countDocuments({ role: 'admin' });

    // Fallback: .env based creation
    if (adminCount === 0 && process.env.MASTER_ADMIN_EMAIL && process.env.MASTER_ADMIN_PASSWORD) {
      const passwordHash = await bcrypt.hash(process.env.MASTER_ADMIN_PASSWORD, 10);
      await UserModel.create({
        email: process.env.MASTER_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: 'admin',
        status: 'approved'
      });
      console.log('✅ Admin initialized from environment variables');
      adminCount = 1;
    }

    // Interactive: Setup Key creation
    if (adminCount === 0) {
      const newToken = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Store in DB for consistency across all processes
      await SystemConfigModel.findOneAndUpdate(
        { key: 'setup' },
        { 
            key: 'setup', 
            setupToken: newToken, 
            setupTokenExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 Hour for extra safety
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log('\n================================================================');
      console.log('🛡️ Evacu3D: INITIAL ADMIN REQUIRED');
      console.log(`   Setup Key: ${newToken}`);
      console.log('   ✅ Key saved to MongoDB for all instances.');
      console.log('   Browse: http://localhost:5173/setup');
      console.log('================================================================\n');
    }
  } catch (err) {
    console.error('Failed to initialize admin system', err);
  }
};

export const requireAuth = (roles?: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
    (req as any).user = decoded;
    if (roles && !roles.includes(decoded.role)) return res.status(403).json({ error: 'Unauthorized' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (!validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Strong password required (8+ chars, upper, lower, digit, special)' 
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ email: email.toLowerCase(), passwordHash, role: 'user', status: 'pending' });
    return res.status(201).json({ message: 'Account created and pending approval', user: { id: user._id, email: user.email } });
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    return res.status(500).json({ error: 'Database error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if ((user as any).status !== 'approved') {
      return res.status(403).json({ error: `Account status: ${(user as any).status}` });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, email: user.email, role: user.role, status: (user as any).status } });
  } catch (err) {
    return res.status(500).json({ error: 'Login error' });
  }
});

// ─── Setup ────────────────────────────────────────────────────────────────────
router.get('/setup-check', async (_req: Request, res: Response) => {
  const adminCount = await UserModel.countDocuments({ role: 'admin' });
  res.json({ setupRequired: adminCount === 0 });
});

router.post('/setup', async (req: Request, res: Response) => {
  const { email, password, setupKey } = req.body;
  console.log(`📩 Request received for setup. Key: ${setupKey}, Server PID: ${process.pid}`);

  try {
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount > 0) return res.status(403).json({ error: 'Setup already complete' });

    const config = await SystemConfigModel.findOne({ key: 'setup' });
    if (!config || !config.setupToken || setupKey?.trim() !== config.setupToken) {
      console.log(`❌ Mismatch: Received "${setupKey}", DB contains "${config?.setupToken}"`);
      return res.status(403).json({ error: 'Invalid Setup Key or Key has expired.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Strong password required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await UserModel.create({ email: email.toLowerCase(), passwordHash, role: 'admin', status: 'approved' });
    await SystemConfigModel.deleteOne({ key: 'setup' });
    
    console.log('✅ Admin setup successful!');
    return res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('❌ Database error during setup:', err);
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists. Use a different email.' });
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

router.post('/profile', requireAuth(), async (req: Request, res: Response) => {
  const { newEmail, currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Incorrect current password' });

    // Update email if provided
    if (newEmail && newEmail.toLowerCase() !== user.email) {
      const emailLower = newEmail.toLowerCase();
      user.email = emailLower;
    }

    // Update password if provided
    if (newPassword) {
      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'New password does not meet security requirements' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return res.json({ message: 'Profile updated successfully' });
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Database error' });
  }
});

export default router;
