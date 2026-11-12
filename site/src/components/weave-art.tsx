/**
 * Le dessin de la trame : la toile, les fils, les mailles, le trou, la
 * perforation, le fil détendu.
 *
 * Schéma écrit à la main en SVG dans la page — aucune image, aucun fichier
 * externe. Les formes portent le sens (plein, vide, barré, interrompu) : la
 * couleur n'est jamais le seul signal (§22).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';

/** Les quatre fils de chaîne et leurs repères. */
const WARPS = [
  { x: 90, label: 'AC-1' },
  { x: 175, label: 'AC-2' },
  { x: 260, label: 'AC-3' },
  { x: 345, label: 'AC-4' },
];

/** Les trois passages de trame ; le dernier s'arrête avant le bout. */
const WEFTS = [
  { y: 120, label: 'testShouldWeave', to: 410 },
  { y: 195, label: 'testShouldCountHoles', to: 410 },
  { y: 270, label: 'testShouldShowZones', to: 300 },
];

/** Les mailles : `mesh` pleine, `hole` vide, `perforation` barrée. */
type MeshKind = 'mesh' | 'hole' | 'perforation';

interface Mesh {
  x: number;
  y: number;
  kind: MeshKind;
}

const MESHES: Mesh[] = [
  { x: 90, y: 120, kind: 'mesh' },
  { x: 175, y: 120, kind: 'mesh' },
  { x: 260, y: 120, kind: 'mesh' },
  { x: 345, y: 120, kind: 'mesh' },
  { x: 90, y: 195, kind: 'mesh' },
  { x: 175, y: 195, kind: 'mesh' },
  { x: 260, y: 195, kind: 'perforation' },
  { x: 345, y: 195, kind: 'hole' },
  { x: 90, y: 270, kind: 'mesh' },
  { x: 175, y: 270, kind: 'mesh' },
];

function MeshCell({ mesh }: { mesh: Mesh }): ReactElement {
  const size = 20;
  const left = mesh.x - size / 2;
  const top = mesh.y - size / 2;
  if (mesh.kind === 'mesh') {
    return <rect x={left} y={top} width={size} height={size} className="weave-mesh weave-mesh--full" />;
  }
  if (mesh.kind === 'hole') {
    return (
      <rect
        x={left}
        y={top}
        width={size}
        height={size}
        className="weave-mesh weave-mesh--empty"
        strokeDasharray="4 3"
      />
    );
  }
  return (
    <g className="weave-mesh weave-mesh--broken">
      <rect x={left} y={top} width={size} height={size} />
      <path d={`M${left + 3} ${top + size - 3} L${left + size - 3} ${top + 3}`} />
    </g>
  );
}

export function WeaveArt(): ReactElement {
  return (
    <svg
      className="weave-art"
      viewBox="0 0 560 340"
      role="img"
      aria-label="Four warp threads crossed by three weft passes: the cells are meshes, one cell is empty (a hole), one is slashed (a perforation), and the last pass stops before the end (a loose thread)."
    >
      <g className="weave-art__warp">
        {WARPS.map((warp) => (
          <line key={warp.label} x1={warp.x} y1={60} x2={warp.x} y2={305} />
        ))}
      </g>
      <g className="weave-art__weft">
        {WEFTS.map((weft) => (
          <line key={weft.label} x1={55} y1={weft.y} x2={weft.to} y2={weft.y} />
        ))}
      </g>
      <g className="weave-art__meshes">
        {MESHES.map((mesh) => (
          <MeshCell key={`${mesh.x}-${mesh.y}`} mesh={mesh} />
        ))}
      </g>
      <g className="weave-art__labels">
        {WARPS.map((warp) => (
          <text key={warp.label} x={warp.x} y={45} textAnchor="middle">
            {warp.label}
          </text>
        ))}
        {WEFTS.map((weft) => (
          <text key={weft.label} x={420} y={weft.y - 10}>
            {weft.label}
          </text>
        ))}
      </g>
    </svg>
  );
}
