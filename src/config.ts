/**
 * Todo el contenido editable de la landing vive aquí: contacto, planes, preguntas.
 * Cambia estos valores y el sitio (y el SEO estructurado) se actualizan solos.
 */

export const SITE = {
  name: 'MyNeg',
  tagline: 'Tu negocio, en orden. Hasta sin internet.',
  title: 'MyNeg — Sistema de caja, inventario y facturación electrónica para negocios en RD',
  description:
    'Punto de venta, inventario, compras, e-CF de la DGII, 606/607, delivery, mesas, taller, nómina y contabilidad en un solo sistema. Funciona sin internet. Prueba 14 días gratis.',
  keywords: [
    'sistema de punto de venta República Dominicana',
    'facturación electrónica e-CF DGII',
    'software de inventario RD',
    'sistema para colmado',
    'sistema para ferretería',
    'POS restaurante República Dominicana',
    'reporte 606 607',
    'cuadre de caja',
    'nómina TSS AFP SFS',
  ],
  locale: 'es_DO',
  whatsapp: '18093603722',
  // TODO: cambia por tu correo de ventas
  email: 'ventas@myneg.do',
  trialDays: 14,
  ecfDeadline: '2026-11-15',
};

export const waLink = (text: string) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

/** Precios de ejemplo (los mismos de Plataforma → Planes). Cámbialos cuando los definas. */
export const PLANS = [
  {
    name: 'Básico',
    price: 1500,
    branch: 750,
    pitch: 'Para el colmado, la tienda o la boutique que quiere vender y cuadrar sin dolores de cabeza.',
    features: [
      'Caja con NCF y cuadre guiado',
      'Inventario, tallas y colores',
      'Clientes y fiado con límite',
      'Caja sin internet',
      'Usuarios ilimitados',
    ],
  },
  {
    name: 'Pro',
    price: 2500,
    branch: 1250,
    featured: true,
    pitch: 'Para el negocio que compra, despacha y quiere sus números al día con la DGII.',
    features: [
      'Todo lo del Básico',
      'Compras con e-CF y cuentas por pagar',
      'Pedido sugerido inteligente',
      'Reportes, ITBIS y 606/607',
      'Delivery, mesas o taller',
    ],
  },
  {
    name: 'Empresa',
    price: 4000,
    branch: 2000,
    pitch: 'Para varias sucursales con su contabilidad, nómina y producción bajo control.',
    features: [
      'Todo lo del Pro',
      'Contabilidad automática',
      'Nómina con TSS, ISR y regalía',
      'Producción y recetas',
      'Transferencias entre sucursales',
    ],
  },
];

export const BUSINESS_TYPES = [
  'Ferretería',
  'Colmado',
  'Restaurante',
  'Farmacia',
  'Boutique y calzado',
  'Autorepuestos',
  'Celulares y electrónica',
  'Taller',
  'Fábrica',
  'Servicios',
];

