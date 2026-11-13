/**
 * Le montage d'un écran UI Kit 2 dans le pont Forge.
 *
 * `@forge/react` n'exporte **pas** de fonction `render` nommée : le montage
 * passe par l'export **par défaut**, `ForgeReconciler.render(element)` (v10 et
 * v12). C'est le seul point du code qui connaît cette bascule — tous les
 * écrans appellent `mountScreen`.
 *
 * Le montage ne jette jamais : hors navigateur (tests, vérification de type),
 * `mountScreen` ne fait rien et l'import du module reste sans effet.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import ForgeReconciler from '@forge/react';
import React from 'react';

/** Vrai dans un navigateur, faux dans Node (tests, typecheck). */
function inBrowser(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== 'undefined';
}

/**
 * Monte un écran dans le pont Forge.
 *
 * L'appel est silencieux hors navigateur : l'import d'un point d'entrée ne doit
 * jamais faire échouer un test ou une vérification de type.
 */
export function mountScreen(element: React.ReactElement): void {
  if (!inBrowser()) return;
  ForgeReconciler.render(element);
}
