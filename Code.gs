const DOMAIN = 'uit.ac.ma';
const SHEET_NAME = 'Responses';          // Feuille officielle : Col A = Nom, Col B = Note, [V2] Col C = Email (optionnelle)
const EMAIL_COLUMN_INDEX = 2;            // [V2] colonne C de Responses…
const EMAIL_HEADER = 'Email';            // …intitulée « Email » : adresse cherchée avant le nom
const PREFERENCES_SHEET = 'Preferences'; // Choix en clair : Nom, Choice_1, Choice_2, Choice_3, Timestamp

// --- Règles d'affectation ---
// [V2] Spécialités par défaut (propriété SPECIALTIES absente). La liste en vigueur est chargée à chaque
// lecture des propriétés (applyProgram_) : toute la logique lit BRANCHES, jamais cette constante.
const DEFAULT_BRANCHES = ['Cybersécurité', 'Réseaux Mobiles', 'Systèmes Ubiquitaires'];
let BRANCHES = DEFAULT_BRANCHES.slice(); // [V2] spécialités en vigueur pour cette exécution
const MIN_SEATS = 12;  // minimum obligatoire par filière ([V2] valeur par défaut de la propriété MIN_SEATS)
const CLASS_SIZE = 70; // effectif officiel de la promo CI2 RST ([V2] défaut de la propriété CLASS_SIZE)
const MAX_SEATS = 26;  // plafond maximal strict par filière fixé par la coordination ([V2] défaut de MAX_SEATS)
const SEAT_VALUE_MAX = 999; // [V2] borne de saisie d'un minimum ou d'un maximum

// --- [V2] Formation : nom affiché (propriété PROGRAM_NAME) et bornes de la liste des spécialités ---
const DEFAULT_PROGRAM_NAME = 'CI2';
const PROGRAM_NAME_MAX_LENGTH = 40;
const BRANCH_NAME_MAX_LENGTH = 60;
const MIN_BRANCHES = 2;
const MAX_BRANCHES = 4; // projection au pire cas (page étudiante, statuts de l'administration) : 0,03 s à 3 filières, 0,2 s à 4, 3 s à 5
// [V2] Signature de l'équipe qui a conçu l'outil : fixe, indépendante du nom de la formation
const BUILT_BY_TEXT = 'Conçu et développé par les étudiants de la filière RST';
let PROGRAM = { name: DEFAULT_PROGRAM_NAME, classSize: CLASS_SIZE, branchesInvalid: false }; // [V2] cf. applyProgram_

// --- Clôture des choix : Paramètres du projet > Propriétés du script ---
const DEADLINE_PROPERTY = 'CHOICES_DEADLINE';
const LOCKED_PROPERTY = 'CHOICES_LOCKED';

const SNAPSHOT_CACHE_KEY = 'snapshot_v9'; // [V2] v9 : colonne Email = C, en-tête « Email »
const SNAPSHOT_CACHE_SECONDS = 30;
const SAVE_COOLDOWN_SECONDS = 5;
const MAX_TIE_GROUP = 4;
const LOCK_WAIT_MS = 10000;

// [V2] Messages qui citent la formation ou les spécialités : fonctions (valeurs de l'exécution en cours)
function noGradeMessage_() {
  return 'Accès refusé : votre adresse institutionnelle ne correspond à aucun étudiant inscrit sur la liste officielle ' + PROGRAM.name + '.';
}
function invalidChoicesMessage_() {
  return 'Classez les ' + BRANCHES.length + ' filières (' + BRANCHES.join(', ') + '), chacune une seule fois.';
}
const DESYNC_MESSAGE = "Erreur de lecture de la liste officielle. Veuillez contacter l'administrateur.";
const LOCKED_MESSAGE = "Les choix sont clos : plus aucune modification n'est acceptée.";

// =========================================================================
// [V2] ADMINISTRATION : CONSTANTES
// =========================================================================

// Administrateurs : propriété ADMIN_EMAILS (séparées par des virgules), sinon cette liste
const DEFAULT_ADMIN_EMAILS = ['tomader.mazri@uit.ac.ma'];
const ADMIN_LIST_MAX = 20; // [V2] administrateurs ajoutés depuis l'interface

const ADMIN_EMAILS_PROPERTY = 'ADMIN_EMAILS';
const STUDENT_PAGE_OPEN_PROPERTY = 'STUDENT_PAGE_OPEN';
const MIN_SEATS_PROPERTY = 'MIN_SEATS';
const MAX_SEATS_PROPERTY = 'MAX_SEATS';
const UNDECIDED_POLICY_PROPERTY = 'UNDECIDED_POLICY';
const ANNOUNCEMENT_PROPERTY = 'ANNOUNCEMENT';
const PROGRAM_NAME_PROPERTY = 'PROGRAM_NAME';
const SPECIALTIES_PROPERTY = 'SPECIALTIES';
const CLASS_SIZE_PROPERTY = 'CLASS_SIZE';
const SEAT_LIMITS_PROPERTY = 'SEAT_LIMITS'; // [V2] minimum / maximum propres à certaines spécialités (JSON)
const FROZEN_SHEETS_PROPERTY = 'FROZEN_SHEETS';
const PUBLISHED_SHEET_PROPERTY = 'PUBLISHED_SHEET';
const PUBLIC_URL_PROPERTY = 'PUBLIC_URL';

const HISTORY_SHEET = 'Historique';
const JOURNAL_SHEET = 'Journal';
const TIEBREAK_SHEET = 'Departage';
const OVERRIDES_SHEET = 'Surcharges';
const ALLOCATION_SHEET_PREFIX = 'Affectation_';

// [V2] Preferences et Historique ont une colonne par spécialité : en-têtes construits à la demande (sheetHeaders_)
const SHEET_HEADERS = {
  [JOURNAL_SHEET]: ['Timestamp', 'Admin', 'Action', 'Détails'],
  [TIEBREAK_SHEET]: ['Note', 'Rang', 'Nom', 'Raison', 'Admin', 'Timestamp'],
  [OVERRIDES_SHEET]: ['Nom', 'Filière', 'Raison', 'Admin', 'Timestamp', 'Actif']
};
// Colonnes au format texte brut (évite qu'un « 12/26 » devienne une date)
const SHEET_TEXT_COLUMNS = {
  [JOURNAL_SHEET]: [2, 3, 4],
  [TIEBREAK_SHEET]: [3, 4, 5],
  [OVERRIDES_SHEET]: [1, 2, 3, 4, 6]
};
// [V2] Feuilles Affectation_ : Rang, Nom, Note, Choix 1..n, puis ces colonnes (allocationHeaders_)
const ALLOCATION_TAIL_HEADERS = ['Filière affectée', 'Rang du choix obtenu', 'Origine', 'Commentaire'];

const TALLY_CACHE_KEY = 'status_tally_v1';
const TALLY_CACHE_SECONDS = 60;
const OFFICIAL_CACHE_KEY = 'official_v1';
const OFFICIAL_CACHE_SECONDS = 60;

const ANNOUNCEMENT_MAX_LENGTH = 400;
const REASON_MAX_LENGTH = 500;
const FROZEN_SHEETS_MAX = 10;
const TIE_PERMUTATION_LIMIT = 5;
const UNDECIDED_POLICIES = ['LAST', 'MANUAL'];
const SOURCES = ['ALGO', 'TIEBREAK', 'MANUAL', 'AUTO'];
// [V2] Historique : origine d'un classement (SPECIALITES = mis à jour après un changement de la liste)
const HISTORY_SOURCES = ['ETUDIANT', 'ADMIN', 'SPECIALITES'];

const APP_VERSION = 'V2.9 (2026-10-20)'; // [V2] affichée dans l'interface : vérifie que /exec sert la bonne version
const WAITING_TEXT = 'Vous pourrez bientôt choisir vos options de spécialité sur cette page.';
const ACCESS_DENIED_MESSAGE = 'Accès refusé.';
const UNPUBLISH_FIRST_MESSAGE = "Dépubliez d'abord les résultats.";
const ADMIN_NOT_STUDENT_MESSAGE = "Ce compte est un compte administrateur : il n'a pas de choix à prévisualiser ni à enregistrer. Utilisez l'interface de gestion.";
const PAGE_CLOSED_MESSAGE = "Le tableau de bord n'est pas encore ouvert aux étudiants.";
const REASON_REQUIRED_MESSAGE = 'Indiquez la raison de cette décision (obligatoire, elle est inscrite au journal).';

// =========================================================================
// ROUTAGE
// =========================================================================

function doGet(e) {
  // [V2] Routage par rôle : l'adresse est lue en premier.
  // Administrateur → Admin ; hors domaine → page d'erreur ; étudiant → Dashboard (ouvert ou en attente).
  const email = activeEmail_();
  const props = scriptProps_();

  if (isAdmin_(email, props)) {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Gestion des affectations - ' + PROGRAM.name)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (!email || !email.endsWith('@' + DOMAIN)) {
    return simplePage_('Connexion requise',
      '<h1 style="margin:0 0 12px;font-size:1.25rem;font-weight:600;color:#0f172a;">Connexion requise</h1>' +
      '<p style="margin:0;color:#334155;line-height:1.6;">Connectez-vous avec votre compte institutionnel <strong>@' +
      escapeHtml_(DOMAIN) + '</strong> pour accéder à cette page.</p>' +
      '<p style="margin:16px 0 0;font-size:.875rem;color:#64748b;line-height:1.6;">Si vous êtes déjà connecté(e) avec un autre compte Google, ' +
      'déconnectez-vous ou ouvrez une fenêtre de navigation privée, puis rouvrez le lien.</p>');
  }

  // [V2] Les étudiants reçoivent toujours le Dashboard. Page fermée : il affiche la page d'attente
  // (texte inchangé + annonce) et se met à jour seul, dans les deux sens, à chaque actualisation.
  return HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('Affectation de Spécialité - ' + PROGRAM.name)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// [V2] Petite page autonome (connexion requise) au style sobre de l'établissement
function simplePage_(title, innerHtml) {
  const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>' + escapeHtml_(title) + '</title></head>' +
    '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'font-family:Inter,system-ui,-apple-system,\'Segoe UI\',Roboto,sans-serif;background:#f1f5f9;color:#1e293b;padding:24px;box-sizing:border-box;">' +
    '<main style="max-width:560px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06);overflow:hidden;">' +
    '<div style="height:6px;background:linear-gradient(90deg,#0b2545,#1d4ed8);"></div>' +
    '<div style="padding:32px 28px;text-align:center;">' +
    '<div style="font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:#64748b;margin-bottom:16px;">Université Ibn Tofail · ' + escapeHtml_(PROGRAM.name) + '</div>' +
    innerHtml + '</div></main>' +
    // [V2] Signature de l'équipe de conception (fixe)
    '<p style="position:fixed;left:0;right:0;bottom:12px;margin:0;text-align:center;font-size:.72rem;color:#64748b;">' + escapeHtml_(BUILT_BY_TEXT) + '</p>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// =========================================================================
// IDENTIFICATION PAR NOM EN CLAIR & VERROUS
// =========================================================================

function squash_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Associe l'adresse @uit.ac.ma de l'étudiant connecté à son Nom officiel exact
 * dans la feuille Responses, et renvoie ce Nom en clair.
 */
function matchOfficialNameByEmail_(email, rows) {
  // [V2] Même règle qu'avant, factorisée dans namePieceMatches_ (exactement une correspondance)
  const matches = namePieceMatches_(email, rows);
  return matches.length === 1 ? matches[0] : null;
}

// [V2] Prénom et nom lus dans l'adresse : « salma.alami2@… » → ['salma', 'alami'] (séparateurs . et _)
function emailNamePieces_(email) {
  const local = String(email || '').split('@')[0];
  return local.split(/[._]+/).map(squash_).filter(function(p) { return p.length > 0; });
}

// [V2] Mots du Nom officiel : « EL AMRANI Mohamed » → ['el', 'amrani', 'mohamed']
function nameWords_(name) {
  return String(name || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/).filter(function(w) { return w.length > 0; });
}

// [V2] Le morceau est un mot du Nom, ou plusieurs mots consécutifs collés (« elamrani » = EL AMRANI)
function wordRunMatch_(piece, words) {
  for (let a = 0; a < words.length; a++) {
    let run = '';
    for (let b = a; b < words.length && run.length < piece.length; b++) {
      run += words[b];
      if (run === piece) return true;
    }
  }
  return false;
}

/**
 * [V2] Lignes dont le Nom contient le prénom et le nom lus dans l'adresse.
 * D'abord en mots entiers (« said.amine » désigne SAID Amine, pas SAIDI Amine) ; si aucune ligne
 * ne correspond ainsi, l'ancienne règle s'applique telle quelle (morceaux contenus dans le Nom).
 */
function namePieceMatches_(email, rows) {
  const pieces = emailNamePieces_(email);
  if (pieces.length === 0) return [];
  const whole = [];
  const loose = [];
  for (let i = 0; i < rows.length; i++) {
    const candidate = squash_(rows[i].h);
    if (!candidate) continue;
    const words = nameWords_(rows[i].h);
    if (pieces.every(function(p) { return wordRunMatch_(p, words); })) whole.push(rows[i].h);
    if (pieces.every(function(p) { return candidate.indexOf(p) !== -1; })) loose.push(rows[i].h); // Nom exact en clair
  }
  return whole.length ? whole : loose;
}

/**
 * [V2] Fonction unique d'identification d'un étudiant, utilisée par la connexion et par adminTestEmail.
 * 1) L'adresse est cherchée dans la colonne Email de Responses : la ligne qui la porte l'emporte.
 * 2) Sinon, le prénom et le nom lus dans l'adresse sont cherchés dans la colonne Nom, parmi les seules
 *    lignes sans e-mail : une ligne qui porte déjà une adresse n'est jamais attribuée à un autre compte.
 * Sans colonne Email (ou vide), seule l'étape 2 s'applique.
 */
function resolveStudent_(email, rows) {
  const target = String(email || '').toLowerCase().trim();
  const byEmail = [];
  const withoutEmail = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].e) {
      if (rows[i].e === target) byEmail.push(rows[i].h);
    } else {
      withoutEmail.push(rows[i]);
    }
  }
  if (byEmail.length) {
    return { email: target, verdict: byEmail.length === 1 ? 'OK' : 'AMBIGUOUS', via: 'EMAIL_COLUMN', matches: byEmail };
  }
  const names = namePieceMatches_(target, withoutEmail);
  return {
    email: target,
    verdict: names.length === 1 ? 'OK' : (names.length > 1 ? 'AMBIGUOUS' : 'NONE'),
    via: 'NAME_PIECES',
    matches: names
  };
}

function currentUserName_(snap, props) {
  const email = activeEmail_();
  // [V2] L'adresse de l'administrateur ne correspond à aucune ligne : contrôle AVANT l'appariement
  if (isAdmin_(email, props)) throw new Error(ADMIN_NOT_STUDENT_MESSAGE);
  if (!email.endsWith('@' + DOMAIN)) {
    throw new Error('Connectez-vous avec votre compte institutionnel @' + DOMAIN + '.');
  }
  // [V2] Colonne Email prioritaire, puis appariement par nom (resolveStudent_)
  const found = resolveStudent_(email, snap.rows);
  if (found.verdict !== 'OK') {
    throw new Error(noGradeMessage_());
  }
  return found.matches[0];
}

function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    // [V2] En-têtes de toutes les feuilles gérées (Preferences : même en-tête, une colonne par spécialité)
    const headers = sheetHeaders_(name);
    if (headers) {
      sh.appendRow(headers);
      formatManagedSheet_(sh, name);
    }
  }
  return sh;
}

// [V2] Preferences : Nom, Choice_1..n, Timestamp ; Historique : Timestamp, Nom, Choice_1..n, Source, Auteur
function choiceHeaders_(n) {
  const out = [];
  for (let k = 1; k <= n; k++) out.push('Choice_' + k);
  return out;
}

function sheetHeaders_(name) {
  if (name === PREFERENCES_SHEET) return ['Nom'].concat(choiceHeaders_(BRANCHES.length), ['Timestamp']);
  if (name === HISTORY_SHEET) return ['Timestamp', 'Nom'].concat(choiceHeaders_(BRANCHES.length), ['Source', 'Auteur']);
  return SHEET_HEADERS[name] || null;
}

function textColumns_(name, width) {
  // Historique : toutes les colonnes sauf l'horodatage
  if (name === HISTORY_SHEET) { const out = []; for (let c = 2; c <= width; c++) out.push(c); return out; }
  return SHEET_TEXT_COLUMNS[name] || [];
}

// [V2] Mise en forme des feuilles créées par le script : en-tête figé et colonnes texte
function formatManagedSheet_(sh, name) {
  try {
    const width = sheetHeaders_(name).length;
    sh.getRange(1, 1, 1, width).setFontWeight('bold');
    sh.setFrozenRows(1);
    textColumns_(name, width).forEach(function(col) {
      sh.getRange(1, col, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  } catch (e) {
    Logger.log('Mise en forme de ' + name + ' impossible : ' + e);
  }
}

function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    throw new Error('Serveur occupé, réessayez dans quelques secondes.');
  }
  try {
    return fn();
  } finally {
    try { SpreadsheetApp.flush(); } catch (e) { Logger.log('Flush failed: ' + e); }
    lock.releaseLock();
  }
}

function normalizeChoices_(choices) {
  return normalizeChoicesIn_(choices, BRANCHES);
}

// [V2] Classement complet et sans doublon d'une liste donnée de spécialités (null sinon)
function normalizeChoicesIn_(choices, list) {
  if (!Array.isArray(choices) || choices.length !== list.length) return null;
  const out = [];
  for (let i = 0; i < choices.length; i++) {
    const c = (typeof choices[i] === 'string') ? choices[i].trim() : '';
    if (list.indexOf(c) === -1 || out.indexOf(c) !== -1) return null;
    out.push(c);
  }
  return out;
}

function sameChoices_(a, b) {
  return !!a && !!b && a.length === b.length && a.every(function(c, i) { return c === b[i]; });
}

function choicesLock_(props) {
  // [V2] props optionnel (lecture groupée des propriétés) ; champs ajoutés pour l'administration
  props = props || scriptProps_();
  const flag = String(props[LOCKED_PROPERTY] || '').trim().toLowerCase();
  const manual = flag !== '' && LOCK_OFF_VALUES.indexOf(flag) === -1;
  const published = !!publishedSheet_(props);
  const raw = String(props[DEADLINE_PROPERTY] || '').trim();
  const out = { deadline: null, locked: manual, manualLock: manual, deadlinePassed: false, deadlineInvalid: false, published: published };
  if (raw) {
    const d = parseDeadline_(raw);
    if (!d) {
      Logger.log(DEADLINE_PROPERTY + ' illisible : "' + raw + '" — choix verrouillés.');
      out.deadlineInvalid = true;
      out.locked = true;
    } else {
      out.deadline = d.toISOString();
      out.deadlinePassed = Date.now() >= d.getTime();
      out.locked = manual || out.deadlinePassed;
    }
  }
  // [V2] Liste des spécialités illisible : aucun classement ne doit être enregistré sur la liste de secours
  out.specialtiesInvalid = !!PROGRAM.branchesInvalid;
  if (out.specialtiesInvalid) out.locked = true;
  // [V2] Verrou hors publication (sert à décider si une publication est possible)
  out.baseLocked = out.locked;
  // [V2] Des résultats publiés verrouillent aussi les choix
  if (published) out.locked = true;
  return out;
}

function parseDeadline_(raw) {
  const tz = Session.getScriptTimeZone();
  let d = null;
  let m;
  try {
    let local = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      local = raw + ' 23:59:59';
    } else if ((m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2})?$/.exec(raw))) {
      local = m[1] + ' ' + m[2] + (m[3] || ':00');
    }
    if (local) {
      d = Utilities.parseDate(local, tz, 'yyyy-MM-dd HH:mm:ss');
      if (!isDate_(d) || Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm:ss') !== local) d = null;
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(raw)) {
      d = new Date(raw);
    }
  } catch (e) {
    d = null;
  }
  return isDate_(d) ? d : null;
}

// =========================================================================
// [V2] RÔLES, PROPRIÉTÉS ET PETITS UTILITAIRES
// =========================================================================

function activeEmail_() {
  try {
    return String(Session.getActiveUser().getEmail() || '').toLowerCase().trim();
  } catch (e) {
    return '';
  }
}

function scriptProps_() {
  const props = PropertiesService.getScriptProperties().getProperties() || {};
  applyProgram_(props); // [V2] formation et spécialités en vigueur : relues avec chaque lecture des propriétés
  return props;
}

// [V2] Charge la formation (nom, spécialités, effectif attendu) à partir des propriétés.
// Chaque requête Apps Script est une exécution distincte : ces valeurs ne survivent pas à la requête.
function applyProgram_(props) {
  const name = String(props[PROGRAM_NAME_PROPERTY] === undefined || props[PROGRAM_NAME_PROPERTY] === null ? '' : props[PROGRAM_NAME_PROPERTY])
    .replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, PROGRAM_NAME_MAX_LENGTH);
  const parsed = parseBranches_(props[SPECIALTIES_PROPERTY]);
  BRANCHES = parsed.list ? parsed.list : DEFAULT_BRANCHES.slice();
  PROGRAM = {
    name: name || DEFAULT_PROGRAM_NAME,
    classSize: parseSeats_(props[CLASS_SIZE_PROPERTY], CLASS_SIZE, CLASS_SIZE_PROPERTY) || CLASS_SIZE,
    branchesInvalid: parsed.invalid
  };
  return PROGRAM;
}

/**
 * [V2] Propriété SPECIALTIES : tableau JSON de noms (écrit par l'interface), ou liste séparée par « ; ».
 * Absente ou vide → liste par défaut. Illisible → liste par défaut ET choix verrouillés (cf. choicesLock_),
 * pour ne jamais enregistrer de classement sur une liste qui n'est pas celle voulue.
 */
