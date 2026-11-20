# HU-002: Autenticacion Segura y Gobernanza de Roles

## 1. Metadatos
- Codigo: HU-002
- Modulo: Seguridad y Accesos
- Prioridad: Critica
- Responsable: Backend Security Lead
- Estado: Aprobada

## 2. Definicion Estandar
Como Usuario del sistema (Residente, Lider, Autoridad o Administrador),
quiero iniciar sesion mediante credenciales cifradas y obtener un token JWT firmado,
para acceder de manera segura a los servicios y funciones correspondientes a mi rol y sector asignado.

## 3. Contexto de Negocio Justificado
La informacion barrial (residentes, denuncias ciudadanas, ausencias temporales) es sensible. Se exige proteccion criptografica robusta, no repudio y aislamiento estricto por sector. Los residentes comunes no deben acceder a datos privados de otros vecinos ni a bitacoras policiales restringidas.

## 4. Precondiciones
- El usuario debe estar previamente registrado y activo en el sector correspondiente.
- La contraseña debe haber sido procesada mediante algoritmo bcrypt con salt cost de al menos 10.

## 5. Flujo Principal (Happy Path)
1. El usuario envia sus credenciales (email y password) mediante peticion POST a `/api/auth/login`.
2. El sistema busca el usuario por email e incluye los datos de su sector asignado y rol.
3. El sistema valida el estado activo de la cuenta.
4. El sistema compara el hash con bcrypt.
5. Si coincide, el sistema actualiza `lastLoginAt` con la fecha y hora actual.
6. El sistema genera un JWT firmado con expiracion definida (ej. 24h) conteniendo `userId`, `role`, `sectorId` y `familyUnitCode`.
7. El sistema retorna codigo HTTP 200 con el token y el perfil del usuario.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Credenciales invalidas): Si el email no existe o la contraseña no coincide, se responde con 401 Unauthorized sin revelar que campo fallo.
- FA-02 (Usuario inactivo): Si el usuario fue suspendido por la directiva del sector, se responde con 403 Forbidden indicando "Cuenta inactiva o suspendida".
- FA-03 (Token expirado o corrupto): Las rutas protegidas rechazan peticiones con 401 si el header `Authorization` no cuenta con formato `Bearer <token>` valido.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Inicio de sesion satisfactorio con rol asignado
  Dado que existe un usuario activo con email "lider.floresta@barrioseguro.ec" y contraseña valida
  Cuando envia una solicitud POST a "/api/auth/login" con dichas credenciales
  Entonces el sistema responde con codigo 200
  Y la respuesta contiene un token JWT y los datos de perfil con rol "VECINO_LIDER".

Escenario: Intento de acceso con contraseña incorrecta
  Dado que existe el usuario "residente1@barrioseguro.ec"
  Cuando envia una contraseña incorrecta en "/api/auth/login"
  Entonces el sistema responde con codigo 401
  Y no se genera ningun token de sesion.

Escenario: Consulta de perfil propio mediante token autenticado
  Dado un token JWT valido emitido para un usuario
  Cuando se realiza una peticion GET a "/api/auth/profile" con dicho token en el header Authorization
  Entonces el sistema responde con codigo 200
  Y entrega el perfil completo del usuario y el sector al que pertenece.
```

## 8. Reglas de Negocio e Invariantes
- RN-02.1: Toda contraseña debe poseer al menos 8 caracteres, incluyendo al menos una mayuscula, una minuscula y un digito.
- RN-02.2: El payload del token JWT debe contener `userId`, `email`, `role` y `sectorId`.
- RN-02.3: La sesion se invalida inmediatamente si el usuario es desactivado en base de datos.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/auth/login`
- Request Body:
```json
{
  "email": "admin.floresta@barrioseguro.ec",
  "password": "Password123!"
}
```
- Response (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e2a9b341-381c-4b5a-9b11-a8b2734df910",
      "email": "admin.floresta@barrioseguro.ec",
      "firstName": "Carlos",
      "lastName": "Mendoza",
      "role": "ADMIN_SECTOR",
      "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
      "sectorName": "Sector La Floresta"
    }
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/auth/register` (Registro de usuario en sector)
  - `POST /api/auth/login` (Autenticacion)
  - `GET /api/auth/profile` (Perfil de usuario activo)
  - `PUT /api/auth/change-password` (Cambio de contraseña)
- Modelos Prisma: `User`, `Sector`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de login y bcrypt contra usuarios reales sembrados en PostgreSQL.
- Eliminacion de cualquier script auxiliar de validacion de contraseñas.
