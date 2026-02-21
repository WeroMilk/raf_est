# Despliegue en Vercel

## 1. Favicon y logo

- **Favicon**: El proyecto usa `app/icon.png` (Next.js lo sirve automáticamente). Si prefieres el de `public`, asegúrate de que `public/favicon.png` esté en el repositorio y desplegado.
- **Logo Sonora**: La imagen está en `public/Logtipo_EscudoColor.png`. Para que se vea en producción:
  - Incluye `public/Logtipo_EscudoColor.png` en el repositorio (no lo tengas solo en local).
  - Haz commit y push para que Vercel lo incluya en el build.

## 2. Login y super usuario (error "error" o pantalla en rojo)

En producción el login falla si no está configurada la variable **AUTH_SECRET**.

1. En [Vercel](https://vercel.com) → tu proyecto → **Settings** → **Environment Variables**.
2. Añade:
   - **Name**: `AUTH_SECRET`
   - **Value**: una frase o string aleatorio de **al menos 16 caracteres** (por ejemplo una contraseña larga que solo tú conozcas).
3. Marca el entorno **Production** (y opcionalmente Preview).
4. Guarda y **redeploy** el proyecto (Deployments → ⋮ en el último deploy → Redeploy).

Sin `AUTH_SECRET` la cookie de sesión no se puede firmar y verás "Error al iniciar sesión" o el mensaje de configuración.

## 3. Contraseñas (super usuario y por escuela)

Las contraseñas están en `lib/auth-data.json` (hashes). Ese archivo **sí debe estar en el repositorio** para que en Vercel funcione el login.

- **Super usuario**: una sola contraseña (hash en `superUsuario`) que ve todas las escuelas.
- **Por escuela**: cada CCT tiene su contraseña en `escuelas`.

**Si el super usuario no entra en producción** (pero sí en local): en Vercel puede que no se lea bien `auth-data.json`. Añade en Vercel la variable **AUTH_SUPER_HASH** con el hash del super. Para ver el hash actual (sin cambiar la contraseña):

```bash
node scripts/ver-hash-super.mjs
```

Copia el valor y en Vercel → Environment Variables → **AUTH_SUPER_HASH** = (ese hash). Redeploy.

Para **generar una contraseña nueva** de super y ver su hash:

```bash
node scripts/regenerate-super-only.mjs
```

Guarda la contraseña que imprime; opcionalmente copia el hash a **AUTH_SUPER_HASH** en Vercel si no subes `auth-data.json`.

Para generar o regenerar contraseñas y actualizar `lib/auth-data.json`:

```bash
npm run generate-auth
```

Guarda el archivo `lib/passwords-inicial.txt` en un lugar seguro y no lo subas a Git (ya está en `.gitignore`).
