var _merge = require('lodash/merge');
var _isEmpty = require('lodash/isEmpty');
var _compact = require('lodash/compact');

var uuid = require('uuid');

var DEFAULTS = {
  filename: 'event'
};

function ICS(options) {
  this.options = _merge({}, DEFAULTS, options);
}

function buildEvent(attributes) {
  if (!attributes || _isEmpty(attributes)) {
    return buildDefaultEvent();
  } else {
    return _compact([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//Adam Gibbons//agibbons.com//ICS: iCalendar Generator'
    ]
    .concat([
      'BEGIN:VEVENT',
      generateUID(attributes.uid),
      'DTSTAMP:' + generateDateTimeStamp(),
      formatDTSTART(attributes.start),
      formatDTEND(attributes.start, attributes.end),
      formatProperty('SUMMARY', attributes.title),
      formatProperty('DESCRIPTION', attributes.description),
      formatProperty('LOCATION', attributes.location),
      formatProperty('URL', attributes.url),
      formatStatus(attributes.status),
      formatGeo(attributes.geo)
    ])
    .concat(formatAttendees(attributes))
    .concat(formatOrganizer(attributes))
    .concat(formatCategories(attributes))
    .concat(formatAttachments(attributes))
    .concat(['END:VEVENT', 'END:VCALENDAR'])).join('\r\n');
  }

  function buildDefaultEvent() {
    var file = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//Adam Gibbons//agibbons.com//ICS: iCalendar Generator',
      'BEGIN:VEVENT',
      generateUID(),
      'DTSTAMP:' + generateDateTimeStamp(),
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return file;
  }

  function generateUID(uid) {
    if(uid) {
      return 'UID:' + uid;
    }
    return 'UID:' + uuid.v1();
  }

  function setFileExtension(dest) {
    return dest.slice(-4) === '.ics' ? dest : dest.concat('.ics');
  }

  // Follow ISO 8601 string rules:
  // If `start` contains an uppercase T or a space,
  // it's a date-time; otherwise, it's just a date.
  function formatDTSTART(string) {
    if (!string) {
      return 'DTSTART;VALUE=DATE:' + formatDateToLocalDate(new Date());
    }

    if (isDateTime(string)) {
      // Form #2: DATE WITH UTC TIME
      return 'DTSTART:' + formatDateToUTCDatetime(new Date(string));
    }

    return 'DTSTART;VALUE=DATE:' + formatDateToLocalDate(new Date(string));
  }

  function formatDTEND(startString, endString) {

    if (!startString) {
      return 'DTEND;VALUE=DATE:' + formatDateToLocalDate(addDays(new Date(), 1));
    }

    if (endString && !isDateTime(startString)) {
      return 'DTEND;VALUE=DATE:' + formatDateToLocalDate(new Date(endString));
    }

    if (endString && isDateTime(startString)) {
      return 'DTEND:' + formatDateToUTCDatetime(new Date(endString));
    }

    if (!endString && !isDateTime(startString)) {
      return 'DTEND;VALUE=DATE:' + formatDateToLocalDate(addDays(new Date(startString), 1));
    }

    return 'DTEND:' + formatDateToUTCDatetime(new Date(startString));
  }

  function isDateTime(string) {
    return ['T', ' '].some(function (char) {
      return string.search(char) !== -1;
    });
  }

  function isUTC(string) {
    return string[string.length - 1] === 'Z';
  }

  function generateDateTimeStamp() {
    return formatDateToUTCDatetime(new Date(), true);
  }

  function pad(a) {
    return a < 10 ? '0' + a : '' + a;
  }

  function addDays(oldDate, days) {
    return new Date(oldDate.getFullYear(),oldDate.getMonth(),oldDate.getDate()+days);
  }

  function formatDateToLocalDate(date) {
    return[
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('')
  }

  function formatDateToUTCDatetime(date, hasSS) {
    var ss = hasSS ? pad(date.getUTCSeconds()) : '00';

    return[
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
      'T',
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      ss,
      'Z'
    ].join('')
  }

  function formatProperty(key, value) {
    if (value) {
      return key + ':' + value;
    }

    return null;
  }

  function formatAttachments(attributes) {
    if (attributes.attachments) {
      return attributes.attachments.map(function (path) {
        return 'ATTACH:' + path;
      });
    }
    return null;
  }

  function formatAttendees(attributes) {
    if (attributes.attendees) {
      return attributes.attendees.map(function (attendee) {
        if (attendee.name && attendee.email) {
          return 'ATTENDEE;CN=' + attendee.name + ':mailto:' + attendee.email;
        }
        return null;
      });
    }

    return null;
  }

  function formatOrganizer(attributes) {
    if (attributes.organizer) {
      if (attributes.organizer.name && attributes.organizer.email) {
        return 'ORGANIZER;CN=' + attributes.organizer.name + ':mailto:' + attributes.organizer.email;
      }
      return null;
    }

    return null;
  }

  function formatCategories(attributes) {
    if (attributes.categories) {
      return 'CATEGORIES:' + attributes.categories.join(',');
    }

    return null;
  }

  function formatGeo(geo) {
    if (geo && geo.lat && geo.lon) {
      return 'GEO:' + parseFloat(geo.lat) + ';' + parseFloat(geo.lon);
    }

    return null;
  }

  function formatStatus(status) {
    if (status && ['TENTATIVE', 'CONFIRMED', 'CANCELLED'].indexOf(status.toUpperCase()) !== -1) {
      return 'STATUS:' + status;
    }

    return null;
  }
}

ICS.prototype.buildEvent = function(attributes) {
  return buildEvent(attributes);
};

module.exports = ICS;
