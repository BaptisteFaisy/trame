# Captures — le site public et sa démo

Ces images ne sont pas des maquettes : ce sont des captures d'écran du **site public**
<https://tradoooo.github.io/trame/>, prises le **2026-11-13** sur `main` @
**`7c468f7`** (428 tests verts).

## Ce que ces captures sont — et ne sont pas

**Ce qu'elles sont.** Le site public n'est pas une brochure : sa section `#demo` exécute le
**vrai moteur** de l'app (`src/domain`, `src/sample`, `src/i18n`) dans le navigateur. Les
chiffres visibles — 24 critères écrits, 18 vérifiables, 4 infalsifiables, 13/18 couverts
déclarés, 1 provisoire — sont calculés à l'affichage par ces modules, pas écrits à la main.
Ils tombent juste : 24 = les 6 tickets du projet semé (`DEMO_TICKETS`, `src/sample/demo-project.ts`)
× 4 critères.

**Ce qu'elles ne sont pas.** Ce ne sont **pas** des captures des écrans Forge rendus dans
Jira. L'entrée UI Kit 2 n'est pas branchée : `@forge/react` v10 n'expose pas `render`, donc
l'écran Jira n'est pas rendable hors instance. Les illustrations « les onze écrans » de la
section `#screens` sont, comme le dit le site lui-même, dessinées à la main dans la page —
aucune capture d'interface Forge n'existe ici. Toute image de ce dossier qui laisserait
croire à un écran Jira serait un faux : il n'y en a pas.

## Les fichiers

Source de toutes les images : `https://tradoooo.github.io/trame/` (aucun build local n'a été
nécessaire — le site en ligne a rendu correctement, HTTP 200). Outil : **Chrome headless**
(`google-chrome --headless=new`), **profil `/tmp` isolé** (`--user-data-dir=/tmp/chrome-trame-captures`),
sans prise de focus, largeur 1440 px.

| Fichier | Taille | Plage capturée (y) | Ce qu'on voit |
| --- | --- | --- | --- |
| `01-site-entier.png` | 1 549 446 o (1440×12432) | 0 → 12 432 (page entière) | Le site complet, du héro à la recette : en-tête, `#top`, `#problem`, `#weave`, `#demo`, `#screens`, `#limits`, `#architecture`, `#recipe`. |
| `02-demo.png` | 276 052 o (1440×2200) | 2 401 → 4 601 | La démo vivante : sélecteurs *Ticket* / *Criterion* (« Whole project »), les 8 compteurs (24 / 18 / 4 / 13-18 / 1, trous, prouvés, perforations, fils détendus), les trois axes, le début du tableau des trous classés par le métré. |
| `03-ecrans.png` | 226 390 o (1440×2200) | 7 762 → 9 962 | « The eleven screens » : les cartes 1 à 9 lisibles (weave map, criterion sheet, hole explorer, perforation register, loose threads, weave bulletin, certificate, validation queue, risk zones) et le début de la 10. |
| `04-trame.png` | 227 764 o (1440×2200) | 1 269 → 3 469 | « The metaphor » : le schéma de tissage dessiné (AC-1 à AC-4 × `testShouldWeave`, `testShouldCountHoles`, `testShouldShowZone`), la légende fil de chaîne / passage de trame / maille / trou / perforation / fil détendu, puis le haut de la démo. |
| `05-architecture.png` | 297 534 o (1440×2129) | 10 303 → 12 432 (fin de page) | « The architecture in ten lines » (les 10 points), les quatre chemins de liaison, les documents du dépôt, puis `#recipe` et le pied de page. |

Les sections ne font pas toutes 2200 px de haut : `#weave` (1132 px), `#screens` (1659 px) et
`#architecture` (1186 px) tiennent dans la fenêtre, donc la fin de chaque image montre le
début de la section suivante. La colonne « plage capturée » donne les pixels exacts : rien
n'est rogné ni recomposé. `#demo` mesure 5361 px — `02-demo.png` n'en montre que le haut.

Le site choisit sa langue d'après `navigator.language` (`src/i18n/index.ts`) : les captures
sont en **anglais**, la langue que voit un visiteur quelconque, la plus fréquente pour un
jury Codegeist. Le projet semé reste en français — le site le dit lui-même, les gloses
anglaises ne servent qu'à l'affichage.

## Comment refaire ces images

La page entière, telle quelle :

```sh
/usr/bin/google-chrome --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
  --user-data-dir=/tmp/chrome-trame-captures --lang=en-US \
  --window-size=1440,6000 --virtual-time-budget=12000 \
  --screenshot=docs/captures/01-site-entier.png https://tradoooo.github.io/trame/
```

Pour une section, attention : `--screenshot` avec une URL à ancre (`.../#demo`) rend **le haut
de la page**, pas l'ancre — les quatre captures d'ancres produites ainsi étaient identiques à
l'octet près. Les images 02 à 05 ont donc été prises en pilotant le même Chrome par le
protocole DevTools (port de débogage local, `Page.captureScreenshot` avec un `clip` à
l'offset de la section, `captureBeyondViewport`). Les offsets sont ceux du tableau ci-dessus,
mesurés sur la page chargée ; ils bougeront si le contenu du site change.

Le garde `python3 tools/check-file-limits.py` n'audite que `.ts .tsx .js .jsx .mjs .py .yml
.yaml .md` : les `.png` ne le font pas échouer.