function parseBranches_(raw) {
  const text = String(raw === undefined || raw === null ? '' : raw).trim();
  if (!text) return { list: null, invalid: false };
  let items = null;
  if (text.charAt(0) === '[') {
    const json = parseJson_(text);
    if (Array.isArray(json) && json.every(function(x) { return typeof x === 'string'; })) items = json;
  } else {
    items = text.split(/[;\n]/);
  }
  if (!items) return { list: null, invalid: true };
  const list = items.map(function(x) { return String(x).replace(/\s+/g, ' ').trim(); }).filter(function(x) { return x !== ''; });
  const problem = branchListProblem_(list);
  if (problem) Logger.log(SPECIALTIES_PROPERTY + ' invalide (' + problem + ') : liste par défaut, choix verrouillés.');
  return problem ? { list: null, invalid: true } : { list: list, invalid: false };
}

// Clé de comparaison de deux noms de spécialité : casse, accents et espaces ignorés
function branchKey_(name) {
  return String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

// [V2] Raison pour laquelle un nom de spécialité est refusé (null s'il est valable)
function branchNameProblem_(name) {
  if (!name) return 'nom vide';
  if (name.length > BRANCH_NAME_MAX_LENGTH) return '« ' + name.slice(0, 20) + '… » dépasse ' + BRANCH_NAME_MAX_LENGTH + ' caractères';
  // Écrit tel quel dans les feuilles : jamais de formule ; et jamais un nom réservé des objets JavaScript
  if (/^[=+\-@]/.test(name)) return '« ' + name + ' » ne peut pas commencer par =, +, - ou @';
  if (name in {} || name === '__proto__') return '« ' + name + ' » est un nom réservé';
  return null;
}

function branchListProblem_(list) {
  if (list.length < MIN_BRANCHES) return 'il faut au moins ' + MIN_BRANCHES + ' spécialités';
  if (list.length > MAX_BRANCHES) return MAX_BRANCHES + ' spécialités au plus';
  const seen = {};
  for (let i = 0; i < list.length; i++) {
    const p = branchNameProblem_(list[i]);
    if (p) return p;
    const k = branchKey_(list[i]);
    if (seen[k]) return '« ' + list[i] + ' » apparaît deux fois';
    seen[k] = true;
  }
  return null;
}

function sameList_(a, b) {
  return a.length === b.length && a.every(function(x, i) { return x === b[i]; });
}

function adminEmails_(props) {
  const raw = props ? props[ADMIN_EMAILS_PROPERTY] : PropertiesService.getScriptProperties().getProperty(ADMIN_EMAILS_PROPERTY);
  const list = String(raw || '').split(/[,;\s]+/)
    .map(function(s) { return s.toLowerCase().trim(); })
    .filter(function(s) { return s.length > 0; });
  return list.length ? list : DEFAULT_ADMIN_EMAILS.slice();
}

function isAdmin_(email, props) {
  const e = String(email || '').toLowerCase().trim();
  return e !== '' && adminEmails_(props).indexOf(e) !== -1;
}

// Toute fonction publique d'administration commence par cet appel : masquer la page ne protège rien
function requireAdmin_() {
  const email = activeEmail_();
  // [V2] scriptProps_ charge aussi la formation en vigueur avant toute autre lecture
  if (!isAdmin_(email, scriptProps_())) throw new Error(ACCESS_DENIED_MESSAGE);
  return email;
}

// setupSheets / selfTest : administrateur, ou propriétaire du script lancé depuis l'éditeur
function requireOwnerOrAdmin_() {
  const active = activeEmail_();
  let owner = '';
  try { owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase().trim(); } catch (e) { owner = ''; }
  if (isAdmin_(active, scriptProps_()) || (active !== '' && active === owner)) return active;
  throw new Error(ACCESS_DENIED_MESSAGE);
}

// [V2] Propriétés gérées par l'interface. Une propriété absente vaut sa valeur par défaut (définie ici,
// dans le code) : désactiver un réglage ou le remettre par défaut SUPPRIME la propriété, si bien
// qu'aucune ancienne valeur ne peut rester figée (ni masquer un changement des valeurs par défaut).
const MANAGED_PROPERTIES = [ADMIN_EMAILS_PROPERTY, STUDENT_PAGE_OPEN_PROPERTY, DEADLINE_PROPERTY, LOCKED_PROPERTY,
  MIN_SEATS_PROPERTY, MAX_SEATS_PROPERTY, UNDECIDED_POLICY_PROPERTY, ANNOUNCEMENT_PROPERTY,
  FROZEN_SHEETS_PROPERTY, PUBLISHED_SHEET_PROPERTY, PUBLIC_URL_PROPERTY,
  PROGRAM_NAME_PROPERTY, SPECIALTIES_PROPERTY, CLASS_SIZE_PROPERTY, SEAT_LIMITS_PROPERTY];
const LOCK_OFF_VALUES = ['false', '0', 'non', 'no', 'off'];

// Interrupteur : activé → 'true' ; désactivé → propriété supprimée
function setFlag_(key, on) {
  const store = PropertiesService.getScriptProperties();
  if (on) store.setProperty(key, 'true');
  else store.deleteProperty(key);
}

// Valeur égale à la valeur par défaut (ou vide) → propriété supprimée
function setOrDefault_(key, value, defaultValue) {
  const store = PropertiesService.getScriptProperties();
  const v = value === null || value === undefined ? '' : String(value);
  if (v === '' || v === String(defaultValue)) store.deleteProperty(key);
  else store.setProperty(key, v);
}

// Propriétés présentes mais inutiles : elles valent la valeur par défaut, ou sont vides / illisibles
// au point d'être ignorées. Une date limite illisible n'en fait pas partie (elle verrouille les choix).
function staleSettings_(props) {
  const out = [];
  const has = function(k) { return props[k] !== undefined && props[k] !== null; };
  const raw = function(k) { return String(props[k]).trim(); };
  if (has(ADMIN_EMAILS_PROPERTY)) {
    const list = adminEmails_({ [ADMIN_EMAILS_PROPERTY]: props[ADMIN_EMAILS_PROPERTY] }).slice().sort().join(',');
    if (!raw(ADMIN_EMAILS_PROPERTY) || list === DEFAULT_ADMIN_EMAILS.slice().sort().join(',')) out.push(ADMIN_EMAILS_PROPERTY);
  }
  if (has(STUDENT_PAGE_OPEN_PROPERTY) && !isTrue_(props[STUDENT_PAGE_OPEN_PROPERTY])) out.push(STUDENT_PAGE_OPEN_PROPERTY);
  if (has(LOCKED_PROPERTY) && (raw(LOCKED_PROPERTY) === '' || LOCK_OFF_VALUES.indexOf(raw(LOCKED_PROPERTY).toLowerCase()) !== -1)) out.push(LOCKED_PROPERTY);
  if (has(DEADLINE_PROPERTY) && raw(DEADLINE_PROPERTY) === '') out.push(DEADLINE_PROPERTY);
  if (has(MIN_SEATS_PROPERTY) && parseSeats_(props[MIN_SEATS_PROPERTY], MIN_SEATS, MIN_SEATS_PROPERTY) === MIN_SEATS) out.push(MIN_SEATS_PROPERTY);
  if (has(MAX_SEATS_PROPERTY) && parseSeats_(props[MAX_SEATS_PROPERTY], MAX_SEATS, MAX_SEATS_PROPERTY) === MAX_SEATS) out.push(MAX_SEATS_PROPERTY);
  if (has(UNDECIDED_POLICY_PROPERTY) && raw(UNDECIDED_POLICY_PROPERTY).toUpperCase() !== 'MANUAL') out.push(UNDECIDED_POLICY_PROPERTY);
  if (has(ANNOUNCEMENT_PROPERTY) && !announcement_(props)) out.push(ANNOUNCEMENT_PROPERTY);
  if (has(FROZEN_SHEETS_PROPERTY) && !frozenSheets_(props).length) out.push(FROZEN_SHEETS_PROPERTY);
  if (has(PUBLISHED_SHEET_PROPERTY) && !publishedSheet_(props)) out.push(PUBLISHED_SHEET_PROPERTY);
  if (has(PUBLIC_URL_PROPERTY) && !/^https:\/\//i.test(raw(PUBLIC_URL_PROPERTY))) out.push(PUBLIC_URL_PROPERTY);
  // [V2] Formation : valeur par défaut ou vide (une liste de spécialités illisible n'en fait pas partie)
  if (has(PROGRAM_NAME_PROPERTY) && (raw(PROGRAM_NAME_PROPERTY) === '' || raw(PROGRAM_NAME_PROPERTY) === DEFAULT_PROGRAM_NAME)) out.push(PROGRAM_NAME_PROPERTY);
  if (has(SPECIALTIES_PROPERTY)) {
    const b = parseBranches_(props[SPECIALTIES_PROPERTY]);
    if (!b.invalid && (!b.list || sameList_(b.list, DEFAULT_BRANCHES))) out.push(SPECIALTIES_PROPERTY);
  }
  if (has(CLASS_SIZE_PROPERTY) && parseSeats_(props[CLASS_SIZE_PROPERTY], CLASS_SIZE, CLASS_SIZE_PROPERTY) === CLASS_SIZE) out.push(CLASS_SIZE_PROPERTY);
  // [V2] Places par spécialité : aucune spécialité ne s'écarte des règles communes
  if (has(SEAT_LIMITS_PROPERTY)) {
    const r = rules_(props);
    const l = parseSeatLimits_(props[SEAT_LIMITS_PROPERTY]);
    if (!l.invalid && Object.keys(l.limits).every(function(b) { return l.limits[b].min === r.min && l.limits[b].max === r.max; })) out.push(SEAT_LIMITS_PROPERTY);
  }
  return out;
}

// Inventaire pour l'administration : valeur brute de chaque propriété gérée présente
function settingsReport_(props) {
  const stale = staleSettings_(props);
  return MANAGED_PROPERTIES.filter(function(k) { return props[k] !== undefined && props[k] !== null; }).map(function(k) {
    return { key: k, value: String(props[k]).slice(0, 300), stale: stale.indexOf(k) !== -1 };
  });
}

function isTrue_(v) {
  return ['true', '1', 'oui', 'yes', 'on'].indexOf(String(v === undefined || v === null ? '' : v).trim().toLowerCase()) !== -1;
}

function parseJson_(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function studentPageOpen_(props) {
  return isTrue_((props || scriptProps_())[STUDENT_PAGE_OPEN_PROPERTY]);
}

function assertStudentPageOpen_(props) {
  if (!studentPageOpen_(props)) throw new Error(PAGE_CLOSED_MESSAGE);
}

/**
 * [V2] Places par filière. Règles communes (MIN_SEATS / MAX_SEATS) pour toutes les spécialités, sauf
 * celles qui ont leurs propres minimum et maximum (SEAT_LIMITS ; maximum null = sans maximum).
 * Objet complet : {min, max, limits, mins, maxs} ; mins et maxs suivent l'ordre de BRANCHES
 * (Infinity = sans maximum). Sans SEAT_LIMITS, le calcul est exactement celui d'avant.
 */
function seatRules_(min, max, limits) {
  const own = {};
  const mins = [];
  const maxs = [];
  BRANCHES.forEach(function(b) {
    const l = limits && limits[b];
    if (l) own[b] = { min: l.min, max: l.max === null ? null : l.max };
    mins.push(l ? l.min : min);
    maxs.push(l ? (l.max === null ? Infinity : l.max) : max);
  });
  return { min: min, max: max, limits: own, mins: mins, maxs: maxs };
}

// Règles complètes à partir d'un objet {min, max[, limits]} (simulation, autotest) ou déjà complet
function fullRules_(rules) {
  if (!rules) return defaultRules_();
  if (rules.mins && rules.maxs && rules.mins.length === BRANCHES.length) return rules;
  return seatRules_(rules.min, rules.max, rules.limits);
}

function defaultRules_() {
  return seatRules_(MIN_SEATS, MAX_SEATS, null);
}

// Règles en vigueur : propriétés MIN_SEATS / MAX_SEATS (sinon les constantes) et SEAT_LIMITS
function rules_(props) {
  props = props || scriptProps_();
  let min = parseSeats_(props[MIN_SEATS_PROPERTY], MIN_SEATS, MIN_SEATS_PROPERTY);
  let max = parseSeats_(props[MAX_SEATS_PROPERTY], MAX_SEATS, MAX_SEATS_PROPERTY);
  if (min > max) {
    Logger.log('Règles incohérentes (min ' + min + ' > max ' + max + ') : valeurs par défaut utilisées.');
    min = MIN_SEATS;
    max = MAX_SEATS;
  }
  const parsed = parseSeatLimits_(props[SEAT_LIMITS_PROPERTY]);
  const rules = seatRules_(min, max, parsed.limits);
  rules.limitsInvalid = parsed.invalid;
  return rules;
}

// [V2] SEAT_LIMITS : {"Spécialité": {"min": 12, "max": 40 | null}} ; une entrée illisible est ignorée et signalée
function parseSeatLimits_(raw) {
  const out = { limits: {}, invalid: false };
  if (raw === undefined || raw === null || String(raw).trim() === '') return out;
  const obj = parseJson_(raw);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    Logger.log(SEAT_LIMITS_PROPERTY + ' illisible : ignorée.');
    out.invalid = true;
    return out;
  }
  Object.keys(obj).forEach(function(b) {
    const l = seatLimit_(obj[b]);
    if (BRANCHES.indexOf(b) === -1 || !l) {
      Logger.log(SEAT_LIMITS_PROPERTY + ' : entrée ignorée pour « ' + b + ' ».');
      out.invalid = true;
      return;
    }
    out.limits[b] = l;
  });
  return out;
}

// {min, max} : entiers de 0 à SEAT_VALUE_MAX, min ≤ max ; max vide ou null = sans maximum. Sinon null.
function seatLimit_(v) {
  if (!v || typeof v !== 'object') return null;
  const min = toInt_(v.min);
  const noMax = v.max === null || v.max === undefined || v.max === '';
  const max = noMax ? null : toInt_(v.max);
  if (min === null || min < 0 || min > SEAT_VALUE_MAX) return null;
  if (!noMax && (max === null || max < min || max > SEAT_VALUE_MAX)) return null;
  return { min: min, max: max };
}

function sumExcept_(values, skip) {
  let s = 0;
  values.forEach(function(v, k) { if (k !== skip) s += v; });
  return s;
}

// [V2] Effectif garanti de chaque filière : son minimum, ou ce que les autres filières ne peuvent pas accueillir
function floorsOf_(rules, N) {
  rules = fullRules_(rules);
  return rules.mins.map(function(m, k) { return Math.max(m, N - sumExcept_(rules.maxs, k)); });
}

// [V2] Effectif maximal possible : son maximum, ou ce qui reste une fois les minimums des autres assurés
function ceilingsOf_(rules, N) {
  rules = fullRules_(rules);
  return rules.maxs.map(function(m, k) { return Math.max(0, Math.min(m, N - sumExcept_(rules.mins, k))); });
}

// [V2] Règles transmises à l'interface (JSON : null = sans maximum)
function rulesOut_(rules, N) {
  rules = fullRules_(rules);
  const floors = floorsOf_(rules, N);
  const ceilings = ceilingsOf_(rules, N);
  return {
    min: rules.min,
    max: rules.max,
    perBranch: BRANCHES.map(function(b, k) {
      return {
        branch: b, min: rules.mins[k], max: isFinite(rules.maxs[k]) ? rules.maxs[k] : null,
        own: !!rules.limits[b], floor: floors[k], ceiling: ceilings[k]
      };
    })
  };
}

function rulesKey_(rules) {
  rules = fullRules_(rules);
  return JSON.stringify([rules.mins, rules.maxs.map(function(m) { return isFinite(m) ? m : null; })]);
}

// Règles applicables à N étudiants ? (liste des problèmes, vide si oui)
function rulesProblems_(rules, N) {
  rules = fullRules_(rules);
  const out = [];
  const totalMax = rules.maxs.reduce(function(a, b) { return a + b; }, 0);
  const totalMin = rules.mins.reduce(function(a, b) { return a + b; }, 0);
  if (totalMax < N) out.push('Places insuffisantes : les maximums totalisent ' + totalMax + ' places pour ' + N + ' étudiants. Des étudiants resteraient sans filière.');
  if (totalMin > N) out.push('Minimums impossibles : ils totalisent ' + totalMin + " étudiants, plus que l'effectif de " + N + '.');
  return out;
}

// Texte court pour le journal et les notifications
function describeRules_(rules) {
  rules = fullRules_(rules);
  const one = function(k) {
    return isFinite(rules.maxs[k]) ? 'de ' + rules.mins[k] + ' à ' + rules.maxs[k] : 'au moins ' + rules.mins[k] + ', sans maximum';
  };
  if (!Object.keys(rules.limits).length) return one(0) + ' étudiants par filière';
  return BRANCHES.map(function(b, k) { return b + ' ' + one(k); }).join(' ; ');
}

/**
 * [V2] Règles demandées par l'interface : {limits: {spécialité: {min, max | null}}} pour chaque spécialité,
 * ou {min, max} identiques pour toutes. Des valeurs identiques partout deviennent les règles communes ;
 * sinon chaque spécialité qui s'écarte des règles communes en vigueur garde ses propres valeurs.
 */
function requestedRules_(req, current) {
  req = req || {};
  if (req.limits && typeof req.limits === 'object') {
    const per = {};
    BRANCHES.forEach(function(b) {
      const l = seatLimit_(req.limits[b]);
      if (!l) throw new Error(b + ' : saisissez un minimum et un maximum entiers (0 ≤ minimum ≤ maximum ≤ ' + SEAT_VALUE_MAX + '), ou laissez le maximum vide pour « sans maximum ».');
      per[b] = l;
    });
    const first = per[BRANCHES[0]];
    const uniform = first.max !== null && BRANCHES.every(function(b) { return per[b].min === first.min && per[b].max === first.max; });
    if (uniform) return seatRules_(first.min, first.max, null);
    const limits = {};
    BRANCHES.forEach(function(b) {
      if (per[b].min !== current.min || per[b].max !== current.max) limits[b] = per[b];
    });
    return seatRules_(current.min, current.max, limits);
  }
  const min = toInt_(req.min), max = toInt_(req.max);
  if (min === null || max === null || min < 0 || min > max || max > SEAT_VALUE_MAX) {
    throw new Error('Règles invalides : saisissez des entiers avec 0 ≤ minimum ≤ maximum.');
  }
  return seatRules_(min, max, null);
}

// [V2] Enregistre les places propres aux spécialités (liste vide → propriété supprimée)
function saveSeatLimits_(limits, list) {
  const store = PropertiesService.getScriptProperties();
  const keep = {};
  (list || BRANCHES).forEach(function(b) { if (limits[b]) keep[b] = { min: limits[b].min, max: limits[b].max }; });
  if (Object.keys(keep).length) store.setProperty(SEAT_LIMITS_PROPERTY, JSON.stringify(keep));
  else store.deleteProperty(SEAT_LIMITS_PROPERTY);
}

function parseSeats_(raw, fallback, label) {
  const s = String(raw === undefined || raw === null ? '' : raw).trim();
  if (s === '') return fallback;
  if (!/^\d{1,3}$/.test(s)) {
    Logger.log(label + ' illisible : "' + s + '" — valeur par défaut ' + fallback + ' utilisée.');
    return fallback;
  }
  return Number(s);
}

function undecidedPolicy_(props) {
  const p = String((props || scriptProps_())[UNDECIDED_POLICY_PROPERTY] || '').trim().toUpperCase();
  return p === 'MANUAL' ? 'MANUAL' : 'LAST';
}

function announcement_(props) {
  const a = parseJson_((props || scriptProps_())[ANNOUNCEMENT_PROPERTY]);
  if (!a || typeof a.text !== 'string' || !a.text.trim()) return null;
  return {
    text: a.text.slice(0, ANNOUNCEMENT_MAX_LENGTH),
    level: a.level === 'warning' ? 'warning' : 'info',
    updatedAt: typeof a.updatedAt === 'string' ? a.updatedAt : null
  };
}

function frozenSheets_(props) {
  const list = parseJson_((props || scriptProps_())[FROZEN_SHEETS_PROPERTY]);
  if (!Array.isArray(list)) return [];
  return list.filter(function(f) { return f && typeof f.sheet === 'string' && f.sheet; })
    .map(function(f) {
      return { sheet: f.sheet, at: typeof f.at === 'string' ? f.at : null, by: typeof f.by === 'string' ? f.by : null };
    })
    .slice(0, FROZEN_SHEETS_MAX);
}

function publishedSheet_(props) {
  const p = parseJson_((props || scriptProps_())[PUBLISHED_SHEET_PROPERTY]);
  if (!p || typeof p.sheet !== 'string' || !p.sheet) return null;
  return { sheet: p.sheet, at: typeof p.at === 'string' ? p.at : null, by: typeof p.by === 'string' ? p.by : null };
}

function assertNotPublished_(props) {
  if (publishedSheet_(props)) throw new Error(UNPUBLISH_FIRST_MESSAGE);
}

function webAppUrl_() {
  try { return String(ScriptApp.getService().getUrl() || ''); } catch (e) { return ''; }
}

// [V2] Lien de test d'un projet Apps Script (exécute le code enregistré, réservé aux éditeurs)
function isDevUrl_(url) {
  return /\/dev(\?|$)/.test(String(url || ''));
}

// [V2] Identifiant de déploiement dans une URL /macros/s/<id>/exec
function deploymentId_(url) {
  const m = /\/macros\/(?:[^/]+\/)?s\/([^/]+)\//.exec(String(url || ''));
  return m ? m[1] : null;
}

function publicUrl_(props) {
  const custom = String((props || scriptProps_())[PUBLIC_URL_PROPERTY] || '').trim();
  return /^https:\/\//i.test(custom) ? custom : webAppUrl_();
}

function escapeHtml_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Texte libre saisi par un administrateur : caractères de contrôle retirés, longueur bornée
function cleanText_(v, max, label, multiline) {
  let s = String(v === undefined || v === null ? '' : v).replace(/\r\n?/g, '\n');
  s = multiline
    ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    : s.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  s = s.trim();
  if (s.length > max) throw new Error((label || 'Le texte') + ' ne doit pas dépasser ' + max + ' caractères.');
  return s;
}

function requireReason_(v) {
  const reason = cleanText_(v, REASON_MAX_LENGTH, 'La raison');
  if (!reason) throw new Error(REASON_REQUIRED_MESSAGE);
  return reason;
}

// Un texte commençant par =, +, - ou @ ne doit jamais devenir une formule
function sanitizeCell_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function gradeKey_(g) {
  return String(g);
}

function fmtGradeFr_(g) {
  return (typeof g === 'number' && isFinite(g)) ? g.toFixed(2).replace('.', ',') : '—';
}

function isoOrNull_(ms) {
  return (typeof ms === 'number' && isFinite(ms)) ? new Date(ms).toISOString() : null;
}

function toInt_(v) {
  if (typeof v === 'number') return (isFinite(v) && Math.floor(v) === v) ? v : null;
  const s = String(v === undefined || v === null ? '' : v).trim();
  return /^-?\d{1,6}$/.test(s) ? Number(s) : null;
}

function compareNames_(a, b) {
  const ka = squash_(a), kb = squash_(b);
  if (ka !== kb) return ka < kb ? -1 : 1;
  const ra = String(a), rb = String(b);
  return ra < rb ? -1 : (ra > rb ? 1 : 0);
}

function ordinalFr_(k) {
  // [V2] Autant de rangs que de spécialités
  return k === 1 ? '1er choix' : (k >= 2 && k <= BRANCHES.length ? k + 'e choix' : 'hors choix');
}

function capitalizeFr_(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function timeMs_(v) {
  if (isDate_(v)) return v.getTime();
  if (typeof v === 'string' && v.trim()) {
    const t = Date.parse(v);
    return isNaN(t) ? null : t;
  }
  return null;
}

// « vendredi 24 octobre 2026 à 18:00 » dans le fuseau du script
function fmtLocalFr_(ms, tz) {
  if (typeof ms !== 'number' || !isFinite(ms)) return 'non fixée';
  const d = new Date(ms);
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
    'septembre', 'octobre', 'novembre', 'décembre'];
  const dow = Number(Utilities.formatDate(d, tz, 'u'));
  const month = Number(Utilities.formatDate(d, tz, 'M'));
  return days[dow - 1] + ' ' + Utilities.formatDate(d, tz, 'd') + ' ' + months[month - 1] + ' ' +
    Utilities.formatDate(d, tz, 'yyyy') + ' à ' + Utilities.formatDate(d, tz, 'HH:mm');
}

function dayStart_(ms, tz) {
  const day = Utilities.formatDate(new Date(ms), tz, 'yyyy-MM-dd');
  return Utilities.parseDate(day + ' 00:00:00', tz, 'yyyy-MM-dd HH:mm:ss').getTime();
}

// =========================================================================
// DONNÉES : JOINTURE Responses (Nom, Note) ⇄ Preferences (Nom, Choix 1..3)
// =========================================================================

function isDate_(v) {
  return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
}

function toGrade_(v) {
  if (typeof v === 'number') return v;
  const s = String(v).trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}

function readRows_(sheet, width) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, width).getValues();
  while (values.length && values[values.length - 1].every(function(v) { return v === '' || v === null; })) {
    values.pop();
  }
  return values;
}

