import { __, sprintf } from '@wordpress/i18n';
import { Button, CheckboxControl, Notice } from '@wordpress/components';
import { icons } from '../../../utils/icons';
import { dayLabel, formatSchedule, hasHours, hhmm, hoursText, parseSchedule, scheduleOf } from '../../../utils/hours';

const lang = document.documentElement.lang;

// minutes from a time field ("09:30"), or null while it is not filled in
const minutesOf = ( value ) => ( /^\d{2}:\d{2}$/.test( value ) ? ( Number( value.slice( 0, 2 ) ) * 60 ) + Number( value.slice( 3 ) ) : null );

// the store's opening times as a week: a row a day, with up to two times (a lunch break). It writes the
// store's `schedule` ("Mo-Fr 09:00-18:00"), which the open/closed badge and the "Open now" filter read.
const WeekHours = ( { value, onChange, onText } ) => {
	const week = parseSchedule( value );
	const save = ( next ) => onChange( formatSchedule( next ) );
	const setDay = ( day, spans ) => save( week.map( ( old, d ) => ( d === day ? spans : old ) ) );
	const setTime = ( day, index, edge, time ) => {
		const minutes = minutesOf( time );
		if ( null !== minutes ) {
			setDay( day, week[ day ].map( ( span, i ) => ( i === index ? Object.assign( [ ...span ], { [ edge ]: minutes } ) : span ) ) );
		}
	};
	// any part that can not be read would be lost with the next change
	const unread = value && ! scheduleOf( value );

	return <div className="alslWeek">
		<p className="alslLabel">{ __( 'Opening times', 'softicon-store-locator' ) }</p>
		{ unread && <Notice status="warning" isDismissible={ false }>{
			// translators: %s: the opening times as saved, which could not be read
			sprintf( __( 'Some of these opening times could not be read: %s. Check them below.', 'softicon-store-locator' ), value )
		}</Notice> }
		{ week.map( ( spans, day ) => <div className="alslDay" key={ day }>
			<CheckboxControl
				label={ dayLabel( day, lang ) }
				checked={ spans.length > 0 }
				onChange={ ( open ) => setDay( day, open ? [ [ 540, 1020 ] ] : [] ) }
				__nextHasNoMarginBottom
			/>
			<div className="alslSpans">
				{ ! spans.length && <span className="alslClosed">{ __( 'Closed', 'softicon-store-locator' ) }</span> }
				{ spans.map( ( [ start, end ], index ) => <div className="alslSpan" key={ index }>
					<input type="time" value={ hhmm( start ) } onChange={ ( event ) => setTime( day, index, 0, event.target.value ) }
						aria-label={ sprintf( /* translators: %s: a day of the week */ __( '%s opens', 'softicon-store-locator' ), dayLabel( day, lang, 'long' ) ) } />
					<span aria-hidden="true">–</span>
					<input type="time" value={ hhmm( end ) } onChange={ ( event ) => setTime( day, index, 1, event.target.value ) }
						aria-label={ sprintf( /* translators: %s: a day of the week */ __( '%s closes', 'softicon-store-locator' ), dayLabel( day, lang, 'long' ) ) } />
					{ index > 0
						? <Button icon={ icons.remove } size="small" label={ __( 'Remove these times', 'softicon-store-locator' ) } onClick={ () => setDay( day, spans.filter( ( s, i ) => i !== index ) ) } />
						: spans.length < 2 && <Button icon={ icons.add } size="small" label={ __( 'Add a second time, e.g. after lunch', 'softicon-store-locator' ) } onClick={ () => setDay( day, [ ...spans, [ Math.min( end + 60, 1380 ), Math.min( end + 240, 1439 ) ] ] ) } /> }
				</div> ) }
			</div>
		</div> ) }
		<p className="alslHelp">{ __( 'In the site\'s time zone (Settings › General). A closing time at or before the opening time is after midnight.', 'softicon-store-locator' ) }</p>
		<div className="alslActions">
			<Button variant="secondary" size="compact" disabled={ ! week[ 0 ].length } onClick={ () => save( week.map( ( spans, day ) => ( day >= 1 && day <= 4 ? week[ 0 ].map( ( span ) => [ ...span ] ) : spans ) ) ) }>
				{ __( 'Copy Monday to Tuesday–Friday', 'softicon-store-locator' ) }
			</Button>
			<Button variant="secondary" size="compact" disabled={ ! hasHours( week ) } onClick={ () => onText( hoursText( week, lang, __( 'Closed', 'softicon-store-locator' ) ) ) }>
				{ __( 'Write the shown text from these times', 'softicon-store-locator' ) }
			</Button>
		</div>
	</div>;
};

export default WeekHours;
