# Campus Info Hub

## 1. Ce este o resursă (resource)?

În aplicația mea, o resursă reprezintă o entitate din campus (bibliotecă, cantină, spațiu de studiu, eveniment).

Resursele sunt definite în fișierul `resources.json` și conțin:
- id
- name
- type
- location
- program
- tags
- details

Datele sunt încărcate dinamic în pagina principală folosind `fetch()`.

---

## 2. Exemplu de URI și componente

Exemplu de URI:

/pages/library.html#schedule

Componente:
- /pages/ → folder
- library.html → resursa (pagina Bibliotecii)
- #schedule → fragment (ancoră) care duce la secțiunea Program

Alt exemplu:
/data/resources.json

- /data/ → folder date
- resources.json → colecție de resurse (API local)

---

## 3. Părți statice și dinamice

### Statice:
- Paginile library.html, cafeteria.html, events.html
- Structura HTML
- Stilizarea CSS

### Dinamice:
- Încărcarea datelor din JSON
- Filtrare după text, tip, tag
- Modal de detalii
- Favorite (localStorage)
- Schimbare temă dark/light

---

## 4. Tipul aplicației

Aplicația este hibridă (document-centric + interactive).

Document-centric:
- Are pagini separate pentru fiecare resursă.
- Navigare prin URI-uri clasice.

Interactive:
- Date încărcate dinamic.
- Filtrare live.
- Modal fără reîncărcarea paginii.
- Salvare favorite.
- Schimbare temă.

Componenta interactivă este dominantă în pagina principală.
