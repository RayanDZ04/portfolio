# Rayan Benhabiles - Portfolio interactif

Portfolio bilingue (FR / EN) construit dans la direction artistique de mon CV : fond blanc, cadre fin périwinkle, bandeau plein, nom en capitales légères, typographie Inter.

**HTML, CSS et JavaScript vanilla, sans framework ni étape de build.**

## Ce qu'il contient

| Section | Interaction |
|---|---|
| Hero | Le cadre du CV se dessine, le nom s'écrit lettre par lettre, terminal animé |
| Tikiya | Onglets Admin / Organisateur / **la vraie app Flutter compilée pour le web**, dans un téléphone |
| Rust OS | Simulation interactive d'un ordonnanceur adaptatif (curseur de charge) |
| AREA | Flux action → réaction animé |
| Rick 7533 | Galerie interactive du jeu de plateforme Unreal Engine 5 (C++ / Blueprints) |
| Compétences | Cliquer une compétence liste les projets où elle est utilisée |
| Partout | Bascule FR / EN (mémorisée, `?lang=en` possible), filtres, lightbox, copie de l'e-mail |

Accessibilité : navigation clavier, onglets ARIA, contrastes AA, `prefers-reduced-motion` respecté, cibles tactiles ≥ 44 px.

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000 (il faut un serveur : l'app Flutter ne se charge pas en `file://`).

## Déployer sur GitHub Pages

1. Pousser ce dossier à la racine du dépôt.
2. Settings → Pages → *Deploy from a branch* → `main` / `root`.

Le fichier `.nojekyll` est déjà présent.

## Structure

```
index.html
css/style.css            tokens de design + composants
js/i18n.js               tous les textes FR / EN
js/main.js               interactions
assets/img/              captures (WebP) et logos
assets/cv/               CV PDF FR et EN
projects/tikiya-app/     build web de l'app Flutter + demo-api/events (données fictives)
```

## Régénérer les démos

App Flutter (depuis `Tikiya/App_mobile`) :

```bash
flutter build web --release --base-href /projects/tikiya-app/ --dart-define=API_BASE_URL=/projects/tikiya-app/demo-api
```

Copier ensuite `build/web` dans `projects/tikiya-app/` (sans le dossier `canvaskit`, chargé depuis le CDN de Google) et garder `demo-api/`.

> Si le site est publié dans un sous-dossier (`username.github.io/portfolio/`), adapter `--base-href` et `API_BASE_URL` en `/portfolio/projects/tikiya-app/…`.

Les captures des dashboards Tikiya ont été réalisées avec des données de démonstration.
