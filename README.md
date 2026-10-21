# heymartin.xyz

Osobní portfolio – statický web (čisté HTML + CSS + JS, žádný build, žádné závislosti), přepsaný z Frameru pro **GitHub Pages**.

Živě: <https://heymartin.xyz>

## Struktura

```
.
├── index.html      # obsah stránky
├── style.css       # design tokeny (dark/light), typografie, layout, komponenty
├── script.js       # přepínač tématu, klávesa „C“ = kopie e-mailu, ticker, zvuky
├── 404.html        # stránka pro neexistující adresy
├── robots.txt      # pravidla pro vyhledávače
├── sitemap.xml     # mapa webu (1 stránka)
├── CNAME           # vlastní doména pro GitHub Pages (heymartin.xyz)
├── .nojekyll       # vypne Jekyll, GitHub Pages servíruje soubory tak, jak jsou
└── assets/
    ├── fonts/          # Geist Mono (woff2)
    ├── icons/          # arrow, moon, sun, x, threads, instagram, letterboxd (SVG)
    ├── logos/          # loga do tickeru (SVG)
    ├── profile-photo/
    ├── selected-work/
    ├── stack/
    ├── writing/
    ├── last-played/
    ├── last-watched/
    └── latest-news/
```

## Co upravit

| Co | Kde |
|---|---|
| E-mail, který se kopíruje po stisku „C“ | `script.js` → konstanta `EMAIL` |
| Položky (ikona, název, popis, odkaz) | `index.html` – každá položka je jeden blok `<a class="item">` |
| Barvy (dark / light) | `style.css` → `:root[data-theme="dark" / "light"]` |
| Zvuky (zap/vyp, hlasitost, téma) | `script.js` → objekt `SOUND` |
| Rychlost tickeru | `style.css` → `.ticker-track { animation: ticker 32s … }` (větší číslo = pomaleji) |

## Funkce

- **Dark / Light** – přepínač vpravo nahoře, volba se pamatuje v `localStorage`; výchozí hodnota podle systému.
- **Klávesa `C`** kdekoliv na webu zkopíruje e-mail a zobrazí „Copied! ✓“ (na dotykových zařízeních tlačítko s ikonou kopírování). Nereaguje na `Ctrl/Cmd + C`.
- **Hover na položce** – rozbalí se popis a zobrazí se linka vlevo.
- **Ticker s logy** – směr doleva, při najetí zpomalí na 0.5×.
- **Přístupnost** – skip link, popisky „opens in a new tab“ pro čtečky, respektuje `prefers-reduced-motion`.
- **SEO / sdílení** – Open Graph + Twitter card, JSON-LD (Person), sitemap, robots.
- **Zvuky** – knihovna [cuelume](https://github.com/danielwh2/cuelume) načtená z esm.sh až po první interakci; pokud se nenačte, web funguje normálně bez zvuku. Volitelně lze knihovnu hostovat lokálně v `assets/vendor/cuelume.js` (skript ji zkusí načíst jako první, CDN je záloha).
- Písmo **Geist Mono** je self-hosted (`assets/fonts/`, řezy Regular a Medium), žádné externí fonty.

## Nasazení na GitHub Pages

1. Na GitHubu vytvoř nový repozitář (např. `heymartin.xyz` nebo `portfolio`), **public**.
2. Nahraj obsah této složky (index.html, style.css, script.js, CNAME, .nojekyll, README.md, složku `assets/`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:<tvuj-uzivatel>/<repo>.git
   git push -u origin main
   ```
3. V repozitáři: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. Za minutu až dvě bude web na `https://<tvuj-uzivatel>.github.io/<repo>/`.

## Nastavení domény heymartin.xyz

U registrátora domény (DNS) nastav:

| Typ | Název (host) | Hodnota |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA *(volitelné)* | `@` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `<tvuj-uzivatel>.github.io` |

Pak v repozitáři **Settings → Pages → Custom domain** zadej `heymartin.xyz` (soubor `CNAME` v repu to už obsahuje), počkej na ověření DNS a zaškrtni **Enforce HTTPS**.

> Šíření DNS může trvat od několika minut po pár hodin. Aktuální IP adresy GitHubu ověř v [dokumentaci](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
> Pokud na starém Framer webu `designtogether.framer.website` ponecháš stejný obsah, nezapomeň ho po přepnutí domény zrušit/přesměrovat.
