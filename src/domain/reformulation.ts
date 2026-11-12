/**
 * La reformulation vérifiable d'un critère infalsifiable (§8.4, §12.6).
 *
 * Un critère infalsifiable (« l'application doit être rapide ») n'est pas
 * réécrit dans le vide : l'app **propose** un critère vérifiable, avec la
 * mesure proposée. Rien n'est appliqué (§12.6) — la reformulation part en
 * proposition, elle ne remplace jamais le critère d'origine.
 *
 * Deux chemins :
 *  - `proposeReformulation` : **déterministe**, sans modèle. Un gabarit
 *    (verbe d'observable + mesure + percentile) qui transforme le texte à
 *    l'identique d'une fois à l'autre — c'est lui qui fait les tests ;
 *  - `proposeReformulationWithModel` : passe par la passerelle LLM
 *    (`LlmGateway.proposeReformulation`), **avec repli** sur le gabarit
 *    déterministe, et le budget LLM tenu au compte (§22 sobriété).
 *
 * Si le critère porte déjà une mesure, la reformulation **précise** cette
 * mesure au lieu d'en inventer une autre : l'app ne fabrique pas de seuil
 * que l'équipe n'a pas choisi.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps, LlmGateway } from '../ports.js';
import type { Criterion } from '../types.js';
import { measureFragment } from './falsifiability.js';

/** Une reformulation : le texte proposé et la mesure qui le rend tranchable. */
export interface Reformulation {
  after: string;
  measure: string;
}

/** Un gabarit : les mots qui y mènent, le texte et la mesure correspondants. */
interface Template {
  id: string;
  markers: readonly string[];
  after: string;
  measure: string;
}

/** Les gabarits, du plus spécifique au plus général. */
const TEMPLATES: readonly Template[] = [
  {
    id: 'performance',
    markers: ['rapide', 'fast', 'performant', 'performance', 'latence', 'fluide'],
    after: 'le temps de réponse du tableau de bord reste sous 2 s au 95ᵉ centile',
    measure: 'temps de réponse < 2 s au 95ᵉ centile',
  },
  {
    id: 'robustesse',
    markers: ['robuste', 'robust', 'fiable', 'stable', 'résiste'],
    after: 'le service répond sans erreur sur 99 % des requêtes d’une série de 1 000 requêtes',
    measure: 'taux d’erreur < 1 % sur 1 000 requêtes',
  },
  {
    id: 'experience',
    markers: [
      'agréable',
      'pleasant',
      'ergonomique',
      'intuitif',
      'intuitive',
      'simple',
      'facile',
      'easy to use',
      'user-friendly',
      'joli',
      'nice',
      'confortable',
    ],
    after: '80 % des utilisateurs terminent la tâche en moins de 30 s',
    measure: '80 % des utilisateurs terminent la tâche en moins de 30 s',
  },
];

/** Le gabarit quand rien n'est connu du critère : la forme, pas le chiffre. */
const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  markers: [],
  after:
    '« [critère] » reformulé : [comportement observable] mesuré — la valeur reste sous [seuil] au 95ᵉ centile (seuil, population et percentile à fixer avec l’équipe)',
  measure: '[comportement observable] < [seuil] au 95ᵉ centile — à fixer avec l’équipe',
};

/** Coût estimé d'un appel LLM, pour l'affichage de sobriété (§22). */
const LLM_CALL_COST_ESTIMATE = 0.0002;

/* ------------------------------------------------------------------ outils */

/** Échappe un littéral pour une expression régulière. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Le texte nettoyé : espaces aux bouts, espaces multiples réduits. */
function trimmed(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Le gabarit d'un mot : « rapide », « rapides », « performante »… */
function markerPattern(marker: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(marker)}\\w{0,2}\\b`, 'i');
}

/** Le gabarit qui colle le mieux au texte, puis à la raison. */
function templateFor(text: string, reason: string): Template {
  for (const template of TEMPLATES) {
    const markers = template.markers.map(markerPattern);
    if (markers.some((pattern) => pattern.test(text))) return template;
  }
  for (const template of TEMPLATES) {
    const markers = template.markers.map(markerPattern);
    if (markers.some((pattern) => pattern.test(reason))) return template;
  }
  return DEFAULT_TEMPLATE;
}

/** La reformulation quand le critère porte déjà une mesure : on la précise. */
function precise(text: string): string {
  const clean = trimmed(text);
  if (/centile/i.test(clean)) {
    return `${clean} — préciser la population mesurée et la taille de l’échantillon`;
  }
  return `${clean} — au 95ᵉ centile, sur un échantillon d’au moins 100 mesures`;
}

/* -------------------------------------------------------------- reformuler */

/**
 * La reformulation **déterministe** d'un critère infalsifiable.
 *
 * - critère déjà mesuré → la mesure est précisée, pas inventée ;
 * - « rapide », « agréable », « robuste » → le gabarit correspondant
 *   (verbe d'observable + mesure + percentile) ;
 * - critère inconnu → la forme d'une mesure vérifiable, le seuil est laissé
 *   à l'équipe (l'app n'invente pas de seuil que personne n'a choisi).
 */
export function proposeReformulation(text: string, reason: string): Reformulation {
  const existante = measureFragment(text);
  if (existante) {
    return { after: precise(text), measure: existante };
  }
  const template = templateFor(text, reason);
  if (template.id === 'default') {
    const clean = trimmed(text);
    return {
      after: template.after.replace('[critère]', clean),
      measure: template.measure,
    };
  }
  return { after: template.after, measure: template.measure };
}

/* ------------------------------------------------------------------ modèle */

/** Note l'appel LLM au budget du jour (§22 : la sobriété s'affiche). */
async function recordBudget(deps: Deps, text: string): Promise<void> {
  const day = deps.clock.now().slice(0, 10);
  const tokens = Math.ceil(text.length / 4);
  await deps.store.addBudget(day, 1, tokens, LLM_CALL_COST_ESTIMATE);
}

/**
 * La reformulation par le modèle, avec repli sur le gabarit déterministe.
 *
 * La passerelle peut être absente (`LlmGateway` est un port : une
 * implémentation n'a pas à l'implémenter) : dans ce cas, le gabarit prend le
 * relais. L'appel est noté au budget **même en cas d'échec** : un jeton
 * consommé ne redevient pas disponible.
 */
export async function proposeReformulationWithModel(
  deps: Deps,
  criterion: Criterion,
  reason: string,
): Promise<Reformulation> {
  const passerelle = deps.llm as Partial<LlmGateway>;
  if (typeof passerelle.proposeReformulation !== 'function') {
    return proposeReformulation(criterion.text, reason);
  }
  let reponse: Reformulation | null = null;
  try {
    reponse = await passerelle.proposeReformulation(criterion.text, reason);
  } catch (error) {
    deps.log.log('warn', 'reformulation LLM indisponible — gabarit déterministe', {
      error: String(error),
    });
  }
  await recordBudget(deps, criterion.text);
  if (reponse && typeof reponse.after === 'string' && reponse.after.trim().length > 0) {
    return {
      after: reponse.after.trim(),
      measure: typeof reponse.measure === 'string' ? reponse.measure.trim() : '',
    };
  }
  return proposeReformulation(criterion.text, reason);
}
