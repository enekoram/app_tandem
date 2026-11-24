/**
 * Todos los textos de la app. Nunca literales en componentes.
 * Títulos con parte en cursiva: { lead, em } → «lead *em*».
 * «amig@» se escribe para lectura como «amiga o amigo» en las etiquetas de accesibilidad.
 */

export interface Emphasis {
  lead: string;
  em: string;
  tail?: string;
}

export const es = {
  common: {
    comingSoon: 'Esto llega en la próxima versión',
    profile: 'Mi perfil',
    close: 'Cerrar',
    /** Se añade al nombre de quien aún no ha aceptado: «Lucía, pendiente». */
    pendingSuffix: 'pendiente',
  },
  tabs: {
    a11yLabel: 'Secciones',
    today: 'Hoy',
    tasks: 'Tareas',
    sessions: 'Sesiones',
    companion: 'Acompaño',
  },
  today: {
    title: { lead: 'Empieza ', em: 'aquí' } satisfies Emphasis,
    intro:
      'Aún no hay nadie en tu red de apoyo. Cuando crees una tarea podrás añadir a una persona.',
    nextTask: { lead: 'Tu ', em: 'siguiente tarea' } satisfies Emphasis,
    emptyTitle: { lead: 'Aún ', em: 'no tienes tareas' } satisfies Emphasis,
    emptyBody: 'Empieza por una sola cosa que quieras hacer, y elige a alguien que te acompañe.',
    createFirst: 'Crear mi primera tarea',
  },
  tasks: {
    caption: 'Sin tareas todavía',
    title: { lead: 'Mis ', em: 'tareas' } satisfies Emphasis,
    add: 'Nueva tarea',
    emptyTitle: { lead: 'Aún ', em: 'no tienes tareas' } satisfies Emphasis,
    emptyBody: 'Crea tu primera tarea y elige a una persona que te acompañe.',
    createFirst: 'Crear mi primera tarea',
    addContactFirst: 'Añadir un contacto primero',
    hint: 'Cada tarea va con alguien. Si aún no ha aceptado, la verás como pendiente.',
  },
  sessions: {
    caption: 'Sin sesiones',
    title: { lead: 'Mis ', em: 'sesiones' } satisfies Emphasis,
    add: 'Programar sesión',
    emptyTitle: { lead: 'Aún no ', em: 'tienes sesiones' } satisfies Emphasis,
    emptyBody: 'Programa una sesión para trabajar en una tarea junto a la persona que te acompaña.',
    schedule: 'Programar sesión',
  },
  companion: {
    caption: 'Sin tareas que acompañar',
    title: { lead: '', em: 'Acompaño' } satisfies Emphasis,
    emptyTitle: { lead: 'Aún no ', em: 'acompañas ninguna tarea' } satisfies Emphasis,
    emptyBody: 'Cuando alguien comparta una tarea contigo o te pida apoyo, aparecerá aquí.',
  },
  profile: {
    caption: 'Tu cuenta',
    title: { lead: 'Mi ', em: 'perfil' } satisfies Emphasis,
    emptyBody:
      'Aquí podrás cambiar tu nombre, tu foto, las notificaciones y el nivel de movimiento.',
    signOut: 'Cerrar sesión',
    signedOut: 'Has cerrado sesión',
  },
  brand: {
    name: { lead: 'Tan', em: 'dems' } satisfies Emphasis,
    tagline: { lead: 'Hazlo con ', em: 'compañía' } satisfies Emphasis,
  },
  onboarding: {
    skip: 'Saltar',
    back: 'Atrás',
    next: 'Siguiente',
    createAccount: 'Crear cuenta',
    haveAccount: 'Ya tengo cuenta',
    /** «1 de 4» */
    step: (n: number, total: number) => `${n} de ${total}`,
    stepA11y: (n: number, total: number) => `Paso ${n} de ${total}`,
    you: 'Tú',
    /** Se escribe «amig@»; VoiceOver lo lee con la etiqueta de la ilustración. */
    friend: 'amig@',
    live: 'EN VIVO',
    slides: [
      {
        caption: 'Bienvenida',
        title: { lead: 'Hazlo con ', em: 'compañía' },
        body: 'Una app para avanzar en lo que te importa con el apoyo de personas de confianza. Pensada para personas con TDAH.',
        art: 'Tu forma y la de tu amiga o amigo, unidas en una sola',
      },
      {
        caption: 'Foco',
        title: { lead: 'Enfócate en ', em: '5 tareas' },
        body: 'Puedes tener hasta 5 tareas activas a la vez. Menos ruido y más foco: cuando terminas una, se libera un hueco.',
        art: 'Tú en el centro y cinco huecos para tareas: una hecha y un hueco libre',
      },
      {
        caption: 'Sesiones',
        title: { lead: 'Sesiones en vivo ', em: 'con tu acompañante' },
        body: 'Cada tarea tiene una persona que te acompaña. Programad una sesión por videollamada y trabajad a la vez.',
        art: 'Tú y tu amiga o amigo en una videollamada en vivo',
      },
      {
        caption: 'Apoyo',
        title: { lead: 'Apoyo ', em: 'cuando lo necesitas' },
        body: 'Si te cuesta empezar, pide apoyo. Tu acompañante te lo envía y lo sientes en la pantalla mientras trabajas.',
        art: 'Aviso: tu amiga o amigo te está enviando apoyo',
        noticeCaption: 'Amig@ · ahora',
        noticeCaptionA11y: 'Amiga o amigo, ahora',
        noticeTitle: { lead: 'Te está ', em: 'enviando apoyo' },
      },
    ] satisfies {
      caption: string;
      title: Emphasis;
      body: string;
      art: string;
      noticeCaption?: string;
      noticeCaptionA11y?: string;
      noticeTitle?: Emphasis;
    }[],
  },
  auth: {
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    passwordHint: 'Mínimo 8 caracteres.',
    login: {
      title: { lead: 'Inicia ', em: 'sesión' } satisfies Emphasis,
      forgot: '¿Has olvidado tu contraseña?',
      submit: 'Entrar',
      noAccount: '¿No tienes cuenta?',
      createAccount: 'Crear cuenta',
      errorTitle: 'No hemos podido iniciar sesión',
      errorBody: 'El email o la contraseña no son correctos. Revísalos y vuelve a intentarlo.',
    },
    register: {
      back: 'Iniciar sesión',
      caption: 'Bienvenida',
      title: { lead: 'Crear ', em: 'cuenta' } satisfies Emphasis,
      allRequired: 'Todos los campos son obligatorios.',
      name: '¿Cómo quieres que te llamemos?',
      terms: 'Acepto las condiciones de uso y la política de privacidad',
      submit: 'Crear cuenta',
      /** «Revisa 3 campos para continuar» */
      summary: (n: number) =>
        new Intl.PluralRules('es').select(n) === 'one'
          ? 'Revisa 1 campo para continuar'
          : `Revisa ${n} campos para continuar`,
      signInWithEmail: 'Iniciar sesión con este email',
    },
    forgot: {
      back: 'Iniciar sesión',
      caption: 'Contraseña',
      title: { lead: 'Recuperar ', em: 'contraseña' } satisfies Emphasis,
      body: 'Escribe el email de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.',
      submit: 'Enviar enlace',
    },
    sent: {
      back: 'Iniciar sesión',
      caption: 'Enlace enviado',
      title: { lead: 'Revisa tu ', em: 'email' } satisfies Emphasis,
      body: (email: string) =>
        `Si hay una cuenta con ${email}, recibirás un enlace para crear una contraseña nueva. Puede tardar unos minutos.`,
      openMail: 'Abrir el email',
      resend: 'No me ha llegado: reenviar',
      resent: 'Te hemos enviado otro enlace.',
    },
    reset: {
      caption: 'Último paso',
      title: { lead: 'Crea una contraseña ', em: 'nueva' } satisfies Emphasis,
      newPassword: 'Contraseña nueva',
      repeat: 'Repite la contraseña',
      submit: 'Guardar y entrar',
      saved: 'Contraseña guardada. Ya puedes iniciar sesión.',
    },
    errors: {
      nameRequired: 'Escribe cómo quieres que te llamemos.',
      nameTooLong: 'Máximo 40 caracteres.',
      emailInvalid: 'Escribe un email válido, por ejemplo tu@email.com.',
      emailTaken: 'Este email ya tiene una cuenta.',
      passwordShort: 'La contraseña no cumple los requisitos.',
      passwordCompromised: 'Esta contraseña ha aparecido en filtraciones de datos. Elige otra.',
      passwordMismatch: 'Las contraseñas no coinciden.',
      termsRequired: 'Acepta las condiciones para crear la cuenta.',
      tokenInvalid: 'El enlace ha caducado o ya se ha usado. Pide uno nuevo.',
      tooManyAttempts: 'Demasiados intentos. Espera un momento y vuelve a probar.',
      network: 'No hay conexión con el servidor. Revisa tu conexión y vuelve a intentarlo.',
      unknown: 'Algo ha fallado. Vuelve a intentarlo.',
    },
  },
  errors: {
    fontsFailed: 'No se han podido cargar las fuentes. Se usará la del sistema.',
  },
} as const;

/** Texto plano de un título con énfasis, para lectores de pantalla. */
export function plain(text: Emphasis): string {
  return `${text.lead}${text.em}${text.tail ?? ''}`;
}