function desync_(detail) {
  Logger.log('Désynchronisation : ' + detail);
  throw new Error(DESYNC_MESSAGE);
}

// [V2] En-tête de la colonne Email (casse et tiret ignorés : « EMAIL », « E-mail »)
function isEmailHeader_(v) {
  return squash_(v) === squash_(EMAIL_HEADER);
}

function institutionalEmailPattern_() {
  return new RegExp('^[a-z0-9._%+\\-]+@' + DOMAIN.replace(/\./g, '\\.') + '$');
}

function cellEmail_(v) {
  return String(v === undefined || v === null ? '' : v).trim().toLowerCase();
}

/**
 * [V2] Feuille Responses : Nom (A), Note (B), Email (C). Renvoie {header, rows, email} ;
 * email = 2 (colonne C) si C1 vaut « Email », sinon -1 (identification par le nom seulement).
 */
function readResponses_(sheet) {
  const width = Math.max(1, Math.min(EMAIL_COLUMN_INDEX + 1, sheet.getMaxColumns()));
  const header = sheet.getLastRow() >= 1 ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  const rows = readRows_(sheet, width);
  const email = width > EMAIL_COLUMN_INDEX && isEmailHeader_(header[EMAIL_COLUMN_INDEX]) ? EMAIL_COLUMN_INDEX : -1;
  return { header: header, rows: rows, email: email };
}

/**
 * Lit la liste officielle dans Responses [Col A = Nom, Col B = Note, [V2] Col C = Email optionnelle]
 * et les vœux enregistrés dans Preferences [Col A = Nom en clair, Col B..D = Choix, Col E = Date].
 * [V2] diag (optionnel, réservé à l'administration) reçoit les anomalies de Preferences.
 */
function readSnapshot_(ss, diag) {
  const responsesSheet = ss.getSheetByName(SHEET_NAME);
  if (!responsesSheet) desync_('feuille ' + SHEET_NAME + ' introuvable');
  // [V2] Colonne Email : C, si son en-tête est « Email » (readResponses_)
  const official = readResponses_(responsesSheet);
  const responses = official.rows;
  const emailIndex = official.email;
  const emailColumn = emailIndex >= 0;
  // [V2] Colonnes de Preferences repérées par l'en-tête : Nom, Choice_1..n, Timestamp
  const prefsSheet = getOrCreateSheet_(ss, PREFERENCES_SHEET);
  const layout = prefsLayout_(prefsSheet);
  const prefs = readRows_(prefsSheet, layout.width);

  // Indexer les préférences par nom normalisé (squash_) pour tolérer la casse/espaces
  const saved = {};
  const prefLines = {}; // [V2] diagnostic : lignes Preferences par nom
  prefs.forEach(function(row, i) {
    const key = squash_(row[0]);
    const c = normalizeChoices_(row.slice(1, 1 + layout.choices));
    if (key) {
      (prefLines[key] = prefLines[key] || { name: String(row[0]).trim(), lines: [], valid: !!c }).lines.push(i + 2);
    }
    if (key && c) {
      const ts = row[layout.ts];
      saved[key] = { c: c, t: isDate_(ts) ? ts.getTime() : null };
    }
  });

  const rows = [];
  const seen = {};
  const skipped = []; // [V2] lignes écartées, visibles par l'administration
  const skip = function(line, why) {
    Logger.log('Ligne ' + line + ' écartée : ' + why);
    skipped.push({ line: line, why: why });
  };
  const emailPattern = institutionalEmailPattern_();
  const badEmails = [];
  const emailCount = {};

  for (let i = 0; i < responses.length; i++) {
    const line = i + 2;
    const officialName = String(responses[i][0] || '').trim();
    const key = squash_(officialName);
    const grade = toGrade_(responses[i][1]);

    if (!key) { skip(line, 'nom vide'); continue; }
    if (seen[key]) { skip(line, 'nom en double : ' + officialName); continue; }
    if (!isFinite(grade)) { skip(line, 'note illisible pour ' + officialName); continue; }

    // [V2] Adresse de la colonne Email (minuscules) ; une adresse invalide est ignorée et signalée
    let email = '';
    if (emailColumn) {
      const raw = cellEmail_(responses[i][emailIndex]);
      if (raw) {
        if (!emailPattern.test(raw)) badEmails.push({ name: officialName, email: raw, why: 'adresse hors @' + DOMAIN + ' ou mal formée' });
        else if (isAdmin_(raw)) badEmails.push({ name: officialName, email: raw, why: "adresse d'un administrateur" });
        else { email = raw; emailCount[raw] = (emailCount[raw] || 0) + 1; }
      }
    }

    seen[key] = true;
    const p = saved[key];
    // h contient désormais le Nom officiel en clair !
    rows.push({ h: officialName, g: grade, c: p ? p.c : null, t: p ? p.t : null, e: email });
  }

  // [V2] Une adresse partagée par plusieurs lignes est ambiguë : ignorée pour toutes
  rows.forEach(function(r) {
    if (r.e && emailCount[r.e] > 1) {
      badEmails.push({ name: r.h, email: r.e, why: 'adresse utilisée sur plusieurs lignes' });
      r.e = '';
    }
  });

  if (diag) {
    const known = {};
    rows.forEach(function(r) { known[squash_(r.h)] = true; });
    diag.orphanPreferences = [];
    diag.duplicatePreferences = [];
    diag.invalidPreferences = [];
    // [V2] Disposition de Preferences différente de la liste des spécialités (propriété modifiée à la main)
    diag.preferencesLayout = layout.choices === BRANCHES.length ? null : { found: layout.choices, expected: BRANCHES.length };
    Object.keys(prefLines).forEach(function(k) {
      const p = prefLines[k];
      if (!known[k]) diag.orphanPreferences.push(p.name);
      if (p.lines.length > 1) diag.duplicatePreferences.push({ name: p.name, rows: p.lines });
      if (!p.valid && !saved[k]) diag.invalidPreferences.push({ name: p.name, rows: p.lines });
    });
  }

  return {
    rows: rows,
    skipped: skipped,
    emailColumn: {
      present: emailColumn,
      filled: rows.filter(function(r) { return !!r.e; }).length,
      column: 'C',
      header: official.header.length > EMAIL_COLUMN_INDEX ? String(official.header[EMAIL_COLUMN_INDEX]) : '' // [V2] C1 lu, pour l'administration
    },
    badEmails: badEmails,
    branchesKey: branchesKey_(), // [V2] un cache lu avec une autre liste de spécialités est ignoré
    builtAt: Date.now()
  };
}

function branchesKey_() {
  return BRANCHES.join('\n');
}

/**
 * [V2] Disposition de Preferences d'après son en-tête : {choices, ts, width} (indices à partir de 0).
 * Sans en-tête « Timestamp » reconnu : Nom, n colonnes de choix (n = nombre de spécialités), date.
 */
function prefsLayout_(sh) {
  const n = BRANCHES.length;
  let ts = -1;
  try {
    const width = Math.min(sh.getMaxColumns(), MAX_BRANCHES + 4);
    if (sh.getLastRow() >= 1 && width >= 1) {
      const header = sh.getRange(1, 1, 1, width).getValues()[0].map(squash_);
      ts = header.indexOf('timestamp');
    }
  } catch (e) { ts = -1; }
  if (ts < 1) ts = n + 1;
  return { choices: ts - 1, ts: ts, width: ts + 1 };
}

/**
 * [V2] Disposition de l'Historique : {choices, source, width} (indices à partir de 0) d'après l'en-tête.
 * Elle peut compter plus de colonnes de choix que de spécialités (liste raccourcie) : jamais moins,
 * ensureHistoryColumns_ ajoute les colonnes manquantes avant une écriture.
 */
function historyLayout_(sh) {
  let src = -1;
  try {
    const width = Math.min(sh.getMaxColumns(), MAX_BRANCHES + 6);
    if (sh.getLastRow() >= 1 && width >= 1) {
      const header = sh.getRange(1, 1, 1, width).getValues()[0].map(squash_);
      src = header.indexOf('source');
    }
  } catch (e) { src = -1; }
  if (src < 3) src = 2 + DEFAULT_BRANCHES.length; // disposition d'origine : 3 choix
  return { choices: src - 2, source: src, width: src + 2 };
}

// Historique : ajoute des colonnes de choix si la liste compte plus de spécialités que l'en-tête
function ensureHistoryColumns_(sh, count) {
  const layout = historyLayout_(sh);
  const missing = (count || BRANCHES.length) - layout.choices;
  if (missing <= 0) return layout;
  sh.insertColumnsBefore(layout.source + 1, missing);
  const n = layout.choices + missing;
  sh.getRange(1, 3, 1, n).setValues([choiceHeaders_(n)]);
  try { sh.getRange(1, 3, sh.getMaxRows(), n).setNumberFormat('@'); } catch (e) { Logger.log('Format Historique : ' + e); }
  return { choices: n, source: 2 + n, width: 4 + n };
}

function loadSnapshot_() {
  const cache = CacheService.getScriptCache();
  // [V2] Un snapshot lu avec une autre liste de spécialités ne vaut plus rien
  const usable = function(raw) {
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return snap && snap.branchesKey === branchesKey_() ? snap : null;
  };
  const hit = usable(cache.get(SNAPSHOT_CACHE_KEY));
  if (hit) return hit;
  return withScriptLock_(function() {
    const again = usable(cache.get(SNAPSHOT_CACHE_KEY));
    if (again) return again;
    const snap = readSnapshot_(SpreadsheetApp.getActiveSpreadsheet());
    putSnapshot_(snap);
    return snap;
  });
}

function putSnapshot_(snap) {
  try {
    CacheService.getScriptCache().put(SNAPSHOT_CACHE_KEY, JSON.stringify(snap), SNAPSHOT_CACHE_SECONDS);
  } catch (e) {
    Logger.log('Cache put failed: ' + e);
    invalidateSnapshot_();
  }
}

function invalidateSnapshot_() {
  try { CacheService.getScriptCache().remove(SNAPSHOT_CACHE_KEY); } catch (e) { Logger.log('Cache remove failed: ' + e); }
}

// [V2] Caches secondaires : statuts des projections et résultat officiel publié
function invalidateTally_() {
  try { CacheService.getScriptCache().remove(TALLY_CACHE_KEY); } catch (e) { Logger.log('Cache remove failed: ' + e); }
}

function invalidateOfficial_() {
  try { CacheService.getScriptCache().remove(OFFICIAL_CACHE_KEY); } catch (e) { Logger.log('Cache remove failed: ' + e); }
}

function indexOfStudent_(snap, officialName) {
  const targetKey = squash_(officialName);
  for (let i = 0; i < snap.rows.length; i++) {
    if (squash_(snap.rows[i].h) === targetKey) return i;
  }
  return -1;
}

// [V2] Étudiant désigné par son Nom officiel (comparaison via squash_)
function findStudent_(snap, name) {
  const u = squash_(name) ? indexOfStudent_(snap, name) : -1;
  if (u === -1) throw new Error('Étudiant introuvable dans la liste officielle : « ' + String(name || '') + ' ». Actualisez la page.');
  return u;
}

// =========================================================================
// [V2] FEUILLES D'ADMINISTRATION : LECTURES ET ÉCRITURES GROUPÉES
// =========================================================================

// Historique : [{at, key, name, choices, source, author}] du plus ancien au plus récent
function readHistory_(ss) {
  const sh = ss.getSheetByName(HISTORY_SHEET);
  if (!sh) return [];
  const out = [];
  const layout = historyLayout_(sh);
  readRows_(sh, layout.width).forEach(function(row) {
    const key = squash_(row[1]);
    // [V2] Classement tel qu'il était à cette date (la liste des spécialités a pu changer depuis)
    const c = historyChoices_(row.slice(2, 2 + layout.choices));
    const at = timeMs_(row[0]);
    if (!key || !c || at === null) return;
    const src = String(row[layout.source]).trim().toUpperCase();
    out.push({
      at: at, key: key, name: String(row[1]).trim(), choices: c,
      source: HISTORY_SOURCES.indexOf(src) !== -1 ? src : 'ETUDIANT',
      author: String(row[layout.source + 1] || '').trim()
    });
  });
  out.sort(function(a, b) { return a.at - b.at; });
  return out;
}

// [V2] Choix d'une ligne d'Historique : textes non vides et distincts, dans l'ordre (null sinon)
function historyChoices_(cells) {
  const out = [];
  for (let i = 0; i < cells.length; i++) {
    const c = typeof cells[i] === 'string' ? cells[i].trim() : '';
    if (!c) continue;
    if (out.indexOf(c) !== -1) return null;
    out.push(c);
  }
  return out.length ? out : null;
}

function groupHistory_(history) {
  const by = {};
  history.forEach(function(h) { (by[h.key] = by[h.key] || []).push(h); });
  return by;
}

// Departage : {cléNote: {grade, keys, names, reason, admin, at}} trié par Rang
function readTieBreaks_(ss) {
  const sh = ss.getSheetByName(TIEBREAK_SHEET);
  const out = {};
  if (!sh) return out;
  const tmp = {};
  readRows_(sh, 6).forEach(function(row) {
    const g = toGrade_(row[0]);
    const rank = Number(row[1]);
    const key = squash_(row[2]);
    if (!isFinite(g) || !key) return;
    const gk = gradeKey_(g);
    (tmp[gk] = tmp[gk] || { grade: g, items: [], reason: '', admin: '', at: null }).items.push({ rank: isFinite(rank) ? rank : 999, key: key, name: String(row[2]).trim() });
    tmp[gk].reason = String(row[3] || '');
    tmp[gk].admin = String(row[4] || '');
    tmp[gk].at = timeMs_(row[5]);
  });
  Object.keys(tmp).forEach(function(gk) {
    const t = tmp[gk];
    t.items.sort(function(a, b) { return a.rank - b.rank; });
    out[gk] = {
      grade: t.grade,
      keys: t.items.map(function(x) { return x.key; }),
      names: t.items.map(function(x) { return x.name; }),
      reason: t.reason, admin: t.admin, at: t.at
    };
  });
  return out;
}

// Surcharges actives : {clé: {name, branch, reason, admin, at}} (la dernière ligne active l'emporte)
function readOverrides_(ss) {
  const sh = ss.getSheetByName(OVERRIDES_SHEET);
  const out = {};
  if (!sh) return out;
  readRows_(sh, 6).forEach(function(row) {
    const key = squash_(row[0]);
    const branch = String(row[1] || '').trim();
    if (!key || String(row[5]).trim().toUpperCase() !== 'OUI' || BRANCHES.indexOf(branch) === -1) return;
    out[key] = { name: String(row[0]).trim(), branch: branch, reason: String(row[2] || ''), admin: String(row[3] || ''), at: timeMs_(row[4]) };
  });
  return out;
}

function appendJournal_(ss, admin, action, details) {
  getOrCreateSheet_(ss, JOURNAL_SHEET)
    .appendRow([new Date(), sanitizeCell_(String(admin || '')), sanitizeCell_(action), sanitizeCell_(String(details || ''))]);
}

function appendHistory_(ss, when, name, choices, source, author) {
  const sh = getOrCreateSheet_(ss, HISTORY_SHEET);
  sh.appendRow(historyRow_(ensureHistoryColumns_(sh), when, name, choices, source, author));
}

// [V2] Ligne d'Historique à la largeur de la feuille (colonnes de choix en trop laissées vides)
function historyRow_(layout, when, name, choices, source, author) {
  const cells = [];
  for (let k = 0; k < layout.choices; k++) cells.push(k < choices.length ? sanitizeCell_(choices[k]) : '');
  return [when, sanitizeCell_(name)].concat(cells, [source, sanitizeCell_(String(author || ''))]);
}

// Réécrit les lignes de données d'une feuille en deux appels groupés
function rewriteRows_(sh, rows, width) {
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, width).clearContent();
  if (rows.length) {
    sh.getRange(2, 1, rows.length, width).setValues(rows.map(function(r) { return r.map(sanitizeCell_); }));
  }
}

/**
 * [V2] Écriture commune des choix (étudiant ou administrateur), appelée sous le verrou :
 * Preferences (une ligne par étudiant, écrasée) + une ligne ajoutée à Historique.
 */
function writeChoices_(ss, officialName, choices, now, source, author, logHistory) {
  const prefsSheet = getOrCreateSheet_(ss, PREFERENCES_SHEET);
  // [V2] Jamais d'écriture dans une disposition qui ne correspond pas à la liste des spécialités
  if (prefsLayout_(prefsSheet).choices !== BRANCHES.length) {
    desync_('Preferences : en-tête incompatible avec les ' + BRANCHES.length + ' spécialités (relancer setupSheets)');
  }
  const keys = prefsSheet.getLastRow() > 1
    ? prefsSheet.getRange(2, 1, prefsSheet.getLastRow() - 1, 1).getValues()
    : [];
  const targetKey = squash_(officialName);
  let updated = 0;
  const line = [sanitizeCell_(officialName)].concat(choices.map(sanitizeCell_), [now]);

  // Écraser la ligne existante de l'étudiant (en gardant son Nom officiel en clair en Colonne A)
  for (let i = 0; i < keys.length; i++) {
    if (squash_(keys[i][0]) === targetKey) {
      prefsSheet.getRange(i + 2, 1, 1, line.length).setValues([line]);
      updated++;
    }
  }
  if (updated === 0) {
    // Première soumission : écrit le Nom officiel en clair dans la feuille Preferences
    prefsSheet.appendRow(line);
  }
  if (logHistory !== false) appendHistory_(ss, now, officialName, choices, source, author);
}

// =========================================================================
// POINTS D'ENTRÉE DU TABLEAU DE BORD & ENREGISTREMENT EN CLAIR
// =========================================================================

// L'argument facultatif est le classement prévisualisé à l'écran (pour que l'actualisation garde la même simulation)
function getDashboardState(choices) {
  // [V2] Contrôle administrateur AVANT tout appariement par nom
  const email = activeEmail_();
  const props = scriptProps_(); // [V2] lues une seule fois pour toute la requête
  if (isAdmin_(email, props)) return { access: 'ADMIN', adminUrl: webAppUrl_(), program: programInfo_() };
  const open = studentPageOpen_(props);
  // [V2] Identité vérifiée même page fermée : un étudiant absent de la liste le sait dès sa première visite.
  // Page fermée et liste illisible : on ne peut rien vérifier, la page d'attente s'affiche.
  let snap = null;
  try {
    snap = loadSnapshot_();
  } catch (e) {
    if (open) throw e;
    Logger.log('Liste officielle illisible (page fermée) : ' + e);
  }
  const denied = snap ? deniedState_(email, snap) : null;
  if (denied) return denied;
  // [V2] Page fermée : un état dédié (et non une erreur), pour qu'un onglet déjà ouvert bascule
  // sur la page d'attente et cesse d'afficher d'anciennes données ou une annonce retirée.
  if (!open) return closedState_(props);
  const name = currentUserName_(snap, props);
  return buildState_(snap, name, normalizeChoices_(choices), props);
}

