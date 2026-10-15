const DOMAIN = 'uit.ac.ma';
const SHEET_NAME = 'Responses';          // Feuille officielle : Col A = Nom, Col B = Note, [V2] Col C = Email (optionnelle)
const PREFERENCES_SHEET = 'Preferences'; // Choix en clair : Nom, Choice_1, Choice_2, Choice_3, Timestamp

// --- Règles d'affectation ---
const BRANCHES = ['Cybersécurité', 'Réseaux Mobiles', 'Systèmes Ubiquitaires'];
const MIN_SEATS = 12;  // minimum obligatoire par filière ([V2] valeur par défaut de la propriété MIN_SEATS)
const CLASS_SIZE = 70; // effectif officiel de la promo CI2 RST
const MAX_SEATS = 26;  // plafond maximal strict par filière fixé par la coordination ([V2] défaut de MAX_SEATS)

// --- Clôture des choix : Paramètres du projet > Propriétés du script ---
const DEADLINE_PROPERTY = 'CHOICES_DEADLINE';
const LOCKED_PROPERTY = 'CHOICES_LOCKED';

const SNAPSHOT_CACHE_KEY = 'snapshot_v6'; // [V2] v6 : e-mail de chaque ligne + lignes écartées
const SNAPSHOT_CACHE_SECONDS = 30;
const SAVE_COOLDOWN_SECONDS = 5;
const MAX_TIE_GROUP = 4;
const LOCK_WAIT_MS = 10000;

const NO_GRADE_MESSAGE = "Accès refusé : votre adresse institutionnelle ne correspond à aucun étudiant inscrit sur la liste officielle CI2 RST.";
const INVALID_CHOICES_MESSAGE = 'Classez les 3 filières (' + BRANCHES.join(', ') + '), chacune une seule fois.';
const DESYNC_MESSAGE = "Erreur de lecture de la liste officielle. Veuillez contacter l'administrateur.";
const LOCKED_MESSAGE = "Les choix sont clos : plus aucune modification n'est acceptée.";

// =========================================================================
// [V2] ADMINISTRATION : CONSTANTES
// =========================================================================

// Administrateurs : propriété ADMIN_EMAILS (séparées par des virgules), sinon cette liste
const DEFAULT_ADMIN_EMAILS = ['tomader.mazri@uit.ac.ma'];

const ADMIN_EMAILS_PROPERTY = 'ADMIN_EMAILS';
const STUDENT_PAGE_OPEN_PROPERTY = 'STUDENT_PAGE_OPEN';
const MIN_SEATS_PROPERTY = 'MIN_SEATS';
const MAX_SEATS_PROPERTY = 'MAX_SEATS';
const UNDECIDED_POLICY_PROPERTY = 'UNDECIDED_POLICY';
const ANNOUNCEMENT_PROPERTY = 'ANNOUNCEMENT';
const FROZEN_SHEETS_PROPERTY = 'FROZEN_SHEETS';
const PUBLISHED_SHEET_PROPERTY = 'PUBLISHED_SHEET';
const PUBLIC_URL_PROPERTY = 'PUBLIC_URL';

const HISTORY_SHEET = 'Historique';
const JOURNAL_SHEET = 'Journal';
const TIEBREAK_SHEET = 'Departage';
const OVERRIDES_SHEET = 'Surcharges';
const ALLOCATION_SHEET_PREFIX = 'Affectation_';

const SHEET_HEADERS = {
  [PREFERENCES_SHEET]: ['Nom', 'Choice_1', 'Choice_2', 'Choice_3', 'Timestamp'],
  [HISTORY_SHEET]: ['Timestamp', 'Nom', 'Choice_1', 'Choice_2', 'Choice_3', 'Source', 'Auteur'],
  [JOURNAL_SHEET]: ['Timestamp', 'Admin', 'Action', 'Détails'],
  [TIEBREAK_SHEET]: ['Note', 'Rang', 'Nom', 'Raison', 'Admin', 'Timestamp'],
  [OVERRIDES_SHEET]: ['Nom', 'Filière', 'Raison', 'Admin', 'Timestamp', 'Actif']
};
// Colonnes au format texte brut (évite qu'un « 12/26 » devienne une date)
const SHEET_TEXT_COLUMNS = {
  [HISTORY_SHEET]: [2, 3, 4, 5, 6, 7],
  [JOURNAL_SHEET]: [2, 3, 4],
  [TIEBREAK_SHEET]: [3, 4, 5],
  [OVERRIDES_SHEET]: [1, 2, 3, 4, 6]
};
const ALLOCATION_HEADERS = ['Rang', 'Nom', 'Note', 'Choix 1', 'Choix 2', 'Choix 3',
  'Filière affectée', 'Rang du choix obtenu', 'Origine', 'Commentaire'];

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
const MAIL_SENDER_NAME = 'Coordination CI2 RST';

