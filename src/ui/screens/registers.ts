/**
 * Les **projections** de registre : un sous-ensemble de lignes, dans un
 * tableau.
 *
 * Les écrans principaux (trous, perforations, fils détendus) rendent
 * l'entête et les lignes que le serveur a construites (`TableHead`,
 * `RegisterRow`) — ils ne les recalculent jamais. Mais une fiche critère ou
 * un certificat **imbriquent** une liste dans un écran plus grand : il faut
 * alors un tableau plus petit.
 *
 * Ces projections sont écrites ici, une seule fois, et s'appuient sur les
 * constructeurs du serveur (`tableHead`, `registerRow`) : la forme du
 * registre reste celle de `src/viewmodel/common.ts`.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../../i18n/index';
import type { DanglingLine, PerforationLine, RegisterRow, TableHead } from '../../viewmodel/common';
import { registerRow, tableHead } from '../../viewmodel/common';
import type { StrengthLine } from '../../viewmodel/criterion-detail';
import { text } from '../../viewmodel/labels';

/** Un registre : son entête et ses lignes. */
export interface Register {
  head: TableHead;
  rows: RegisterRow[];
}

/** Les actes qui couvrent un critère, en registre. */
export function forcesRegister(lang: Lang, forces: readonly StrengthLine[]): Register {
  return {
    head: tableHead([
      text(lang, 'action'),
      text(lang, 'force'),
      text(lang, 'form'),
      text(lang, 'path'),
      text(lang, 'confidence'),
      text(lang, 'date'),
    ]),
    rows: forces.map((line) =>
      registerRow(
        [
          line.name,
          line.strengthLabel,
          line.formLabel,
          line.pathLabel,
          line.confidence.toFixed(2),
          line.executedAt,
        ],
        line.state,
      ),
    ),
  };
}

/** Les perforations d'un périmètre ou d'un critère, en registre. */
export function perforationRegister(
  lang: Lang,
  lines: readonly PerforationLine[],
): Register {
  return {
    head: tableHead([
      text(lang, 'ticket'),
      text(lang, 'criterion'),
      text(lang, 'version'),
      text(lang, 'changed-at'),
      text(lang, 'verified-at'),
      text(lang, 'gap'),
      text(lang, 'class'),
    ]),
    rows: lines.map((line) =>
      registerRow(
        [
          line.ticketKey,
          line.criterionKey,
          String(line.version),
          line.changedAt,
          line.verifiedAt,
          String(line.gapDays),
          line.classLabel,
        ],
        line.state,
      ),
    ),
  };
}

/** Les fils détendus, en registre. */
export function danglingRegister(lang: Lang, lines: readonly DanglingLine[]): Register {
  return {
    head: tableHead([
      text(lang, 'action'),
      text(lang, 'reason'),
      text(lang, 'impact'),
      text(lang, 'detected-at'),
    ]),
    rows: lines.map((line) =>
      registerRow(
        [line.verificationName, line.reasonLabel, String(line.impact), line.detectedAt],
        line.state,
      ),
    ),
  };
}