// [V2] Étudiant non reconnu (absent de la liste, nom ambigu, compte hors domaine) : un état dédié,
// rafraîchi comme les autres, qui bascule seul sur le tableau de bord une fois la liste corrigée.
function deniedState_(email, snap) {
  // Adresse non transmise par Google : ce n'est pas un refus de la liste (page d'attente, ou erreur si ouverte)
  if (!email) return null;
  let message = null;
  if (!email.endsWith('@' + DOMAIN)) message = 'Connectez-vous avec votre compte institutionnel @' + DOMAIN + '.';
  else if (resolveStudent_(email, snap.rows).verdict !== 'OK') {
    message = 'Votre adresse ' + email + ' ne correspond à aucun étudiant inscrit sur la liste officielle ' + PROGRAM.name + '.';
  }
  if (!message) return null;
  return { access: 'DENIED', message: message, program: programInfo_(), serverTime: new Date().toISOString() };
}

function previewOdds(userChoices) {
  // [V2] Contrôle administrateur AVANT tout appariement par nom
  const props = scriptProps_(); // [V2] lues une seule fois
  if (isAdmin_(activeEmail_(), props)) throw new Error(ADMIN_NOT_STUDENT_MESSAGE);
  const choices = normalizeChoices_(userChoices);
  if (!choices) throw new Error(invalidChoicesMessage_());
  assertStudentPageOpen_(props);
  const snap = loadSnapshot_();
  const name = currentUserName_(snap, props);
  return buildState_(snap, name, choices, props);
}

function saveChoices(userChoices) {
  // [V2] Contrôle administrateur AVANT tout appariement par nom
  const email = activeEmail_();
  const props = scriptProps_(); // [V2] lues une seule fois (relues sous verrou avant d'écrire)
  if (isAdmin_(email, props)) throw new Error(ADMIN_NOT_STUDENT_MESSAGE);
  const choices = normalizeChoices_(userChoices);
  if (!choices) throw new Error(invalidChoicesMessage_());
  assertStudentPageOpen_(props);
  // [V2] choicesLock_ inclut la publication des résultats (aucun enregistrement après publication)
  if (choicesLock_(props).locked) throw new Error(LOCKED_MESSAGE);

  const cached = loadSnapshot_();
  const name = currentUserName_(cached, props);
  const known = indexOfStudent_(cached, name);
  if (known !== -1 && sameChoices_(cached.rows[known].c, choices)) {
    return buildState_(cached, name, choices, props);
  }

  const cache = CacheService.getScriptCache();
  const cooldownKey = 'save_' + squash_(name);
  if (cache.get(cooldownKey)) {
    throw new Error("Patientez quelques secondes avant d'enregistrer à nouveau.");
  }

  return withScriptLock_(function() {
    // [V2] Relecture fraîche sous verrou : page fermée ou choix clos entre-temps
    const fresh = scriptProps_();
    assertStudentPageOpen_(fresh);
    if (choicesLock_(fresh).locked) throw new Error(LOCKED_MESSAGE);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const snap = readSnapshot_(ss);
    const officialName = currentUserName_(snap, fresh);
    const u = indexOfStudent_(snap, officialName);
    if (u === -1) throw new Error(noGradeMessage_());

    const now = new Date();
    // [V2] Écriture commune : Preferences comme avant, + une ligne Historique si les choix changent
    writeChoices_(ss, officialName, choices, now, 'ETUDIANT', email, !sameChoices_(snap.rows[u].c, choices));
    SpreadsheetApp.flush();
    invalidateTally_(); // [V2] statuts de l'administration recalculés

    snap.rows[u].c = choices;
    snap.rows[u].t = now.getTime();
    snap.builtAt = Date.now();
    putSnapshot_(snap);
    try { cache.put(cooldownKey, '1', SAVE_COOLDOWN_SECONDS); } catch (e) { Logger.log('Cooldown put failed: ' + e); }
    return buildState_(snap, officialName, choices, fresh);
  });
}

// [V2] Ce que voit un étudiant quand la page est fermée : texte d'attente et annonce, rien d'autre
function closedState_(props) {
  return {
    access: 'CLOSED',
    message: WAITING_TEXT,
    program: programInfo_(), // [V2]
    announcement: announcement_(props),
    serverTime: new Date().toISOString(),
    timeZone: Session.getScriptTimeZone()
  };
}

// [V2] État de la page étudiante : note, rang, choix, projection avec les places en vigueur
// (« assuré », « incertain », « hors d'atteinte ») et conseil, demande.
function buildState_(snap, officialName, requested, props) {
  const u = indexOfStudent_(snap, officialName);
  if (u === -1) throw new Error(noGradeMessage_());

  const me = snap.rows[u];
  // [V2] Propriétés lues une seule fois (transmises par l'appelant) ; places propres à chaque filière
  props = props || scriptProps_();
  const rules = rules_(props);
  const lockInfo = choicesLock_(props);
  const coverage = coverage_(snap, u);
  const N = snap.rows.length || PROGRAM.classSize;
  return {
    access: 'OK',
    grade: me.g,
    savedChoices: me.c,
    savedAt: me.t ? new Date(me.t).toISOString() : null,
    deadline: lockInfo.deadline,
    locked: lockInfo.locked,
    serverTime: new Date().toISOString(),
    timeZone: Session.getScriptTimeZone(),
    rules: {
      branches: BRANCHES.slice(), classSize: N,
      // [V2] Places en vigueur : chaque filière recevra de floor à ceiling étudiants
      seats: rulesOut_(rules, N).perBranch.map(function(p) { return { branch: p.branch, floor: p.floor, ceiling: p.ceiling }; })
    },
    stats: stats_(snap),
    ranking: ranking_(snap, u),
    coverage: coverage,
    projection: project_(snap, u, requested || me.c, me.c, coverage, rules),
    // [V2] Champs additionnels : annonce et résultat officiel publié
    announcement: announcement_(props),
    official: officialResult_(officialName, props),
    program: programInfo_() // [V2]
  };
}

// [V2] Classement par note : 1 + nombre d'étudiants mieux notés ; tied = autres étudiants de même note
function ranking_(snap, u) {
  const me = snap.rows[u];
  let above = 0, tied = 0;
  snap.rows.forEach(function(r, j) {
    if (j === u) return;
    if (r.g > me.g) above++;
    else if (r.g === me.g) tied++;
  });
  return { rank: above + 1, total: snap.rows.length, tied: tied };
}

// [V2] Formation affichée en en-tête des pages
function programInfo_() {
  return { name: PROGRAM.name };
}

// Demande : stats[filière] = {c1, c2, …, cn} (nombre d'étudiants l'ayant classée k-ième)
function stats_(snap) {
  const stats = {};
  BRANCHES.forEach(function(b) {
    stats[b] = {};
    for (let k = 1; k <= BRANCHES.length; k++) stats[b]['c' + k] = 0;
  });
  snap.rows.forEach(function(r) {
    if (!r.c) return;
    r.c.forEach(function(b, k) { stats[b]['c' + (k + 1)]++; });
  });
  return stats;
}

function coverage_(snap, u) {
  const me = snap.rows[u];
  const total = snap.rows.length;
  let choicesSaved = 0, undecidedAbove = 0, tied = 0;
  snap.rows.forEach(function(r, j) {
    if (r.c) choicesSaved++;
    if (j === u) return;
    if (r.g === me.g) tied++;
    else if (r.g > me.g && !r.c) undecidedAbove++;
  });
  return {
    classSize: total,
    gradesSubmitted: total,
    missingGrades: 0, // Liste officielle complète = 0 note manquante
    choicesSaved: choicesSaved,
    undecidedAbove: undecidedAbove,
    tied: tied
  };
}

// [V2] Résultat officiel de l'étudiant, lu dans la feuille Affectation publiée (cache 60 s)
function officialResult_(officialName, props) {
  const pub = publishedSheet_(props);
  if (!pub) return null;
  const map = officialMap_(pub);
  if (!map) return null;
  const hit = map.byKey[squash_(officialName)];
  return {
    published: true,
    branch: hit ? hit.b : null,
    choiceRank: hit ? hit.r : null,
    publishedAt: pub.at
  };
}

function officialMap_(pub) {
  const cache = CacheService.getScriptCache();
  try {
    const hit = cache.get(OFFICIAL_CACHE_KEY);
    if (hit) {
      const parsed = JSON.parse(hit);
      if (parsed && parsed.sheet === pub.sheet && parsed.branchesKey === branchesKey_()) return parsed;
    }
  } catch (e) { Logger.log('Official cache read failed: ' + e); }

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pub.sheet);
  if (!sh) {
    Logger.log('Feuille publiée introuvable : ' + pub.sheet);
    return null;
  }
  // [V2] Colonnes repérées par l'en-tête : la feuille a autant de colonnes « Choix » que de spécialités au gel
  const width = Math.max(1, Math.min(allocationHeaders_(MAX_BRANCHES).length, sh.getMaxColumns()));
  const header = sh.getRange(1, 1, 1, width).getValues()[0].map(squash_);
  const col = function(label, fallback) { const k = header.indexOf(squash_(label)); return k !== -1 ? k : fallback; };
  const cName = col('Nom', 1), cBranch = col('Filière affectée', 6), cRank = col('Rang du choix obtenu', 7);
  const byKey = {};
  readRows_(sh, width).forEach(function(row) {
    const key = squash_(row[cName]);
    if (!key) return;
    const b = String(row[cBranch] === undefined ? '' : row[cBranch]).trim();
    const r = Number(row[cRank]);
    byKey[key] = { b: BRANCHES.indexOf(b) !== -1 ? b : null, r: (Math.floor(r) === r && r >= 1 && r <= BRANCHES.length) ? r : null };
  });
  const map = { sheet: pub.sheet, branchesKey: branchesKey_(), byKey: byKey };
  try { cache.put(OFFICIAL_CACHE_KEY, JSON.stringify(map), OFFICIAL_CACHE_SECONDS); } catch (e) { Logger.log('Official cache put failed: ' + e); }
  return map;
}

// =========================================================================
// MOTEUR MATHÉMATIQUE D'AFFECTATION (MAX = 26, MIN = 12)
// [V2] Paramétré par les règles complètes (seatRules_) : minimum et maximum de chaque filière ;
//      avec les mêmes règles pour toutes les filières, le comportement est strictement identique.
// =========================================================================

function project_(snap, u, choices, saved, coverage, rules) {
  rules = fullRules_(rules); // [V2]
  if (!choices) {
    return {
      status: 'NO_CHOICES', choices: null, isSaved: false,
      bestBranch: null, worstBranch: null, reason: null,
      message: 'Aucun choix enregistré.'
    };
  }
  // [V2] Situations possibles avant le tour de l'étudiant : elles ne dépendent pas de son classement
  const behindStates = reachableStates_(snap, u, false, rules);
  const aheadStates = reachableStates_(snap, u, true, rules);
  const behindCase = landingsFrom_(behindStates, choices, rules);
  const aheadCase = landingsFrom_(aheadStates, choices, rules);
  const reachable = choices.filter(function(b) { return (b in behindCase) || (b in aheadCase); });
  const best = reachable[0];
  const worst = reachable[reachable.length - 1];
  const reason = (worst in aheadCase) ? aheadCase[worst] : behindCase[worst];

  let status;
  if (best === worst) status = (best === choices[0]) ? 'SECURE' : 'FALLBACK_SECURED';
  else status = 'VULNERABLE';

  return {
    status: status,
    choices: choices.slice(),
    isSaved: sameChoices_(choices, saved),
    bestBranch: best,
    worstBranch: worst,
    reason: reason,
    message: projectionMessage_(status, choices, best, worst, reason, coverage, rules),
    // [V2] Filière que l'étudiant obtiendrait dans tous les cas en la plaçant en 1er choix (page étudiante)
    safeBranch: status === 'SECURE' ? best : safeFirstChoice_([behindStates, aheadStates], choices, rules)
  };
}

// [V2] Première filière, dans l'ordre de l'étudiant, qui lui serait attribuée dans toutes les situations
// possibles s'il la plaçait en 1er choix ; null si aucune
function safeFirstChoice_(cases, choices, rules) {
  const mine = prefIndices_(choices);
  for (let k = 0; k < mine.length; k++) {
    const order = [mine[k]].concat(mine.filter(function(b) { return b !== mine[k]; }));
    const landings = {};
    cases.forEach(function(c) { landsOn_(c, order, rules, landings); });
    const got = Object.keys(landings);
    if (got.length === 1 && got[0] === BRANCHES[mine[k]]) return BRANCHES[mine[k]];
  }
  return null;
}

function projectionMessage_(status, choices, best, worst, reason, cov, rules) {
  rules = fullRules_(rules); // [V2]
  const ordinal = function(b) { return ordinalFr_(choices.indexOf(b) + 1); };
  const why = reason === 'CAPACITY'
    ? choices[0] + ' est complet (' + rules.maxs[BRANCHES.indexOf(choices[0])] + ' places au maximum) avant votre rang'
    : 'les étudiants classés derrière vous sont nécessaires pour atteindre le minimum d\'une autre filière';

  if (status === 'SECURE') {
    return 'Votre 1er choix (' + best + ') est assuré avec les données actuelles : même dans le pire ' +
      'scénario (étudiants à égalité ou indécis devant vous faisant les choix les plus ' +
      'défavorables), vous l\'obtenez.';
  }
  if (status === 'FALLBACK_SECURED') {
    return 'Votre 1er choix (' + choices[0] + ') n\'est pas atteignable, même dans le meilleur scénario : ' +
      why + '. Dans tous les scénarios, vous êtes affecté(e) à ' + best + ' (' + ordinal(best) + ').';
  }
  const unknown = [];
  if (cov.undecidedAbove) unknown.push(cov.undecidedAbove + ' étudiant(s) classé(s) devant vous sans choix enregistré');
  if (cov.tied) unknown.push(cov.tied + ' étudiant(s) à égalité de note avec vous (départage inconnu)');
  return 'Résultat incertain : au mieux ' + best + ' (' + ordinal(best) + '), au pire ' + worst +
    ' (' + ordinal(worst) + ').' +
    (unknown.length ? ' Cela dépend de : ' + unknown.join(' ; ') + '.' : '') +
    (reason ? ' Dans le pire cas, vous perdez votre 1er choix car ' + why + '.' : '');
}

// [V2] Filières où l'étudiant peut atterrir (avec la raison) depuis les situations calculées par reachableStates_
function landingsFrom_(c, choices, rules) {
  return landsOn_(c, prefIndices_(choices), fullRules_(rules), {});
}

function landsOn_(c, mine, rules, landings) {
  for (let s = 0; s < c.states.length; s++) {
    c.decode(c.states[s]);
    const res = assignOne_(c.x, mine, c.remaining, rules);
    if (!(BRANCHES[res.b] in landings)) landings[BRANCHES[res.b]] = res.reason;
  }
  return landings;
}

// Situations (effectifs par filière) possibles au tour de l'étudiant u : ahead = les ex æquo passent devant
function reachableStates_(snap, u, ahead, rules) {
  rules = fullRules_(rules); // [V2]
  const totalStudents = snap.rows.length;
  const me = snap.rows[u];
  const before = snap.rows.filter(function(r, j) {
    return j !== u && (r.g > me.g || (ahead && r.g === me.g));
  });
  before.sort(function(a, b) { return b.g - a.g; });

  const groups = [];
  before.forEach(function(r, j) {
    const prefs = r.c ? prefIndices_(r.c) : null;
    if (j > 0 && r.g === before[j - 1].g) groups[groups.length - 1].push(prefs);
    else groups.push([prefs]);
  });

  // [V2] Un état = effectifs des n filières, codés en base W sur les n − 1 premières (la dernière s'en déduit).
  // Avec 3 filières, le code est exactement celui d'origine (x0 × W + x1) et les états sont parcourus
  // dans le même ordre : résultats identiques.
  const B = BRANCHES.length;
  const W = totalStudents + 1;
  const x = BRANCHES.map(function() { return 0; });
  const options = BRANCHES.map(function() { return 0; });
  const encode = function() {
    let code = 0;
    for (let k = 0; k < B - 1; k++) code = code * W + x[k];
    return code;
  };
  const decode = function(code, at) {
    let sum = 0;
    for (let k = B - 2; k >= 0; k--) { x[k] = code % W; code = Math.floor(code / W); sum += x[k]; }
    x[B - 1] = at - sum;
  };
  let states = [0];
  let pos = 0;
  groups.forEach(function(group) {
    const members = group.length <= MAX_TIE_GROUP ? [group] : group.map(function() { return [null]; });
    members.forEach(function(g) {
      let layer = states.map(function(code) { return code * 16; });
      for (let t = 0; t < g.length; t++, pos++) {
        const remaining = totalStudents - 1 - pos;
        const next = [];
        const seen = new Set(); // états déjà atteints à cette position
        for (let s = 0; s < layer.length; s++) {
          const code = Math.floor(layer[s] / 16), mask = layer[s] % 16;
          decode(code, pos);
          for (let j = 0; j < g.length; j++) {
            if (mask & (1 << j)) continue;
            const n = stepOptions_(x, g[j], remaining, options, rules);
            for (let o = 0; o < n; o++) {
              x[options[o]]++;
              const key = encode() * 16 + (mask | (1 << j));
              x[options[o]]--;
              if (!seen.has(key)) { seen.add(key); next.push(key); }
            }
          }
        }
        layer = next;
      }
      states = layer.map(function(key) { return Math.floor(key / 16); });
    });
  });

  return {
    states: states, x: x, remaining: totalStudents - 1 - pos,
    decode: function(code) { decode(code, pos); }
  };
}

function stepOptions_(x, prefs, remaining, out, rules) {
  rules = fullRules_(rules); // [V2]
  if (prefs) { out[0] = assignOne_(x, prefs, remaining, rules).b; return 1; }
  const base = seatsNeeded_(x, -1, rules);
  let n = 0;
  for (let b = 0; b < x.length; b++) {
    if (x[b] < rules.maxs[b] && remaining >= base - (x[b] < rules.mins[b] ? 1 : 0)) {
      out[n++] = b;
    }
  }
  if (n === 0) out[n++] = assignOne_(x, BRANCHES.map(function(v, k) { return k; }), remaining, rules).b;
  return n;
}

function prefIndices_(prefs) {
  return prefs.map(function(b) { return BRANCHES.indexOf(b); });
}

// [V2] Minimum et maximum propres à chaque filière (rules.mins[b], rules.maxs[b])
function assignOne_(counts, prefs, remaining, rules) {
  rules = fullRules_(rules);
  let assigned = -1;
  let forced = false;
  for (let k = 0; k < prefs.length; k++) {
    if (counts[prefs[k]] < rules.maxs[prefs[k]] && remaining >= seatsNeeded_(counts, prefs[k], rules)) {
      assigned = prefs[k];
      break;
    }
  }
  if (assigned === -1) {
    forced = true;
    let maxNeeded = -1;
    for (let b = 0; b < counts.length; b++) {
      if (counts[b] >= rules.maxs[b]) continue;
      const need = Math.max(0, rules.mins[b] - counts[b]);
      if (need > maxNeeded) { maxNeeded = need; assigned = b; }
    }
  }
  let reason = null;
  if (assigned !== prefs[0]) reason = (counts[prefs[0]] >= rules.maxs[prefs[0]]) ? 'CAPACITY' : 'QUOTA';
  return { b: assigned, reason: reason, forced: forced };
}

function seatsNeeded_(counts, taking, rules) {
  rules = fullRules_(rules);
  let need = 0;
  for (let b = 0; b < counts.length; b++) {
    need += Math.max(0, rules.mins[b] - counts[b] - (b === taking ? 1 : 0));
  }
  return need;
}

// =========================================================================
// [V2] AFFECTATION UNIQUE
// allocate_ alimente la vue provisoire, la simulation, les exports et le gel :
// ils ne peuvent donc jamais diverger.
// =========================================================================

/**
 * rows      : lignes du snapshot [{h, g, c, t, e}]
 * rules     : règles complètes (seatRules_) ou {min, max} identiques pour toutes les filières
 * tieOrders : {cléNote: [clés squash_ dans l'ordre de départage]} (feuille Departage)
 * forced    : {clé squash_: filière} (Surcharges actives)
 * policy    : 'LAST' | 'MANUAL' pour les étudiants sans choix
 */
function allocate_(rows, rules, tieOrders, forced, policy) {
  rules = fullRules_(rules);
  tieOrders = tieOrders || {};
  forced = forced || {};
  policy = policy === 'MANUAL' ? 'MANUAL' : 'LAST';
  const keys = rows.map(function(r) { return squash_(r.h); });
  const order = allocationOrder_(rows, keys, tieOrders);
  const base = runAllocation_(rows, keys, order, rules, forced, policy);

  const ties = [];
  let unresolved = 0;
  tieGroups_(rows, order).forEach(function(g) {
    const stored = tieOrders[gradeKey_(g.grade)] || null;
    const resolved = !!stored && g.members.every(function(i) { return stored.indexOf(keys[i]) !== -1; });
    const decisive = isDecisiveTie_(rows, keys, order, g, rules, forced, policy, base.res);
    if (decisive && !resolved) unresolved++;
    if (decisive && resolved) {
      g.members.forEach(function(i) { if (base.res[i].source === 'ALGO') base.res[i].source = 'TIEBREAK'; });
    }
    ties.push({ grade: g.grade, decisive: decisive, resolved: resolved, stale: !!stored && !resolved, members: g.members });
  });

  const counts = {};
  BRANCHES.forEach(function(b, k) { counts[b] = base.counts[k]; });
  return {
    rules: rules, policy: policy, keys: keys, order: order, // [V2] règles complètes (usage interne, cf. rulesOut_)
    res: base.res, counts: counts, ties: ties, unresolvedTies: unresolved, forcedOverflow: base.forcedOverflow
  };
}

