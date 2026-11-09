import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { findPlace, queryOf } from '../../../map/geocode';
import { placeOf } from '../../../utils/store';

// finds the places of every store that has an address but no place, one request a second (Nominatim's limit);
// flags: id => 'lost' (not found) or 'check' (found without the postcode, the pin may be on the wrong street)
const FindPlaces = ( { actions, geocoder, flags, setFlags } ) => {
	const [ run, setRun ] = useState( null );
	const abort = useRef();
	useEffect( () => () => abort.current?.abort(), [] );

	const todo = actions.get().filter( ( store ) => store?.id && ! placeOf( store ) && queryOf( store ) && ! flags[ store.id ] );

	const start = async () => {
		abort.current = new window.AbortController();
		const list = todo.map( ( store ) => store.id );
		const found = {};
		for ( let i = 0; i < list.length; i++ ) {
			setRun( { done: i, total: list.length } );
			// the newest copy: the store may have changed or gone while the batch ran
			const store = actions.get().find( ( item ) => item?.id === list[ i ] );
			if ( ! store || placeOf( store ) ) {
				continue;
			}
			try {
				const hit = await findPlace( store, { url: geocoder, signal: abort.current.signal } );
				if ( hit ) {
					actions.update( store.id, { lat: hit.lat, lng: hit.lng } );
				}
				if ( ! hit || hit.loose ) {
					found[ store.id ] = hit ? 'check' : 'lost';
				}
			} catch ( error ) {
				if ( 'AbortError' === error.name ) {
					break;
				}
				found[ store.id ] = 'lost';
			}
		}
		setFlags( ( old ) => ( { ...old, ...found } ) );
		setRun( null );
	};

	// a store fixed by hand since is no longer counted
	const unplaced = new Set( actions.get().filter( ( store ) => store?.id && ! placeOf( store ) ).map( ( store ) => store.id ) );
	const lost = Object.keys( flags ).filter( ( id ) => 'lost' === flags[ id ] && unplaced.has( id ) ).length;
	const check = Object.values( flags ).filter( ( flag ) => 'check' === flag ).length;

	if ( run ) {
		return <div className="alslBatch">
			<p className="alslHelp" role="status">{
				// translators: 1: the store being looked for now, 2: all the stores to look for
				sprintf( __( 'Finding places: %1$d of %2$d…', 'softicon-store-locator' ), run.done + 1, run.total )
			}</p>
			<progress max={ run.total } value={ run.done } />
			<Button variant="secondary" onClick={ () => abort.current?.abort() } size="compact">{ __( 'Stop', 'softicon-store-locator' ) }</Button>
		</div>;
	}

	return <>
		{ todo.length > 0 && <div className="alslBatch">
			<Button variant="secondary" onClick={ start } __next40pxDefaultSize>
				{
					// translators: %d: number of stores without a place on the map
					sprintf( _n( 'Find the place of %d store', 'Find the places of %d stores', todo.length, 'softicon-store-locator' ), todo.length )
				}
			</Button>
			{ todo.length > 5 && <p className="alslHelp">
				{
					// translators: %d: about how many minutes the search takes
					sprintf( __( 'About one store a second (the map service’s limit): up to %d min.', 'softicon-store-locator' ), Math.ceil( todo.length * 2.2 / 60 ) )
				}
			</p> }
		</div> }
		{ lost > 0 && <p className="alslHelp">
			{
				// translators: %d: number of stores whose address was not found
				sprintf( _n( '%d address was not found. Open the store to fix it, or click the map where it is.', '%d addresses were not found. Open each store to fix it, or click the map where it is.', lost, 'softicon-store-locator' ), lost )
			}
		</p> }
		{ check > 0 && <p className="alslHelp">
			{
				// translators: %d: number of stores found without their postcode
				sprintf( _n( '%d store was found without its postcode, so its pin may be on the wrong street. It is marked in the list: check it on the map.', '%d stores were found without their postcode, so their pins may be on the wrong street. They are marked in the list: check them on the map.', check, 'softicon-store-locator' ), check )
			}
		</p> }
	</>;
};

export default FindPlaces;
