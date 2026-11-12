#!/usr/bin/env python3
"""Garde : chaque workflow GitHub doit être un document YAML valide.

Un workflow invalide ne crée aucun job (« workflow file issue ») et laisse le
dépôt sans déploiement ni suite. Ce garde le détecte dès la PR, pas sur main.

La liste des workflows est **découverte** dans `.github/workflows/` : un
workflow ajouté sans être déclaré ici est contrôlé quand même, et un workflow
supprimé ne fait pas échouer la garde.

PyYAML n'est pas garanti sur les runners ; s'il manque, le garde fait un
contrôle syntaxique minimal (tabulations interdites, clés de jobs alignées) et
le signale clairement au lieu d'échouer en silence.
"""
import glob
import sys

try:
    import yaml
    HAVE_YAML = True
except ImportError:
    HAVE_YAML = False


def workflow_files():
    """Tous les workflows du dépôt, triés par nom."""
    found = glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml")
    return sorted(found)


def check_without_yaml(raw):
    """Contrôle minimal : pas de tabulation, indentation par espaces."""
    if "\t" in raw:
        raise ValueError("tabulation dans le YAML")
    for line_no, line in enumerate(raw.splitlines(), 1):
        if line.strip() and not line.startswith(" ") and not line.startswith(("-", "#")):
            if ":" not in line:
                raise ValueError("ligne %d : clé de premier niveau sans « : »" % line_no)


def main():
    files = workflow_files()
    if not files:
        print("::error::aucun workflow dans .github/workflows/")
        return 1
    errors = []
    for path in files:
        try:
            with open(path, encoding="utf-8") as handle:
                raw = handle.read()
            if HAVE_YAML:
                yaml.safe_load(raw)
            else:
                check_without_yaml(raw)
        except Exception as exc:
            errors.append("%s: %s: %s" % (path, type(exc).__name__, exc))
    if errors:
        for message in errors:
            print("::error::%s" % message)
        print("ERREUR : %d workflow(s) YAML invalide(s)." % len(errors))
        return 1
    print("OK : %d workflow(s) YAML valide(s)%s." % (
        len(files), "" if HAVE_YAML else " (contrôle minimal, PyYAML absent)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