// Ordre de passage : note décroissante ; égalités selon Departage, sinon par nom croissant
function allocationOrder_(rows, keys, tieOrders) {
  const idx = rows.map(function(r, i) { return i; });
  idx.sort(function(a, b) {
    if (rows[a].g !== rows[b].g) return rows[b].g - rows[a].g;
    const stored = tieOrders[gradeKey_(rows[a].g)];
    if (stored) {
      let pa = stored.indexOf(keys[a]), pb = stored.indexOf(keys[b]);
      if (pa === -1) pa = 1e9;
      if (pb === -1) pb = 1e9;
      if (pa !== pb) return pa - pb;
    }
    return compareNames_(rows[a].h, rows[b].h);
  });
  return idx;
}

function runAllocation_(rows, keys, order, rules, forced, policy) {
  const n = rows.length;
  const counts = BRANCHES.map(function() { return 0; });
  const res = new Array(n);
  const done = new Array(n);
  for (let i = 0; i < n; i++) {
    res[i] = { branch: null, choiceRank: null, source: null, reason: null, rank: 0, at: null, remaining: null };
    done[i] = false;
  }
  order.forEach(function(i, pos) { res[i].rank = pos + 1; });
  let unplaced = n;
  const forcedOverflow = [];

  // 1) Affectations imposées (Surcharges) : placées d'abord, comptées, jamais au-delà du maximum
  order.forEach(function(i) {
    const b = forced[keys[i]] ? BRANCHES.indexOf(forced[keys[i]]) : -1;
    if (b === -1) return;
    if (counts[b] >= rules.maxs[b]) { forcedOverflow.push(i); return; }
    counts[b]++;
    done[i] = true;
    unplaced--;
    const c = rows[i].c;
    const k = c ? c.indexOf(BRANCHES[b]) + 1 : 0;
    res[i].branch = BRANCHES[b];
    res[i].choiceRank = k > 0 ? k : null;
    res[i].source = 'MANUAL';
  });

  // 2) Étudiants avec choix, dans l'ordre, via la logique existante (assignOne_)
  order.forEach(function(i) {
    if (done[i] || !rows[i].c) return;
    const remaining = unplaced - 1;
    const at = counts.slice();
    const r = assignOne_(counts, prefIndices_(rows[i].c), remaining, rules);
    done[i] = true;
    unplaced--;
    res[i].at = at;
    res[i].remaining = remaining;
    if (r.b === -1) { res[i].reason = 'CAPACITY'; return; } // impossible lorsque n × max ≥ effectif
    counts[r.b]++;
    res[i].branch = BRANCHES[r.b];
    res[i].choiceRank = rows[i].c.indexOf(BRANCHES[r.b]) + 1;
    res[i].source = 'ALGO';
    res[i].reason = r.reason;
  });

  // 3) Sans choix : LAST → après tous les autres ; MANUAL → non placés (attention.pending)
  if (policy === 'LAST') {
    order.forEach(function(i) {
      if (done[i]) return;
      const b = autoBranch_(counts, rules);
      done[i] = true;
      unplaced--;
      if (b === -1) return;
      counts[b]++;
      res[i].branch = BRANCHES[b];
      res[i].source = 'AUTO';
    });
  }
  return { counts: counts, res: res, forcedOverflow: forcedOverflow };
}

// Filière non pleine au plus grand besoin restant sous le minimum (égalité : plus petit effectif)
function autoBranch_(counts, rules) {
  let best = -1, bestNeed = -1;
  for (let b = 0; b < counts.length; b++) {
    if (counts[b] >= rules.maxs[b]) continue;
    const need = Math.max(0, rules.mins[b] - counts[b]);
    if (best === -1 || need > bestNeed || (need === bestNeed && counts[b] < counts[best])) {
      best = b;
      bestNeed = need;
    }
  }
  return best;
}

function tieGroups_(rows, order) {
  const groups = [];
  let cur = null;
  order.forEach(function(i, pos) {
    if (cur && rows[i].g === cur.grade) { cur.members.push(i); return; }
    cur = { grade: rows[i].g, start: pos, members: [i] };
    groups.push(cur);
  });
  return groups.filter(function(g) { return g.members.length > 1; });
}

/**
 * Une égalité est décisive si permuter ses membres change la filière d'au moins un membre.
 * Jusqu'à 5 membres : toutes les permutations sont testées. Au-delà : décisive si les membres
 * finissent dans des filières différentes ou si l'un d'eux manque son 1er choix.
 */
function isDecisiveTie_(rows, keys, order, g, rules, forced, policy, baseRes) {
  const members = g.members;
  if (members.length > TIE_PERMUTATION_LIMIT) {
    const seen = {};
    let missed = false;
    members.forEach(function(i) {
      if (baseRes[i].branch) seen[baseRes[i].branch] = true;
      if (rows[i].c && baseRes[i].choiceRank !== 1) missed = true;
    });
    return Object.keys(seen).length > 1 || missed;
  }
  let decisive = false;
  permutations_(members, function(perm) {
    if (decisive) return true;
    const o = order.slice();
    for (let k = 0; k < perm.length; k++) o[g.start + k] = perm[k];
    const r = runAllocation_(rows, keys, o, rules, forced, policy);
    decisive = members.some(function(i) { return r.res[i].branch !== baseRes[i].branch; });
    return decisive;
  });
  return decisive;
}

// Parcourt les permutations (sauf l'identité) ; arrêt dès que visit renvoie true
function permutations_(items, visit) {
  const a = items.slice();
  const c = a.map(function() { return 0; });
  let i = 1;
  while (i < a.length) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      const tmp = a[j]; a[j] = a[i]; a[i] = tmp;
      if (visit(a.slice())) return;
      c[i]++;
      i = 1;
    } else {
      c[i] = 0;
      i++;
    }
  }
}

// Récapitulatif par filière et satisfaction
function allocationSummary_(rows, alloc) {
  const maxs = alloc.rules.maxs;
  const per = {};
  // [V2] Un compteur r1..rn par rang de choix
  const ranks = function(into) {
    for (let k = 1; k <= BRANCHES.length; k++) into['r' + k] = 0;
    return into;
  };
  BRANCHES.forEach(function(b) {
    per[b] = {
      count: 0, seatsLeft: 0, full: false, cutoffGrade: null,
      byRank: ranks({}),
      bySource: { ALGO: 0, TIEBREAK: 0, MANUAL: 0, AUTO: 0 }
    };
  });
  const sat = ranks({});
  sat.placed = 0; sat.unplaced = 0; sat.avgRank = null;
  let rankSum = 0, rankN = 0;
  alloc.order.forEach(function(i) {
    const r = alloc.res[i];
    if (!r.branch) { sat.unplaced++; return; }
    sat.placed++;
    const p = per[r.branch];
    p.count++;
    if (r.source) p.bySource[r.source]++;
    if (r.choiceRank) {
      p.byRank['r' + r.choiceRank]++;
      sat['r' + r.choiceRank]++;
      rankSum += r.choiceRank;
      rankN++;
    }
    if ((r.source === 'ALGO' || r.source === 'TIEBREAK') && (p.cutoffGrade === null || rows[i].g < p.cutoffGrade)) {
      p.cutoffGrade = rows[i].g;
    }
  });
  // [V2] Sans maximum : seatsLeft = null, jamais complète
  BRANCHES.forEach(function(b, k) {
    per[b].seatsLeft = isFinite(maxs[k]) ? Math.max(0, maxs[k] - per[b].count) : null;
    per[b].full = per[b].count >= maxs[k];
  });
  sat.avgRank = rankN ? Math.round(rankSum / rankN * 100) / 100 : null;
  return { perBranch: per, satisfaction: sat };
}

// Zone de bascule : pour chaque filière pleine, 3 derniers admis et 3 premiers recalés
function bubble_(rows, alloc) {
  const out = [];
  BRANCHES.forEach(function(b, k) {
    if (alloc.counts[b] < alloc.rules.maxs[k]) return;
    const admitted = alloc.order.filter(function(i) {
      const r = alloc.res[i];
      return r.branch === b && (r.source === 'ALGO' || r.source === 'TIEBREAK');
    });
    admitted.slice(-3).forEach(function(i) {
      out.push({ branch: b, kind: 'LAST_ADMITTED', name: rows[i].h, grade: rows[i].g, rank: alloc.res[i].rank });
    });
    const rejected = alloc.order.filter(function(i) {
      const r = alloc.res[i], c = rows[i].c;
      if (!c || r.source === 'MANUAL' || r.branch === b) return false;
      return r.branch === null || c.indexOf(b) < c.indexOf(r.branch);
    });
    rejected.slice(0, 3).forEach(function(i) {
      out.push({ branch: b, kind: 'FIRST_REJECTED', name: rows[i].h, grade: rows[i].g, rank: alloc.res[i].rank });
    });
  });
  return out;
}

// Phrase d'explication en français pour un étudiant
function explainAllocation_(row, r, summary, alloc, forcedInfo, total) {
  const maxs = alloc.rules.maxs, mins = alloc.rules.mins;
  if (r.source === 'MANUAL') {
    return "Affectation imposée par l'administration" + (forcedInfo && forcedInfo.reason ? ' : ' + forcedInfo.reason : '') + '.';
  }
  if (!row.c) {
    if (r.source === 'AUTO') {
      return "Aucun choix enregistré : placé(e) après les étudiants ayant classé les filières, dans la filière qui avait le plus besoin d'effectif (" + r.branch + ').';
    }
    if (alloc.policy === 'MANUAL') return "Aucun choix enregistré : en attente d'une décision de l'administration.";
    return "Aucun choix enregistré et aucune place disponible.";
  }
  if (!r.branch) return "Aucune place n'a pu être attribuée : la capacité totale est insuffisante.";
  const parts = [];
  for (let k = 0; k < r.choiceRank - 1; k++) {
    const b = row.c[k];
    const bi = BRANCHES.indexOf(b);
    if (r.at && r.at[bi] >= maxs[bi]) {
      const cut = summary.perBranch[b].cutoffGrade;
      parts.push(b + ' était complète (' + maxs[bi] + '/' + maxs[bi] + ') quand votre tour est arrivé ; dernière note admise : ' + fmtGradeFr_(cut));
    } else {
      // [V2] Filières encore sous leur minimum à ce moment-là
      const short = r.at ? BRANCHES.filter(function(x, k) { return k !== bi && r.at[k] < mins[k]; }).map(function(x) {
        return x + ' (' + r.at[BRANCHES.indexOf(x)] + '/' + mins[BRANCHES.indexOf(x)] + ')';
      }) : [];
      parts.push(b + " n'était pas complète (" + (r.at ? r.at[bi] : '?') + (isFinite(maxs[bi]) ? '/' + maxs[bi] : '') + '), mais les ' + r.remaining +
        ' étudiant(s) restant(s) étaient tous nécessaires pour atteindre le minimum des autres filières' + (short.length ? ' : ' + short.join(', ') : ''));
    }
  }
  let s = parts.length ? capitalizeFr_(parts.join(' ; ')) + '. ' : '';
  s += r.choiceRank === 1
    ? 'Votre 1er choix, ' + r.branch + ', vous est attribué (rang ' + r.rank + ' sur ' + total + ').'
    : 'Vous êtes affecté(e) à ' + r.branch + ' (' + ordinalFr_(r.choiceRank) + ', rang ' + r.rank + ' sur ' + total + ').';
  if (r.source === 'TIEBREAK') s += " Votre égalité de note a été départagée par l'administration.";
  return s;
}

function sourceComment_(row, r, alloc, forcedInfo, tie) {
  if (r.source === 'MANUAL') return 'Affectation imposée' + (forcedInfo && forcedInfo.reason ? ' : ' + forcedInfo.reason : '');
  if (r.source === 'AUTO') return 'Sans choix : placé(e) automatiquement';
  if (!row.c) return alloc.policy === 'MANUAL' ? 'Sans choix : à placer manuellement' : 'Non affecté(e)';
  const notes = [];
  if (r.reason === 'CAPACITY') notes.push('1er choix complet');
  else if (r.reason === 'QUOTA') notes.push("Quota minimum d'une autre filière");
  if (r.source === 'TIEBREAK') notes.push('Égalité départagée');
  else if (tie && tie.decisive && !tie.resolved) notes.push('Égalité non départagée (ordre alphabétique)');
  return notes.join(' ; ');
}

// =========================================================================
// [V2] CONTEXTE ADMINISTRATEUR ET VUE D'ENSEMBLE
// =========================================================================

function adminContext_(ss, fresh) {
  const diag = {};
  const props = scriptProps_(); // [V2] avant toute lecture des feuilles (liste des spécialités en vigueur)
  let snap;
  if (fresh) {
    // Lecture fraîche (sans le cache de 30 s) puis remise en cache, sous verrou
    snap = withScriptLock_(function() {
      const s = readSnapshot_(ss, diag);
      putSnapshot_(s);
      return s;
    });
  } else {
    snap = loadSnapshot_();
  }
  return contextFrom_(ss, props, snap, diag);
}

function contextFrom_(ss, props, snap, diag) {
  const ties = readTieBreaks_(ss);
  const forced = readOverrides_(ss);
  const tieOrders = {};
  Object.keys(ties).forEach(function(gk) { tieOrders[gk] = ties[gk].keys; });
  const forcedMap = {};
  Object.keys(forced).forEach(function(k) { forcedMap[k] = forced[k].branch; });
  return {
    ss: ss, props: props, snap: snap, diag: diag || {},
    rules: rules_(props), policy: undecidedPolicy_(props), lock: choicesLock_(props),
    ties: ties, tieOrders: tieOrders, forced: forced, forcedMap: forcedMap,
    history: readHistory_(ss)
  };
}

function allocateCtx_(ctx, rules) {
  return allocate_(ctx.snap.rows, rules || ctx.rules, ctx.tieOrders, ctx.forcedMap, ctx.policy);
}

function adminOverview_(ss) {
  return buildOverview_(adminContext_(ss, true));
}

function buildOverview_(ctx) {
  const ss = ctx.ss;
  const rows = ctx.snap.rows;
  const N = rows.length;
  const tz = Session.getScriptTimeZone();
  const rules = ctx.rules;
  const lock = ctx.lock;
  const alloc = allocateCtx_(ctx);
  const sum = allocationSummary_(rows, alloc);
  const keys = alloc.keys;
  const histByKey = groupHistory_(ctx.history);

  const tieOf = {};
  alloc.ties.forEach(function(t) { t.members.forEach(function(i) { tieOf[i] = t; }); });

  let sheetNames = [];
  try { sheetNames = ss.getSheets().map(function(s) { return s.getName(); }); } catch (e) { sheetNames = []; }
  const frozen = frozenSheets_(ctx.props).map(function(f) {
    return { sheet: f.sheet, at: f.at, by: f.by, exists: sheetNames.indexOf(f.sheet) !== -1 };
  });
  let spreadsheetUrl = '';
  try { spreadsheetUrl = ss.getUrl(); } catch (e) { spreadsheetUrl = ''; }
  const dl = lock.deadline ? Date.parse(lock.deadline) : null;

  const roster = alloc.order.map(function(i) {
    const r = rows[i], a = alloc.res[i], key = keys[i];
    const hist = histByKey[key] || [];
    const lastHist = hist.length ? hist[hist.length - 1] : null;
    const flags = [];
    if (r.c && lastHist && lastHist.source === 'ADMIN' && sameChoices_(lastHist.choices, r.c)) flags.push('CHOICES_BY_ADMIN');
    if (ctx.forced[key] && a.source === 'MANUAL') flags.push('FORCED');
    if (tieOf[i]) flags.push('TIED');
    if (!r.c) flags.push('PENDING');
    return {
      name: r.h, grade: r.g, rank: a.rank, email: r.e || null,
      choices: r.c ? r.c.slice() : null, savedAt: isoOrNull_(r.t),
      assigned: a.branch, choiceRank: a.choiceRank, source: a.source, reason: a.reason,
      forcedReason: ctx.forced[key] ? ctx.forced[key].reason : null,
      forcedBranch: ctx.forced[key] ? ctx.forced[key].branch : null,
      flags: flags
    };
  });

  const pending = alloc.order.filter(function(i) { return !rows[i].c; }).map(function(i) {
    return { name: rows[i].h, grade: rows[i].g, rank: alloc.res[i].rank, assigned: alloc.res[i].branch, email: rows[i].e || null };
  });

  const ties = alloc.ties.map(function(t) {
    const stored = ctx.ties[gradeKey_(t.grade)] || null;
    return {
      grade: t.grade, decisive: t.decisive, resolved: t.resolved, stale: t.stale,
      reason: stored ? stored.reason : null, by: stored ? stored.admin : null, at: stored ? isoOrNull_(stored.at) : null,
      members: t.members.map(function(i) {
        return { name: rows[i].h, choices: rows[i].c ? rows[i].c.slice() : null, assigned: alloc.res[i].branch,
          choiceRank: alloc.res[i].choiceRank, source: alloc.res[i].source, rank: alloc.res[i].rank };
      })
    };
  });

  return {
    access: 'ADMIN',
    me: { email: activeEmail_() },
    serverTime: new Date().toISOString(),
    timeZone: tz,
    config: {
      branches: BRANCHES.slice(),
      expectedClassSize: PROGRAM.classSize,
      // [V2] Formation et bornes de la liste des spécialités (carte « Formation et spécialités »)
      program: {
        name: PROGRAM.name, classSize: PROGRAM.classSize, specialtiesInvalid: PROGRAM.branchesInvalid,
        defaultName: DEFAULT_PROGRAM_NAME, defaultClassSize: CLASS_SIZE, defaultBranches: DEFAULT_BRANCHES.slice(),
        minBranches: MIN_BRANCHES, maxBranches: MAX_BRANCHES, nameMaxLength: PROGRAM_NAME_MAX_LENGTH, branchMaxLength: BRANCH_NAME_MAX_LENGTH,
        builtBy: BUILT_BY_TEXT
      },
      spreadsheetUrl: spreadsheetUrl,
      // [V2] Règles communes + places de chaque filière (perBranch : min, max | null, own, floor, ceiling)
      rules: Object.assign(rulesOut_(rules, N), { defaultMin: MIN_SEATS, defaultMax: MAX_SEATS, limitsInvalid: !!rules.limitsInvalid }),
      deadline: lock.deadline,
      deadlineLocal: dl !== null ? Utilities.formatDate(new Date(dl), tz, 'yyyy-MM-dd HH:mm') : null,
      deadlineInvalid: lock.deadlineInvalid,
      deadlineRaw: lock.deadlineInvalid ? String(ctx.props[DEADLINE_PROPERTY] || '').trim().slice(0, 100) : null, // [V2]
      locked: lock.locked,
      specialtiesInvalid: lock.specialtiesInvalid, // [V2]
      manualLock: lock.manualLock,
      deadlinePassed: lock.deadlinePassed,
      studentPageOpen: studentPageOpen_(ctx.props),
      undecidedPolicy: ctx.policy,
      announcement: announcement_(ctx.props),
      results: { frozen: frozen, published: publishedSheet_(ctx.props) },
      mail: mailInfo_(ctx.snap),
      studentUrl: publicUrl_(ctx.props),
      properties: settingsReport_(ctx.props), // [V2]
      admins: adminEmails_(ctx.props), // [V2] liste en vigueur (propriété ADMIN_EMAILS, sinon celle du code)
      version: APP_VERSION,
      deployment: deploymentInfo_(ctx.props)
    },
    participation: participation_(rows, keys, histByKey, tz),
    demand: demand_(rows),
    allocation: { perBranch: sum.perBranch, satisfaction: sum.satisfaction, unresolvedTies: alloc.unresolvedTies },
    attention: { pending: pending, bubble: bubble_(rows, alloc), ties: ties },
    health: health_(ctx, alloc),
    roster: roster
  };
}

// [V2] Lien utilisé par l'interface et par les rappels : lien de test, ou autre déploiement que celui-ci ?
function deploymentInfo_(props) {
  const url = webAppUrl_();
  const custom = String(props[PUBLIC_URL_PROPERTY] || '').trim();
  const a = deploymentId_(url), b = deploymentId_(custom);
  return {
    url: url,
    isDev: isDevUrl_(url),
    publicUrlIsDev: !!custom && isDevUrl_(custom),
    publicUrlOtherDeployment: !!(a && b && a !== b)
  };
}

function participation_(rows, keys, histByKey, tz) {
  let saved = 0, last = null;
  const firstSaves = [];
  // [V2] Les lignes SPECIALITES (classement converti après un changement de la liste) ne sont pas des choix d'étudiant
  const own = function(h) { return (h || []).filter(function(x) { return x.source !== 'SPECIALITES'; }); };
  rows.forEach(function(r, i) {
    if (!r.c) return;
    saved++;
    if (typeof r.t === 'number' && (last === null || r.t > last)) last = r.t;
    const h = own(histByKey[keys[i]]);
    const t0 = h.length ? h[0].at : r.t;
    if (typeof t0 === 'number' && isFinite(t0)) firstSaves.push(t0);
  });
  const known = {};
  keys.forEach(function(k) { known[k] = true; });
  let changed = 0;
  Object.keys(histByKey).forEach(function(k) {
    if (!known[k]) return;
    const distinct = {};
    own(histByKey[k]).forEach(function(h) { distinct[h.choices.join('|')] = true; });
    if (Object.keys(distinct).length >= 2) changed++;
  });
  firstSaves.sort(function(a, b) { return a - b; });
  return {
    classSize: rows.length,
    choicesSaved: saved,
    pending: rows.length - saved,
    firstSavedAt: firstSaves.length ? isoOrNull_(firstSaves[0]) : null,
    lastSavedAt: isoOrNull_(last),
    changedMind: changed,
    timeline: timeline_(firstSaves, tz)
  };
}

