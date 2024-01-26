import { BADGE_COLORS } from '@noodl-core-ui/styles/badges';
import { getColorFromMap } from '@noodl-core-ui/utils/color';

export interface CollaboratorBadge {
  label: string;
  color: string;
}

export function getBadgeAndNameForUser(user: { name: string; email: string; id: string }): {
  name: string;
  badge: CollaboratorBadge;
} {
  function hashCode(str) {
    var hash = 0,
      i,
      chr;
    if (!str?.length) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  let badge = 'UK';
  function _makeBadge(first, second) {
    if (first === undefined) return 'UK';
    else if (second === undefined) return (first + first).toUpperCase();
    else return (first + second).toUpperCase();
  }

  let name: string = undefined;

  try {
    name = user.name;
    if (!name && user.email && user.email.length >= 2) {
      name = user.email.split('@')[0];
    }

    let p;
    if (user.name && user.name.length >= 2) {
      p = user.name.split(' ');
    } else if (user.email && user.email.length >= 2) {
      p = user.email.split('.');
    }

    if (p.length === 1) {
      badge = _makeBadge(p[0][0], p[0][1]);
    } else if (p.length >= 2) {
      badge = _makeBadge(p[0][0], p[1][0]);
    }
  } catch (e) {}

  const color = getColorFromMap(user.id, BADGE_COLORS);

  return {
    badge: { label: badge, color: color },
    name
  };
}

export function getBadgeForUser(c: { id: string; email: string; name: string }) {
  function hashCode(str) {
    var hash = 0,
      i,
      chr;
    if (!str?.length) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  var badge = 'UK';

  function _makeBadge(first, second) {
    if (first === undefined) return 'UK';
    else if (second === undefined) return (first + first).toUpperCase();
    else return (first + second).toUpperCase();
  }
  try {
    var name = c.name;
    if (!name && c.email && c.email.length >= 2) {
      name = c.email.split('@')[0];
    }

    if (c.name && c.name.length >= 2) {
      var p = c.name.split(' ');
    } else if (c.email && c.email.length >= 2) {
      var p = c.email.split('.');
    }

    if (p.length === 1) {
      badge = _makeBadge(p[0][0], p[0][1]);
    } else if (p.length >= 2) {
      badge = _makeBadge(p[0][0], p[1][0]);
    }
  } catch (e) {}

  var color = getColorFromMap(c.id, BADGE_COLORS);
  return {
    label: badge,
    color: color
  };
}
