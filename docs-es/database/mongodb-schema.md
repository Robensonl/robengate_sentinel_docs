# MongoDB — Esquema Completo

**Versión:** MongoDB 7  
**Colecciones:** 2  
**ODM:** Mongoose 8.x  

---

## Resumen

| Colección | Propósito | TTL | Documentos Esperados |
|---|---|---|---|
| `security_logs` | Audit trail de eventos de seguridad | 365 días | Millones |
| `threat_indicators` | IOCs — Indicadores de Compromiso | Sin TTL | Cientos-miles |

---

## Colección: `security_logs`

**Modelo:** `backend/db-nosql/models/SecurityLog.js`  
**Colección MongoDB:** `security_logs`

```javascript
const SecurityLogSchema = new mongoose.Schema({
  // Categoría del evento
  category: {
    type: String,
    required: true,
    index: true,
    enum: ['AUTH', 'ACCESS', 'DATA', 'SYSTEM', 'THREAT', 'ADMIN', 'HONEYPOT']
  },

  // Acción específica
  action: {
    type: String,
    required: true,
    index: true
    // Ej: LOGIN_FAILED, SQL_INJECTION_ATTEMPT, USER_ROLE_CHANGED
  },

  // Severidad
  severity: {
    type: String,
    required: true,
    index: true,
    enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  },

  // Actor
  userId:    { type: String, index: true },
  userEmail: { type: String },

  // Red
  ipAddress:   { type: String, index: true },
  countryCode: { type: String },
  userAgent:   { type: String },

  // Request context
  requestId: { type: String },
  sessionId: { type: String },
  endpoint:  { type: String },
  method:    { type: String },
  statusCode:{ type: Number },

  // MITRE ATT&CK
  mitreTactic:     { type: String },
  mitreTechnique:  { type: String },

  // IOC reference
  ioc: { type: String },

  // Metadata libre
  metadata: { type: mongoose.Schema.Types.Mixed },

  // Auto-populated
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'security_logs',
  versionKey: false
});
```

### Índices

```javascript
// Compound indexes para queries frecuentes
SecurityLogSchema.index({ severity: 1, createdAt: -1 });
SecurityLogSchema.index({ category: 1, createdAt: -1 });
SecurityLogSchema.index({ ipAddress: 1, createdAt: -1 });
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
SecurityLogSchema.index({ action: 1, createdAt: -1 });

// TTL index — auto-delete después de 365 días
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
```

### Reglas de Inmutabilidad

```javascript
// El esquema NO tiene métodos de actualización
// auditService.js solo expone:
async log(data) { return SecurityLog.create(data); }
// No existe update(), findOneAndUpdate(), etc.
```

### Documento Ejemplo

```json
{
  "_id": "60d5f5b8c9e4a12345678901",
  "category": "THREAT",
  "action": "SQL_INJECTION_ATTEMPT",
  "severity": "CRITICAL",
  "userId": "42",
  "userEmail": null,
  "ipAddress": "45.148.10.22",
  "countryCode": "NL",
  "userAgent": "sqlmap/1.7.2#stable",
  "requestId": "req-abc123-xyz",
  "sessionId": null,
  "endpoint": "/api/users",
  "method": "GET",
  "statusCode": 403,
  "mitreTactic": "TA0001",
  "mitreTechnique": "T1190",
  "ioc": "45.148.10.22",
  "metadata": {
    "payload": "' OR 1=1--",
    "parameter": "id",
    "blocked": true
  },
  "createdAt": "2026-06-01T14:00:00.000Z",
  "updatedAt": "2026-06-01T14:00:00.000Z"
}
```

### Queries de Ejemplo

```javascript
// Eventos críticos de las últimas 24h
SecurityLog.find({
  severity: 'CRITICAL',
  createdAt: { $gte: new Date(Date.now() - 86400000) }
}).sort({ createdAt: -1 }).limit(100);

// Eventos de una IP específica
SecurityLog.find({ ipAddress: '45.148.10.22' })
  .sort({ createdAt: -1 });

// Aggregation — eventos por hora
SecurityLog.aggregate([
  { $match: { createdAt: { $gte: last24h } } },
  { $group: {
    _id: { $hour: '$createdAt' },
    count: { $sum: 1 }
  }},
  { $sort: { '_id': 1 } }
]);
```

---

## Colección: `threat_indicators`

**Modelo:** `backend/db-nosql/models/ThreatIndicator.js`  
**Colección MongoDB:** `threat_indicators`