/** Lo que ve cada rol (resumen de los permisos por defecto de MyNeg). */
export const ROLES = [
  {
    name: 'Dueño',
    sees: 'Todo el negocio y todas las sucursales, también desde el celular.',
    can: ['Ver costos, ganancias y cada sucursal', 'Crear roles y dar permisos', 'Descargar todos sus datos en un ZIP'],
    cannot: [],
  },
  {
    name: 'Gerente',
    sees: 'La operación del día, el equipo y los reportes.',
    can: [
      'Autorizar descuentos y anulaciones con su PIN',
      'Revisar cierres, faltantes y sobrantes',
      'Gestionar el equipo',
    ],
    cannot: ['Cambiar los ajustes del negocio'],
  },
  {
    name: 'Cajera',
    sees: 'Su caja, sus ventas y los clientes.',
    can: [
      'Cobrar en efectivo, tarjeta, transferencia o mixto',
      'Cobrar pedidos de los vendedores',
      'Cuadrar su turno por billetes',
    ],
    cannot: ['Ver costos ni ganancias', 'Dar descuentos sin el PIN de un supervisor'],
  },
  {
    name: 'Vendedor',
    sees: 'El catálogo, las existencias y sus pedidos.',
    can: ['Armar pedidos en el piso, desde el celular', 'Mandarlos a caja o para apartar', 'Registrar clientes'],
    cannot: ['Cobrar', 'Ver costos'],
  },
  {
    name: 'Almacenista',
    sees: 'Productos, inventario, compras y proveedores.',
    can: [
      'Registrar compras (también con el XML del e-CF)',
      'Hacer el conteo del día con el escáner',
      'Transferir entre sucursales',
    ],
    cannot: ['Vender', 'Ver reportes de ventas'],
  },
  {
    name: 'Contador',
    sees: 'Ventas, compras, reportes fiscales y la contabilidad.',
    can: ['Sacar el ITBIS y los formatos 606 y 607', 'Ver diario, mayor y balance', 'Revisar la auditoría'],
    cannot: ['Vender ni cambiar precios'],
  },
  {
    name: 'Mesero',
    sees: 'El salón, sus mesas y el menú.',
    can: ['Abrir mesas y mandar a cocina', 'Imprimir la precuenta dividida', 'Pedir la cuenta a caja'],
    cannot: ['Cobrar', 'Ver reportes'],
  },
  {
    name: 'Cocina',
    sees: 'Solo la pantalla de comandas.',
    can: ['Ver las comandas en orden, con reloj', 'Marcar cada plato listo', 'Avisar al salón con un toque'],
    cannot: ['Todo lo demás: ni precios ni ventas'],
  },
  {
    name: 'Repartidor',
    sees: '«Mis entregas» en su celular.',
    can: [
      'Ver la dirección en el mapa y llamar al cliente',
      'Saber cuánto cobrar y el cambio',
      'Marcar entregado o no se pudo',
    ],
    cannot: ['Ver otras entregas', 'Ver ventas del negocio'],
  },
  {
    name: 'Técnico',
    sees: 'El tablero del taller.',
    can: [
      'Recibir equipos con fotos y fallas',
      'Presupuestar y usar piezas del inventario',
      'Avisar por WhatsApp que está listo',
    ],
    cannot: ['Cobrar', 'Ver costos'],
  },
  {
    name: 'Producción',
    sees: 'Recetas y órdenes de producción.',
    can: ['Ver cuántos se pueden hacer con lo que hay', 'Registrar lo producido', 'Sacar materiales del inventario'],
    cannot: ['Vender', 'Ver reportes'],
  },
];

export const FAQ = [
  {
    q: '¿MyNeg funciona sin internet?',
    a: 'Sí. La caja guarda una copia del catálogo y de los clientes, y aparta comprobantes para ese equipo. Si se cae el internet sigues vendiendo e imprimiendo; todo se sube solo cuando vuelve, sin duplicarse.',
  },
  {
    q: '¿Emite facturación electrónica (e-CF) de la DGII?',
    a: 'Sí. MyNeg arma el e-CF (E31, E32, E34), lo envía, guarda el código de seguridad e imprime el QR de la DGII en el recibo. Si la DGII no responde, la factura queda en contingencia y se reenvía sola. Desde el 15 de noviembre de 2026 los contribuyentes pequeños y micro están obligados a emitir e-CF.',
  },
  {
    q: '¿Sirve para mi tipo de negocio?',
    a: 'MyNeg trae plantillas para ferretería, colmado, restaurante, farmacia, ropa y calzado, autorepuestos, electrónica, taller, fábrica y servicios. Cada una activa lo que ese negocio necesita: tallas, IMEI, mesas, recetas, compatibilidad de vehículos…',
  },
  {
    q: '¿Cuántos usuarios puedo tener?',
    a: 'Ilimitados. Pagas por sucursal, no por persona. Cada empleado entra con su usuario y solo ve lo que su rol le permite.',
  },
  {
    q: '¿Mis empleados pueden ver mis costos y ganancias?',
    a: 'Solo si tú lo permites. Hay 44 permisos editables; por ejemplo, la cajera vende sin ver costos, y los descuentos y anulaciones necesitan el PIN de un supervisor. Todo lo sensible queda en la auditoría.',
  },
  {
    q: '¿Saca el 606, el 607 y el ITBIS?',
    a: 'Sí. El reporte fiscal calcula el ITBIS del mes y exporta los detalles 606 y 607. Con el módulo de contabilidad, los asientos se arman solos y el contador recibe el diario, el mayor y el balance cuadrados.',
  },
  {
    q: '¿Qué pasa con mis datos si me voy?',
    a: 'Tus datos son tuyos. El dueño descarga en un clic un ZIP con Excel de productos, clientes, ventas, compras, nómina y más, con las fotos y el logo. Además hay respaldos automáticos diarios.',
  },
  {
    q: '¿Funciona con mi impresora térmica y el lector de código de barras?',
    a: 'Sí. Recibos de 80 o 58 mm por el navegador, por USB directo o con el agente de impresión para impresoras de red, y el cajón se abre al cobrar en efectivo. El lector USB o Bluetooth funciona tal cual, y también puedes escanear con la cámara del celular.',
  },
];