// Courbe cumulée des premiers enregistrements (par heure sur 48 h au plus, sinon par jour)
function timeline_(times, tz) {
  const ts = times.slice().sort(function(a, b) { return a - b; });
  if (!ts.length) return { unit: 'hour', points: [] };
  const unit = ts[ts.length - 1] - ts[0] <= 48 * 3600000 ? 'hour' : 'day';
  const floor = unit === 'hour'
    ? function(t) { return Math.floor(t / 3600000) * 3600000; }
    : function(t) { return dayStart_(t, tz); };
  const next = unit === 'hour'
    ? function(t) { return t + 3600000; }
    : function(t) { return dayStart_(t + 36 * 3600000, tz); };
  const buckets = {};
  ts.forEach(function(t) { const k = floor(t); buckets[k] = (buckets[k] || 0) + 1; });
  const end = floor(ts[ts.length - 1]);
  const points = [];
  let cumulative = 0;
  for (let t = floor(ts[0]), guard = 0; t <= end && guard < 400; t = next(t), guard++) {
    const added = buckets[t] || 0;
    cumulative += added;
    points.push({ t: new Date(t).toISOString(), added: added, cumulative: cumulative });
  }
  return { unit: unit, points: points };
}

// [V2] Effectif garanti à chaque filière : ce que les n − 1 autres ne peuvent pas absorber
// [V2] Tous les classements possibles, dans l'ordre lexicographique de la liste (6 pour 3 filières)
function rankingsOf_(items) {
  if (items.length <= 1) return [items.slice()];
  const out = [];
  items.forEach(function(first, i) {
    rankingsOf_(items.slice(0, i).concat(items.slice(i + 1))).forEach(function(rest) { out.push([first].concat(rest)); });
  });
  return out;
}

function demand_(rows) {
  // Jusqu'à 4 filières (24 classements), tous sont listés ; au-delà, seuls ceux qui ont été choisis
  const all = BRANCHES.length <= 4;
  const perms = all ? rankingsOf_(BRANCHES) : [];
  const counted = {};
  rows.forEach(function(r) {
    if (!r.c) return;
    const k = r.c.join('\n');
    if (!(k in counted)) { counted[k] = 0; if (!all) perms.push(r.c.slice()); }
    counted[k]++;
  });
  const rankings = perms.map(function(p, k) {
    return { order: p, count: counted[p.join('\n')] || 0, k: k };
  });
  rankings.sort(function(x, y) { return (y.count - x.count) || (x.k - y.k); });
  return {
    perBranch: stats_({ rows: rows }),
    rankings: rankings.map(function(r) { return { order: r.order, count: r.count }; })
  };
}

function health_(ctx, alloc) {
  const snap = ctx.snap;
  const rows = snap.rows;
  const diag = ctx.diag || {};
  // Paires de noms que l'appariement par le nom pourrait confondre (lignes sans e-mail) :
  // [V2] tous les mots de l'un se retrouvent, en mots entiers, dans l'autre (cf. namePieceMatches_)
  const ambiguous = [];
  const plain = rows.filter(function(r) { return !r.e; });
  const words = plain.map(function(r) { return nameWords_(r.h); });
  for (let a = 0; a < plain.length && ambiguous.length < 50; a++) {
    for (let b = a + 1; b < plain.length && ambiguous.length < 50; b++) {
      const aInB = words[a].length && words[a].every(function(w) { return wordRunMatch_(w, words[b]); });
      const bInA = words[b].length && words[b].every(function(w) { return wordRunMatch_(w, words[a]); });
      if (aInB || bInA) ambiguous.push({ a: plain[a].h, b: plain[b].h });
    }
  }
  const known = {};
  rows.forEach(function(r) { known[squash_(r.h)] = true; });
  // [V2] Feuille publiée supprimée à la main : les étudiants ne voient plus rien, les choix restent clos
  const pub = publishedSheet_(ctx.props);
  let publishedSheetMissing = false;
  if (pub) {
    try { publishedSheetMissing = !ctx.ss.getSheetByName(pub.sheet); } catch (e) { publishedSheetMissing = false; }
  }
  return {
    loaded: rows.length,
    expected: PROGRAM.classSize,
    specialtiesInvalid: PROGRAM.branchesInvalid, // [V2] propriété SPECIALTIES illisible
    preferencesLayout: diag.preferencesLayout || null, // [V2] Preferences ne suit pas la liste des spécialités
    publishedSheetMissing: publishedSheetMissing,
    staleProperties: staleSettings_(ctx.props),
    skipped: (snap.skipped || []).slice(),
    orphanPreferences: diag.orphanPreferences || [],
    duplicatePreferences: diag.duplicatePreferences || [],
    invalidPreferences: diag.invalidPreferences || [],
    ambiguousNames: ambiguous,
    emailColumn: snap.emailColumn || { present: false, filled: 0 },
    badEmails: snap.badEmails || [],
    staleOverrides: Object.keys(ctx.forced).filter(function(k) { return !known[k]; }).map(function(k) { return ctx.forced[k].name; }),
    forcedOverflow: alloc.forcedOverflow.map(function(i) { return rows[i].h; }),
    staleTieBreaks: alloc.ties.filter(function(t) { return t.stale; }).map(function(t) { return t.grade; })
  };
}

function mailInfo_(snap) {
  let quota = null;
  try {
    quota = MailApp.getRemainingDailyQuota();
  } catch (e) {
    return { available: false, reason: "Service d'envoi indisponible : autorisez l'envoi d'e-mails depuis l'éditeur.", remainingQuota: null };
  }
  if (!snap.emailColumn || !snap.emailColumn.present || !snap.emailColumn.filled) {
    return { available: false, reason: 'Renseignez la colonne « Email » de la feuille Responses pour envoyer des rappels.', remainingQuota: quota };
  }
  if (quota <= 0) {
    return { available: false, reason: "Quota d'envoi quotidien épuisé : réessayez demain.", remainingQuota: quota };
  }
  return { available: true, reason: null, remainingQuota: quota };
}

// =========================================================================
// [V2] API ADMINISTRATEUR : LECTURES
// =========================================================================

function adminGetOverview() {
  requireAdmin_();
  return adminOverview_(SpreadsheetApp.getActiveSpreadsheet());
}

function adminGetStatusTally() {
  requireAdmin_();
  const cache = CacheService.getScriptCache();
  try {
    const hit = cache.get(TALLY_CACHE_KEY);
    // [V2] ignoré si les règles ont changé depuis (ex. propriété modifiée hors de l'interface)
    if (hit) {
      const parsed = JSON.parse(hit);
      const now = rules_();
      if (parsed.rulesKey === rulesKey_(now) && parsed.branchesKey === branchesKey_()) return parsed;
    }
  } catch (e) { Logger.log('Tally cache read failed: ' + e); }
  const snap = loadSnapshot_();
  const rules = rules_();
  const counts = { SECURE: 0, FALLBACK_SECURED: 0, VULNERABLE: 0, NO_CHOICES: 0 };
  const byStudent = {};
  snap.rows.forEach(function(r, u) {
    let status = 'NO_CHOICES';
    if (r.c) status = project_(snap, u, r.c, r.c, coverage_(snap, u), rules).status;
    counts[status] = (counts[status] || 0) + 1;
    byStudent[r.h] = status;
  });
  const out = { computedAt: new Date().toISOString(), counts: counts, byStudent: byStudent, rulesKey: rulesKey_(rules), branchesKey: branchesKey_() };
  try { cache.put(TALLY_CACHE_KEY, JSON.stringify(out), TALLY_CACHE_SECONDS); } catch (e) { Logger.log('Tally cache put failed: ' + e); }
  return out;
}

function adminExplainStudent(name) {
  requireAdmin_();
  const ctx = adminContext_(SpreadsheetApp.getActiveSpreadsheet(), false);
  const snap = ctx.snap;
  const u = findStudent_(snap, name);
  const me = snap.rows[u];
  const key = squash_(me.h);
  const alloc = allocateCtx_(ctx);
  const sum = allocationSummary_(snap.rows, alloc);
  const r = alloc.res[u];
  const coverage = coverage_(snap, u);
  const history = (groupHistory_(ctx.history)[key] || []).slice().reverse().map(function(h) {
    return { at: isoOrNull_(h.at), choices: h.choices.slice(), source: h.source, author: h.author || null };
  });
  return {
    name: me.h,
    grade: me.g,
    rank: r.rank,
    email: me.e || null,
    savedChoices: me.c ? me.c.slice() : null,
    savedAt: isoOrNull_(me.t),
    history: history,
    coverage: coverage,
    projection: project_(snap, u, me.c, me.c, coverage, ctx.rules),
    allocation: {
      branch: r.branch,
      choiceRank: r.choiceRank,
      source: r.source,
      reason: r.reason,
      explanation: explainAllocation_(me, r, sum, alloc, ctx.forced[key], snap.rows.length)
    },
    forced: ctx.forced[key] ? { branch: ctx.forced[key].branch, reason: ctx.forced[key].reason, by: ctx.forced[key].admin, at: isoOrNull_(ctx.forced[key].at) } : null
  };
}

// [V2] Règles applicables à N étudiants, sinon erreur (premier problème)
function validateRules_(rules, N) {
  const problems = rulesProblems_(rules, N);
  if (problems.length) throw new Error(problems[0]);
}

// [V2] req : {limits: {spécialité: {min, max | null}}} (une entrée par spécialité) ou {min, max} pour toutes
function adminWhatIf(req) {
  requireAdmin_();
  const ctx = adminContext_(SpreadsheetApp.getActiveSpreadsheet(), false);
  const scenarioRules = requestedRules_(req, ctx.rules);
  const rows = ctx.snap.rows;
  const N = rows.length;
  const warnings = rulesProblems_(scenarioRules, N);
  const feasible = warnings.length === 0;
  const forcedCount = {};
  Object.keys(ctx.forcedMap).forEach(function(k) { forcedCount[ctx.forcedMap[k]] = (forcedCount[ctx.forcedMap[k]] || 0) + 1; });
  Object.keys(forcedCount).forEach(function(b) {
    const k = BRANCHES.indexOf(b);
    if (k !== -1 && forcedCount[b] > scenarioRules.maxs[k]) {
      warnings.push(forcedCount[b] + ' affectation(s) imposée(s) en ' + b + ' dépassent son maximum : les dernières seraient ignorées.');
    }
  });
  const pendingCount = rows.filter(function(r) { return !r.c; }).length;
  if (pendingCount) {
    warnings.push(pendingCount + ' étudiant(s) sans choix : ' + (ctx.policy === 'LAST'
      ? 'placés en dernier dans les filières qui en ont le plus besoin (politique actuelle).'
      : 'laissés non placés (politique manuelle actuelle).'));
  }

  const cur = allocateCtx_(ctx, ctx.rules);
  const scn = allocateCtx_(ctx, scenarioRules);
  const pack = function(alloc) {
    const s = allocationSummary_(rows, alloc);
    const per = {};
    BRANCHES.forEach(function(b) { per[b] = { count: s.perBranch[b].count, cutoffGrade: s.perBranch[b].cutoffGrade, full: s.perBranch[b].full }; });
    return { rules: rulesOut_(alloc.rules, N), perBranch: per, satisfaction: s.satisfaction, unresolvedTies: alloc.unresolvedTies };
  };
  const changed = cur.order.filter(function(i) { return cur.res[i].branch !== scn.res[i].branch; }).map(function(i) {
    return {
      name: rows[i].h, grade: rows[i].g, from: cur.res[i].branch, to: scn.res[i].branch,
      fromRank: cur.res[i].choiceRank, toRank: scn.res[i].choiceRank
    };
  });
  return {
    rules: rulesOut_(scenarioRules, N),
    same: rulesKey_(scenarioRules) === rulesKey_(ctx.rules), // [V2] déjà les règles en vigueur
    feasible: feasible,
    warnings: warnings,
    summary: { current: pack(cur), scenario: pack(scn) },
    changed: changed
  };
}

function adminGetJournal(req) {
  requireAdmin_();
  req = req || {};
  let limit = toInt_(req.limit);
  let offset = toInt_(req.offset);
  limit = limit === null ? 50 : Math.max(1, Math.min(500, limit));
  offset = offset === null ? 0 : Math.max(0, offset);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JOURNAL_SHEET);
  if (!sh || sh.getLastRow() < 2) return { entries: [], total: 0 };
  const last = sh.getLastRow();
  const total = last - 1;
  if (offset >= total) return { entries: [], total: total };
  // Le plus récent d'abord : on lit le bloc correspondant en partant du bas
  const top = Math.max(2, last - offset - limit + 1);
  const bottom = last - offset;
  const values = sh.getRange(top, 1, bottom - top + 1, 4).getValues().reverse();
  return {
    entries: values.map(function(v) {
      return { at: isoOrNull_(timeMs_(v[0])), admin: String(v[1] || ''), action: String(v[2] || ''), details: String(v[3] || '') };
    }),
    total: total
  };
}

// Tableau commun du gel et de l'export « allocation »
// [V2] En-tête des feuilles Affectation_ : une colonne « Choix k » par spécialité
function allocationHeaders_(n) {
  const out = ['Rang', 'Nom', 'Note'];
  for (let k = 1; k <= n; k++) out.push('Choix ' + k);
  return out.concat(ALLOCATION_TAIL_HEADERS);
}

// Classement d'une ligne sur n colonnes (vides si aucun choix)
function choiceCells_(c) {
  return BRANCHES.map(function(b, k) { return c ? c[k] : ''; });
}

function allocationTable_(ctx, alloc) {
  const rows = ctx.snap.rows;
  const tieOf = {};
  alloc.ties.forEach(function(t) { t.members.forEach(function(i) { tieOf[i] = t; }); });
  const body = alloc.order.map(function(i) {
    const r = rows[i], a = alloc.res[i];
    return [a.rank, r.h, r.g].concat(choiceCells_(r.c), [a.branch || '', a.choiceRank || '', a.source || '',
      sourceComment_(r, a, alloc, ctx.forced[alloc.keys[i]], tieOf[i])]);
  });
  return [allocationHeaders_(BRANCHES.length)].concat(body);
}

function adminExport(kind) {
  requireAdmin_();
  kind = String(kind || '');
  const ctx = adminContext_(SpreadsheetApp.getActiveSpreadsheet(), true);
  const rows = ctx.snap.rows;
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmm');
  const alloc = allocateCtx_(ctx);
  let table, base;

  if (kind === 'allocation') {
    table = allocationTable_(ctx, alloc);
    base = 'affectation_provisoire';
  } else if (kind.indexOf('branch:') === 0) {
    const b = kind.slice(7);
    if (BRANCHES.indexOf(b) === -1) throw new Error('Filière inconnue : ' + b + '.');
    table = [['Rang', 'Nom', 'Note', 'Rang du choix obtenu', 'Origine']].concat(
      alloc.order.filter(function(i) { return alloc.res[i].branch === b; }).map(function(i) {
        const a = alloc.res[i];
        return [a.rank, rows[i].h, rows[i].g, a.choiceRank || '', a.source || ''];
      }));
    base = 'filiere_' + squash_(b);
  } else if (kind === 'demand') {
    const d = demand_(rows);
    const ranks = BRANCHES.map(function(b, k) { return k + 1; });
    table = [['Filière'].concat(ranks.map(ordinalFr_))].concat(BRANCHES.map(function(b) {
      return [b].concat(ranks.map(function(k) { return d.perBranch[b]['c' + k]; }));
    }));
    table.push([]);
    table.push(['Classement complet', 'Nombre d\'étudiants']);
    d.rankings.forEach(function(r) { table.push([r.order.join(' > '), r.count]); });
    base = 'demande';
  } else if (kind === 'pending') {
    table = [['Rang', 'Nom', 'Note', 'Email']].concat(alloc.order.filter(function(i) { return !rows[i].c; }).map(function(i) {
      return [alloc.res[i].rank, rows[i].h, rows[i].g, rows[i].e || ''];
    }));
    base = 'sans_choix';
  } else if (kind === 'roster') {
    table = [['Rang', 'Nom', 'Note', 'Email'].concat(BRANCHES.map(function(b, k) { return 'Choix ' + (k + 1); }),
      ['Enregistré le', 'Filière provisoire', 'Rang du choix', 'Origine'])].concat(alloc.order.map(function(i) {
      const r = rows[i], a = alloc.res[i];
      return [a.rank, r.h, r.g, r.e || ''].concat(choiceCells_(r.c), [
        r.t ? Utilities.formatDate(new Date(r.t), tz, 'yyyy-MM-dd HH:mm') : '',
        a.branch || '', a.choiceRank || '', a.source || '']);
    }));
    base = 'liste_complete';
  } else {
    throw new Error("Type d'export inconnu : " + kind + '.');
  }
  return { filename: base + '_' + stamp + '.csv', mimeType: 'text/csv;charset=utf-8', content: toCsv_(table) };
}

