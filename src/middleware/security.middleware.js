// src/middleware/security.middleware.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting para IPs locales en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.');
    }
    return false;
  }
});

// Rate limiting general más permisivo
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intente nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Configuración de Helmet para headers de seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      // En producción, solo permitir dominios específicos
      const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (productionOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    } else {
      // En desarrollo, permitir localhost
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    }
    
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

// Middleware de sanitización
const sanitizeInput = (req, res, next) => {
  // Sanitizar datos contra NoSQL injection
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  
  next();
};

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const timestamp = new Date().toISOString();
  
  // Log de intentos de autenticación
  if (req.path.includes('/auth/')) {
    console.log(`[SECURITY] ${timestamp} - Auth attempt from ${ip} - ${req.method} ${req.path} - User-Agent: ${userAgent}`);
  }
  
  // Log de accesos a rutas protegidas
  if (req.headers.authorization) {
    console.log(`[SECURITY] ${timestamp} - Protected route access from ${ip} - ${req.method} ${req.path}`);
  }
  
  next();
};

// Middleware para prevenir ataques de fuerza bruta por usuario
const bruteForceProtection = {};

const antibruteforce = (req, res, next) => {
  const identifier = req.body.identifier || req.body.email || req.body.username;
  const ip = req.ip || req.connection.remoteAddress;
  const key = `${ip}-${identifier}`;
  
  if (!bruteForceProtection[key]) {
    bruteForceProtection[key] = {
      attempts: 0,
      blockedUntil: null
    };
  }
  
  const record = bruteForceProtection[key];
  
  // Verificar si está bloqueado
  if (record.blockedUntil && Date.now() < record.blockedUntil) {
    const timeLeft = Math.ceil((record.blockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      success: false,
      message: `Cuenta temporalmente bloqueada. Intente nuevamente en ${timeLeft} minutos.`
    });
  }
  
  // Resetear si ha pasado el tiempo de bloqueo
  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    record.attempts = 0;
    record.blockedUntil = null;
  }
  
  // Agregar middleware para manejar respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const response = typeof data === 'string' ? JSON.parse(data) : data;
    
    if (response.success === false && req.path.includes('/login')) {
      record.attempts++;
      
      if (record.attempts >= 3) {
        // Bloquear por 15 minutos después de 3 intentos fallidos
        record.blockedUntil = Date.now() + (15 * 60 * 1000);
        console.log(`[SECURITY] User ${identifier} blocked from ${ip} for 15 minutes`);
      }
    } else if (response.success === true && req.path.includes('/login')) {
      // Resetear contador en login exitoso
      record.attempts = 0;
      record.blockedUntil = null;
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  helmetConfig,
  corsOptions,
  sanitizeInput,
  securityLogger,
  antibruteforce,
  xss: xss(),
  hpp: hpp()
};