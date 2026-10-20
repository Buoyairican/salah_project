# Specialty assignment (built by CI2 RST, adaptable to any major) — V2 deployment guide

This release adds a **management interface** for the coordinator (tomader.mazri@uit.ac.ma) to the existing Apps Script web app, and refreshes the student page. When the coordinator opens the usual web-app link, she lands on the management interface; students keep seeing the waiting page until she opens the student dashboard from that interface.

| File | What it is |
|---|---|
| `Code.gs` | Server. The existing file, extended. Every new or changed block is marked `[V2]`. |
| `Admin.html` | **New.** Management interface (single file, inline CSS/JS). Includes a demo mode. |
| `Dashboard.html` | Student page, updated (see [§10](#10-what-students-will-notice)). |
| `DEPLOYMENT.md` | This guide. |

> Tip: search for `[V2]` in the Apps Script editor to find every change.

---

## 1. Before you start (5 minutes)

1. **Back up the spreadsheet:** *File → Make a copy*. Keep the copy untouched.
2. **Back up the script:** in the Apps Script editor, copy the current `Code.gs` and `Dashboard.html` into a text file (or rely on *Project history*, but a copy is faster to restore).
3. **Check the time zone:** *Project Settings → Time zone* must be **(GMT+01:00) Casablanca** (`Africa/Casablanca`). Deadlines are entered and displayed in this zone.
4. Make sure you are signed in with the **account that owns the script** (the one that deployed the current web app).

## 2. Install the files

In the spreadsheet: *Extensions → Apps Script*.

1. **`Code.gs`** — select all, delete, paste the new `Code.gs`, save (Ctrl/Cmd + S).
2. **`Dashboard`** — open the existing `Dashboard` HTML file, select all, delete, paste the new `Dashboard.html`, save.
3. **`Admin`** — click **+ → HTML**, name it exactly **`Admin`** (the editor adds `.html`), paste `Admin.html`, save.

The file names matter: `doGet` serves `Admin` and `Dashboard` by name.

## 3. Run `setupSheets` once

In the editor toolbar, choose the function **`setupSheets`** and click **Run**.

- Google asks for authorization the first time. Accept. The script needs: the spreadsheet (read/write), your e-mail address (to recognise users), and **sending e-mail as you** (only used by the optional reminders).
- It creates, if missing: `Historique`, `Journal`, `Departage`, `Surcharges` (with headers) and writes **`Email`** in `Responses!C1` if that cell is empty.
- It does **not** write any setting: an absent script property means its default (page closed, no deadline, no lock, 12 / 26, students without choices placed last, the administrator listed in the code). It **removes** properties left at their default value by an earlier version (for example `STUDENT_PAGE_OPEN=false`, `MIN_SEATS=12`), so no old value can stay fixed. Run it again after updating the code.
- It never overwrites an existing sheet, header or property. Running it again logs *« Rien à faire : tout est déjà en place. »*
- If `Preferences` does not have one choice column per specialty (only possible after editing `SPECIALTIES` by hand), it reshapes the sheet to the current list and says so. Use the interface instead (§7, *Using the tool for another major*): it converts the saved rankings properly.

## 4. Run `selfTest`

Choose **`selfTest`** and click **Run**, then open *Execution log*. It uses a synthetic 70-student class in memory (no sheet is touched) and must print six `PASS` lines:

```
PASS — (a) règles de 12 à 26 étudiants par filière : chaque filière entre son plancher (18, 18, 18) et son maximum
PASS — (a) règles de 20 à 30 étudiants par filière : …
PASS — (a) règles de 12 à 24 étudiants par filière : …
PASS — (a) règles Cybersécurité au moins 12, sans maximum ; Réseaux Mobiles de 15 à 26 ; … : …
PASS — (b) 64 étudiants : affectation entre meilleur et pire cas, SECURE = 1er choix
PASS — (c) allocate_ déterministe (deux exécutions, ordre des lignes inversé)
selfTest : tout est correct.
```

If any line says `FAIL`, stop here and roll back (§9).

## 5. Deploy a new version (keeps the same link)

*Deploy → Manage deployments* → select the **existing** web-app deployment → ✏️ **Edit** →
- **Version:** *New version* (description: `V2 – interface de gestion`)
- **Execute as:** *Me* (the owner)
- **Who has access:** *Anyone within Université Ibn Tofail* (the uit.ac.ma domain)

→ **Deploy**. The URL does not change, so links already sent to students keep working.

> Do **not** create a *new* deployment: that would produce a different URL.

**Saving the code is not enough.** The `/exec` link runs the *version* it was deployed with; script properties, on the other hand, are shared by every version. If you paste new code and run `setupSheets` but forget *New version*, students and the `/exec` interface keep running the old code, which writes the old values back. So, every time you update the code:
1. Deploy a new version as above, then check that *Manage deployments* shows the new version number and today's date.
2. Archive any other web-app deployment, so no old link keeps running old code.
3. Always open the interface through the **`/exec`** link. The `/dev` link (*Test deployments*) runs the saved code, which students don't see; the interface warns you if you use it.
4. The interface's sidebar shows *Version du code* (`APP_VERSION` in `Code.gs`): check it matches the version you just pasted.
5. Students who had the page open before the update must reload it once.

**Nothing changes for students at this point:** `STUDENT_PAGE_OPEN` is absent (page closed), so they see the same waiting message.

## 6. Check that it works

| Who | Open the web-app link | Expected |
|---|---|---|
| Coordinator (tomader.mazri@uit.ac.ma) | | **Management interface**: ENSA Kénitra logo, “Affectation des spécialités”, *Université Ibn Tofail · CI2* |
| A student account | | Waiting message: *« Vous pourrez bientôt choisir vos options de spécialité sur cette page. »* (it turns into the dashboard by itself, within a minute, once you open the page) |
| A uit.ac.ma account that is **not** in `Responses` | | *« Accès non autorisé »* card, **even while the page is closed**, with the address used. It turns into the waiting page or the dashboard by itself once the student is added to the list |
| A non-uit.ac.ma Google account | | *« Connexion requise »* page |

Then, in the management interface:
1. **Qualité des données** → check *Étudiants chargés = 70 / 70* and that no line is listed under *Lignes écartées*.
2. Same page → **Tester une adresse de connexion** with two or three real student addresses. Each must say *« Connexion acceptée : NOM Prénom »*. If one says *ambiguë* or *aucune correspondance*, fill that student's address in **column C (`Email`) of `Responses`** — an exact e-mail match always wins.
3. **Journal des actions** is empty — every change you make from now on is recorded there with your address.
4. **Live updates:** with a student account in a private window, open the link. Switch the student page on and off and add then remove an announcement: within a minute (or on *Actualiser*), the student's tab must follow each change without being reloaded.
5. **Qualité des données → Réglages enregistrés:** after re-running `setupSheets`, nothing should be marked *Inutile*.

## 7. Running the campaign (coordinator's checklist)

The bar under the header shows the campaign phase: *Préparation → Choix ouverts → Choix clos → Affectation figée → Résultats publiés*.

| Step | Where | What to do |
|---|---|---|
| 1. Prepare | **Calendrier & accès** | Set the **deadline** (date + time, Morocco time). Optionally post an **announcement** (≤ 400 characters, *Information* or *Avertissement*). Choose what happens to students **without choices** (*placed last automatically* — default — or *left for a manual decision*). |
| 2. Open | **Calendrier & accès → Page étudiante** | Switch it on. Students now see their dashboard. Share the link shown under the switch. |
| 3. Monitor | **Vue d'ensemble**, **Étudiants** | Participation, provisional allocation per branch, demand vs. each branch's places, satisfaction, students without choices. Click any student for their detail: what they see, their history, why they get their branch. |
| 4. Remind | **Rappels par e-mail** | Needs column C (`Email`) of `Responses` filled. Edit the message (`{nom}`, `{date_limite}`, `{lien}` are replaced per student; grades are never included), type `ENVOYER` to confirm. Stops automatically at Google's daily quota. |
| 5. Close | **Résultats officiels → 1** or **Calendrier & accès → Clôture manuelle** | Or simply let the deadline pass. Students can no longer save. |
| 6. Ties | **Affectation & égalités** | Only *decisive* ties (where the order changes someone's branch) need you. Set the order with the arrows, give a reason, save. Without a decision, alphabetical order applies. |
| 7. Exceptions | Student detail | **Modifier les choix** (e.g. choices sent by e-mail; allowed even when closed) or **Imposer une filière** (placed before everyone; the branch's maximum is still respected). Both require a reason and are journaled. |
| 8. Freeze | **Résultats officiels → 2** | Creates a sheet `Affectation_YYYYMMDD_HHmm` with rank, name, grade, choices, branch, choice rank, origin and a French comment — exactly what the interface shows. It is protected with a warning (you can still edit it by hand if the jury decides so). |
| 9. Publish | **Résultats officiels → 3** | Pick the frozen sheet, type `PUBLIER`. Each student sees their official branch (read from that sheet). While published, re-opening choices, editing choices and forcing a branch are blocked (*« Dépubliez d'abord les résultats. »*). **Dépublier** undoes it. |

### Settings, administrators and other majors (*Paramètres*)

The tool was built for CI2 RST, but nothing in it is specific to RST any more. In **Paramètres**, an administrator sets:

- **Administrateurs**: add an `@uit.ac.ma` address, or remove one with the bin icon. You cannot remove your own address (ask another administrator), and an address that belongs to a student of the official list is refused. Changes take effect immediately and are journaled.
- **Nom de la formation** (default `CI2`): shown after *Université Ibn Tofail* in the header of both pages, in the browser tab title, the “not on the list” message and the reminder e-mails.
- **Effectif attendu**: the class size the *Étudiants chargés* check compares with (70 for RST).
- **Spécialités proposées**: **2 to 4** names. Rename one in place, remove it with the bin icon (*Rétablir* undoes it before saving), or add one. Students always rank every specialty, so the student page shows one drop-down per specialty.

Before saving, the page shows the effect on saved rankings, and the confirmation lists every change. On save, under the script lock:

| Change | Saved rankings (`Preferences`) | `Historique` | `Surcharges` |
|---|---|---|---|
| Rename | Same position, new name | Renamed in every row | Renamed (its own places follow it too) |
| Add | New specialty placed **last** in every complete ranking | One `SPECIALITES` row per ranking changed | — |
| Remove | Removed; the order of the others is kept | One `SPECIALITES` row per ranking changed | Refused while a forced assignment targets it |

Saving is refused while results are published (only the name stays editable), when the list would make the places impossible (e.g. the remaining maximums total fewer places than students — raise a maximum first in *Places par filière*), or when another administrator changed the list in the meantime. Frozen `Affectation_` sheets are never rewritten; one frozen with an old list can no longer be published (freeze a new one). If the choices are closed when you add or remove a specialty, re-open them if students should be able to review their ranking.

The footer of every page shows **“Conçu et développé par les étudiants de la filière RST”**. It is written in the code, so it stays whatever the course name.

### Places per specialty (*Places par filière*)

Each specialty has its own **minimum** and **maximum**; an empty maximum means **no maximum**. By default every specialty has 12 to 26. Seeing the demand (the first-choice count is shown next to each specialty), the coordination can, for example, leave *Cybersécurité* without a maximum while keeping a minimum of 12 in the others: the 70 students are then placed in merit order, each in their best choice, as long as the students still to be placed are enough to fill the minimums.

1. Change the numbers. Under each specialty the page shows how many students it would get (*« Recevra de 18 à 46 étudiants »*) and checks the totals (maximums ≥ students, minimums ≤ students).
2. **Simuler**: same calculation as the real allocation, nothing saved. It shows the new numbers per specialty, the satisfaction, and every student who would change branch.
3. **Appliquer ces places**: the provisional allocation is recalculated at once. Change them again at any time (until the allocation is frozen); *Valeurs en vigueur* reloads the current ones, *Par défaut* puts 12 to 26 everywhere.

Specialties with the same values share the common minimum/maximum (`MIN_SEATS`/`MAX_SEATS`); only those that differ are stored, in `SEAT_LIMITS`. A renamed specialty keeps its places; a removed one loses them; an added one gets the common values. A forced assignment counts against its specialty's maximum. Students no longer see places or projections, only their rank (see §10).

**Exports** (*Résultats officiels → Exports CSV*, and buttons on other pages) open directly in French Excel: UTF-8, `;` separator, decimal comma, grades rounded to 2 decimals and written in quotes (`"17,74"`), so an import that also splits on commas can no longer shift the columns. In **LibreOffice**, the Text Import dialog ticks Tab, Comma and Semicolon by default: tick **Semicolon only**, set **Language** to *French*, keep the string delimiter `"` and leave *Format quoted field as text* unticked, otherwise grades arrive as text. If your browser blocks the download inside the Apps Script page, use *Afficher le contenu* in the notification and copy it.

## 8. Reference

### Script properties (*Project Settings → Script properties*)

**Rule: an absent property means the default.** The interface only stores a property while a setting is *active*: turning a setting off, removing it, or setting it back to its default **deletes** the property. So nothing can stay stuck at an old value, and a default changed in the code is never masked by an old copy.

| Property | Present when | Absent means | Notes |
|---|---|---|---|
| `ADMIN_EMAILS` | the administrator list differs from the code's (comma-separated) | the administrator listed in the code (`tomader.mazri@uit.ac.ma`) | Managed in *Paramètres → Administrateurs*. Case-insensitive. |
| `STUDENT_PAGE_OPEN` | the page is open (`true`) | page closed: students see the waiting message | Closing the page deletes it. Saves are refused while closed. |
| `CHOICES_DEADLINE` | a deadline is set (`YYYY-MM-DD HH:mm`) | no deadline | Script time zone. An unreadable value locks the choices. |
| `CHOICES_LOCKED` | the manual lock is on (`true`) | no manual lock | Unlocking deletes it. |
| `MIN_SEATS`, `MAX_SEATS` | the common minimum / maximum differs from 12 / 26 | 12 / 26 | Set in *Places par filière*. |
| `SEAT_LIMITS` | some specialties have their own places (JSON, e.g. `{"Cybersécurité":{"min":12,"max":null}}`; `null` = no maximum) | every specialty uses the common minimum / maximum | Set in *Places par filière*. Unreadable entries are ignored and flagged. |
| `UNDECIDED_POLICY` | `MANUAL` | `LAST` (placed last automatically) | |
| `ANNOUNCEMENT` | an announcement is online | no announcement | Removed by *Retirer* or by saving an empty message. |
| `FROZEN_SHEETS` | at least one allocation was frozen | none | Sheets deleted by hand are dropped from the list at the next freeze. |
| `PUBLISHED_SHEET` | results are published | not published | Unpublishing deletes it. |
| `PUBLIC_URL` | you add it by hand (`https://…`) | the web-app URL | Link used in reminder e-mails. |
| `PROGRAM_NAME` | the course name differs from `CI2` | `CI2` | Set in *Paramètres*. |
| `SPECIALTIES` | the list differs from the 3 RST specialties (JSON array, e.g. `["A","B","C","D"]`) | Cybersécurité, Réseaux Mobiles, Systèmes Ubiquitaires | Set in *Paramètres*, which also converts saved rankings. An unreadable value (not 2–4 distinct names) **locks the choices** and is flagged. |
| `CLASS_SIZE` | the expected class size differs from 70 | 70 | Used by the *Étudiants chargés* check only. |

*Qualité des données → Réglages enregistrés* lists the properties currently set, flags any that are useless (default value, empty or unreadable) and removes them in one click.

Prefer the interface over editing these by hand: it validates values and writes to the journal. If you do edit them in *Project Settings → Script properties*, **reload that settings page first**: a settings page opened before a change made in the interface still shows the old values, and saving it can write them back.

### Sheets

| Sheet | Content | Written by |
|---|---|---|
| `Responses` | A `Nom`, B `Note`, **C `Email`** (optional; header must read `Email`) | You (official list) |
| `Preferences` | One row per student: Nom, `Choice_1`…`Choice_n` (one per specialty), Timestamp | Students, admin |
| `Historique` | Timestamp, Nom, `Choice_1`…, Source (`ETUDIANT`/`ADMIN`/`SPECIALITES`), Auteur — one row per change. Never fewer choice columns than specialties; after a removal the extra column stays (old rows keep their data) | Script (append-only) |
| `Journal` | Timestamp, Admin, Action, Détails | Script (append-only) |
| `Departage` | Note, Rang, Nom, Raison, Admin, Timestamp | Interface |
| `Surcharges` | Nom, Filière, Raison, Admin, Timestamp, Actif (`OUI`/`NON`) | Interface |
| `Affectation_YYYYMMDD_HHmm` | One per freeze: Rang, Nom, Note, `Choix 1`…`Choix n`, Filière affectée, Rang du choix obtenu, Origine, Commentaire | Interface |

**Origin codes** in exports and frozen sheets: `ALGO` merit order · `TIEBREAK` tie decided by the coordination · `MANUAL` forced assignment · `AUTO` no choices, placed automatically.

### How a student is identified

1. **E-mail first.** The signed-in address is looked up in **column C of `Responses`, whose header must read `Email`** (case and hyphen ignored: `EMAIL`, `E-mail`). If a row has that address, that row wins.
2. **Then first name and surname.** Otherwise, the part before `@` is split on `.` and `_` (digits ignored), and the pieces are looked up in the `Nom` column, among rows **without** an e-mail (a row that already has an address is never given to another account). Each piece must be a whole word of the name, or several consecutive words written together (`mohamed.elamrani` → *EL AMRANI Mohamed*, `salaheddine.moujahid` → *MOUJAHID Salah Eddine*). Exactly one name must match. Only if no name matches that way does the previous, looser rule apply (each piece contained anywhere in the name), so every address accepted before is still accepted, for the same student.

Addresses in any other column, or under another header in C1 (`Adresse électronique`, `Courriel`…), are not read: students are then matched by name only. *Qualité des données → Colonne Email (C)* shows how many addresses are used, or says what to write in C1.

Invalid addresses (not `@uit.ac.ma`), addresses used on two rows, or an administrator's address are ignored and listed under *Qualité des données*. The coordinator's account is recognised **before** any matching, everywhere.

### Security

- Every `admin…` server function re-checks the caller's address against `ADMIN_EMAILS` and throws *« Accès refusé. »* otherwise. Hiding the page is not relied on.
- Students only ever receive their own data plus anonymous totals; names, grades and individual choices are sent to administrators only.
- Free text written to sheets is protected against formula injection; CSV exports too.
- `setupSheets` and `selfTest` can only be run by an administrator or by the script owner from the editor.

## 9. Rollback

1. *Deploy → Manage deployments → Edit →* **Version:** pick the previous version → *Deploy*. Students immediately get the previous behaviour.
2. If you also want the old code in the editor, paste back your backup of `Code.gs` and `Dashboard.html` and delete `Admin`.

The new sheets and properties are harmless for the old version; you can leave them.

## 10. What students will notice

When the page is opened, students see:

- their grade, their saved choices and the deadline;
- **Classement**: their rank by grade, e.g. **#4 sur 70 étudiants** (students with the same grade share the rank, and the page says *« Ex æquo avec 1 autre étudiant »*);
- the demand per branch (how many ranked each branch 1st, 2nd, …);
- **the coordination's announcement**, when there is one, and **their official result** once published.

They **no longer** see a projection (*Sécurisé*, *Incertain*, *Repli stable*), the reliability card (students without choices or tied ahead of them), the *Prévisualiser l'affectation* button or the number of places per branch: the coordination adjusts the places while watching the demand, so any projection would be misleading. A short notice says that the coordination sets the places and publishes the results.

## 11. Demo mode (no Google account needed)

Open `Admin.html` or `Dashboard.html` directly in a browser: without `google.script.run` they run on built-in fictitious data and nothing is saved.

- `Admin.html?scenario=campagne` (default) · `preparation` · `cloture` · `publie` · `anomalies` — add `&fail=action` to simulate a server error, `&delay=1500` for latency.
- `Dashboard.html?mock=SECURE` (rank #4) · `FALLBACK_SECURED` (#31) · `VULNERABLE` (#25, tied) · `NO_CHOICES` · `LOCKED` · `ADMIN` · `DENIED` · `CLOSED` · `PUBLISHED` (+ `&absent=1`) — add `&annonce=info|warning` for an announcement. `deadline`, `locked`, `skew`, `fail=load|poll|save`, `poll` and `delay` still work.

## 12. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| A student sees *« Accès non autorisé »* (*« Votre adresse … ne correspond à aucun étudiant … »*), even before the page is open | Use *Tester une adresse de connexion*. Fix the spelling of the name in `Responses`, or put the student's exact address in column C (`Email`). |
| A student says “the page is not open yet” | `STUDENT_PAGE_OPEN` is off: switch it on in *Calendrier & accès*. Pages already open switch to the dashboard within a minute (or when the student clicks *Actualiser*). |
| A setting looks stuck (a property is still there after turning it off) | Reload *Project Settings* (it shows a snapshot). Check *Qualité des données → Réglages enregistrés*: it shows what is really stored and removes useless values. Re-run `setupSheets` after updating the code. |
| *« Serveur occupé, réessayez dans quelques secondes. »* | Many simultaneous saves; the script lock waited 10 s. Retry. |
| Reminders say *Service d'envoi indisponible* | Run any function once from the editor and accept the e-mail permission. |
| *« Dépubliez d'abord les résultats. »* | Expected while results are published. Unpublish first (*Résultats officiels → 3*). |
| A CSV opens with every column after `Note` shifted one place right | The file was exported before the CSV fix: its grades were unquoted and the import also split on commas (`17,74` → `17` \| `74`). Deploy the current code (new version) and export again; splitting lost leading zeros (`16,09` → `16` \| `9`), so don't repair old files by hand. With old files, import with *Semicolon* as the only separator. |
| A student is listed under *Lignes écartées* | Empty name, duplicate name or unreadable grade on that line of `Responses`. The student cannot log in until it is fixed. |
| Students get *« Erreur de lecture de la liste officielle »* on saving, and *Qualité des données* says *Feuille Preferences à remettre en forme* | `SPECIALTIES` was edited by hand to a different number of specialties. Open *Paramètres*, check the list and save it (or run `setupSheets`). Rankings saved with the old count have to be redone. |
| Choices are closed with *« liste des spécialités illisible »* | `SPECIALTIES` was edited by hand and is not 2–4 distinct names. Save the right list in *Paramètres*. |
| The admin sees the students' waiting message | Their address is not in the administrator list (*Paramètres → Administrateurs*), or they are signed in with another Google account. |

## 13. Assumptions and decisions

The requirements file ended after section 8; sections 9 (admin UI), 10 (mock), 11 (Dashboard changes) and 12 (this guide) were referenced but missing. They were inferred from sections 4–8. Other open points, decided as follows:

1. **A closed page is a live state, not an error.** *(The identity check now comes first: a uit.ac.ma account that does not match exactly one student gets `{access: 'DENIED', message}` whether the page is open or not, so unlisted students find out — and can ask for a fix — before the campaign starts. If the official list cannot be read while the page is closed, the waiting page is shown.)* Students always receive the dashboard page. While `STUDENT_PAGE_OPEN` is absent, `getDashboardState` returns `{access: 'CLOSED', message, announcement}` (nothing else) and the page shows the unchanged waiting text plus the current announcement. It keeps refreshing every minute, so it switches to the dashboard when the page opens and back to the waiting text when it closes, and a removed announcement disappears from tabs already open. `previewOdds` and `saveChoices` still refuse calls while closed. Administrators are always checked first.
2. **Publication locks choices.** The effective lock (`locked`) is true while results are published, so students get the usual *« Les choix sont clos »* message rather than *« Dépubliez d'abord »*, which only makes sense to administrators. Publishing itself requires the lock *without* counting the publication (manual lock or deadline passed).
3. **E-mail column**: column C of `Responses`, used only when C1 reads `Email` (case, spaces and hyphen ignored). `setupSheets` writes `Email` there if C1 is empty. Otherwise matching is by name only, as before. (V2.7 looked for the column anywhere; at the owner's request it is fixed to C again.)
4. **Rows with a valid e-mail are matched by e-mail only** (not by name pieces). Invalid, duplicated or administrator addresses are ignored for that row, which falls back to name matching, and are listed in *Qualité des données*.
5. **“Name ascending”** for ties uses the same accent/case-insensitive comparison as matching (`squash_`), with the raw name as a final tie-breaker.
6. **A tie-break is “resolved” only if it lists every current member** of the tie. If the group changed since (e.g. a grade was corrected), it is shown as *Départage incomplet*; listed members still go first, others follow alphabetically.
7. **`TIEBREAK`** relabels only `ALGO` students of a resolved decisive tie (forced and automatic placements keep their origin).
8. **`remaining`** (students still to place) counts every student not yet placed, including those without choices, under both policies — so `MANUAL` does not change the merit outcome of others.
9. **Forced assignments beyond a branch's maximum** (possible only if the maximum was lowered by hand) are ignored by the calculation and reported (*Qualité des données*, *Points d'attention*). `adminSetRules` refuses a maximum below the number of forced assignments in that branch. The “would exceed the maximum” check counts forced assignments only — forcing someone into a branch filled by merit bumps its last merit admission, by design.
10. **Bubble:** “last admitted” counts merit/tie-break admissions only; “first rejected” excludes forced students.
11. **Freezing twice in the same minute** is refused (the sheet name would collide). Frozen sheets get a warning-only protection. Only the 10 newest are listed in `FROZEN_SHEETS`; older sheets are kept.
12. **Reminders** are sent *outside* the script lock (sending dozens of e-mails would otherwise block student saves for many seconds); the journal row is written under the lock. They are refused when choices are closed. Plain text, sender name *Coordination* + the course name (e.g. *Coordination CI2 RST*), reply-to the administrator.
13. **`adminSetChoicesFor` with identical choices** is a no-op: nothing written, no journal row.
14. **Published sheet deleted by hand:** students see no official result (rather than “you are missing from the list”), and the problem is logged.
15. **Participation timeline:** hourly buckets when first saves span ≤ 48 h, daily otherwise. Saves made before V2 have no history, so their `Preferences` timestamp is used (that is the *last* save, an approximation).
16. **Ambiguous names** (health) are detected heuristically: two names where every word of one appears as a whole word in the other, among rows without an e-mail (e.g. *ALAMI Salma* / *ALAMI Salma Fatima*; no longer *BERRADA Aya* / *BERRADA Yassine*).
17. **Extra response fields** beyond the contract (all JSON-safe, additive): `config.deadlineInvalid`, `config.studentUrl`, `results.frozen[].exists`, `roster[].email/reason/forcedReason/forcedBranch`, `attention.pending[].assigned/email`, `attention.ties[].stale/reason/by/at` and member `choiceRank/source/rank`, `health.invalidPreferences/staleOverrides/forcedOverflow/staleTieBreaks`, `badEmails[].why`, `adminExplainStudent().email/forced`, `history[].author`, `adminWhatIf().changed[].fromRank/toRank`, `adminWhatIf().same`, `config.rules.perBranch[]` (`min`, `max`/`null`, `own`, `floor`, `ceiling`), `config.rules.limitsInvalid`, `adminTestEmail().isAdmin/domainOk`, `adminPreviewReminders().available/reason`, `adminSendReminders().sent/failed/skipped`.
18. **Student page.** Restyled at the owner's request. Since V2.8 it shows the rank (`ranking: {rank, total, tied}`) instead of `projection` and `coverage`, which are no longer sent to students; `previewOdds` was removed, and `getDashboardState` ignores its old argument. The projection still exists for the administration (student statuses, student detail).
19. **Number of specialties: 2 to 4.** The projection (now shown to administrators only) explores every order in which undecided and tied students ahead could choose. Its worst case (everyone ahead undecided) takes about 0.03 s with 3 specialties, 0.2 s with 4 and 3 s with 5 on a laptop; uncapping specialties raises it a little (1.6 s → 2.6 s in the emulator with 4 specialties, two of them without maximum). 5 or more is still refused. With identical places for every specialty the calculation is unchanged.
20. **Rankings are converted, never dropped.** Adding a specialty appends it to every complete ranking rather than invalidating it, so no student silently becomes “without choices”; the conversion is logged per student (`SPECIALITES`). A specialty removed and re-added under the same name (case and accents ignored) in one save counts as kept.
21. **The RST credit is fixed.** It is a constant (`BUILT_BY_TEXT`) shown on every page, independent of `PROGRAM_NAME`.
22. **Places per specialty.** A specialty's guaranteed size is `max(its minimum, students − sum of the others' maximums)`; its largest possible size is `min(its maximum, students − sum of the others' minimums)`. Students are still placed in merit order: when the students left are all needed to fill the minimums, a better-graded student takes their next feasible choice before lower-graded students who ranked it first (e.g. with 50 / 18 / 2 first choices, *Cybersécurité* without maximum and 12 minimum elsewhere: 46 / 12 / 12).

## 14. How this release was tested

The code was exercised outside Google's runtime, in a Node.js emulation of the Apps Script services (Sheets, Properties, Cache, Lock, Session, Mail, Utilities):

- **Unchanged without per-specialty places:** 12 random classes (36 to 70 students, ties, students without choices, both policies, various common minimums and maximums) run through the code of the previous version and this one: allocation, ranks, sources, satisfaction, administrator statuses and simulations are identical — 4,014 fields compared, 0 differences.
- **`selfTest`** passes (now also with a specialty without maximum and one with its own minimum).
- **246 assertions** on routing, access control (every `admin…` function refuses students and anonymous callers), each endpoint, the publication guards, CSV format (no unquoted decimal anywhere), e-mail matching, the student rank (each of 70 students = 1 + number of strictly higher grades; ties share it), reminders and quota, journal paging, JSON-safety of every response, and absence of formulas in written cells.
- **Places par filière:** 50 server assertions — the 50 / 18 / 2 case (46 / 12 / 12 with *Cybersécurité* uncapped, worked out by hand), storage (only differing specialties), return to defaults, refusals (min > max, totals), forced assignments against a specialty's maximum, rename / removal / addition of a specialty, hand-edited `SEAT_LIMITS`, and 35 random classes where every specialty stays between its floor and its maximum — plus 25 browser assertions (simulate, apply, overview, mobile, demo, student rank).
- **Paramètres:** 119 server assertions and 55 browser assertions on both pages while the list changes under an open page.
- **Student identification:** 42 server assertions (column C read only when C1 is `Email`; e-mail first, then first name and surname; rows that already have an address are never given to another account; compound and hyphenated names) and 10 browser assertions on *Qualité des données*. On 210 generated names, every one of the 576 addresses the V2.6 rule accepted still maps to the same student.
- **Both pages driven in Chromium** against the emulated server (not only their demo data): every tab, dialogs, tie-break, places per specialty, close → freeze → publish, export download, then the student's official result.

It has **not** been run on Google's servers. Steps 4 and 6 above are the first real-environment checks; do them before opening the page to students.