```javascript
const ThreatIndicatorSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true,
    enum: ['IP', 'DOMAIN', 'HASH_MD5', 'HASH_SHA256', 'URL', 'EMAIL', 'CVE', 'USER_AGENT']
  },
  value: { type: String, required: true, index: true },

  // Calidad del indicador
  confidence: { type: Number, min: 0, max: 100, default: 50 },
  severity:   { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },

  // Fuente y contexto
  source:      { type: String, default: 'internal' },   // honeypot|virustotal|manual|feed
  description: { type: String },
  tags:        [{ type: String }],

  // Temporalidad
  firstSeen: { type: Date, default: Date.now },
  lastSeen:  { type: Date, default: Date.now },
  hitCount:  { type: Number, default: 0 },
  active:    { type: Boolean, default: true, index: true },

  // MITRE ATT&CK
  mitreTactic:    { type: String },
  mitreTechnique: { type: String },

  // Geo (para IPs)
  country: { type: String },
  asn:     { type: String },

  // Trazabilidad
  addedBy:    { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date }
}, {
  timestamps: true,
  collection: 'threat_indicators',
  versionKey: false
});
```

### Índices

```javascript
// Unicidad: no se puede tener el mismo valor dos veces para el mismo tipo
ThreatIndicatorSchema.index({ value: 1, type: 1 }, { unique: true });

// Queries frecuentes
ThreatIndicatorSchema.index({ severity: 1, lastSeen: -1 });
ThreatIndicatorSchema.index({ active: 1, severity: 1 });
```

### Documento Ejemplo

```json
{
  "_id": "60d5f5b8c9e4a12345678902",
  "type": "IP",
  "value": "185.220.101.44",
  "confidence": 95,
  "severity": "HIGH",
  "source": "honeypot",
  "description": "Known Tor exit node involved in brute force campaigns",
  "tags": ["Tor", "Brute Force", "Scanning"],
  "firstSeen": "2026-05-15T10:00:00.000Z",
  "lastSeen": "2026-06-01T14:00:00.000Z",
  "hitCount": 890,
  "active": true,
  "mitreTactic": "TA0006",
  "mitreTechnique": "T1110",
  "country": "RO",
  "asn": "AS200350",
  "addedBy": "honeypot@system",
  "reviewedBy": null,
  "reviewedAt": null,
  "createdAt": "2026-05-15T10:00:00.000Z",
  "updatedAt": "2026-06-01T14:00:00.000Z"
}
```

### Queries de Ejemplo

```javascript
// Lookup de IP en tiempo real (usado por enricher.js)
ThreatIndicator.findOne({
  value: ipAddress,
  type: 'IP',
  active: true
});

// IOCs de alta severidad recientes
ThreatIndicator.find({
  active: true,
  severity: { $in: ['HIGH', 'CRITICAL'] }
}).sort({ lastSeen: -1 }).limit(50);

// Actualizar hitCount cuando se detecta uso
ThreatIndicator.findOneAndUpdate(
  { value: ipAddress, type: 'IP' },
  { $inc: { hitCount: 1 }, $set: { lastSeen: new Date() } }
);
```

---

## Conexión MongoDB

```javascript
// backend/db-nosql/config/mongodb.js
const mongoose = require('mongoose');

async function connectMongoDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/robengate';
  
  await mongoose.connect(uri, {
    authSource: 'admin',
    // Opciones de pool
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
}
```

### Variables de Entorno

| Variable | Ejemplo | Descripción |
|---|---|---|
| `MONGO_URI` | `mongodb://user:pass@mongodb:27017/robengate?authSource=admin` | URI de conexión |
| `MONGO_ROOT_USER` | `admin` | Usuario root |
| `MONGO_ROOT_PASSWORD` | `32+ chars random` | Contraseña root |

---

## Estrategia de Retención

### TTL Automático

```javascript
// security_logs — TTL de 365 días
SecurityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 31536000 }
);
// MongoDB ejecuta el purge cada 60 segundos (por defecto)
```

### Configuración por Tenant

La retención se configura por organización:

```javascript
// Calcular TTL según organización (soarEngine/auditService)
const retentionDays = organization.retention_days || 365;
const ttlSeconds = retentionDays * 86400;
```

Para modificar el TTL de una colección:

```javascript
// Solo en administración directa de MongoDB
db.security_logs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: retention_days * 86400, name: "ttl_index" }
);
```

---

## Seguridad MongoDB

### Autenticación

```yaml
# docker-compose (infra/docker/)
mongodb:
  image: mongo:7
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    MONGO_INITDB_DATABASE: robengate
  volumes:
    - mongodb_data:/data/db
```

### Recomendaciones de Hardening

1. Autenticación obligatoria (`--auth`)
2. Bind solo a red interna (no exponer 27017 a internet)
3. Crear usuario específico de aplicación con permisos mínimos
4. Habilitar TLS para conexiones
5. Auditoría de MongoDB habilitada en producción

```javascript
// Usuario de aplicación con permisos mínimos
db.createUser({
  user: "robengate_app",
  pwd: "strong-password",
  roles: [
    { role: "readWrite", db: "robengate" }
    // Solo acceso a la BD de la aplicación
  ]
});
```