const PAGE_TITLE = 'Affectation de Spécialité - RST';
const ADMIN_PAGE_TITLE = 'Gestion des affectations - RST';
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
  // Administrateur → Admin ; hors domaine → page d'erreur ;
  // étudiant → Dashboard si STUDENT_PAGE_OPEN, sinon la page d'attente (texte inchangé).
  const email = activeEmail_();
  const props = scriptProps_();

  if (isAdmin_(email, props)) {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle(ADMIN_PAGE_TITLE)
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

  if (studentPageOpen_(props)) {
    return HtmlService.createHtmlOutputFromFile('Dashboard')
      .setTitle(PAGE_TITLE)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Page d'attente : texte inchangé, annonce éventuelle affichée dessous (échappée)
  const ann = announcement_(props);
  let annHtml = '';
  if (ann) {
    const warn = ann.level === 'warning';
    annHtml = '<div style="margin-top:24px;padding:14px 16px;border-radius:10px;text-align:left;font-size:.95rem;line-height:1.6;white-space:pre-line;' +
      (warn ? 'background:#fffbeb;border:1px solid #fcd34d;color:#78350f;' : 'background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;') + '">' +
      escapeHtml_(ann.text) + '</div>';
  }
  return simplePage_(PAGE_TITLE,
    '<p style="margin:0;font-size:1.25rem;font-weight:500;color:#1e293b;line-height:1.5;">' + escapeHtml_(WAITING_TEXT) + '</p>' + annHtml);
}

// [V2] Petite page autonome (attente, connexion requise) au style sobre de l'établissement
function simplePage_(title, innerHtml) {
  const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>' + escapeHtml_(title) + '</title></head>' +
    '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'font-family:Inter,system-ui,-apple-system,\'Segoe UI\',Roboto,sans-serif;background:#f1f5f9;color:#1e293b;padding:24px;box-sizing:border-box;">' +
    '<main style="max-width:560px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06);overflow:hidden;">' +
    '<div style="height:6px;background:linear-gradient(90deg,#0b2545,#1d4ed8);"></div>' +
    '<div style="padding:32px 28px;text-align:center;">' +
    '<div style="font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:#64748b;margin-bottom:16px;">Université Ibn Tofail · CI2 RST</div>' +
    innerHtml + '</div></main></body></html>';
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

// [V2] Toutes les lignes dont le Nom contient chaque morceau de la partie locale de l'adresse
function namePieceMatches_(email, rows) {
  const local = String(email || '').split('@')[0];
  const pieces = local.split('.').map(squash_).filter(function(p) { return p.length > 0; });
  if (pieces.length === 0) return [];
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const candidate = squash_(rows[i].h);
    if (!candidate) continue;
    const allIn = pieces.every(function(p) { return candidate.indexOf(p) !== -1; });
    if (allIn) out.push(rows[i].h); // Nom exact en clair (ex: "MOUJAHID Salaheddine")
  }
  return out;
}

/**
 * [V2] Fonction unique d'identification d'un étudiant, utilisée par la connexion et par adminTestEmail.
 * 1) Une ligne dont la colonne Email vaut exactement l'adresse l'emporte.
 * 2) Sinon, l'appariement par morceaux du nom s'applique aux seules lignes sans e-mail.
 * Sans colonne Email (ou vide), le comportement est identique à la version précédente.
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

function currentUserName_(snap) {
  const email = activeEmail_();
  // [V2] L'adresse de l'administrateur ne correspond à aucune ligne : contrôle AVANT l'appariement
  if (isAdmin_(email)) throw new Error(ADMIN_NOT_STUDENT_MESSAGE);
  if (!email.endsWith('@' + DOMAIN)) {
    throw new Error('Connectez-vous avec votre compte institutionnel @' + DOMAIN + '.');
  }
  // [V2] Colonne Email prioritaire, puis appariement par nom (resolveStudent_)
  const found = resolveStudent_(email, snap.rows);
  if (found.verdict !== 'OK') {
    throw new Error(NO_GRADE_MESSAGE);
  }
  return found.matches[0];
}

function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    // [V2] En-têtes de toutes les feuilles gérées (Preferences : en-tête inchangé)
    if (SHEET_HEADERS[name]) {
      sh.appendRow(SHEET_HEADERS[name]);
      formatManagedSheet_(sh, name);
    }
  }
  return sh;
}

// [V2] Mise en forme des feuilles créées par le script : en-tête figé et colonnes texte
function formatManagedSheet_(sh, name) {
  try {
    const width = SHEET_HEADERS[name].length;
    sh.getRange(1, 1, 1, width).setFontWeight('bold');
    sh.setFrozenRows(1);
    (SHEET_TEXT_COLUMNS[name] || []).forEach(function(col) {
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
  if (!Array.isArray(choices) || choices.length !== BRANCHES.length) return null;
  const out = [];
  for (let i = 0; i < choices.length; i++) {
    const c = (typeof choices[i] === 'string') ? choices[i].trim() : '';
    if (BRANCHES.indexOf(c) === -1 || out.indexOf(c) !== -1) return null;
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
  const manual = flag !== '' && ['false', '0', 'non', 'no', 'off'].indexOf(flag) === -1;
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
  return PropertiesService.getScriptProperties().getProperties() || {};
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
  if (!isAdmin_(email)) throw new Error(ACCESS_DENIED_MESSAGE);
  return email;
}

// setupSheets / selfTest : administrateur, ou propriétaire du script lancé depuis l'éditeur
function requireOwnerOrAdmin_() {
  const active = activeEmail_();
  let owner = '';
  try { owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase().trim(); } catch (e) { owner = ''; }
  if (isAdmin_(active) || (active !== '' && active === owner)) return active;
  throw new Error(ACCESS_DENIED_MESSAGE);
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

function defaultRules_() {
  return { min: MIN_SEATS, max: MAX_SEATS };
}

// Règles en vigueur : propriétés MIN_SEATS / MAX_SEATS, sinon les constantes
function rules_(props) {
  props = props || scriptProps_();
  const min = parseSeats_(props[MIN_SEATS_PROPERTY], MIN_SEATS, MIN_SEATS_PROPERTY);
  const max = parseSeats_(props[MAX_SEATS_PROPERTY], MAX_SEATS, MAX_SEATS_PROPERTY);
  if (min > max) {
    Logger.log('Règles incohérentes (min ' + min + ' > max ' + max + ') : valeurs par défaut utilisées.');
    return defaultRules_();
  }
  return { min: min, max: max };
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
  return ['1er choix', '2e choix', '3e choix'][k - 1] || 'hors choix';
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

// [V2] En-tête de la colonne C reconnu comme colonne e-mail (« Email », « E-mail », « Courriel »…)
function isEmailHeader_(v) {
  const k = squash_(v);
  return k.indexOf('mail') !== -1 || k.indexOf('courriel') !== -1;
}

/**
 * Lit la liste officielle dans Responses [Col A = Nom, Col B = Note, [V2] Col C = Email optionnelle]
 * et les vœux enregistrés dans Preferences [Col A = Nom en clair, Col B..D = Choix, Col E = Date].
 * [V2] diag (optionnel, réservé à l'administration) reçoit les anomalies de Preferences.
 */
function readSnapshot_(ss, diag) {
  const responsesSheet = ss.getSheetByName(SHEET_NAME);
  if (!responsesSheet) desync_('feuille ' + SHEET_NAME + ' introuvable');
  // [V2] Largeur bornée par le nombre réel de colonnes de la feuille
  const width = Math.max(1, Math.min(3, responsesSheet.getMaxColumns()));
  const header = responsesSheet.getLastRow() >= 1 ? responsesSheet.getRange(1, 1, 1, width).getValues()[0] : [];
  const emailColumn = width >= 3 && isEmailHeader_(header[2]);
  const responses = readRows_(responsesSheet, width);
  const prefs = readRows_(getOrCreateSheet_(ss, PREFERENCES_SHEET), 5);

  // Indexer les préférences par nom normalisé (squash_) pour tolérer la casse/espaces
  const saved = {};
  const prefLines = {}; // [V2] diagnostic : lignes Preferences par nom
  prefs.forEach(function(row, i) {
    const key = squash_(row[0]);
    const c = normalizeChoices_([row[1], row[2], row[3]]);
    if (key) {
      (prefLines[key] = prefLines[key] || { name: String(row[0]).trim(), lines: [], valid: !!c }).lines.push(i + 2);
    }
    if (key && c) {
      saved[key] = { c: c, t: isDate_(row[4]) ? row[4].getTime() : null };
    }
  });

  const rows = [];
  const seen = {};
  const skipped = []; // [V2] lignes écartées, visibles par l'administration
  const skip = function(line, why) {
    Logger.log('Ligne ' + line + ' écartée : ' + why);
    skipped.push({ line: line, why: why });
  };
  const emailPattern = new RegExp('^[a-z0-9._%+\\-]+@' + DOMAIN.replace(/\./g, '\\.') + '$');
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

    // [V2] Adresse de la colonne C (minuscules) ; une adresse invalide est ignorée et signalée
    let email = '';
    if (emailColumn) {
      const raw = String(responses[i][2] === undefined || responses[i][2] === null ? '' : responses[i][2]).trim().toLowerCase();
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
    emailColumn: { present: emailColumn, filled: rows.filter(function(r) { return !!r.e; }).length },
    badEmails: badEmails,
    builtAt: Date.now()
  };
}

function loadSnapshot_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(SNAPSHOT_CACHE_KEY);
  if (hit) return JSON.parse(hit);
  return withScriptLock_(function() {
    const again = cache.get(SNAPSHOT_CACHE_KEY);
    if (again) return JSON.parse(again);
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
  readRows_(sh, 7).forEach(function(row) {
    const key = squash_(row[1]);
    const c = normalizeChoices_([row[2], row[3], row[4]]);
    const at = timeMs_(row[0]);
    if (!key || !c || at === null) return;
    out.push({
      at: at, key: key, name: String(row[1]).trim(), choices: c,
      source: String(row[5]).trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'ETUDIANT',
      author: String(row[6] || '').trim()
    });
  });
  out.sort(function(a, b) { return a.at - b.at; });
  return out;
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
  getOrCreateSheet_(ss, HISTORY_SHEET)
    .appendRow([when, sanitizeCell_(name), choices[0], choices[1], choices[2], source, sanitizeCell_(String(author || ''))]);
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
  const keys = prefsSheet.getLastRow() > 1
    ? prefsSheet.getRange(2, 1, prefsSheet.getLastRow() - 1, 1).getValues()
    : [];
  const targetKey = squash_(officialName);
  let updated = 0;

  // Écraser la ligne existante de l'étudiant (en gardant son Nom officiel en clair en Colonne A)
  for (let i = 0; i < keys.length; i++) {
    if (squash_(keys[i][0]) === targetKey) {
      prefsSheet.getRange(i + 2, 1, 1, 5).setValues([[sanitizeCell_(officialName), choices[0], choices[1], choices[2], now]]);
      updated++;
    }
  }
  if (updated === 0) {
    // Première soumission : écrit le Nom officiel en clair dans la feuille Preferences
    prefsSheet.appendRow([sanitizeCell_(officialName), choices[0], choices[1], choices[2], now]);
  }
  if (logHistory !== false) appendHistory_(ss, now, officialName, choices, source, author);
}

// =========================================================================
// POINTS D'ENTRÉE DU TABLEAU DE BORD & ENREGISTREMENT EN CLAIR
// =========================================================================

function getDashboardState(choices) {
  // [V2] Contrôle administrateur AVANT tout appariement par nom
  if (isAdmin_(activeEmail_())) return { access: 'ADMIN', adminUrl: webAppUrl_() };
  assertStudentPageOpen_();
  const snap = loadSnapshot_();
  const name = currentUserName_(snap);
  return buildState_(snap, name, normalizeChoices_(choices));
}

function previewOdds(userChoices) {
  // [V2] Contrôle administrateur AVANT tout appariement par nom
  if (isAdmin_(activeEmail_())) throw new Error(ADMIN_NOT_STUDENT_MESSAGE);
  const choices = normalizeChoices_(userChoices);
  if (!choices) throw new Error(INVALID_CHOICES_MESSAGE);
  assertStudentPageOpen_();
  const snap = loadSnapshot_();
  const name = currentUserName_(snap);
  return buildState_(snap, name, choices);
}

function saveChoices(userChoices) {
  // [V2] Contrôle administrateur AVANT tout appariement par nom
  const email = activeEmail_();
  if (isAdmin_(email)) throw new Error(ADMIN_NOT_STUDENT_MESSAGE);
  const choices = normalizeChoices_(userChoices);
  if (!choices) throw new Error(INVALID_CHOICES_MESSAGE);
  assertStudentPageOpen_();
  // [V2] choicesLock_ inclut la publication des résultats (aucun enregistrement après publication)
  if (choicesLock_().locked) throw new Error(LOCKED_MESSAGE);

  const cached = loadSnapshot_();
  const name = currentUserName_(cached);
  const known = indexOfStudent_(cached, name);
  if (known !== -1 && sameChoices_(cached.rows[known].c, choices)) {
    return buildState_(cached, name, choices);
  }

  const cache = CacheService.getScriptCache();
  const cooldownKey = 'save_' + squash_(name);
  if (cache.get(cooldownKey)) {
    throw new Error("Patientez quelques secondes avant d'enregistrer à nouveau.");
  }

  return withScriptLock_(function() {
    if (choicesLock_().locked) throw new Error(LOCKED_MESSAGE);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const snap = readSnapshot_(ss);
    const officialName = currentUserName_(snap);
    const u = indexOfStudent_(snap, officialName);
    if (u === -1) throw new Error(NO_GRADE_MESSAGE);

    const now = new Date();
    // [V2] Écriture commune : Preferences comme avant, + une ligne Historique si les choix changent
    writeChoices_(ss, officialName, choices, now, 'ETUDIANT', email, !sameChoices_(snap.rows[u].c, choices));
    SpreadsheetApp.flush();

    snap.rows[u].c = choices;
    snap.rows[u].t = now.getTime();
    snap.builtAt = Date.now();
    putSnapshot_(snap);
    try { cache.put(cooldownKey, '1', SAVE_COOLDOWN_SECONDS); } catch (e) { Logger.log('Cooldown put failed: ' + e); }
    return buildState_(snap, officialName, choices);
  });
}

function buildState_(snap, officialName, requested) {
  const u = indexOfStudent_(snap, officialName);
  if (u === -1) throw new Error(NO_GRADE_MESSAGE);

  const me = snap.rows[u];
  // [V2] Propriétés lues une seule fois ; règles en vigueur au lieu des constantes
  const props = scriptProps_();
  const rules = rules_(props);
  const lockInfo = choicesLock_(props);
  const coverage = coverage_(snap, u);
  return {
    access: 'OK',
    grade: me.g,
    savedChoices: me.c,
    savedAt: me.t ? new Date(me.t).toISOString() : null,
    deadline: lockInfo.deadline,
    locked: lockInfo.locked,
    serverTime: new Date().toISOString(),
    timeZone: Session.getScriptTimeZone(),
    rules: { branches: BRANCHES.slice(), minSeats: rules.min, maxSeats: rules.max, classSize: snap.rows.length || CLASS_SIZE },
    stats: stats_(snap),
    coverage: coverage,
    projection: project_(snap, u, requested || me.c, me.c, coverage, rules),
    // [V2] Champs additionnels : annonce et résultat officiel publié
    announcement: announcement_(props),
    official: officialResult_(officialName, props)
  };
}

function stats_(snap) {
  const stats = {};
  BRANCHES.forEach(function(b) { stats[b] = { c1: 0, c2: 0, c3: 0 }; });
  snap.rows.forEach(function(r) {
    if (!r.c) return;
    stats[r.c[0]].c1++;
    stats[r.c[1]].c2++;
    stats[r.c[2]].c3++;
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
      if (parsed && parsed.sheet === pub.sheet) return parsed;
    }
  } catch (e) { Logger.log('Official cache read failed: ' + e); }

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pub.sheet);
  if (!sh) {
    Logger.log('Feuille publiée introuvable : ' + pub.sheet);
    return null;
  }
  const width = Math.max(1, Math.min(ALLOCATION_HEADERS.length, sh.getMaxColumns()));
  const header = sh.getRange(1, 1, 1, width).getValues()[0].map(squash_);
  const col = function(label, fallback) { const k = header.indexOf(squash_(label)); return k !== -1 ? k : fallback; };
  const cName = col('Nom', 1), cBranch = col('Filière affectée', 6), cRank = col('Rang du choix obtenu', 7);
  const byKey = {};
  readRows_(sh, width).forEach(function(row) {
    const key = squash_(row[cName]);
    if (!key) return;
    const b = String(row[cBranch] === undefined ? '' : row[cBranch]).trim();
    const r = Number(row[cRank]);
    byKey[key] = { b: BRANCHES.indexOf(b) !== -1 ? b : null, r: (r === 1 || r === 2 || r === 3) ? r : null };
  });
  const map = { sheet: pub.sheet, byKey: byKey };
  try { cache.put(OFFICIAL_CACHE_KEY, JSON.stringify(map), OFFICIAL_CACHE_SECONDS); } catch (e) { Logger.log('Official cache put failed: ' + e); }
  return map;
}

// =========================================================================
// MOTEUR MATHÉMATIQUE D'AFFECTATION (MAX = 26, MIN = 12)
// [V2] Paramétré par un objet rules {min, max} au lieu des constantes globales ;
//      avec les règles par défaut, le comportement est strictement identique.
// =========================================================================

function project_(snap, u, choices, saved, coverage, rules) {
  rules = rules || defaultRules_(); // [V2]
  if (!choices) {
    return {
      status: 'NO_CHOICES', choices: null, isSaved: false,
      bestBranch: null, worstBranch: null, reason: null,
      message: "Vous n'avez pas encore enregistré de choix. Classez les 3 filières, prévisualisez, puis enregistrez."
    };
  }
  const behindCase = reachableLandings_(snap, u, choices, false, rules);
  const aheadCase = reachableLandings_(snap, u, choices, true, rules);
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
    message: projectionMessage_(status, choices, best, worst, reason, coverage, rules)
  };
}

