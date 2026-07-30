const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres raises a cast error on a malformed uuid, so ids coming from the
// request are checked before they reach a query.
const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

const uuidList = (values) => (Array.isArray(values) ? values.filter(isUuid) : []);

module.exports = { isUuid, uuidList };
