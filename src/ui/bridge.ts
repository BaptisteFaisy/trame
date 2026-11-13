/**
 * Le pont entre l'interface et le resolver (§17).
 *
 * Tout ce que l'UI demande au serveur passe par ce fichier : la **clé** de
 * l'écran, la **forme** de la charge utile et la **forme** de la réponse y
 * sont écrites une seule fois. Aucun écran n'appelle `invoke` lui-même.
 *
 * Deux règles de la maison (§22) :
 *
 *  - la **lecture du contexte ne jette jamais** : un champ absent est vide,
 *    pas une exception ;
 *  - l'écran affiche toujours l'un des trois états — chargement, erreur, ou
 *    donnée — jamais une page blanche.
 *
 * Les libellés, eux, sont calculés côté serveur : le view-model porte déjà
 * `language`, `kindLabel`, `formLabel`… L'interface affiche, elle ne
 * retraduit pas.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { invoke, view } from '@forge/bridge';
import { useEffect, useState } from 'react';
import type { ScreenKey } from '../handlers/resolver';
import type { Lang } from '../i18n/index';
import { pickLang } from '../i18n/index';
import type { ScopeType } from '../types';

/* ---------------------------------------------------------------- contrat */

/** Ce qu'un écran reçoit : le périmètre à mesurer, et la langue de l'écran. */
export interface ScreenProps {
  /** Le périmètre : une clé de ticket, de sprint, de projet ou de version. */
  scope: string;
  /** Le type de ce périmètre. */
  scopeType: ScopeType;
  /** La langue de l'écran — celle que le serveur a utilisée pour ses libellés. */
  lang: Lang;
}

/* ---------------------------------------------------------------- contexte */

/** Ce dont un écran a besoin du contexte Forge, et rien de plus. */
export interface ScreenContext {
  /** La clé du ticket courant, quand l'écran est dans un panneau de ticket. */
  issueKey: string;
  /** La clé du projet courant, quand l'écran est dans une page de projet. */
  projectKey: string;
  /** La langue de l'utilisateur, ramenée à `en` ou `fr`. */
  locale: Lang;
  /** L'adresse du site, pour les liens. */
  siteUrl: string;
}

/** Vrai pour un objet ordinaire (ni `null`, ni un tableau). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Un champ texte, ou une chaîne vide quand il manque ou n'est pas du texte. */
function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Extrait le contexte de l'écran courant sans jamais jeter.
 *
 * `view.getContext()` rend un objet libre : `extension.issue.key`,
 * `extension.project.key`, `locale`, `siteUrl`. Un contexte qui ne contient
 * rien rend un contexte vide — l'écran demandera alors son périmètre.
 */
export function readContext(raw: unknown): ScreenContext {
  const root = isRecord(raw) ? raw : {};
  const extension = isRecord(root['extension']) ? root['extension'] : {};
  const issue = isRecord(extension['issue']) ? extension['issue'] : {};
  const project = isRecord(extension['project']) ? extension['project'] : {};
  return {
    issueKey: textOf(issue['key']),
    projectKey: textOf(project['key']),
    locale: pickLang(textOf(root['locale'])),
    siteUrl: textOf(root['siteUrl']),
  };
}

/* ------------------------------------------------------------------ états */

/** L'état d'une donnée distante : chargement, erreur, ou donnée. */
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

/** Un état et son rechargement. */
export interface ScreenState<T> {
  state: AsyncState<T>;
  reload: () => void;
}

/** Un message lisible pour n'importe quelle erreur. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/* -------------------------------------------------------------- le resolver */

/**
 * La réponse « aucun critère écrit » : le périmètre n'a rien à mesurer.
 *
 * Les handlers la rendent à la place du view-model quand le périmètre est vide
 * ou inconnu (§24.16). L'interface la reconnaît et affiche l'état vide — elle
 * ne montre jamais « 0 % ».
 */
export interface ScreenEmpty {
  scope: string;
  scopeType: string;
  language: Lang;
  message: string;
  empty?: boolean;
}

/** Vrai pour la réponse « aucun critère écrit ». */
export function isEmptyScreen(value: unknown): value is ScreenEmpty {
  return isRecord(value) && typeof value['message'] === 'string';
}

/**
 * Déballe une réponse du resolver.
 *
 * Le resolver rend le view-model nu. On accepte malgré tout une enveloppe
 * (`{ data }`, `{ result }`) : l'interface lit alors la même chose quel que
 * soit le transport.
 */
export function unpack<T>(raw: unknown): T {
  if (!isRecord(raw)) return raw as T;
  for (const key of ['data', 'result']) {
    const inner = raw[key];
    if (isRecord(inner)) return inner as T;
  }
  return raw as T;
}

/**
 * Appelle un écran du resolver et rend son view-model.
 *
 * La clé est une `ScreenKey` : la liste des onze écrans de §17 est fermée, un
 * écran ne peut pas appeler une clé inventée.
 */
export function invokeScreen<T>(key: ScreenKey, payload: Record<string, unknown>): Promise<T> {
  return invoke<T>(key, payload).then((raw) => unpack<T>(raw));
}

/* ------------------------------------------------------------------ hooks */

/** Le contexte de l'écran courant, avec ses états de chargement et d'erreur. */
export function useScreenContext(): ScreenState<ScreenContext> {
  const [state, setState] = useState<AsyncState<ScreenContext>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const data = readContext(await view.getContext());
        if (!cancelled) setState({ status: 'ready', data });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', message: errorMessage(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { state, reload: () => setAttempt(attempt + 1) };
}

/**
 * Charge un écran du resolver.
 *
 * La charge utile est sérialisée pour que l'effet ne redemande pas la même
 * donnée à chaque rendu : l'écran ne recharge que quand son périmètre change.
 */
export function useScreen<T>(
  key: ScreenKey,
  payload: Record<string, unknown>,
): ScreenState<T | ScreenEmpty> {
  const [state, setState] = useState<AsyncState<T | ScreenEmpty>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const serial = JSON.stringify(payload);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const data = await invokeScreen<T>(key, JSON.parse(serial) as Record<string, unknown>);
        if (!cancelled) setState({ status: 'ready', data });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', message: errorMessage(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, serial, attempt]);

  return { state, reload: () => setAttempt(attempt + 1) };
}
