// opening times: the store's `schedule`, in schema.org's openingHours form ("Mo-Fr 09:00-18:00; Sa 10:00-14:00"),
// read in the site's time zone. Used by the open/closed badge (src/map/hours.js), the "Open now" filter
// (src/map/search.js) and the editor. A week is 7 lists (Monday first) of [ start, end ] in minutes;
// an end at or before its start is after midnight ("22:00-02:00"), and a start equal to its end is 24 hours.

const DAYS = [ 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su' ];
const DAY = '[a-z]{2}(?:\\s*-\\s*[a-z]{2})?';
const SPAN = '\\d{1,2}:\\d{2}\\s*-\\s*\\d{1,2}:\\d{2}';
const RULE = new RegExp( `^(${ DAY }(?:\\s*,\\s*${ DAY })*)\\s+(${ SPAN }(?:\\s*,\\s*${ SPAN })*)$`, 'i' );

// the "Open now" setting: badge and filter, the badge only, or none
export const openModeOf = ( value ) => ( [ 'filter', 'badge' ].includes( value ) ? value : '' );

const minutesOf = ( time ) => {
	const [ h, m ] = time.trim().split( ':' ).map( Number );
	return h <= 24 && m < 60 ? ( h * 60 ) + m : NaN;
};

export const hhmm = ( minutes ) => [ Math.floor( minutes / 60 ) % 24, minutes % 60 ].map( ( n ) => String( n ).padStart( 2, '0' ) ).join( ':' );

// what can not be read is left out
export const parseSchedule = ( value ) => {
	const week = DAYS.map( () => [] );
	String( value || '' ).split( ';' ).forEach( ( rule ) => {
		const match = RULE.exec( rule.trim() );
		if ( ! match ) {
			return;
		}
		const spans = match[ 2 ].split( ',' ).map( ( span ) => span.split( '-' ).map( minutesOf ) ).filter( ( [ start, end ] ) => start < 1440 && end <= 1440 );
		match[ 1 ].split( ',' ).forEach( ( part ) => {
			const [ first, last = first ] = part.split( '-' ).map( ( day ) => DAYS.findIndex( ( name ) => name.toLowerCase() === day.trim().toLowerCase() ) );
			if ( first < 0 || last < 0 ) {
				return;
			}
			// "Fr-Mo" goes round the weekend
			for ( let day = first; ; day = ( day + 1 ) % 7 ) {
				week[ day ].push( ...spans.map( ( span ) => [ ...span ] ) );
				if ( day === last ) {
					break;
				}
			}
		} );
	} );
	// each time once a day, at most 8: "Mo-Su,Mo-Su,…" can not make a day of hundreds
	return week.map( ( spans ) => [ ...new Map( spans.map( ( span ) => [ span.join(), span ] ) ).values() ]
		.sort( ( a, b ) => a[ 0 ] - b[ 0 ] ).slice( 0, 8 ) );
};

export const hasHours = ( week ) => week.some( ( spans ) => spans.length > 0 );

// "Mo-Fr 09:00-18:00; Sa 10:00-14:00", one rule a line or after a ;, as a schedule, or '' when any part is
// something else (a CSV's opening hours written for people)
export const scheduleOf = ( value ) => {
	const rules = String( value || '' ).split( /[;\n]/ ).map( ( rule ) => rule.trim() ).filter( Boolean );
	return rules.length && rules.every( ( rule ) => RULE.test( rule ) ) ? rules.join( '; ' ) : '';
};

// a week back to text: days in a row with the same times share a rule
export const formatSchedule = ( week ) => {
	const keys = week.map( ( spans ) => spans.map( ( [ start, end ] ) => hhmm( start ) + '-' + ( 1440 === end ? '24:00' : hhmm( end ) ) ).join( ',' ) );
	const rules = [];
	for ( let day = 0; day < 7; ) {
		let last = day;
		while ( last < 6 && keys[ last + 1 ] === keys[ day ] ) {
			last++;
		}
		if ( keys[ day ] ) {
			rules.push( DAYS[ day ] + ( last > day ? '-' + DAYS[ last ] : '' ) + ' ' + keys[ day ] );
		}
		day = last + 1;
	}
	return rules.join( '; ' );
};

// the day (0 is Monday) and minute now in the site's time zone: "Europe/London" or "+06:00"
export const nowIn = ( zone, date = new Date() ) => {
	const offset = /^([+-])(\d{2}):(\d{2})$/.exec( zone || '' );
	if ( offset ) {
		const sign = '-' === offset[ 1 ] ? -1 : 1;
		const shifted = new Date( date.getTime() + ( sign * ( ( Number( offset[ 2 ] ) * 60 ) + Number( offset[ 3 ] ) ) * 60000 ) );
		return { day: ( shifted.getUTCDay() + 6 ) % 7, minute: ( shifted.getUTCHours() * 60 ) + shifted.getUTCMinutes() };
	}
	try {
		const parts = Object.fromEntries( new Intl.DateTimeFormat( 'en-US', { timeZone: zone || undefined, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' } )
			.formatToParts( date ).map( ( part ) => [ part.type, part.value ] ) );
		return { day: [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ].indexOf( parts.weekday ), minute: ( ( Number( parts.hour ) % 24 ) * 60 ) + Number( parts.minute ) };
	} catch ( error ) {
		// an unknown zone: the visitor's own clock
		return { day: ( date.getDay() + 6 ) % 7, minute: ( date.getHours() * 60 ) + date.getMinutes() };
	}
};

// open now and until when (null: always), or closed and when it opens; null without opening times.
// Minutes count from the start of today.
export const statusOf = ( week, now ) => {
	const spans = [];
	for ( let offset = -1; offset <= 7; offset++ ) {
		week[ ( now.day + offset + 7 ) % 7 ].forEach( ( [ start, end ] ) => spans.push( [ ( offset * 1440 ) + start, ( offset * 1440 ) + ( end > start ? end : end + 1440 ) ] ) );
	}
	const open = spans.find( ( [ start, end ] ) => start <= now.minute && now.minute < end );
	if ( open ) {
		// times that follow on without a break ("Mo-Su 00:00-24:00") count as one
		let until = open[ 1 ];
		for ( let longer = true; longer; ) {
			longer = false;
			spans.forEach( ( [ start, end ] ) => {
				if ( start <= until && end > until ) {
					until = end;
					longer = true;
				}
			} );
		}
		return { open: true, until: until - now.minute >= 7 * 1440 ? null : until };
	}
	const next = spans.filter( ( [ start ] ) => start > now.minute ).sort( ( a, b ) => a[ 0 ] - b[ 0 ] )[ 0 ];
	return next ? { open: false, next: next[ 0 ] } : null;
};

const format = ( lang, options, date ) => {
	try {
		return new Intl.DateTimeFormat( lang || undefined, { ...options, timeZone: 'UTC' } ).format( date );
	} catch ( error ) {
		return new Intl.DateTimeFormat( undefined, { ...options, timeZone: 'UTC' } ).format( date );
	}
};

// "18:00" or "6:00 PM", as the site's language writes it
export const timeLabel = ( minutes, lang ) => format( lang, { hour: 'numeric', minute: '2-digit' }, Date.UTC( 2024, 0, 1, 0, minutes % 1440 ) );

// "Mon"; 1 January 2024 was a Monday
export const dayLabel = ( day, lang, weekday = 'short' ) => format( lang, { weekday }, Date.UTC( 2024, 0, 1 + day ) );

// the badge's words: "Open until 18:00", "Open now", "Closed · opens 9:00" or "Closed · opens Mon 9:00"
export const badgeOf = ( week, now, text, lang ) => {
	const status = statusOf( week, now );
	if ( ! status ) {
		return null;
	}
	const at = ( minutes ) => {
		const day = Math.floor( minutes / 1440 );
		// the day only when it is not today and more than half a day away
		return ( day && minutes - now.minute > 720 ? dayLabel( ( now.day + day ) % 7, lang ) + ' ' : '' ) + timeLabel( minutes, lang );
	};
	if ( status.open ) {
		return { open: true, label: null === status.until ? text.openNow : text.openUntil( at( status.until ) ) };
	}
	return { open: false, label: text.opens( at( status.next ) ) };
};

// the times as people write them, for the store's shown text: "Mon–Fri 9:00–18:00", "Sun closed"
export const hoursText = ( week, lang, closed ) => {
	const keys = week.map( ( spans ) => spans.map( ( [ start, end ] ) => timeLabel( start, lang ) + '–' + timeLabel( end, lang ) ).join( ', ' ) );
	const lines = [];
	for ( let day = 0; day < 7; ) {
		let last = day;
		while ( last < 6 && keys[ last + 1 ] === keys[ day ] ) {
			last++;
		}
		lines.push( dayLabel( day, lang ) + ( last > day ? '–' + dayLabel( last, lang ) : '' ) + ' ' + ( keys[ day ] || closed ) );
		day = last + 1;
	}
	return lines.join( '\n' );
};
