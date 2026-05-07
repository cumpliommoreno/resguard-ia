# ResGuard IA

Plataforma de análisis automatizado de contratos financieros chilenos que detecta cláusulas que vulneran la Ley 19.628 (Protección de la Vida Privada) y la Ley 21.521 (Fintech), y genera una carta ARCO lista para enviar al banco.

---

## ¿Qué hace?

1. El usuario ingresa sus datos personales (nombre, RUT, email) y sube el PDF de su contrato bancario.
2. El sistema extrae automáticamente el nombre y RUT del banco usando IA.
3. Verifica que la institución esté autorizada por la CMF (Comisión para el Mercado Financiero).
4. Analiza cada cláusula del contrato contra la legislación chilena vigente.
5. Genera una carta ARCO formal con los datos reales del banco y del titular, lista para enviar.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                  │
│                    Vercel · TypeScript                  │
│                                                         │
│  Paso 1        Paso 2        Paso 3        Paso 4       │
│  Datos         Upload        Análisis      Resultados   │
│  personales    PDF           en curso      + Carta ARCO │
└────────────────────────┬────────────────────────────────┘
                         │ API Routes
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   /api/analysis    /api/analizar   Supabase
     /upload                        PostgreSQL
   Vercel Blob                      (analyses)
```

### Flujo de análisis (`/api/analizar`)

```
PDF (Vercel Blob)
    │
    ├─► Claude Haiku — ¿Es un contrato financiero?
    │       └─ No → StepAlert: archivo no válido
    │
    ├─► Claude Haiku — Extrae nombre y RUT del banco
    │
    ├─► MCP Módulo 1: resolve_company(rut, nombre)
    │       ├─ not_found     → StepAlert + link alertas CMF
    │       ├─ rut_mismatch  → StepAlert: posible suplantación
    │       └─ verified      → continúa
    │
    └─► MCP Módulo 2: analizar_clausulas(file_url, company, titular)
            └─ ContractAnalysis + Carta ARCO generada
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Base de datos | Supabase (PostgreSQL) |
| Almacenamiento | Vercel Blob (PDFs privados) |
| IA extracción | Claude Haiku 4.5 (Anthropic) |
| IA análisis | Claude Opus 4.7 con adaptive thinking |
| MCP Server | Node.js + Express + MCP SDK (Railway) |
| CMF API | api.cmfchile.cl (datos oficiales) |

---

## MCP Server

Servidor MCP propio deployado en Railway con dos módulos:

### Módulo 1 — `resolve_company`
Verifica que una institución financiera esté autorizada por la CMF.

**Input:** `{ rut: string, name: string }`

**Proceso:**
1. Fuzzy matching contra 22 bancos chilenos registrados
2. Consulta a la API oficial de CMF
3. Validación del RUT contra datos CMF

**Output:**
```json
{
  "success": true,
  "data": {
    "nombre": "Banco de Chile",
    "rut": "97.004.000-5",
    "email": "privacidad@bancochile.cl",
    "direccion": "...",
    "paginaWeb": "..."
  }
}
```

### Módulo 2 — `analizar_clausulas`
Analiza el contrato contra la Ley 19.628 y Ley 21.521 usando Claude Opus 4.7.

**Input:** `{ file_url, company, titular }`

**Proceso:**
1. Descarga el PDF desde Vercel Blob
2. Llama a Claude Opus 4.7 con 3 documentos:
   - Ley 19.628 (subida a Files API al arrancar el servidor)
   - Ley 21.521 (subida a Files API al arrancar el servidor)
   - Contrato del usuario (base64)
3. Prompt caching en los PDFs de las leyes (`cache_control: ephemeral`)
4. Determina automáticamente el derecho ARCO según los hallazgos

**Output:** `ContractAnalysis` con findings, cumplimiento legal y carta ARCO.

---

## Base de datos

