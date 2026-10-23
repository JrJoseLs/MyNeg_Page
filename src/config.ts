/**
 * El contenido editable de la landing vive en src/data/sitio.json: contacto, planes, clientes,
 * preguntas… Se edita a mano o con el editor local (npm run admin), y el sitio (y el SEO
 * estructurado) se actualizan solos.
 */
import data from './data/sitio.json';

export interface Plan {
  name: string;
  price: number;
  /** Precio por sucursal adicional */
  branch: number;
  featured?: boolean;
  pitch: string;
  features: string[];
}

/**
 * Negocio que usa MyNeg (sección «Clientes»). Solo clientes reales y con su permiso para mostrar
 * el nombre y el logo. Mientras no haya ninguno, la sección no aparece.
 */
export interface Client {
  name: string;
  /** Uno de BUSINESS_TYPES (o el que corresponda) */
  type: string;
  city?: string;
  /** Desde cuándo usa MyNeg, ej. '2026' */
  since?: string;
  /** Archivo dentro de public/clientes/. Sin logo se muestran sus iniciales */
  logo?: string;
  quote?: string;
  author?: string;
  /** Su Instagram o página web */
  link?: string;
}

export interface Role {
  name: string;
  sees: string;
  can: string[];
  cannot: string[];
}

export const SITE = data.sitio;

/** La empresa detrás de MyNeg (y de los demás productos) */
export const COMPANY = { ...data.empresa, instagram: SITE.instagram };

export const waLink = (text: string) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

/** Precios (los mismos de Plataforma → Planes en MyNeg) */
export const PLANS: Plan[] = data.planes;

export const CLIENTS: Client[] = data.clientes;

export const BUSINESS_TYPES: string[] = data.tiposDeNegocio;

/** Lo que ve cada rol (resumen de los permisos por defecto de MyNeg) */
export const ROLES: Role[] = data.roles;

export const FAQ: { q: string; a: string }[] = data.preguntas;