function projectionMessage_(status, choices, best, worst, reason, cov, rules) {
  rules = rules || defaultRules_(); // [V2]
  const ordinal = function(b) { return ['1er', '2e', '3e'][choices.indexOf(b)] + ' choix'; };
  const why = reason === 'CAPACITY'
    ? choices[0] + ' est complet (' + rules.max + ' places au maximum) avant votre rang'
    : 'les étudiants classés derrière vous sont nécessaires pour atteindre le minimum de ' +
      rules.min + ' places d\'une autre filière';

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

function reachableLandings_(snap, u, choices, ahead, rules) {
  rules = rules || defaultRules_(); // [V2]
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

  const W = totalStudents + 1;
  const seen = new Int32Array(W * W * 16).fill(-1);
  const x = [0, 0, 0];
  const options = [0, 0, 0];
  let states = [0];
  let pos = 0;
  groups.forEach(function(group) {
    const members = group.length <= MAX_TIE_GROUP ? [group] : group.map(function() { return [null]; });
    members.forEach(function(g) {
      let layer = states.map(function(code) { return code * 16; });
      for (let t = 0; t < g.length; t++, pos++) {
        const remaining = totalStudents - 1 - pos;
        const next = [];
        for (let s = 0; s < layer.length; s++) {
          const code = Math.floor(layer[s] / 16), mask = layer[s] % 16;
          x[0] = Math.floor(code / W); x[1] = code % W; x[2] = pos - x[0] - x[1];
          for (let j = 0; j < g.length; j++) {
            if (mask & (1 << j)) continue;
            const n = stepOptions_(x, g[j], remaining, options, rules);
            for (let o = 0; o < n; o++) {
              x[options[o]]++;
              const key = (x[0] * W + x[1]) * 16 + (mask | (1 << j));
              x[options[o]]--;
              if (seen[key] !== pos) { seen[key] = pos; next.push(key); }
            }
          }
        }
        layer = next;
      }
      states = layer.map(function(key) { return Math.floor(key / 16); });
    });
  });

  const mine = prefIndices_(choices);
  const remaining = totalStudents - 1 - pos;
  const landings = {};
  for (let s = 0; s < states.length; s++) {
    x[0] = Math.floor(states[s] / W); x[1] = states[s] % W; x[2] = pos - x[0] - x[1];
    const res = assignOne_(x, mine, remaining, rules);
    if (!(BRANCHES[res.b] in landings)) landings[BRANCHES[res.b]] = res.reason;
  }
  return landings;
}

function stepOptions_(x, prefs, remaining, out, rules) {
  rules = rules || defaultRules_(); // [V2]
  if (prefs) { out[0] = assignOne_(x, prefs, remaining, rules).b; return 1; }
  const base = seatsNeeded_(x, -1, rules);
  let n = 0;
  for (let b = 0; b < 3; b++) {
    if (x[b] < rules.max && remaining >= base - (x[b] < rules.min ? 1 : 0)) {
      out[n++] = b;
    }
  }
  if (n === 0) out[n++] = assignOne_(x, [0, 1, 2], remaining, rules).b;
  return n;
}

function prefIndices_(prefs) {
  return prefs.map(function(b) { return BRANCHES.indexOf(b); });
}

function assignOne_(counts, prefs, remaining, rules) {
  rules = rules || defaultRules_(); // [V2]
  let assigned = -1;
  let forced = false;
  for (let k = 0; k < prefs.length; k++) {
    if (counts[prefs[k]] < rules.max && remaining >= seatsNeeded_(counts, prefs[k], rules)) {
      assigned = prefs[k];
      break;
    }
  }
  if (assigned === -1) {
    forced = true;
    let maxNeeded = -1;
    for (let b = 0; b < counts.length; b++) {
      if (counts[b] >= rules.max) continue;
      const need = Math.max(0, rules.min - counts[b]);
      if (need > maxNeeded) { maxNeeded = need; assigned = b; }
    }
  }
  let reason = null;
  if (assigned !== prefs[0]) reason = (counts[prefs[0]] >= rules.max) ? 'CAPACITY' : 'QUOTA';
  return { b: assigned, reason: reason, forced: forced };
}

function seatsNeeded_(counts, taking, rules) {
  rules = rules || defaultRules_(); // [V2]
  let need = 0;
  for (let b = 0; b < counts.length; b++) {
    need += Math.max(0, rules.min - counts[b] - (b === taking ? 1 : 0));
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
 * rules     : {min, max}
 * tieOrders : {cléNote: [clés squash_ dans l'ordre de départage]} (feuille Departage)
 * forced    : {clé squash_: filière} (Surcharges actives)
 * policy    : 'LAST' | 'MANUAL' pour les étudiants sans choix
 */
function allocate_(rows, rules, tieOrders, forced, policy) {
  rules = rules || defaultRules_();
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
    rules: { min: rules.min, max: rules.max }, policy: policy, keys: keys, order: order,
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
  const counts = [0, 0, 0];
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
    if (counts[b] >= rules.max) { forcedOverflow.push(i); return; }
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
    if (r.b === -1) { res[i].reason = 'CAPACITY'; return; } // impossible lorsque 3 × max ≥ effectif
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
    if (counts[b] >= rules.max) continue;
    const need = Math.max(0, rules.min - counts[b]);
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
  const max = alloc.rules.max;
  const per = {};
  BRANCHES.forEach(function(b) {
    per[b] = {
      count: 0, seatsLeft: 0, full: false, cutoffGrade: null,
      byRank: { r1: 0, r2: 0, r3: 0 },
      bySource: { ALGO: 0, TIEBREAK: 0, MANUAL: 0, AUTO: 0 }
    };
  });
  const sat = { r1: 0, r2: 0, r3: 0, placed: 0, unplaced: 0, avgRank: null };
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
  BRANCHES.forEach(function(b) {
    per[b].seatsLeft = Math.max(0, max - per[b].count);
    per[b].full = per[b].count >= max;
  });
  sat.avgRank = rankN ? Math.round(rankSum / rankN * 100) / 100 : null;
  return { perBranch: per, satisfaction: sat };
}

// Zone de bascule : pour chaque filière pleine, 3 derniers admis et 3 premiers recalés
function bubble_(rows, alloc) {
  const out = [];
  BRANCHES.forEach(function(b) {
    if (alloc.counts[b] < alloc.rules.max) return;
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
  const max = alloc.rules.max, min = alloc.rules.min;
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
    if (r.at && r.at[bi] >= max) {
      const cut = summary.perBranch[b].cutoffGrade;
      parts.push(b + ' était complète (' + max + '/' + max + ') quand votre tour est arrivé ; dernière note admise : ' + fmtGradeFr_(cut));
    } else {
      parts.push(b + " n'était pas complète (" + (r.at ? r.at[bi] : '?') + '/' + max + '), mais les ' + r.remaining +
        ' étudiant(s) restant(s) étaient tous nécessaires pour atteindre le minimum de ' + min + ' places dans les autres filières');
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
  return contextFrom_(ss, scriptProps_(), snap, diag);
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
      expectedClassSize: CLASS_SIZE,
      spreadsheetUrl: spreadsheetUrl,
      rules: {
        min: rules.min, max: rules.max, defaultMin: MIN_SEATS, defaultMax: MAX_SEATS,
        floor: Math.max(rules.min, N - 2 * rules.max)
      },
      deadline: lock.deadline,
      deadlineLocal: dl !== null ? Utilities.formatDate(new Date(dl), tz, 'yyyy-MM-dd HH:mm') : null,
      deadlineInvalid: lock.deadlineInvalid,
      locked: lock.locked,
      manualLock: lock.manualLock,
      deadlinePassed: lock.deadlinePassed,
      studentPageOpen: studentPageOpen_(ctx.props),
      undecidedPolicy: ctx.policy,
      announcement: announcement_(ctx.props),
      results: { frozen: frozen, published: publishedSheet_(ctx.props) },
      mail: mailInfo_(ctx.snap),
      studentUrl: publicUrl_(ctx.props)
    },
    participation: participation_(rows, keys, histByKey, tz),
    demand: demand_(rows),
    allocation: { perBranch: sum.perBranch, satisfaction: sum.satisfaction, unresolvedTies: alloc.unresolvedTies },
    attention: { pending: pending, bubble: bubble_(rows, alloc), ties: ties },
    health: health_(ctx, alloc),
    roster: roster
  };
}

function participation_(rows, keys, histByKey, tz) {
  let saved = 0, last = null;
  const firstSaves = [];
  rows.forEach(function(r, i) {
    if (!r.c) return;
    saved++;
    if (typeof r.t === 'number' && (last === null || r.t > last)) last = r.t;
    const h = histByKey[keys[i]];
    const t0 = h && h.length ? h[0].at : r.t;
    if (typeof t0 === 'number' && isFinite(t0)) firstSaves.push(t0);
  });
  const known = {};
  keys.forEach(function(k) { known[k] = true; });
  let changed = 0;
  Object.keys(histByKey).forEach(function(k) {
    if (!known[k]) return;
    const distinct = {};
    histByKey[k].forEach(function(h) { distinct[h.choices.join('|')] = true; });
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

function demand_(rows) {
  const perms = [];
  BRANCHES.forEach(function(a) {
    BRANCHES.forEach(function(b) {
      BRANCHES.forEach(function(c) {
        if (a !== b && b !== c && a !== c) perms.push([a, b, c]);
      });
    });
  });
  const rankings = perms.map(function(p, k) {
    return { order: p, count: rows.filter(function(r) { return sameChoices_(r.c, p); }).length, k: k };
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
  // Paires de noms qu'un appariement par morceaux pourrait confondre (lignes sans e-mail)
  const ambiguous = [];
  const plain = rows.filter(function(r) { return !r.e; });
  const words = plain.map(function(r) {
    return String(r.h).split(/[\s\-'’]+/).map(squash_).filter(function(w) { return w.length >= 2; });
  });
  const squashed = plain.map(function(r) { return squash_(r.h); });
  for (let a = 0; a < plain.length && ambiguous.length < 50; a++) {
    for (let b = a + 1; b < plain.length && ambiguous.length < 50; b++) {
      const aInB = words[a].length && words[a].every(function(w) { return squashed[b].indexOf(w) !== -1; });
      const bInA = words[b].length && words[b].every(function(w) { return squashed[a].indexOf(w) !== -1; });
      if (aInB || bInA) ambiguous.push({ a: plain[a].h, b: plain[b].h });
    }
  }
  const known = {};
  rows.forEach(function(r) { known[squash_(r.h)] = true; });
  return {
    loaded: rows.length,
    expected: CLASS_SIZE,
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
    return { available: false, reason: 'Renseignez la colonne C « Email » de la feuille Responses pour envoyer des rappels.', remainingQuota: quota };
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
    if (hit) return JSON.parse(hit);
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
  const out = { computedAt: new Date().toISOString(), counts: counts, byStudent: byStudent };
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

function validateRules_(min, max, N) {
  if (min === null || max === null) throw new Error('Le minimum et le maximum doivent être des nombres entiers.');
  if (min < 0 || min > max) throw new Error('Règles invalides : il faut 0 ≤ minimum ≤ maximum.');
  if (max > 999) throw new Error('Maximum trop grand.');
  if (3 * max < N) throw new Error('Plafond insuffisant : 3 × ' + max + ' = ' + (3 * max) + ' places pour ' + N + ' étudiants.');
  if (3 * min > N) throw new Error('Minimum impossible : 3 × ' + min + ' = ' + (3 * min) + " dépasse l'effectif de " + N + '.');
}

function adminWhatIf(req) {
  requireAdmin_();
  req = req || {};
  const min = toInt_(req.min), max = toInt_(req.max);
  if (min === null || max === null || min < 0 || min > max || max > 999) {
    throw new Error('Règles invalides : saisissez des entiers avec 0 ≤ minimum ≤ maximum.');
  }
  const ctx = adminContext_(SpreadsheetApp.getActiveSpreadsheet(), false);
  const rows = ctx.snap.rows;
  const N = rows.length;
  const scenarioRules = { min: min, max: max };
  const floor = Math.max(min, N - 2 * max);
  const feasible = 3 * max >= N && 3 * min <= N;
  const warnings = [];
  if (3 * max < N) warnings.push('Plafond insuffisant : 3 × ' + max + ' = ' + (3 * max) + ' places pour ' + N + ' étudiants. Des étudiants resteraient sans filière.');
  if (3 * min > N) warnings.push('Minimum impossible : 3 × ' + min + ' = ' + (3 * min) + " dépasse l'effectif de " + N + '.');
  if (feasible && N - 2 * max >= min) {
    warnings.push('Le minimum de ' + min + " n'est pas contraignant : avec un plafond de " + max + ', chaque filière reçoit forcément au moins ' +
      (N - 2 * max) + ' étudiants. C\'est le plafond qui décide.');
  }
  const forcedCount = {};
  Object.keys(ctx.forcedMap).forEach(function(k) { forcedCount[ctx.forcedMap[k]] = (forcedCount[ctx.forcedMap[k]] || 0) + 1; });
  Object.keys(forcedCount).forEach(function(b) {
    if (forcedCount[b] > max) warnings.push(forcedCount[b] + ' affectation(s) imposée(s) en ' + b + ' dépassent ce plafond : les dernières seraient ignorées.');
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
    return { rules: { min: alloc.rules.min, max: alloc.rules.max }, perBranch: per, satisfaction: s.satisfaction, unresolvedTies: alloc.unresolvedTies };
  };
  const changed = cur.order.filter(function(i) { return cur.res[i].branch !== scn.res[i].branch; }).map(function(i) {
    return {
      name: rows[i].h, grade: rows[i].g, from: cur.res[i].branch, to: scn.res[i].branch,
      fromRank: cur.res[i].choiceRank, toRank: scn.res[i].choiceRank
    };
  });
  return {
    rules: { min: min, max: max, floor: floor },
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
function allocationTable_(ctx, alloc) {
  const rows = ctx.snap.rows;
  const tieOf = {};
  alloc.ties.forEach(function(t) { t.members.forEach(function(i) { tieOf[i] = t; }); });
  const body = alloc.order.map(function(i) {
    const r = rows[i], a = alloc.res[i];
    const c = r.c || ['', '', ''];
    return [a.rank, r.h, r.g, c[0], c[1], c[2], a.branch || '', a.choiceRank || '', a.source || '',
      sourceComment_(r, a, alloc, ctx.forced[alloc.keys[i]], tieOf[i])];
  });
  return [ALLOCATION_HEADERS.slice()].concat(body);
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
    table = [['Filière', '1er choix', '2e choix', '3e choix']].concat(BRANCHES.map(function(b) {
      return [b, d.perBranch[b].c1, d.perBranch[b].c2, d.perBranch[b].c3];
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
    table = [['Rang', 'Nom', 'Note', 'Email', 'Choix 1', 'Choix 2', 'Choix 3', 'Enregistré le',
      'Filière provisoire', 'Rang du choix', 'Origine']].concat(alloc.order.map(function(i) {
      const r = rows[i], a = alloc.res[i], c = r.c || ['', '', ''];
      return [a.rank, r.h, r.g, r.e || '', c[0], c[1], c[2],
        r.t ? Utilities.formatDate(new Date(r.t), tz, 'yyyy-MM-dd HH:mm') : '',
        a.branch || '', a.choiceRank || '', a.source || ''];
    }));
    base = 'liste_complete';
  } else {
    throw new Error("Type d'export inconnu : " + kind + '.');
  }
  return { filename: base + '_' + stamp + '.csv', mimeType: 'text/csv;charset=utf-8', content: toCsv_(table) };
}

// CSV : UTF-8 avec BOM, « ; », virgule décimale, CRLF, textes entre guillemets, garde anti-formule
function toCsv_(table) {
  return '﻿' + table.map(function(row) {
    return row.map(function(v) {
      if (typeof v === 'number' && isFinite(v)) return String(v).replace('.', ',');
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
  return {
    subject: 'Rappel : classez vos filières de spécialité (CI2 RST)',
    body: 'Bonjour {nom},\n\n' +
      "Vous n'avez pas encore enregistré votre classement des filières de spécialité (" + BRANCHES.join(', ') + ').\n\n' +
      'Date limite : {date_limite}\n' +
      'Lien : {lien}\n\n' +
      'Connectez-vous avec votre compte @' + DOMAIN + ', classez les trois filières, puis appuyez sur « Enregistrer mes choix ».\n\n' +
      'Cordialement,\nLa coordination CI2 RST'
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
  const out = withScriptLock_(function() {
    const res = fn(ss, scriptProps_(), admin) || {};
    if (res.details !== undefined && res.details !== null) appendJournal_(ss, admin, action, res.details);
    invalidateSnapshot_();
    invalidateTally_();
    if (res.official) invalidateOfficial_();
    return res;
  });
  const result = { ok: true, notice: out.notice || 'Modification enregistrée.', overview: adminOverview_(ss) };
  if (out.extra) Object.keys(out.extra).forEach(function(k) { result[k] = out.extra[k]; });
  return result;
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
    if (unlock) store.setProperty(LOCKED_PROPERTY, 'false');
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
    PropertiesService.getScriptProperties().setProperty(LOCKED_PROPERTY, locked ? 'true' : 'false');
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
    PropertiesService.getScriptProperties().setProperty(STUDENT_PAGE_OPEN_PROPERTY, open ? 'true' : 'false');
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
    PropertiesService.getScriptProperties().setProperty(UNDECIDED_POLICY_PROPERTY, p);
    return {
      notice: p === 'LAST'
        ? 'Les étudiants sans choix seront placés en dernier, dans les filières qui en ont le plus besoin.'
        : "Les étudiants sans choix resteront non placés jusqu'à une décision manuelle.",
      details: 'Politique sans choix : ' + p
    };
  });
}

function adminSetRules(req) {
  const admin = requireAdmin_();
  req = req || {};
  const min = toInt_(req.min), max = toInt_(req.max);
  if (min === null || max === null) throw new Error('Le minimum et le maximum doivent être des nombres entiers.');
  return adminWrite_(admin, 'REGLES', function(ss, props) {
    const snap = readSnapshot_(ss);
    validateRules_(min, max, snap.rows.length);
    const forced = readOverrides_(ss);
    const perBranch = {};
    Object.keys(forced).forEach(function(k) { perBranch[forced[k].branch] = (perBranch[forced[k].branch] || 0) + 1; });
    Object.keys(perBranch).forEach(function(b) {
      if (perBranch[b] > max) throw new Error(perBranch[b] + ' affectations imposées en ' + b + ' dépassent ce plafond : retirez-en d\'abord.');
    });
    const before = rules_(props);
    PropertiesService.getScriptProperties().setProperties({ [MIN_SEATS_PROPERTY]: String(min), [MAX_SEATS_PROPERTY]: String(max) });
    return {
      notice: 'Règles appliquées : au plus ' + max + ' et au moins ' + min + ' étudiants par filière. Les projections des étudiants changeront à leur prochaine actualisation.',
      details: 'Minimum ' + before.min + ' → ' + min + ' ; maximum ' + before.max + ' → ' + max
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
  if (!choices) throw new Error(INVALID_CHOICES_MESSAGE);
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
      if (others >= rules.max) {
        throw new Error('Impossible : ' + branch + ' compte déjà ' + others + ' affectations imposées (plafond ' + rules.max + ').');
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
    const sh = ss.insertSheet(name);
    [2, 4, 5, 6, 7, 9, 10].forEach(function(col) { sh.getRange(1, col, Math.max(table.length, 2), 1).setNumberFormat('@'); });
    sh.getRange(1, 1, table.length, ALLOCATION_HEADERS.length).setValues(table.map(function(r) { return r.map(sanitizeCell_); }));
    sh.getRange(1, 1, 1, ALLOCATION_HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    try { sh.protect().setDescription('Affectation figée le ' + now.toISOString()).setWarningOnly(true); } catch (e) { Logger.log('Protection impossible : ' + e); }
    const list = [{ sheet: name, at: now.toISOString(), by: admin }].concat(frozenSheets_(props)).slice(0, FROZEN_SHEETS_MAX);
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
    if (!ss.getSheetByName(sheet)) throw new Error("La feuille « " + sheet + " » n'existe plus dans le classeur.");
    PropertiesService.getScriptProperties().setProperty(PUBLISHED_SHEET_PROPERTY,
      JSON.stringify({ sheet: sheet, at: new Date().toISOString(), by: admin }));
    return {
      notice: 'Résultats publiés : chaque étudiant voit désormais sa filière officielle.',
      details: 'Feuille publiée : ' + sheet,
      official: true
    };
  });
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
  const snap = withScriptLock_(function() { const s = readSnapshot_(ss); putSnapshot_(s); return s; });
  const info = mailInfo_(snap);
  if (!info.available) throw new Error(info.reason || "Envoi d'e-mails indisponible.");

  const tz = Session.getScriptTimeZone();
  const deadlineText = lock.deadline ? fmtLocalFr_(Date.parse(lock.deadline), tz) : 'non fixée';
  const link = publicUrl_(props);
  const fill = function(text, name) {
    return text.split('{nom}').join(name).split('{date_limite}').join(deadlineText).split('{lien}').join(link);
  };
  let quota = info.remainingQuota;
  // Envoi hors verrou (lent) ; seule l'écriture du Journal se fait sous verrou
  const results = snap.rows.filter(function(r) { return !r.c && r.e; }).map(function(r) {
    if (quota <= 0) return { name: r.h, email: r.e, status: 'SKIPPED', error: 'Quota quotidien atteint' };
    try {
      MailApp.sendEmail({ to: r.e, subject: fill(subject, r.h), body: fill(body, r.h), replyTo: admin, name: MAIL_SENDER_NAME });
      quota--;
      return { name: r.h, email: r.e, status: 'SENT', error: null };
    } catch (e) {
      return { name: r.h, email: r.e, status: 'FAILED', error: String((e && e.message) || e) };
    }
  });
  const count = function(s) { return results.filter(function(r) { return r.status === s; }).length; };
  const sent = count('SENT'), failed = count('FAILED'), skipped = count('SKIPPED');
  withScriptLock_(function() {
    appendJournal_(ss, admin, 'RAPPELS', sent + ' envoyé(s), ' + failed + ' échec(s), ' + skipped + ' non envoyé(s) (quota) — objet : ' + subject);
    invalidateSnapshot_();
  });
  return {
    ok: true,
    notice: sent + ' rappel(s) envoyé(s)' + (failed ? ', ' + failed + ' échec(s)' : '') + (skipped ? ', ' + skipped + ' non envoyé(s) faute de quota' : '') + '.',
    overview: adminOverview_(ss),
    results: results,
    sent: sent, failed: failed, skipped: skipped
  };
}

// =========================================================================
// [V2] INSTALLATION ET AUTO-TEST (à lancer depuis l'éditeur)
// =========================================================================

/**
 * Crée les feuilles manquantes (avec en-têtes) et les propriétés par défaut.
 * Idempotent : ne remplace jamais une feuille, un en-tête ou une propriété existants.
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
    const store = PropertiesService.getScriptProperties();
    const props = store.getProperties();
    const defaults = {
      [ADMIN_EMAILS_PROPERTY]: DEFAULT_ADMIN_EMAILS.join(','),
      [STUDENT_PAGE_OPEN_PROPERTY]: 'false',
      [MIN_SEATS_PROPERTY]: String(MIN_SEATS),
      [MAX_SEATS_PROPERTY]: String(MAX_SEATS),
      [UNDECIDED_POLICY_PROPERTY]: 'LAST'
    };
    const missing = {};
    Object.keys(defaults).forEach(function(k) {
      if (props[k] === undefined || props[k] === null || props[k] === '') { missing[k] = defaults[k]; done.push('propriété ' + k + ' = ' + defaults[k]); }
    });
    if (Object.keys(missing).length) store.setProperties(missing);
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
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const weights = [0.30, 0.20, 0.17, 0.08, 0.15, 0.10];
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

  [defaultRules_(), { min: 20, max: 30 }, { min: 12, max: 24 }].forEach(function(r) {
    const a = allocate_(rows, r, {}, {}, 'LAST');
    const floor = Math.max(r.min, rows.length - 2 * r.max);
    const bad = BRANCHES.filter(function(b) { return a.counts[b] > r.max || a.counts[b] < floor; });
    check('(a) règles ' + r.min + '/' + r.max + ' : aucune filière au-dessus de ' + r.max + ' ni sous le plancher ' + floor,
      bad.length === 0, BRANCHES.map(function(b) { return b + ' = ' + a.counts[b]; }).join(', '));
  });

  const rules = defaultRules_();
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
