/**
 * Todos los textos de la app. Nunca literales en componentes.
 * Títulos con parte en cursiva: { lead, em } → «lead *em*».
 * «amig@» se escribe para lectura como «amiga o amigo» en las etiquetas de accesibilidad.
 */
import { pluralEs } from '@/lib/plural';

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
    liveTitle: { lead: 'Contigo ', em: 'ahora' } satisfies Emphasis,
    seeTasks: 'Ver mis tareas',
    emptyBodyWithContacts:
      'Empieza por una sola cosa que quieras hacer, y elige a alguien de tu red para que te acompañe.',
    forToday: { lead: 'Para ', em: 'hoy' } satisfies Emphasis,
    cardNextTask: (title: string) => `Tu siguiente tarea, ${title}`,
    cardShared: (name: string, title: string) => `${name} te comparte ${title}`,
    hurraReceived: (name: string, title: string) =>
      `${name} te ha enviado un ¡hurra! por «${title}»`,
    /** Lo que lee VoiceOver de la forma de la Home (doc 03 · describeScene). */
    scene: {
      loading: 'Cargando tu día',
      empty: 'Tu red de apoyo, aún vacía',
      alone: 'Tu energía',
      joined: (name: string) => `Tu energía y la de ${name}, unidas`,
      live: (name: string) => `Tú y ${name}, en una sesión en vivo`,
      support: (name: string) => `${name} te está enviando apoyo`,
      approaching: (name: string) => `${name} te pide algo`,
      present: (names: string) => `${names} está contigo`,
      presentMany: (names: string) => `${names} están contigo`,
      absent: (names: string) => `${names} hoy no está`,
      absentMany: (names: string) => `${names} hoy no están`,
      and: ' y ',
    },
    /** Texto bajo la forma (VacioHoyContactos): «Marta está contigo · Juan hoy no está». */
    presenceJoin: ' · ',
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
    /** «3 de 5 tareas» */
    count: (n: number, max: number) => `${n} de ${max} tareas`,
    firstSection: { lead: 'Hoy ', em: 'empiezo con…' } satisfies Emphasis,
    nextSection: { lead: 'Luego ', em: 'sigo con…' } satisfies Emphasis,
    seeDone: 'Ver terminadas',
    card: {
      accompanied: 'Acompañada',
      pending: 'Acompañante · pendiente',
      noCompanion: 'Sin acompañante',
      with: 'Con',
      waitingFor: (name: string) => `Esperando a que ${name} acepte`,
      rejected: (name: string) => `${name} no ha aceptado`,
      left: (name: string) => `${name} ha dejado la tarea`,
      done: 'Hecha',
      doneA11y: (title: string) => `Marcar como terminada: ${title}`,
      edit: 'Editar',
      editA11y: (title: string) => `Editar: ${title}`,
    },
    alert: {
      caption: 'Aviso',
      rejected: (name: string, title: string) => `${name} no puede acompañar «${title}»`,
      left: (name: string, title: string) => `${name} ha dejado de acompañar «${title}»`,
      body: 'Elige a otra persona para que la tarea siga adelante.',
      change: 'Cambiar acompañante',
    },
    doneSheet: {
      title: { lead: '¿La das por ', em: 'hecha', tail: '?' } satisfies Emphasis,
      body: (title: string, name?: string) =>
        `«${title}» pasará a tus tareas terminadas.` + (name ? ` Avisaremos a ${name}.` : ''),
      confirm: 'Sí, está hecha',
      cancel: 'Todavía no',
    },
    finished: {
      caption: 'Hecha · hoy',
      title: { lead: '¡Tarea ', em: 'terminada', tail: '!' } satisfies Emphasis,
      told: (name: string) => `${name} lo verá en su lista y podrá enviarte un ¡hurra!`,
      next: 'Ver mi siguiente tarea',
      seeDone: 'Ver tareas terminadas',
    },
    limit: {
      title: { lead: 'Ya tienes ', em: '5 tareas' } satisfies Emphasis,
      body: 'Mejor concéntrate en acabar estas 5. Cuando termines una, podrás crear otra.',
      next: 'Ir a mi siguiente tarea',
      see: 'Ver mis tareas',
    },
    created: (name: string) => `Tarea creada. Hemos pedido a ${name} que te acompañe.`,
    saved: 'Cambios guardados',
    deleted: 'Tarea borrada',
    undo: 'Deshacer',
    undoExpired: 'Ya no se puede deshacer.',
    form: {
      newTitle: { lead: 'Nueva ', em: 'tarea' } satisfies Emphasis,
      editTitle: { lead: 'Editar ', em: 'tarea' } satisfies Emphasis,
      changeTitle: { lead: 'Otra ', em: 'persona' } satisfies Emphasis,
      cancel: 'Cancelar',
      create: 'Crear',
      save: 'Guardar',
      name: 'Nombre de la tarea (obligatorio)',
      namePlaceholder: 'Ej.: Hacer la renta',
      description: 'Descripción (opcional)',
      when: 'Cuándo',
      date: 'Fecha',
      time: 'Hora',
      choose: 'Elegir',
      clear: 'Quitar',
      ready: 'Listo',
      companion: 'Persona acompañante (obligatorio)',
      companionHelp:
        'Cada tarea necesita a alguien que te acompañe. Si la persona aún no ha aceptado, la tarea quedará pendiente hasta que acepte.',
      changeHelp:
        'Si cambias de persona, se le compartirá la tarea y quedará pendiente hasta que la acepte.',
      otherPerson: 'Elige a otra persona (obligatorio)',
      otherHelp: (name: string) =>
        `${name} no aparece porque no ha aceptado esta tarea. Se compartirá con la nueva persona y quedará pendiente hasta que acepte.`,
      taskLabel: 'Tarea',
      noContacts: 'Aún no tienes contactos.',
      addContact: 'Añadir contacto',
      selected: 'seleccionada',
      missing: (n: number) => pluralEs(n, 'Falta completar 1 campo', `Falta completar ${n} campos`),
      missingBody: 'Revisa los campos marcados para crear la tarea.',
      nameRequired: 'Escribe un nombre para la tarea. Ej.: Hacer la renta',
      companionRequired: 'Elige a una persona que te acompañe.',
      delete: 'Borrar tarea',
    },
    deleteSheet: {
      title: (title: string): Emphasis => ({ lead: '¿Borrar ', em: `«${title}»`, tail: '?' }),
      body: (name?: string) =>
        'Podrás deshacerlo durante unos segundos.' +
        (name ? ` ${name} dejará de ver esta tarea.` : ''),
      confirm: 'Borrar tarea',
      cancel: 'Cancelar',
    },
    doneList: {
      back: 'Mis tareas',
      count: (n: number) => pluralEs(n, '1 terminada', `${n} terminadas`),
      title: { lead: 'Tareas ', em: 'terminadas' } satisfies Emphasis,
      doneOn: (when: string) => `Hecha · ${when}`,
      hurraFrom: (name: string) => `${name} te ha enviado un ¡hurra!`,
      emptyTitle: { lead: 'Aún no has ', em: 'terminado ninguna' } satisfies Emphasis,
      emptyBody: 'Cuando marques una tarea como hecha, aparecerá aquí.',
      seeTasks: 'Ver mis tareas',
    },
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
    /** «Acompañas 2 tareas» */
    count: (n: number) => pluralEs(n, 'Acompañas 1 tarea', `Acompañas ${n} tareas`),
    shared: { lead: 'Te ', em: 'comparten' } satisfies Emphasis,
    mine: { lead: 'Lo que ', em: 'acompaño' } satisfies Emphasis,
    recent: { lead: 'Recién ', em: 'terminadas' } satisfies Emphasis,
    finishedLine: 'ha terminado la tarea',
    sendHurra: 'Enviar un ¡hurra!',
    hurraSent: (name: string) => `¡Hurra! enviado. ${name} lo verá en sus tareas terminadas.`,
    hurraAlready: 'Ya le enviaste un ¡hurra!',
    sharedCaption: 'Tarea compartida',
    /** Va tras el nombre de la persona, que se escribe en su color: «Juan quiere que le acompañes». */
    wantsYou: 'quiere que le acompañes',
    accept: 'Aceptar',
    reject: 'Rechazar',
    tasksRow: 'Tareas',
    doneRow: 'Terminadas',
    accepted: (title: string, name: string) =>
      `Ahora acompañas «${title}». ${name} lo verá en su lista.`,
    rejectSheet: {
      title: (name: string): Emphasis => ({ lead: '¿Rechazar la tarea de ', em: name, tail: '?' }),
      body: (title: string, name: string) =>
        `«${title}». ${name} lo verá en su lista para poder elegir a otra persona.`,
      confirm: 'Rechazar tarea',
      cancel: 'Cancelar',
      done: (title: string, name: string) =>
        `Has rechazado «${title}». ${name} podrá elegir a otra persona.`,
    },
    list: {
      back: 'Acompaño',
      count: (n: number) => pluralEs(n, '1 tarea', `${n} tareas`),
      title: { lead: 'Tareas que ', em: 'acompaño' } satisfies Emphasis,
      from: (name: string, state: string) => `De ${name} · ${state}`,
      stateAccepted: 'aceptada',
      youAccompany: 'Le acompañas',
      leave: 'Dejar de acompañar',
      emptyTitle: { lead: 'Aún no ', em: 'acompañas ninguna tarea' } satisfies Emphasis,
      emptyBody: 'Cuando aceptes una tarea compartida, aparecerá aquí.',
    },
    leaveSheet: {
      title: (title: string): Emphasis => ({
        lead: '¿Dejar de acompañar ',
        em: `«${title}»`,
        tail: '?',
      }),
      body: (name: string) =>
        `${name} lo verá en su lista para poder elegir a otra persona. Dejarás de ver esta tarea.`,
      confirm: 'Dejar de acompañar',
      cancel: 'Cancelar',
      done: (title: string) => `Has dejado de acompañar «${title}».`,
    },
    doneList: {
      back: 'Acompaño',
      caption: 'Terminadas',
      title: { lead: 'Tareas ', em: 'terminadas' } satisfies Emphasis,
      from: (name: string) => `De ${name}`,
      emptyTitle: { lead: 'Aún no ', em: 'hay tareas terminadas' } satisfies Emphasis,
      emptyBody: 'Cuando alguien termine una tarea que acompañas, aparecerá aquí.',
    },
    undo: 'Deshacer',
  },
  profile: {
    back: 'Hoy',
    caption: 'Tu cuenta',
    title: { lead: 'Mi ', em: 'perfil' } satisfies Emphasis,
    myPeople: { lead: 'Tu ', em: 'gente' } satisfies Emphasis,
    contacts: 'Mis contactos',
    contactsCount: (n: number) =>
      n === 0 ? 'Aún no tienes contactos' : pluralEs(n, '1 persona', `${n} personas`),
    signOut: 'Cerrar sesión',
    signedOut: 'Has cerrado sesión',
    edit: 'Editar perfil',
    signOutSheet: {
      title: { lead: '¿Cerrar ', em: 'sesión', tail: '?' } satisfies Emphasis,
      body: 'Tus tareas y contactos seguirán aquí cuando vuelvas a entrar.',
      confirm: 'Cerrar sesión',
      cancel: 'Cancelar',
    },
    form: {
      title: { lead: 'Editar ', em: 'perfil' } satisfies Emphasis,
      cancel: 'Cancelar',
      save: 'Guardar',
      allRequired: 'Todos los campos son obligatorios.',
      name: '¿Cómo quieres que te llamemos?',
      email: 'Email',
      emailHint: 'Por ahora el email no se puede cambiar.',
      saved: 'Cambios guardados',
      changePassword: 'Cambiar contraseña',
      deleteAccount: 'Eliminar cuenta',
    },
    password: {
      title: { lead: 'Cambiar ', em: 'contraseña' } satisfies Emphasis,
      cancel: 'Cancelar',
      save: 'Guardar',
      current: 'Contraseña actual',
      next: 'Contraseña nueva',
      hint: 'Mínimo 8 caracteres.',
      note: 'Se cerrará la sesión en tus otros dispositivos.',
      currentRequired: 'Escribe tu contraseña actual.',
      currentWrong: 'La contraseña actual no es correcta.',
      saved: 'Contraseña cambiada',
    },
    deleteSheet: {
      title: { lead: '¿Eliminar tu ', em: 'cuenta', tail: '?' } satisfies Emphasis,
      body: 'Se borrarán tus tareas, sesiones y contactos. Las personas que te acompañan dejarán de ver tus tareas. No se puede deshacer.',
      confirm: 'Eliminar cuenta',
      cancel: 'Cancelar',
      failed: 'No se ha podido eliminar la cuenta. Vuelve a intentarlo.',
    },
    deleted: {
      caption: 'Cuenta eliminada',
      title: { lead: 'Hasta ', em: 'pronto' } satisfies Emphasis,
      body: 'Hemos borrado tus tareas, sesiones y contactos. Las personas que te acompañaban ya no ven tus tareas.',
      signUp: 'Crear una cuenta nueva',
      signIn: 'Iniciar sesión',
    },
  },
  contacts: {
    back: 'Mi perfil',
    count: (n: number) => pluralEs(n, '1 persona', `${n} personas`),
    title: { lead: 'Mis ', em: 'contactos' } satisfies Emphasis,
    intro: 'Personas que pueden acompañar tus tareas.',
    add: 'Añadir contacto',
    accepted: 'Contacto aceptado',
    pending: 'Pendiente de unirse',
    emptyTitle: { lead: 'Aún no ', em: 'tienes contactos' } satisfies Emphasis,
    emptyBody: 'Añade a personas de confianza para que puedan acompañar tus tareas.',
    form: {
      title: { lead: 'Añadir ', em: 'contacto' } satisfies Emphasis,
      cancel: 'Cancelar',
      send: 'Enviar',
      intro: 'Invita a una persona de confianza para que pueda acompañar tus tareas.',
      allRequired: 'Todos los campos son obligatorios.',
      name: 'Nombre',
      namePlaceholder: 'Ej.: Lucía',
      email: 'Email',
      emailPlaceholder: 'lucia@email.com',
      note: 'La persona recibirá una invitación. Hasta que la acepte, aparecerá como «Pendiente de unirse».',
      nameRequired: 'Escribe su nombre.',
      emailInvalid: 'Escribe un email válido, por ejemplo: persona@email.com',
      exists: (name: string) => `${name} ya está en tus contactos.`,
      seeContacts: 'Ver mis contactos',
      self: 'Ese es tu email: invita a otra persona.',
    },
    sent: (name: string) =>
      `Invitación enviada. ${name} aparecerá como pendiente hasta que se una.`,
    share: 'Compartir enlace',
    shareMessage: (url: string) => `Te invito a mi red de apoyo en Tandems: ${url}`,
    detail: {
      back: 'Contactos',
      pendingInfo: 'Le enviamos una invitación. Cuando cree su cuenta podrá acompañar tus tareas.',
      waitingFor: (name: string): Emphasis => ({ lead: 'Esperando a ', em: name }),
      accompaniesYou: { lead: 'Te ', em: 'acompaña' } satisfies Emphasis,
      youAccompany: (name: string): Emphasis => ({ lead: 'Acompañas a ', em: name }),
      waitingAccept: 'Pendiente de que acepte',
      resend: 'Reenviar invitación',
      resent: (email: string) => `Invitación reenviada a ${email}`,
      resendLimit: 'Ya la has reenviado hace poco. Prueba más tarde.',
      cancelInvite: 'Cancelar invitación',
      remove: 'Eliminar contacto',
    },
    cancelSheet: {
      title: (name: string): Emphasis => ({
        lead: '¿Cancelar la invitación a ',
        em: name,
        tail: '?',
      }),
      body: (task?: string) =>
        'El enlace que le enviamos dejará de funcionar.' +
        (task ? ` «${task}» se quedará sin acompañante hasta que elijas a otra persona.` : ''),
      confirm: 'Cancelar invitación',
      back: 'Volver',
      done: (name: string) => `Invitación a ${name} cancelada.`,
    },
    removeSheet: {
      title: (name: string): Emphasis => ({
        lead: '¿Eliminar a ',
        em: name,
        tail: ' de tus contactos?',
      }),
      body: (name: string, ownTask?: string, theirTask?: string) =>
        [
          ownTask && `«${ownTask}» se quedará sin acompañante hasta que elijas a otra persona.`,
          theirTask && `Dejarás de ver «${theirTask}», que acompañas tú.`,
          `${name} no recibirá ningún aviso.`,
        ]
          .filter(Boolean)
          .join(' '),
      confirm: 'Eliminar contacto',
      cancel: 'Cancelar',
      done: (name: string) => `${name} ya no está en tus contactos.`,
    },
    undo: 'Deshacer',
  },
  invitation: {
    caption: 'Invitación',
    title: (name: string): Emphasis => ({ lead: `${name} te invita a su `, em: 'red de apoyo' }),
    body: 'En Tandems podrás acompañar sus tareas, uniros en sesiones en vivo y enviarle apoyo cuando lo necesite.',
    invitedAs: 'Te ha invitado como contacto',
    createAndAccept: 'Crear cuenta y aceptar',
    haveAccount: 'Ya tengo cuenta',
    accept: 'Aceptar invitación',
    accepted: (name: string) => `Ya estás en la red de apoyo de ${name}.`,
    invalidTitle: { lead: 'Esta invitación ', em: 'no funciona' } satisfies Emphasis,
    invalidBody:
      'Puede que haya caducado, que ya se haya aceptado o que la hayan cancelado. Pide a quien te invitó que te envíe otra.',
    goHome: 'Ir a Hoy',
    /** BienvenidaInvitado */
    welcome: (name: string) => `Ya formas parte de la red de apoyo de ${name}`,
    welcomeOk: 'Vale',
  },
  carousel: {
    previous: 'Tarjeta anterior',
    next: 'Tarjeta siguiente',
    position: (i: number, n: number) => `Tarjeta ${i} de ${n}`,
  },
  dates: {
    noDate: 'sin fecha',
    today: 'hoy',
    tomorrow: 'mañana',
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
        pluralEs(n, 'Revisa 1 campo para continuar', `Revisa ${n} campos para continuar`),
      signInWithEmail: 'Iniciar sesión con este email',
      /** RegistroInvitado */
      invited: {
        back: 'Invitación',
        caption: (name: string) => `Te ha invitado ${name}`,
        cardCaption: 'Invitación',
        cardBody: (name: string) =>
          `Al crear la cuenta formarás parte de la red de apoyo de ${name} y verás las tareas que comparta contigo.`,
        emailHint: 'Es el email al que llegó la invitación.',
        submit: 'Crear cuenta y unirme',
      },
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
