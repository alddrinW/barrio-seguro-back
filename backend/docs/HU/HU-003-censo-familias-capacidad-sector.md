# HU-003: Censo Familiar y Control de Capacidad por Sector

## 1. Metadatos
- Codigo: HU-003
- Modulo: Gestion de Poblacion y Censo Barrial
- Prioridad: Alta
- Responsable: Backend Core Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Administrador de Sector o Lider Barrial,
quiero registrar y censar a las familias y residentes de mi sector asegurando que no se supere el limite maximo (200 a 250 familias),
para garantizar una atencion comunitaria organizada, participativa y equitativa.

## 3. Contexto de Negocio Justificado
El modelo de seguridad barrial requiere una masa critica manejable de 200 a 250 familias para que la coordinacion vecinal y las alertas sean confiables. Si un sector crece desmedidamente, debe crearse un subsector o nuevo sector independiente. El sistema debe vigilar este umbral automaticamente.

## 4. Precondiciones
- El sector debe existir en estado ACTIVO.
- El usuario ejecutor debe tener rol `ADMIN_SECTOR` para su propio sector o `SUPERADMIN`.
- La cedula o identificacion nacional de cada residente censado debe ser unica en todo el sistema.

## 5. Flujo Principal (Happy Path)
1. El administrador envia una peticion POST a `/api/users/census` con los datos del residente: nombres, cedula, email, telefono, direccion, unidad familiar (`familyUnitCode`) y sectorId.
2. El sistema consulta cuantas unidades familiares distintas existen actualmente en el sector.
3. Si la unidad familiar es nueva, verifica que `familiasActuales + 1 <= maxFamilias` configuradas en el sector.
4. Se valida la cedula y el correo unico.
5. Se crea el registro del residente asignado a su respectiva unidad familiar.
6. El sistema retorna 201 Created con el resumen de la familia y el indicador de capacidad restante.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Capacidad excedida): Si el sector ya cuenta con 250 familias y se intenta agregar una nueva unidad familiar, el sistema responde con 400 Bad Request indicando "El sector ha alcanzado su capacidad maxima permitida de 250 familias. Debe aperturar un nuevo sector."
- FA-02 (Miembro adicional de familia existente): Si se registra un nuevo usuario que pertenece a una unidad familiar ya existente (`familyUnitCode`), el sistema lo registra sin incrementar el conteo de familias del sector.
- FA-03 (Cedula duplicada): Si la cedula ya pertenece a otro residente, responde con 409 Conflict.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Registro exitoso de residente en nueva unidad familiar
  Dado que un sector con maxFamilias=250 tiene actualmente 210 familias
  Cuando el administrador registra a un usuario con nuevo "familyUnitCode" "FAM-FLOR-211"
  Entonces el sistema responde con codigo 201
  Y el conteo de familias del sector se incrementa a 211.

Escenario: Registro de familiar dentro de una unidad familiar existente
  Dado que existe la unidad familiar "FAM-FLOR-005" registrada en el sector
  Cuando se registra a un nuevo miembro con dicho "familyUnitCode"
  Entonces el sistema responde con codigo 201
  Y el total de familias del sector permanece sin cambios.

Escenario: Bloqueo por superacion de capacidad del sector
  Dado que un sector alcanzo el limite de 250 familias
  Cuando se intenta registrar una nueva unidad familiar "FAM-FLOR-251"
  Entonces el sistema rechaza la solicitud con codigo 400
  Y el mensaje notifica que se supero la capacidad maxima del sector.
```

## 8. Reglas de Negocio e Invariantes
- RN-03.1: Cada residente debe tener asignado un `familyUnitCode` valido.
- RN-03.2: El censo barrial permite un maximo estricto configurado en `Sector.maxFamilies` (por defecto 250).
- RN-03.3: Las metricas de censo deben distinguir entre total de residentes individuales y total de unidades familiares.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/users/census`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "nationalId": "1718293041",
  "firstName": "Mariana",
  "lastName": "Guerrero",
  "email": "mariana.guerrero@barrioseguro.ec",
  "phone": "+593991234567",
  "address": "Calle Madrid N24-102 y Toledo",
  "familyUnitCode": "FAM-FLOR-045",
  "role": "RESIDENTE",
  "password": "Password123!"
}
```
- Response (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "f8a7b6c5-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
      "nationalId": "1718293041",
      "fullName": "Mariana Guerrero",
      "familyUnitCode": "FAM-FLOR-045",
      "role": "RESIDENTE"
    },
    "sectorStats": {
      "currentFamiliesCount": 45,
      "maxFamilies": 250,
      "availableFamilySlots": 205
    }
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/users/census` (Censar residente)
  - `GET /api/users/sector/:sectorId` (Listar residentes del sector)
  - `GET /api/users/census/summary/:sectorId` (Resumen de censo y familias)
- Modelos Prisma: `User`, `Sector`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Se debe validar en PostgreSQL el control de concurrencia y conteo de familias unicas mediante consultas `COUNT(DISTINCT familyUnitCode)`.
- Eliminacion inmediata de scripts de prueba.
