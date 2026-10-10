import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'romantic_t_solutions_super_secret_jwt_key_2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        department: true,
        businessDivision: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is inactive or invalid' });
    }

    const permissionCodes = user.role?.permissions.map(rp => rp.permission.code) || [];

    const isSuper = user.email?.toLowerCase() === 'romantictsolutions@gmail.com' || user.role?.name === 'Super Administrator';
    const isAdmin = isSuper || user.role?.name === 'Administrator';

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      roleName: isSuper && user.role?.name !== 'Super Administrator' ? 'Super Administrator' : (user.role?.name || 'User'),
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      permissions: permissionCodes,
      isSuperAdmin: isSuper,
      isAdmin: isAdmin,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function hasPermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.isSuperAdmin || req.user.isAdmin || req.user.permissions.includes(permissionCode)) {
      return next();
    }
    return res.status(403).json({
      error: `Access denied. Requires permission '${permissionCode}'`
    });
  };
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
