import { useMemo } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { maxStores } from '../../../utils/options';
import { newId } from '../../../utils/csv';

// valid ids are what sanitize_key() keeps, and each one once
export const fixIds = ( stores ) => {
	const seen = new Set();
	let changed = false;
	const fixed = stores.map( ( store ) => {
		if ( ! store || 'object' !== typeof store ) {
			return store;
		}
		let id = 'string' === typeof store.id ? store.id : '';
		if ( ! /^[a-z0-9_-]{1,40}$/.test( id ) || seen.has( id ) ) {
			do {
				id = newId();
			} while ( seen.has( id ) );
			changed = true;
		}
		seen.add( id );
		return id === store.id ? store : { ...store, id };
	} );
	return changed ? fixed : stores;
};

// changes to the block's stores, always made on the newest list (a batch of place searches runs for a while)
const useStores = ( clientId ) => {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	return useMemo( () => {
		const get = () => {
			const stores = registry.select( 'core/block-editor' ).getBlockAttributes( clientId )?.stores;
			return Array.isArray( stores ) ? stores : [];
		};
		const set = ( stores ) => updateBlockAttributes( clientId, { stores: stores.slice( 0, maxStores ) } );
		return {
			get,
			set,
			add: ( store = {} ) => {
				const added = { id: newId(), name: '', ...store };
				set( [ ...get(), added ] );
				return added.id;
			},
			update: ( id, patch ) => set( get().map( ( store ) => ( store?.id === id ? { ...store, ...patch } : store ) ) ),
			remove: ( id ) => set( get().filter( ( store ) => store?.id !== id ) ),
			move: ( id, by ) => {
				const list = [ ...get() ];
				const from = list.findIndex( ( store ) => store?.id === id );
				const to = from + by;
				if ( from < 0 || to < 0 || to >= list.length ) {
					return;
				}
				[ list[ from ], list[ to ] ] = [ list[ to ], list[ from ] ];
				set( list );
			},
		};
	}, [ registry, clientId, updateBlockAttributes ] );
};

export default useStores;
