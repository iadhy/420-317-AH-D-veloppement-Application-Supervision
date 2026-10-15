/**
 * Construction des options de requete a partir de req.query.
 *
 * Ces fonctions sont PURES : elles ne touchent ni a Express, ni a Mongoose.
 * C'est ce qui permet de les tester sans serveur et sans base (npm test).
 */

// Seuls ces champs peuvent etre tries. Tout le reste retombe sur le defaut.
const SORTABLE_FIELDS = ["createdAt", "value"];

/**
 * On lit les parametres attendus UN PAR UN.
 * Jamais Measure.find(req.query) : le client choisirait lui-meme les
 * operateurs de la requete, ce qui est une injection.
 */
export function buildFilter(query) {
  const filter = {};

  if (query.sensor) {
    filter.sensor = query.sensor;
  }

  // Tout ce qui vient de l'URL est du TEXTE : sans Number(), la comparaison
  // porte sur des chaines et renvoie des resultats faux, sans erreur.
  const min = query.min === undefined ? undefined : Number(query.min);
  const max = query.max === undefined ? undefined : Number(query.max);

  if (Number.isFinite(min) || Number.isFinite(max)) {
    filter.value = {};
    if (Number.isFinite(min)) filter.value.$gte = min;
    if (Number.isFinite(max)) filter.value.$lte = max;
  }

  const from = query.from === undefined ? undefined : new Date(query.from);
  const to = query.to === undefined ? undefined : new Date(query.to);

  const fromValide = from instanceof Date && !Number.isNaN(from.valueOf());
  const toValide = to instanceof Date && !Number.isNaN(to.valueOf());

  if (fromValide || toValide) {
    filter.createdAt = {};
    if (fromValide) filter.createdAt.$gte = from;
    if (toValide) filter.createdAt.$lte = to;
  }

  return filter;
}

/**
 * Liste blanche : on n'accepte pas n'importe quel nom de champ venant du client.
 * Defaut : la mesure la plus recente en premier.
 */
export function buildSort(query) {
  const field = SORTABLE_FIELDS.includes(query.sort) ? query.sort : "createdAt";
  const direction = query.order === "asc" ? 1 : -1;

  return { [field]: direction };
}

// Plafond dur : sans lui, un client ecrit ?limit=999999 et le probleme
// que la pagination devait resoudre revient intact.
const LIMIT_DEFAUT = 20;
const LIMIT_MAX = 100;

export function buildPagination(query) {
  const pageDemandee = Number(query.page);
  const limitDemandee = Number(query.limit);

  const page = Number.isInteger(pageDemandee) && pageDemandee > 0 ? pageDemandee : 1;

  const limit = Number.isInteger(limitDemandee) && limitDemandee > 0
    ? Math.min(limitDemandee, LIMIT_MAX)
    : LIMIT_DEFAUT;

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta({ page, limit, total }) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}