// CSV : UTF-8 avec BOM, « ; », virgule décimale, CRLF, textes entre guillemets, garde anti-formule.
// [V2] Un nombre décimal (« 17,74 ») est lui aussi entre guillemets : un tableur réglé pour couper
// aussi sur la virgule le séparerait sinon en deux cellules et décalerait toute la ligne d'une colonne.
function toCsv_(table) {
  return '\uFEFF' + table.map(function(row) {
    return row.map(function(v) {
      if (typeof v === 'number' && isFinite(v)) {
        // Deux décimales, comme à l'écran (« 15,125 » serait lu 15125 par un tableur non français)
        const n = String(Math.round(v * 100) / 100).replace('.', ',');
        return n.indexOf(',') === -1 ? n : '"' + n + '"';
      }
      let s = String(v === undefined || v === null ? '' : v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(';');
  }).join('\r\n') + '\r\n';
}

function adminTestEmail(email) {
  requireAdmin_();
  const target = String(email || '').toLowerCase().trim();
  if (!target) throw new Error('Saisissez une adresse à tester.');
  const snap = loadSnapshot_();
  // Exactement la fonction utilisée à la connexion des étudiants
  const out = resolveStudent_(target, snap.rows);
  out.isAdmin = isAdmin_(target);
  out.domainOk = target.endsWith('@' + DOMAIN);
  return out;
}

function reminderDefaults_() {
  const count = ['deux', 'trois', 'quatre', 'cinq'][BRANCHES.length - 2] || String(BRANCHES.length);
  return {
    subject: 'Rappel : classez vos filières de spécialité (' + PROGRAM.name + ')',
    body: 'Bonjour {nom},\n\n' +
      "Vous n'avez pas encore enregistré votre classement des filières de spécialité (" + BRANCHES.join(', ') + ').\n\n' +
      'Date limite : {date_limite}\n' +
      'Lien : {lien}\n\n' +
      'Connectez-vous avec votre compte @' + DOMAIN + ', classez les ' + count + ' filières, puis appuyez sur « Enregistrer mes choix ».\n\n' +
      'Cordialement,\nLa coordination ' + PROGRAM.name
  };
}

function adminPreviewReminders() {
  requireAdmin_();
  const snap = loadSnapshot_();
  const pending = snap.rows.filter(function(r) { return !r.c; });
  const info = mailInfo_(snap);
  const d = reminderDefaults_();
  return {
    recipients: pending.filter(function(r) { return !!r.e; }).map(function(r) { return { name: r.h, email: r.e }; }),
    missingEmail: pending.filter(function(r) { return !r.e; }).map(function(r) { return r.h; }),
    remainingQuota: info.remainingQuota,
    available: info.available,
    reason: info.reason,
    defaultSubject: d.subject,
    defaultBody: d.body
  };
}

// =========================================================================
// [V2] API ADMINISTRATEUR : ÉCRITURES
// Sous verrou, une ligne de Journal, cache invalidé, puis {ok, notice, overview}.
// =========================================================================

function adminWrite_(admin, action, fn) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let overview = null;
  const out = withScriptLock_(function() {
    const res = fn(ss, scriptProps_(), admin) || {};
    if (res.details !== undefined && res.details !== null) appendJournal_(ss, admin, action, res.details);
    invalidateSnapshot_();
    invalidateTally_();
    if (res.official) invalidateOfficial_();
    // [V2] Vue d'ensemble construite sous ce même verrou (pas de second verrou à attendre).
    // La modification est déjà enregistrée : une erreur ici ne doit pas la faire passer pour échouée.
    overview = overviewAfterWrite_(ss);
    return res;
  });
  const result = {
    ok: true,
    notice: (out.notice || 'Modification enregistrée.') + (overview ? '' : ' (Affichage non actualisé : rechargez la page.)'),
    overview: overview
  };
  if (out.extra) Object.keys(out.extra).forEach(function(k) { result[k] = out.extra[k]; });
  return result;
}

// [V2] Lecture fraîche + vue d'ensemble, à appeler sous verrou ; null en cas d'erreur
function overviewAfterWrite_(ss) {
  try {
    const diag = {};
    // [V2] Propriétés relues AVANT les feuilles : une liste de spécialités modifiée doit servir à la lecture
    const props = scriptProps_();
    const snap = readSnapshot_(ss, diag);
    putSnapshot_(snap);
    return buildOverview_(contextFrom_(ss, props, snap, diag));
  } catch (e) {
    Logger.log("Vue d'ensemble non construite après écriture : " + e);
    return null;
  }
}

function adminSetDeadline(local, unlock) {
  const admin = requireAdmin_();
  let text = null;
  if (local !== null && local !== undefined && String(local).trim() !== '') {
    text = String(local).trim().replace('T', ' ');
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(text) || !parseDeadline_(text)) {
      throw new Error("Date limite invalide : format attendu AAAA-MM-JJ HH:mm (heure de l'établissement).");
    }
  }
  unlock = unlock === true;
  return adminWrite_(admin, 'DATE_LIMITE', function(ss, props) {
    const lock = choicesLock_(props);
    const d = text ? parseDeadline_(text) : null;
    const newManual = unlock ? false : lock.manualLock;
    const newPassed = !!d && Date.now() >= d.getTime();
    if (lock.published && !newManual && !newPassed) throw new Error(UNPUBLISH_FIRST_MESSAGE);
    const store = PropertiesService.getScriptProperties();
    if (text) store.setProperty(DEADLINE_PROPERTY, text);
    else store.deleteProperty(DEADLINE_PROPERTY);
    if (unlock) store.deleteProperty(LOCKED_PROPERTY); // [V2] verrou levé = propriété supprimée
    const tz = Session.getScriptTimeZone();
    const open = !newManual && !newPassed;
    return {
      notice: (text ? 'Date limite fixée au ' + fmtLocalFr_(d.getTime(), tz) + '.' : 'Date limite supprimée.') +
        (unlock ? ' Verrou manuel levé.' : '') + (open ? ' Les choix sont ouverts.' : ' Les choix sont clos.'),
      details: (text ? 'Date limite : ' + text + ' (' + tz + ')' : 'Date limite supprimée') + (unlock ? ' ; verrou manuel levé' : '')
    };
  });
}

function adminSetLocked(locked) {
  const admin = requireAdmin_();
  if (typeof locked !== 'boolean') throw new Error('Valeur de verrou invalide.');
  return adminWrite_(admin, 'VERROU', function(ss, props) {
    const lock = choicesLock_(props);
    if (!locked && lock.published) throw new Error(UNPUBLISH_FIRST_MESSAGE);
    setFlag_(LOCKED_PROPERTY, locked); // [V2] levé = propriété supprimée
    let notice;
    if (locked) notice = "Choix clos : plus aucun enregistrement étudiant n'est accepté.";
    else if (lock.deadlinePassed || lock.deadlineInvalid) notice = 'Verrou manuel levé, mais la date limite est dépassée : les choix restent clos. Repoussez la date limite pour les rouvrir.';
    else notice = 'Choix rouverts : les étudiants peuvent de nouveau enregistrer.';
    return { notice: notice, details: locked ? 'Verrou manuel activé' : 'Verrou manuel levé' };
  });
}

function adminSetStudentPageOpen(open) {
  const admin = requireAdmin_();
  if (typeof open !== 'boolean') throw new Error('Valeur invalide.');
  return adminWrite_(admin, 'PAGE_ETUDIANTE', function() {
    setFlag_(STUDENT_PAGE_OPEN_PROPERTY, open); // [V2] fermée = propriété supprimée
    return {
      notice: open ? 'Page étudiante ouverte : les étudiants voient désormais le tableau de bord.' : "Page étudiante fermée : les étudiants voient la page d'attente.",
      details: open ? 'Page étudiante ouverte' : 'Page étudiante fermée'
    };
  });
}

function adminSetUndecidedPolicy(policy) {
  const admin = requireAdmin_();
  const p = String(policy || '').trim().toUpperCase();
  if (UNDECIDED_POLICIES.indexOf(p) === -1) throw new Error('Politique inconnue : choisissez LAST ou MANUAL.');
  return adminWrite_(admin, 'POLITIQUE_SANS_CHOIX', function() {
    setOrDefault_(UNDECIDED_POLICY_PROPERTY, p, 'LAST'); // [V2] LAST (défaut) = propriété supprimée
    return {
      notice: p === 'LAST'
        ? 'Les étudiants sans choix seront placés en dernier, dans les filières qui en ont le plus besoin.'
        : "Les étudiants sans choix resteront non placés jusqu'à une décision manuelle.",
      details: 'Politique sans choix : ' + p
    };
  });
}

// [V2] Même format que adminWhatIf : places de chaque spécialité, ou {min, max} pour toutes
function adminSetRules(req) {
  const admin = requireAdmin_();
  return adminWrite_(admin, 'REGLES', function(ss, props) {
    const before = rules_(props);
    const next = requestedRules_(req, before);
    validateRules_(next, readSnapshot_(ss).rows.length);
    const forced = readOverrides_(ss);
    const perBranch = {};
    Object.keys(forced).forEach(function(k) { perBranch[forced[k].branch] = (perBranch[forced[k].branch] || 0) + 1; });
    Object.keys(perBranch).forEach(function(b) {
      const k = BRANCHES.indexOf(b);
      if (k !== -1 && perBranch[b] > next.maxs[k]) {
        throw new Error(perBranch[b] + ' affectations imposées en ' + b + ' dépassent son maximum (' + next.maxs[k] + ') : retirez-en d\'abord.');
      }
    });
    // [V2] Une règle égale à sa valeur par défaut n'est pas stockée ; places propres : SEAT_LIMITS
    setOrDefault_(MIN_SEATS_PROPERTY, next.min, MIN_SEATS);
    setOrDefault_(MAX_SEATS_PROPERTY, next.max, MAX_SEATS);
    saveSeatLimits_(next.limits);
    return {
      notice: 'Places enregistrées : ' + describeRules_(next) + '. L’affectation provisoire est recalculée.',
      details: describeRules_(before) + ' → ' + describeRules_(next)
    };
  });
}

function adminSetAnnouncement(req) {
  const admin = requireAdmin_();
  let text = '';
  let level = 'info';
  if (req !== null && req !== undefined) {
    text = cleanText_(req.text, ANNOUNCEMENT_MAX_LENGTH, "L'annonce", true);
    level = req.level === 'warning' ? 'warning' : 'info';
  }
  return adminWrite_(admin, 'ANNONCE', function() {
    const store = PropertiesService.getScriptProperties();
    if (!text) {
      store.deleteProperty(ANNOUNCEMENT_PROPERTY);
      return { notice: 'Annonce retirée.', details: 'Annonce retirée' };
    }
    store.setProperty(ANNOUNCEMENT_PROPERTY, JSON.stringify({ text: text, level: level, updatedAt: new Date().toISOString() }));
    return { notice: 'Annonce publiée : elle apparaît sur la page des étudiants.', details: '[' + level + '] ' + text };
  });
}

function adminSaveTieBreak(req) {
  const admin = requireAdmin_();
  req = req || {};
  const grade = toGrade_(req.grade);
  if (typeof grade !== 'number' || !isFinite(grade)) throw new Error('Note invalide.');
  const reason = requireReason_(req.reason);
  if (!Array.isArray(req.order)) throw new Error('Ordre de départage invalide.');
  return adminWrite_(admin, 'DEPARTAGE', function(ss) {
    const snap = readSnapshot_(ss);
    const members = snap.rows.filter(function(r) { return r.g === grade; });
    if (members.length < 2) throw new Error('Aucune égalité à la note ' + fmtGradeFr_(grade) + '.');
    const memberKeys = members.map(function(r) { return squash_(r.h); });
    const orderKeys = req.order.map(squash_);
    const valid = orderKeys.length === memberKeys.length &&
      orderKeys.every(function(k, i) { return memberKeys.indexOf(k) !== -1 && orderKeys.indexOf(k) === i; });
    if (!valid) throw new Error("L'ordre doit contenir exactement les " + members.length + ' étudiants à égalité (la liste a peut-être changé : actualisez).');
    const names = orderKeys.map(function(k) { return members[memberKeys.indexOf(k)].h; });
    const sh = getOrCreateSheet_(ss, TIEBREAK_SHEET);
    const now = new Date();
    const kept = readRows_(sh, 6).filter(function(row) { return toGrade_(row[0]) !== grade; });
    const fresh = names.map(function(n, k) { return [grade, k + 1, n, reason, admin, now]; });
    rewriteRows_(sh, kept.concat(fresh), 6);
    return {
      notice: 'Départage enregistré pour la note ' + fmtGradeFr_(grade) + '.',
      details: 'Note ' + fmtGradeFr_(grade) + ' : ' + names.join(' > ') + ' — raison : ' + reason
    };
  });
}

function adminClearTieBreak(grade) {
  const admin = requireAdmin_();
  const g = toGrade_(grade);
  if (typeof g !== 'number' || !isFinite(g)) throw new Error('Note invalide.');
  return adminWrite_(admin, 'DEPARTAGE_SUPPRIME', function(ss) {
    const sh = ss.getSheetByName(TIEBREAK_SHEET);
    const all = sh ? readRows_(sh, 6) : [];
    const kept = all.filter(function(row) { return toGrade_(row[0]) !== g; });
    if (kept.length === all.length) throw new Error('Aucun départage enregistré pour la note ' + fmtGradeFr_(g) + '.');
    rewriteRows_(sh, kept, 6);
    return {
      notice: 'Départage supprimé pour la note ' + fmtGradeFr_(g) + ' : retour à l\'ordre alphabétique.',
      details: 'Note ' + fmtGradeFr_(g)
    };
  });
}

function adminSetChoicesFor(req) {
  const admin = requireAdmin_();
  req = req || {};
  const reason = requireReason_(req.reason);
  const choices = normalizeChoices_(req.choices);
  if (!choices) throw new Error(invalidChoicesMessage_());
  return adminWrite_(admin, 'CHOIX_ADMIN', function(ss, props) {
    assertNotPublished_(props);
    const snap = readSnapshot_(ss);
    const u = findStudent_(snap, req.name);
    const name = snap.rows[u].h;
    const before = snap.rows[u].c;
    if (sameChoices_(before, choices)) {
      return { notice: 'Les choix de ' + name + ' sont déjà ceux-ci : rien n\'a changé.', details: null };
    }
    writeChoices_(ss, name, choices, new Date(), 'ADMIN', admin);
    return {
      notice: 'Choix de ' + name + ' enregistrés : ' + choices.join(' > ') + '.',
      details: name + ' : ' + (before ? before.join(' > ') : 'aucun choix') + ' → ' + choices.join(' > ') + ' — raison : ' + reason
    };
  });
}

function adminForceAssign(req) {
  const admin = requireAdmin_();
  req = req || {};
  const reason = requireReason_(req.reason);
  const branch = (req.branch === null || req.branch === undefined || req.branch === '') ? null : String(req.branch).trim();
  if (branch !== null && BRANCHES.indexOf(branch) === -1) throw new Error('Filière inconnue : ' + branch + '.');
  return adminWrite_(admin, 'AFFECTATION_IMPOSEE', function(ss, props) {
    assertNotPublished_(props);
    const snap = readSnapshot_(ss);
    const u = findStudent_(snap, req.name);
    const name = snap.rows[u].h;
    const key = squash_(name);
    const rules = rules_(props);
    const active = readOverrides_(ss);
    const current = active[key] ? active[key].branch : null;
    if (branch === null && current === null) throw new Error(name + " n'a pas d'affectation imposée.");
    if (branch !== null) {
      const others = Object.keys(active).filter(function(k) { return k !== key && active[k].branch === branch; }).length;
      const cap = rules.maxs[BRANCHES.indexOf(branch)];
      if (others >= cap) {
        throw new Error('Impossible : ' + branch + ' compte déjà ' + others + ' affectations imposées (maximum ' + cap + ').');
      }
    }
    const sh = getOrCreateSheet_(ss, OVERRIDES_SHEET);
    const data = readRows_(sh, 6);
    if (data.length) {
      // Désactive en une écriture de colonne les lignes de cet étudiant
      sh.getRange(2, 6, data.length, 1).setValues(data.map(function(row) {
        return [squash_(row[0]) === key ? 'NON' : sanitizeCell_(String(row[5] || ''))];
      }));
    }
    if (branch !== null) {
      sh.appendRow([sanitizeCell_(name), branch, sanitizeCell_(reason), sanitizeCell_(admin), new Date(), 'OUI']);
    }
    return {
      notice: branch !== null ? name + ' est désormais affecté(e) d\'office à ' + branch + '.' : 'Affectation imposée retirée pour ' + name + '.',
      details: name + ' : ' + (current || 'aucune') + ' → ' + (branch || 'aucune') + ' — raison : ' + reason
    };
  });
}

function adminFreezeAllocation(req) {
  const admin = requireAdmin_();
  const ack = (req && req.ack) || {};
  return adminWrite_(admin, 'FIGER', function(ss, props) {
    const ctx = contextFrom_(ss, props, readSnapshot_(ss), {});
    const alloc = allocateCtx_(ctx);
    const rows = ctx.snap.rows;
    const pending = rows.filter(function(r) { return !r.c; }).length;
    if (!ctx.lock.locked && ack.notLocked !== true) throw new Error('Les choix ne sont pas clos : confirmez que vous voulez figer quand même.');
    if (pending && ack.pending !== true) throw new Error(pending + ' étudiant(s) sans choix : confirmez que vous voulez figer quand même.');
    if (alloc.unresolvedTies && ack.ties !== true) throw new Error(alloc.unresolvedTies + ' égalité(s) décisive(s) non départagée(s) : confirmez que vous voulez figer quand même.');
    const tz = Session.getScriptTimeZone();
    const now = new Date();
    const name = ALLOCATION_SHEET_PREFIX + Utilities.formatDate(now, tz, 'yyyyMMdd_HHmm');
    if (ss.getSheetByName(name)) throw new Error('Une affectation a déjà été figée à cette minute (' + name + ') : réessayez dans une minute.');
    const table = allocationTable_(ctx, alloc);
    const width = table[0].length;
    const sh = ss.insertSheet(name);
    // Colonnes texte : Nom, Choix 1..n, Filière affectée, Origine, Commentaire
    const B = BRANCHES.length;
    [2].concat(BRANCHES.map(function(b, k) { return 4 + k; }), [4 + B, 6 + B, 7 + B]).forEach(function(col) {
      sh.getRange(1, col, Math.max(table.length, 2), 1).setNumberFormat('@');
    });
    sh.getRange(1, 1, table.length, width).setValues(table.map(function(r) { return r.map(sanitizeCell_); }));
    sh.getRange(1, 1, 1, width).setFontWeight('bold');
    sh.setFrozenRows(1);
    try { sh.protect().setDescription('Affectation figée le ' + now.toISOString()).setWarningOnly(true); } catch (e) { Logger.log('Protection impossible : ' + e); }
    // [V2] Les feuilles figées supprimées à la main disparaissent de la liste
    const existing = ss.getSheets().map(function(x) { return x.getName(); });
    let list = [{ sheet: name, at: now.toISOString(), by: admin }]
      .concat(frozenSheets_(props).filter(function(f) { return existing.indexOf(f.sheet) !== -1; }));
    // La feuille publiée ne sort jamais de la liste (sinon elle ne pourrait plus être republiée)
    const pubNow = publishedSheet_(props);
    const pubIdx = pubNow ? list.map(function(f) { return f.sheet; }).indexOf(pubNow.sheet) : -1;
    if (pubIdx >= FROZEN_SHEETS_MAX) list = list.slice(0, FROZEN_SHEETS_MAX - 1).concat([list[pubIdx]]);
    list = list.slice(0, FROZEN_SHEETS_MAX);
    PropertiesService.getScriptProperties().setProperty(FROZEN_SHEETS_PROPERTY, JSON.stringify(list));
    const counts = BRANCHES.map(function(b) { return b + ' ' + alloc.counts[b]; }).join(', ');
    return {
      notice: 'Affectation figée dans la feuille « ' + name + ' ».',
      details: name + ' — ' + counts + (pending ? ' ; ' + pending + ' sans choix' : '') + (alloc.unresolvedTies ? ' ; ' + alloc.unresolvedTies + ' égalité(s) non départagée(s)' : ''),
      extra: { sheet: name }
    };
  });
}

function adminPublishResults(req) {
  const admin = requireAdmin_();
  req = req || {};
  if (req.confirm !== 'PUBLIER') throw new Error('Tapez PUBLIER pour confirmer la publication.');
  const sheet = String(req.sheet || '');
  return adminWrite_(admin, 'PUBLIER', function(ss, props) {
    const lock = choicesLock_(props);
    if (!lock.baseLocked) throw new Error("Clôturez d'abord les choix (verrou ou date limite dépassée) avant de publier.");
    const listed = frozenSheets_(props).some(function(f) { return f.sheet === sheet; });
    if (!listed) throw new Error('Cette feuille ne fait pas partie des affectations figées.');
    const sh = ss.getSheetByName(sheet);
    if (!sh) throw new Error("La feuille « " + sheet + " » n'existe plus dans le classeur.");
    // [V2] Une affectation figée avant un changement des spécialités ne correspond plus à la liste en vigueur
    const outdated = frozenBranchesOutsideList_(sh);
    if (outdated.length) {
      throw new Error('Cette affectation a été figée avec des spécialités qui ne sont plus dans la liste (' + outdated.join(', ') + ') : figez-en une nouvelle.');
    }
    PropertiesService.getScriptProperties().setProperty(PUBLISHED_SHEET_PROPERTY,
      JSON.stringify({ sheet: sheet, at: new Date().toISOString(), by: admin }));
    return {
      // [V2] Page fermée : les étudiants ne voient que le message d'attente tant qu'elle n'est pas ouverte
      notice: studentPageOpen_(props)
        ? 'Résultats publiés : chaque étudiant voit désormais sa filière officielle.'
        : "Résultats publiés, mais la page étudiante est fermée : les étudiants ne voient que le message d'attente tant que vous ne l'ouvrez pas (Calendrier & accès).",
      details: 'Feuille publiée : ' + sheet,
      official: true
    };
  });
}

// [V2] Filières affectées dans une feuille figée qui ne font plus partie de la liste des spécialités
function frozenBranchesOutsideList_(sh) {
  const width = Math.max(1, Math.min(allocationHeaders_(MAX_BRANCHES).length, sh.getMaxColumns()));
  const header = sh.getRange(1, 1, 1, width).getValues()[0].map(squash_);
  const col = header.indexOf(squash_('Filière affectée'));
  if (col === -1) return [];
  const out = [];
  readRows_(sh, width).forEach(function(row) {
    const b = String(row[col] === undefined || row[col] === null ? '' : row[col]).trim();
    if (b && BRANCHES.indexOf(b) === -1 && out.indexOf(b) === -1) out.push(b);
  });
  return out;
}

function adminUnpublishResults() {
  const admin = requireAdmin_();
  return adminWrite_(admin, 'DEPUBLIER', function(ss, props) {
    const pub = publishedSheet_(props);
    if (!pub) throw new Error("Aucun résultat n'est publié.");
    PropertiesService.getScriptProperties().deleteProperty(PUBLISHED_SHEET_PROPERTY);
    return {
      notice: 'Résultats dépubliés : les étudiants ne voient plus de résultat officiel.',
      details: 'Feuille dépubliée : ' + pub.sheet,
      official: true
    };
  });
}

// [V2] Retire les propriétés qui valent leur valeur par défaut (ou sont vides / illisibles)
function adminCleanSettings() {
  const admin = requireAdmin_();
  return adminWrite_(admin, 'REGLAGES_NETTOYES', function(ss, props) {
    const stale = staleSettings_(props);
    if (!stale.length) return { notice: 'Aucune propriété inutile : rien à retirer.', details: null };
    const store = PropertiesService.getScriptProperties();
    stale.forEach(function(k) { store.deleteProperty(k); });
    return {
      notice: plainCount_(stale.length, 'propriété inutile retirée', 'propriétés inutiles retirées') + ' : ' + stale.join(', ') + '.',
      details: 'Propriétés retirées (valeur par défaut ou vide) : ' + stale.join(', ')
    };
  });
}

function plainCount_(n, one, many) {
  return n + ' ' + (n <= 1 ? one : many);
}

function adminSendReminders(req) {
  const admin = requireAdmin_();
  req = req || {};
  if (req.confirm !== 'ENVOYER') throw new Error("Tapez ENVOYER pour confirmer l'envoi.");
  const subject = cleanText_(req.subject, 200, "L'objet");
  const body = cleanText_(req.body, 5000, 'Le message', true);
  if (!subject || !body) throw new Error("L'objet et le message sont obligatoires.");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = scriptProps_();
  const lock = choicesLock_(props);
  if (lock.locked) throw new Error('Les choix sont clos : un rappel inviterait les étudiants à une action impossible.');
  // [V2] Jamais de lien de test (/dev) dans un rappel : les étudiants ne peuvent pas l'ouvrir
  const link = publicUrl_(props);
  if (isDevUrl_(link)) throw new Error("Le lien des rappels est le lien de test (/dev), que les étudiants ne peuvent pas ouvrir : ouvrez l'interface par le lien /exec, ou définissez PUBLIC_URL.");
  const snap = withScriptLock_(function() { const s = readSnapshot_(ss); putSnapshot_(s); return s; });
  const info = mailInfo_(snap);
  if (!info.available) throw new Error(info.reason || "Envoi d'e-mails indisponible.");

  const tz = Session.getScriptTimeZone();
  const deadlineText = lock.deadline ? fmtLocalFr_(Date.parse(lock.deadline), tz) : 'non fixée';
  const fill = function(text, name) {
    return text.split('{nom}').join(name).split('{date_limite}').join(deadlineText).split('{lien}').join(link);
  };
  let quota = info.remainingQuota;
  // Envoi hors verrou (lent) ; seule l'écriture du Journal se fait sous verrou
  const results = snap.rows.filter(function(r) { return !r.c && r.e; }).map(function(r) {
    if (quota <= 0) return { name: r.h, email: r.e, status: 'SKIPPED', error: 'Quota quotidien atteint' };
    try {
      MailApp.sendEmail({ to: r.e, subject: fill(subject, r.h), body: fill(body, r.h), replyTo: admin, name: 'Coordination ' + PROGRAM.name });
      quota--;
      return { name: r.h, email: r.e, status: 'SENT', error: null };
    } catch (e) {
      return { name: r.h, email: r.e, status: 'FAILED', error: String((e && e.message) || e) };
    }
  });
  const count = function(s) { return results.filter(function(r) { return r.status === s; }).length; };
  const sent = count('SENT'), failed = count('FAILED'), skipped = count('SKIPPED');
  let overview = null;
  withScriptLock_(function() {
    appendJournal_(ss, admin, 'RAPPELS', sent + ' envoyé(s), ' + failed + ' échec(s), ' + skipped + ' non envoyé(s) (quota) — objet : ' + subject);
    invalidateSnapshot_();
    overview = overviewAfterWrite_(ss); // [V2] même verrou ; les e-mails sont partis quoi qu'il arrive
  });
  return {
    ok: true,
    notice: sent + ' rappel(s) envoyé(s)' + (failed ? ', ' + failed + ' échec(s)' : '') + (skipped ? ', ' + skipped + ' non envoyé(s) faute de quota' : '') + '.' +
      (overview ? '' : ' (Affichage non actualisé : rechargez la page.)'),
    overview: overview,
    results: results,
    sent: sent, failed: failed, skipped: skipped
  };
}

// =========================================================================
// [V2] ADMINISTRATEURS (propriété ADMIN_EMAILS ; absente = liste inscrite dans le code)
// =========================================================================

function adminAddAdmin(email) {
  const admin = requireAdmin_();
  const target = String(email || '').toLowerCase().trim();
  const pattern = new RegExp('^[a-z0-9._%+\\-]+@' + DOMAIN.replace(/\./g, '\\.') + '$');
  if (!pattern.test(target)) throw new Error('Adresse invalide : saisissez une adresse @' + DOMAIN + '.');
  return adminWrite_(admin, 'ADMINISTRATEURS', function(ss, props) {
    const list = adminEmails_(props);
    if (list.indexOf(target) !== -1) return { notice: target + ' est déjà administrateur.', details: null };
    if (list.length >= ADMIN_LIST_MAX) throw new Error(ADMIN_LIST_MAX + ' administrateurs au plus.');
    // Un administrateur n'a pas de tableau de bord étudiant : jamais l'adresse d'un étudiant de la liste
    const found = resolveStudent_(target, readSnapshot_(ss).rows);
    if (found.verdict === 'OK') throw new Error('Cette adresse correspond à un étudiant de la liste officielle (' + found.matches[0] + ') : il ne pourrait plus choisir sa spécialité.');
    saveAdmins_(list.concat([target]));
    return { notice: target + ' est désormais administrateur.', details: 'Administrateur ajouté : ' + target };
  });
}

function adminRemoveAdmin(email) {
  const admin = requireAdmin_();
  const target = String(email || '').toLowerCase().trim();
  return adminWrite_(admin, 'ADMINISTRATEURS', function(ss, props) {
    const list = adminEmails_(props);
    if (list.indexOf(target) === -1) throw new Error(target + " n'est pas administrateur.");
    if (target === admin) throw new Error('Vous ne pouvez pas retirer votre propre adresse : demandez-le à un autre administrateur.');
    saveAdmins_(list.filter(function(e) { return e !== target; }));
    return { notice: target + " n'est plus administrateur.", details: 'Administrateur retiré : ' + target };
  });
}

// Liste égale à celle du code → propriété supprimée (une propriété absente vaut la valeur par défaut)
function saveAdmins_(list) {
  const store = PropertiesService.getScriptProperties();
  if (list.slice().sort().join(',') === DEFAULT_ADMIN_EMAILS.slice().sort().join(',')) store.deleteProperty(ADMIN_EMAILS_PROPERTY);
  else store.setProperty(ADMIN_EMAILS_PROPERTY, list.join(', '));
}

// =========================================================================
// [V2] FORMATION ET SPÉCIALITÉS
// Renommer garde la place de la spécialité dans chaque classement enregistré ; une spécialité
// ajoutée est placée en dernier choix ; une spécialité retirée disparaît des classements (l'ordre
// des autres est conservé). Les affectations déjà figées restent telles qu'elles ont été figées.
// =========================================================================

/**
 * req = { name, classSize, base: [liste en vigueur vue par l'interface],
 *         branches: [{ from: nom en vigueur, ou null pour une nouvelle spécialité ; name: nom voulu }] }
 */
function adminSetProgram(req) {
  const admin = requireAdmin_();
  req = req || {};
  const name = cleanText_(req.name, PROGRAM_NAME_MAX_LENGTH, 'Le nom de la formation');
  if (!name) throw new Error('Indiquez le nom de la formation (par exemple « CI2 »).');
  const classSize = toInt_(req.classSize);
  if (classSize === null || classSize < 1 || classSize > 999) throw new Error("L'effectif attendu doit être un nombre entier entre 1 et 999.");
  if (!Array.isArray(req.branches) || !Array.isArray(req.base)) throw new Error('Liste des spécialités invalide : rechargez la page.');
  const items = req.branches.map(function(it) {
    return {
      from: it && typeof it.from === 'string' && it.from ? it.from : null,
      name: cleanText_(it && it.name, BRANCH_NAME_MAX_LENGTH, "Le nom d'une spécialité").replace(/\s+/g, ' ')
    };
  });
  const next = items.map(function(it) { return it.name; });
  const problem = branchListProblem_(next);
  if (problem) throw new Error('Liste des spécialités refusée : ' + problem + '.');
  const base = req.base.map(String);

  return adminWrite_(admin, 'FORMATION', function(ss, props) {
    const current = BRANCHES.slice();
    const before = { name: PROGRAM.name, classSize: PROGRAM.classSize };
    const stale = 'La liste des spécialités a changé entre-temps (autre onglet ou autre administrateur) : rechargez la page.';
    if (!sameList_(base, current)) throw new Error(stale);
    const kept = {};
    items.forEach(function(it) {
      if (it.from === null) return;
      if (current.indexOf(it.from) === -1 || kept[it.from]) throw new Error(stale);
      kept[it.from] = true;
    });
    // Une spécialité retirée puis ajoutée sous le même nom est simplement conservée
    items.forEach(function(it) {
      if (it.from !== null) return;
      const same = current.filter(function(b) { return !kept[b] && branchKey_(b) === branchKey_(it.name); });
      if (same.length) { it.from = same[0]; kept[same[0]] = true; }
    });
    const rename = {};
    items.forEach(function(it) { if (it.from !== null && it.from !== it.name) rename[it.from] = it.name; });
    const removed = current.filter(function(b) { return !kept[b]; });
    const added = items.filter(function(it) { return it.from === null; }).map(function(it) { return it.name; });
    const branchesChanged = !sameList_(current, next);
    // [V2] Places propres à une spécialité : suivent son renommage, disparaissent si elle est retirée
    const rules = rules_(props);
    const nextLimits = {};
    current.forEach(function(b) {
      if (rules.limits[b] && removed.indexOf(b) === -1) nextLimits[rename[b] || b] = rules.limits[b];
    });

    if (branchesChanged) {
      assertNotPublished_(props);
      const forced = readOverrides_(ss);
      const blocked = removed.map(function(b) {
        const n = Object.keys(forced).filter(function(k) { return forced[k].branch === b; }).length;
        return n ? plainCount_(n, 'en ', 'en ') + b : null;
      }).filter(function(x) { return !!x; });
      if (blocked.length) {
        throw new Error('Des affectations imposées concernent une spécialité retirée (' + blocked.join(', ') + ") : retirez-les d'abord.");
      }
      const N = readSnapshot_(ss).rows.length;
      // [V2] Places de la nouvelle liste : règles communes, sauf les spécialités gardées qui ont les leurs
      const totalMax = next.reduce(function(t, b) { return t + (nextLimits[b] ? (nextLimits[b].max === null ? Infinity : nextLimits[b].max) : rules.max); }, 0);
      const totalMin = next.reduce(function(t, b) { return t + (nextLimits[b] ? nextLimits[b].min : rules.min); }, 0);
      if (N > 0 && totalMax < N) {
        throw new Error('Avec ces ' + next.length + ' spécialités, il n’y aurait que ' + totalMax + ' places pour ' + N +
          " étudiants : relevez d'abord un maximum (Places par filière).");
      }
      if (N > 0 && totalMin > N) {
        throw new Error('Avec ces ' + next.length + ' spécialités, les minimums demandent ' + totalMin + ' étudiants (' + N +
          " inscrits) : baissez d'abord un minimum (Places par filière).");
      }
    }

    // Feuilles : Preferences (toujours à la disposition de la nouvelle liste), Historique, Surcharges
    let changed = [];
    const prefsSheet = getOrCreateSheet_(ss, PREFERENCES_SHEET);
    const relaid = prefsLayout_(prefsSheet).choices !== next.length; // disposition à réparer (modification à la main)
    if (branchesChanged || relaid) {
      changed = relayoutPreferences_(prefsSheet, current, next, rename, removed, added);
    }
    if (branchesChanged) {
      migrateHistory_(ss, next.length, rename, changed, new Date(), admin);
      renameOverrides_(ss, rename);
    }

    const store = PropertiesService.getScriptProperties();
    setOrDefault_(PROGRAM_NAME_PROPERTY, name, DEFAULT_PROGRAM_NAME);
    if (sameList_(next, DEFAULT_BRANCHES)) store.deleteProperty(SPECIALTIES_PROPERTY);
    else store.setProperty(SPECIALTIES_PROPERTY, JSON.stringify(next));
    if (branchesChanged) saveSeatLimits_(nextLimits, next);
    setOrDefault_(CLASS_SIZE_PROPERTY, classSize, CLASS_SIZE);

    const parts = [];
    if (name !== before.name) parts.push('formation « ' + before.name + ' » → « ' + name + ' »');
    Object.keys(rename).forEach(function(b) { parts.push('« ' + b + ' » renommée « ' + rename[b] + ' »'); });
    added.forEach(function(b) { parts.push('« ' + b + ' » ajoutée'); });
    removed.forEach(function(b) { parts.push('« ' + b + ' » retirée'); });
    if (branchesChanged && !added.length && !removed.length && !Object.keys(rename).length) parts.push('ordre des spécialités modifié');
    if (classSize !== before.classSize) parts.push('effectif attendu ' + before.classSize + ' → ' + classSize);
    if (relaid && !branchesChanged) parts.push('feuille Preferences remise à ' + next.length + ' colonnes de choix');
    if (!parts.length) {
      return { notice: PROGRAM.branchesInvalid ? 'Liste des spécialités réenregistrée.' : 'Aucune modification.', details: PROGRAM.branchesInvalid ? 'Liste des spécialités réenregistrée : ' + next.join(', ') : null, official: true };
    }
    let notice = capitalizeFr_(parts.join(' ; ')) + '.';
    if (changed.length) {
      notice += ' ' + plainCount_(changed.length, 'classement enregistré mis à jour', 'classements enregistrés mis à jour') +
        (added.length ? ' (' + added.join(', ') + ' en dernier choix)' : '') + '.';
      notice += choicesLock_(props).locked
        ? ' Les choix sont clos : rouvrez-les si les étudiants doivent pouvoir revoir leur classement.'
        : ' Les étudiants peuvent revoir leur classement.';
    }
    return {
      notice: notice,
      details: capitalizeFr_(parts.join(' ; ')) + (branchesChanged ? ' — liste : ' + next.join(', ') : '') +
        (changed.length ? ' — ' + plainCount_(changed.length, 'classement mis à jour', 'classements mis à jour') : ''),
      official: true
    };
  });
}

function migrateRanking_(c, rename, removed, added) {
  return c.filter(function(b) { return removed.indexOf(b) === -1; })
    .map(function(b) { return rename[b] || b; })
    .concat(added);
}

/**
 * Réécrit Preferences (en-tête compris) pour la nouvelle liste, en un appel groupé.
 * Les classements valables sont convertis ; une ligne déjà illisible est recopiée telle quelle
 * (noms renommés) à la nouvelle largeur. Renvoie les classements modifiés par un ajout ou un retrait.
 */
function relayoutPreferences_(sh, current, next, rename, removed, added) {
  const layout = prefsLayout_(sh);
  const last = sh.getLastRow();
  const data = last >= 2 ? sh.getRange(2, 1, last - 1, layout.width).getValues() : [];
  const changed = [];
  const width = next.length + 2;
  const rows = data.map(function(row) {
    const raw = row.slice(1, 1 + layout.choices);
    const valid = normalizeChoicesIn_(raw, current);
    let cells;
    if (valid) {
      cells = migrateRanking_(valid, rename, removed, added);
      if (removed.length || added.length) changed.push({ name: String(row[0]).trim(), choices: cells });
    } else {
      cells = raw.map(function(v) { return typeof v === 'string' && rename[v.trim()] ? rename[v.trim()] : v; });
    }
    cells = cells.slice(0, next.length);
    while (cells.length < next.length) cells.push('');
    return [row[0]].concat(cells, [row[layout.ts]]);
  });
  const header = ['Nom'].concat(choiceHeaders_(next.length), ['Timestamp']);
  if (sh.getMaxColumns() < width) sh.insertColumnsAfter(sh.getMaxColumns(), width - sh.getMaxColumns());
  sh.getRange(1, 1, rows.length + 1, width).setValues([header].concat(rows.map(function(r) { return r.map(sanitizeCell_); })));
  if (layout.width > width) sh.getRange(1, width + 1, rows.length + 1, layout.width - width).clearContent();
  return changed;
}

// Historique : colonnes ajoutées si besoin, noms renommés partout, une ligne SPECIALITES par classement modifié
function migrateHistory_(ss, count, rename, changed, when, admin) {
  let sh = ss.getSheetByName(HISTORY_SHEET);
  if (!sh) {
    if (!changed.length) return;
    sh = getOrCreateSheet_(ss, HISTORY_SHEET);
  }
  const layout = ensureHistoryColumns_(sh, count);
  const last = sh.getLastRow();
  if (Object.keys(rename).length && last >= 2) {
    const range = sh.getRange(2, 3, last - 1, layout.choices);
    let touched = false;
    const values = range.getValues().map(function(row) {
      return row.map(function(v) {
        const t = typeof v === 'string' ? v.trim() : null;
        if (t && rename[t]) { touched = true; return rename[t]; }
        return sanitizeCell_(v);
      });
    });
    if (touched) range.setValues(values);
  }
  if (changed.length) {
    const start = sh.getLastRow() + 1;
    const end = start + changed.length - 1;
    if (end > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), end - sh.getMaxRows());
    sh.getRange(start, 1, changed.length, layout.width).setValues(changed.map(function(c) {
      return historyRow_(layout, when, c.name, c.choices, 'SPECIALITES', admin);
    }));
  }
}

