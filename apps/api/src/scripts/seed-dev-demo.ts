/**
 * Monta una red de prueba en la base de DESARROLLO (nunca en producción) para probar la app
 * entera en Expo Go sin invitar por email. Usa los mismos servicios que la API.
 * Requiere las cuentas de `seed:users` (Marta, Juan, Lucía). Se puede repetir: lo que ya
 * existe se salta.
 * Uso: pnpm --filter @tandems/api seed:demo
 *
 * Resultado:
 * - Marta, Juan y Lucía son contactos entre sí (aceptados). Javier queda como invitación
 *   pendiente de Marta.
 * - Marta: «Hacer la renta» con Juan (aceptada, con sesión propuesta para dentro de 10 min),
 *   «Estudiar inglés» con Lucía (pendiente: a Lucía le aparece «Te piden») y
 *   «Llamar al médico» terminada con un ¡hurra! de Juan (HurraRecibido al abrir la app).
 * - Juan: «Ordenar el armario» con Marta (pendiente: a Marta le aparece «Te piden»).
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Contact } from '../contacts/contact.schema.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { Task } from '../tasks/task.schema.js';
import { TasksService } from '../tasks/tasks.service.js';
import { User, type UserDocument } from '../users/user.schema.js';

if (process.env.NODE_ENV === 'production') {
  console.error('seed:demo no se ejecuta en producción.');
  process.exit(1);
}

const { AppModule } = await import('../app.module.js');
const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
const users = app.get<Model<User>>(getModelToken(User.name), { strict: false });
const contactModel = app.get<Model<Contact>>(getModelToken(Contact.name), { strict: false });
const taskModel = app.get<Model<Task>>(getModelToken(Task.name), { strict: false });
const contacts = app.get(ContactsService, { strict: false });
const tasks = app.get(TasksService, { strict: false });
const sessions = app.get(SessionsService, { strict: false });

async function person(email: string): Promise<UserDocument> {
  const found = await users.findOne({ email });
  if (!found) {
    console.error(`Falta ${email}: ejecuta antes pnpm --filter @tandems/api seed:users`);
    await app.close();
    process.exit(1);
  }
  return found as UserDocument;
}

const marta = await person('marta@example.com');
const juan = await person('juan@example.com');
const lucia = await person('lucia@example.com');

/** Contacto aceptado entre dos personas (invitación + aceptación, como en la app). */
async function connect(a: UserDocument, b: UserDocument): Promise<void> {
  const existing = await contactModel.findOne({
    owner_id: a._id,
    contact_user_id: b._id,
    status: 'accepted',
  });
  if (existing) return void console.warn(`· ${a.display_name} ↔ ${b.display_name}: ya estaba`);
  // Si queda una invitación vieja sin aceptar, se cancela y se hace de nuevo
  await contactModel.updateMany(
    { owner_id: a._id, invited_email: b.email, status: 'pending' },
    { status: 'cancelled' },
  );
  let token = '';
  await contacts.invite(a, { name: b.display_name, email: b.email }, (t) => (token = t));
  await contacts.accept(b, token);
  console.warn(`· ${a.display_name} ↔ ${b.display_name}: conectados`);
}

async function contactOf(owner: UserDocument, other: UserDocument): Promise<string> {
  const c = await contactModel.findOne({
    owner_id: owner._id,
    contact_user_id: other._id,
    status: 'accepted',
  });
  return c!._id.toString();
}

/** Tarea abierta de `owner` con `companion` (si ya existe con ese título, la devuelve). */
async function task(
  owner: UserDocument,
  companion: UserDocument,
  title: string,
  extra: { description?: string; dueInHours?: number } = {},
) {
  const existing = await taskModel.findOne({ owner_id: owner._id, title, status: 'open' });
  if (existing) {
    console.warn(`· «${title}»: ya estaba`);
    return existing;
  }
  const created = await tasks.create(owner, {
    title,
    description: extra.description,
    dueAt:
      extra.dueInHours === undefined
        ? undefined
        : new Date(Date.now() + extra.dueInHours * 3_600_000).toISOString(),
    companionContactId: await contactOf(owner, companion),
  });
  console.warn(`· «${title}»: creada`);
  return created;
}

await connect(marta, juan);
await connect(marta, lucia);
await connect(juan, lucia);

// Invitación pendiente (DetalleContactoPendiente) a Javier
const javier = await users.findOne({ email: 'javier@example.com' });
if (
  javier &&
  !(await contactModel.findOne({
    owner_id: marta._id,
    invited_email: javier.email,
    status: { $in: ['pending', 'accepted'] },
  }))
) {
  await contacts.invite(marta, { name: 'Javier', email: javier.email }, () => '');
  console.warn('· Marta → Javier: invitación pendiente');
}

const renta = await task(marta, juan, 'Hacer la renta', {
  description: 'Reunir los papeles del banco y hacer el borrador.',
  dueInHours: 3,
});
if (renta.companion.status === 'pending') await tasks.respond(juan, renta._id.toString(), 'accept');

const ingles = await task(marta, lucia, 'Estudiar inglés', { dueInHours: 26 });
void ingles;
await task(juan, marta, 'Ordenar el armario');

// Sesión propuesta por Marta a Juan dentro de 10 minutos (si no hay ninguna viva)
try {
  await sessions.create(marta, {
    taskId: renta._id.toString(),
    scheduledAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  console.warn('· Sesión «Hacer la renta» en 10 min: propuesta a Juan');
} catch (error) {
  console.warn(`· Sesión: no creada (${(error as Error).message})`);
}

// Tarea terminada con ¡hurra! de Juan
const done = await taskModel.findOne({ owner_id: marta._id, title: 'Llamar al médico' });
if (!done) {
  const medico = await task(marta, juan, 'Llamar al médico');
  await tasks.respond(juan, medico._id.toString(), 'accept');
  await tasks.complete(marta, medico._id.toString());
  await tasks.hurra(juan, medico._id.toString());
  console.warn('· «Llamar al médico»: terminada con ¡hurra! de Juan');
}

await app.close();
console.warn('Listo. Entra como Marta en un móvil y como Juan o Lucía en otro.');