```sql
create table analyses (
  id              uuid        primary key default gen_random_uuid(),
  email           text        not null,
  titular_nombre  text,
  titular_rut     text,
  file_url        text        not null,
  file_name       text        not null,
  entity_name     text,
  entity_rut      text,
  status          text        not null default 'pending',
  result          jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

**Estados del análisis:**

| Status | Descripción |
|---|---|
| `pending` | Archivo subido, esperando análisis |
| `processing` | Análisis en curso |
| `completed` | Análisis completado con éxito |
| `verified` | Empresa verificada en CMF |
| `alert` | Alerta detectada (empresa no encontrada o RUT no coincide) |

---

## Variables de entorno

### Web App (Vercel)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Key de servicio Supabase |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob (auto-inyectado) |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `MCP_SERVER_URL` | URL del MCP server en Railway |
| `MCP_API_KEY` | API key del MCP server |

### MCP Server (Railway)

| Variable | Descripción |
|---|---|
| `CMF_API_KEY` | API key de CMF Chile |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `MCP_API_KEY` | Secret para autenticar clientes |
| `PORT` | Puerto del servidor (Railway lo inyecta) |

---

## Estructura del proyecto

```
resguard-ia/
├── apps/
│   └── web/                          # Next.js frontend
│       ├── components/wizard/        # Componentes del wizard
│       │   ├── StepEmail.tsx         # Paso 1: datos del titular
│       │   ├── StepUpload.tsx        # Paso 2: subida del PDF
│       │   ├── StepAnalyzing.tsx     # Paso 3: análisis en curso
│       │   ├── StepResults.tsx       # Paso 4: resultados y carta ARCO
│       │   ├── StepAlert.tsx         # Error: banco no encontrado / RUT mismatch
│       │   ├── StepManualInput.tsx   # Fallback: ingreso manual
│       │   └── StepIndicator.tsx     # Indicador de progreso
│       ├── hooks/
│       │   └── useWizard.ts          # Estado y lógica del wizard
│       ├── lib/
│       │   ├── supabase.ts           # Cliente Supabase
│       │   ├── mcpClient.ts          # Cliente SSE para MCP server
│       │   └── constants.ts          # Constantes globales
│       ├── pages/
│       │   ├── index.tsx             # Página principal
│       │   └── api/
│       │       ├── analizar.ts       # Orquestador principal del análisis
│       │       └── analysis/
│       │           ├── upload.ts     # Subida a Vercel Blob + Supabase
│       │           ├── run.ts        # (reservado para análisis directo)
│       │           └── labels.ts     # Labels de progreso para el UI
│       └── types/index.ts            # Tipos TypeScript
│
├── mcp-server/                       # Servidor MCP (Railway)
│   ├── src/
│   │   ├── index.ts                  # Express + MCP server + startup
│   │   ├── modules/
│   │   │   ├── companies/            # Módulo 1: verificación CMF
│   │   │   │   ├── application/      # Use cases
│   │   │   │   ├── domain/           # Entidades y puertos
│   │   │   │   ├── infrastructure/   # CMF API + repositorio en memoria
│   │   │   │   └── presentation/     # Tool definition
│   │   │   └── contracts/            # Módulo 2: análisis de cláusulas
│   │   │       ├── application/      # AnalizarClausulasUseCase
│   │   │       └── presentation/     # Tool definition
│   │   └── shared/
│   │       ├── state/lawFiles.ts     # File IDs de las leyes en memoria
│   │       └── utils/logger.ts       # Logger JSON
│   └── assets/
│       ├── ley-19628.pdf             # Ley de protección de datos
│       └── ley-21521.pdf             # Ley Fintech
│
└── script.sql                        # Schema de la base de datos
```

---

## Casos de uso cubiertos

| Caso | Comportamiento |
|---|---|
| Archivo no es contrato financiero | Alerta con mensaje explicativo |
| Banco no registrado en CMF | Alerta + link a alertas CMF |
| RUT del contrato no coincide con CMF | Alerta crítica de posible suplantación |
| No se puede leer el PDF | Formulario manual para ingresar banco y RUT |
| Análisis exitoso | Resultados con findings + carta ARCO lista |

---

## Derechos ARCO

La carta generada ejerce uno de estos derechos según las cláusulas detectadas:

| Derecho | Cuándo se ejerce |
|---|---|
| **Oposición** | Cesión de datos a terceros sin consentimiento |
| **Cancelación** | Datos que ya no son necesarios |
| **Rectificación** | Datos incorrectos o desproporcionados |
| **Acceso** | Sin infracciones graves detectadas |

El banco tiene **2 días hábiles** para acusar recibo y **5 días** para responder.

---

## Hackathon Claude 2026