// Surcharges : filière renommée dans toutes les lignes (actives ou non)
function renameOverrides_(ss, rename) {
  const sh = ss.getSheetByName(OVERRIDES_SHEET);
  if (!sh || !Object.keys(rename).length || sh.getLastRow() < 2) return;
  const range = sh.getRange(2, 2, sh.getLastRow() - 1, 1);
  let touched = false;
  const values = range.getValues().map(function(row) {
    const t = typeof row[0] === 'string' ? row[0].trim() : null;
    if (t && rename[t]) { touched = true; return [rename[t]]; }
    return [sanitizeCell_(row[0])];
  });
  if (touched) range.setValues(values);
}

// =========================================================================
// [V2] INSTALLATION ET AUTO-TEST (à lancer depuis l'éditeur)
// =========================================================================

/**
 * Crée les feuilles manquantes (avec en-têtes) et retire les propriétés inutiles (valeur par défaut).
 * Idempotent : ne remplace jamais une feuille, un en-tête ou un réglage actif.
 */
function setupSheets() {
  requireOwnerOrAdmin_();
  return withScriptLock_(function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const done = [];
    [PREFERENCES_SHEET, HISTORY_SHEET, JOURNAL_SHEET, TIEBREAK_SHEET, OVERRIDES_SHEET].forEach(function(name) {
      if (!ss.getSheetByName(name)) { getOrCreateSheet_(ss, name); done.push('feuille ' + name + ' créée'); }
    });
    const responses = ss.getSheetByName(SHEET_NAME);
    if (!responses) {
      done.push('ATTENTION : feuille ' + SHEET_NAME + ' introuvable');
    } else if (responses.getMaxColumns() >= 3) {
      const c1 = responses.getRange(1, 3).getValue();
      if (c1 === '' || c1 === null) {
        responses.getRange(1, 3).setValue('Email');
        done.push('en-tête « Email » ajouté en ' + SHEET_NAME + '!C1');
      }
    }
    // [V2] Preferences et Historique : une colonne de choix par spécialité de la liste en vigueur
    const prefsSheet = ss.getSheetByName(PREFERENCES_SHEET);
    const found = prefsSheet ? prefsLayout_(prefsSheet).choices : BRANCHES.length;
    if (prefsSheet && found !== BRANCHES.length) {
      relayoutPreferences_(prefsSheet, BRANCHES, BRANCHES, {}, [], []);
      done.push('Preferences remise à ' + BRANCHES.length + ' colonnes de choix (' + found + ' trouvées) : les classements incomplets sont à refaire');
    }
    const historySheet = ss.getSheetByName(HISTORY_SHEET);
    if (historySheet && historyLayout_(historySheet).choices < BRANCHES.length) {
      ensureHistoryColumns_(historySheet);
      done.push('colonnes de choix ajoutées à ' + HISTORY_SHEET);
    }
    // [V2] Aucune valeur par défaut n'est plus écrite : une propriété absente vaut sa valeur par défaut.
    // Celles qu'une version précédente avait figées à leur valeur par défaut sont retirées.
    const store = PropertiesService.getScriptProperties();
    staleSettings_(store.getProperties()).forEach(function(k) {
      store.deleteProperty(k);
      done.push('propriété ' + k + ' retirée (valeur par défaut ou vide)');
    });
    invalidateSnapshot_();
    invalidateTally_();
    const summary = done.length ? done.join(' ; ') : 'Rien à faire : tout est déjà en place.';
    Logger.log('setupSheets : ' + summary);
    return summary;
  });
}

// Jeu synthétique reproductible (aucun accès aux feuilles)
function syntheticRows_(n, seed) {
  let s = seed >>> 0;
  const rand = function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // [V2] Avec 3 filières : jeu d'origine ; sinon tous les classements, à poids égaux
  const three = BRANCHES.length === 3;
  const perms = three ? [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]] : rankingsOf_(BRANCHES.map(function(b, k) { return k; }));
  const weights = three ? [0.30, 0.20, 0.17, 0.08, 0.15, 0.10] : perms.map(function() { return 1 / perms.length; });
  const rows = [];
  for (let i = 0; i < n; i++) {
    let g = Math.round((9 + rand() * 9) * 100) / 100;
    if (i === 10 || i === 11) g = 14.5;                    // égalité de 2
    if (i >= 20 && i <= 22) g = 12.75;                     // égalité de 3
    if (i >= 30 && i <= 34) g = 11.25;                     // égalité de 5
    let x = rand(), k = 0;
    while (k < weights.length - 1 && x > weights[k]) { x -= weights[k]; k++; }
    const undecided = i % 11 === 7;
    rows.push({
      h: 'ETUDIANT' + String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + Math.floor(i / 26)) + ' Test',
      g: g,
      c: undecided ? null : perms[k].map(function(b) { return BRANCHES[b]; }),
      t: null,
      e: ''
    });
  }
  return rows;
}

/**
 * Auto-test en mémoire : (a) aucune filière au-dessus du maximum ni sous le plancher ;
 * (b) aux règles par défaut, chaque affectation est entre le meilleur et le pire cas de project_,
 *     et les étudiants SECURE obtiennent leur 1er choix ; (c) allocate_ est déterministe.
 */
function selfTest() {
  requireOwnerOrAdmin_();
  const rows = syntheticRows_(CLASS_SIZE, 20261015);
  const results = [];
  const check = function(label, ok, detail) {
    results.push({ label: label, ok: !!ok, detail: detail || '' });
    Logger.log((ok ? 'PASS' : 'FAIL') + ' — ' + label + (detail ? ' (' + detail + ')' : ''));
  };

  // [V2] Règles testées : celles d'origine avec 3 filières, sinon des règles réalisables pour n filières
  const N = rows.length, B = BRANCHES.length;
  const share = Math.ceil(N / B);
  const ruleSets = B === 3
    ? [defaultRules_(), { min: 20, max: 30 }, { min: 12, max: 24 }]
    : [{ min: Math.max(0, Math.floor(N / B) - 4), max: share + 6 }, { min: 0, max: share }, { min: Math.floor(N / B), max: share + 12 }];
  // [V2] + places propres : 1re filière sans maximum, 2e avec son propre minimum (les autres : règles communes)
  const own = {};
  own[BRANCHES[0]] = { min: ruleSets[0].min, max: null };
  own[BRANCHES[1]] = { min: Math.min(ruleSets[0].max, ruleSets[0].min + 3), max: ruleSets[0].max };
  ruleSets.push({ min: ruleSets[0].min, max: ruleSets[0].max, limits: own });
  ruleSets.forEach(function(r) {
    const full = fullRules_(r);
    const a = allocate_(rows, full, {}, {}, 'LAST');
    const floors = floorsOf_(full, rows.length);
    const bad = BRANCHES.filter(function(b, k) { return a.counts[b] > full.maxs[k] || a.counts[b] < floors[k]; });
    check('(a) règles ' + describeRules_(full) + ' : chaque filière entre son plancher (' + floors.join(', ') + ') et son maximum',
      bad.length === 0, BRANCHES.map(function(b) { return b + ' = ' + a.counts[b]; }).join(', '));
  });

  const rules = ruleSets[0];
  const snap = { rows: rows };
  const alloc = allocate_(rows, rules, {}, {}, 'LAST');
  const issues = [];
  let checked = 0;
  rows.forEach(function(r, u) {
    if (!r.c) return;
    checked++;
    const p = project_(snap, u, r.c, r.c, coverage_(snap, u), rules);
    const got = alloc.res[u].choiceRank;
    const best = r.c.indexOf(p.bestBranch) + 1;
    const worst = r.c.indexOf(p.worstBranch) + 1;
    if (!(got >= best && got <= worst)) issues.push(r.h + ' : choix ' + got + ' hors [' + best + ', ' + worst + ']');
    if (p.status === 'SECURE' && got !== 1) issues.push(r.h + ' : SECURE mais choix ' + got);
  });
  check('(b) ' + checked + ' étudiants : affectation entre meilleur et pire cas, SECURE = 1er choix',
    issues.length === 0, issues.slice(0, 5).join(' | '));

  const signature = function(rs) {
    const a = allocate_(rs, rules, {}, {}, 'LAST');
    return rs.map(function(r, i) { return r.h + '=' + a.res[i].branch + '/' + a.res[i].source; }).sort().join(';');
  };
  const reversed = rows.slice().reverse();
  const sig = signature(rows);
  check('(c) allocate_ déterministe (deux exécutions, ordre des lignes inversé)',
    sig === signature(rows) && sig === signature(reversed));

  const failed = results.filter(function(r) { return !r.ok; }).length;
  Logger.log(failed ? 'selfTest : ' + failed + ' échec(s).' : 'selfTest : tout est correct.');
  return { passed: results.length - failed, failed: failed, results: results };
}
