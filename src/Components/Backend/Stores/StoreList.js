import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
import StoreForm from './StoreForm';
import FindPlaces from './FindPlaces';
import { icons } from '../../../utils/icons';
import { maxStores } from '../../../utils/options';
import { placeOf } from '../../../utils/store';
import { download, storesToCsv } from '../../../utils/csv';

// rows shown at once; the search finds the others
const SHOWN = 60;

const StoreList = ( { attributes, actions, editing, setEditing, setImporting, geocoder } ) => {
	const [ search, setSearch ] = useState( '' );
	const [ flags, setFlags ] = useState( {} );
	const raw = ( Array.isArray( attributes.stores ) ? attributes.stores : [] ).filter( ( store ) => store && 'object' === typeof store );
	const store = editing && raw.find( ( item ) => item.id === editing );

	if ( store ) {
		return <StoreForm key={ store.id } store={ store } actions={ actions } geocoder={ geocoder } onClose={ () => setEditing( '' ) } />;
	}

	const words = search.toLowerCase().trim();
	const matches = words
		? raw.filter( ( item ) => [ item.name, item.address, item.city, item.postcode, item.country ].join( ' ' ).toLowerCase().includes( words ) )
		: raw;
	const full = raw.length >= maxStores;

	return <div className="alslStores">
		<div className="alslActions">
			<Button variant="primary" icon={ icons.add } disabled={ full } onClick={ () => setEditing( actions.add() ) } __next40pxDefaultSize>
				{ __( 'Add store', 'softicon-store-locator' ) }
			</Button>
			<Button variant="secondary" icon={ icons.upload } onClick={ () => setImporting( true ) } __next40pxDefaultSize>
				{ __( 'Import CSV', 'softicon-store-locator' ) }
			</Button>
			<Button variant="tertiary" icon={ icons.download } disabled={ ! raw.length } onClick={ () => download( 'stores.csv', storesToCsv( raw ) ) } __next40pxDefaultSize>
				{ __( 'Export CSV', 'softicon-store-locator' ) }
			</Button>
		</div>

		{ full && <p className="alslHelp">
			{
				// translators: %d: the most stores one block can hold
				sprintf( __( 'A block holds up to %d stores. Add another Store Locator block for more.', 'softicon-store-locator' ), maxStores )
			}
		</p> }

		<FindPlaces { ...{ actions, geocoder, flags, setFlags } } />

		{ raw.length > 8 && <TextControl
			label={ __( 'Search the stores', 'softicon-store-locator' ) }
			hideLabelFromVision
			placeholder={ __( 'Search the stores', 'softicon-store-locator' ) }
			type="search"
			value={ search }
			onChange={ setSearch }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/> }

		{ raw.length > 0 && <ul className="alslRows">
			{ matches.slice( 0, SHOWN ).map( ( item ) => {
				const index = raw.indexOf( item );
				const lost = ! placeOf( item );
				return <li key={ item.id || index } className="alslRow">
					<button type="button" className="alslRowMain" onClick={ () => {
						setEditing( item.id );
						// opened to look at it: no longer needs checking
						setFlags( ( old ) => ( { ...old, [ item.id ]: 'check' === old[ item.id ] ? undefined : old[ item.id ] } ) );
					} }>
						<span className="alslRowName">{ item.name || __( '(no name)', 'softicon-store-locator' ) }</span>
						<span className="alslRowCity">{ [ item.postcode, item.city ].filter( Boolean ).join( ' ' ) }</span>
					</button>
					{ ( lost || 'check' === flags[ item.id ] ) && <span className={ 'alslRowFlag' + ( lost ? '' : ' is-check' ) } title={ lost ? __( 'Not on the map', 'softicon-store-locator' ) : __( 'Check the pin', 'softicon-store-locator' ) }>
						{ icons.noPin }
						<span className="screen-reader-text">{ lost ? __( 'Not on the map', 'softicon-store-locator' ) : __( 'Check the pin', 'softicon-store-locator' ) }</span>
					</span> }
					{ ! words && <>
						<Button icon={ icons.up } label={ __( 'Move up', 'softicon-store-locator' ) } size="small" disabled={ 0 === index } onClick={ () => actions.move( item.id, -1 ) } />
						<Button icon={ icons.down } label={ __( 'Move down', 'softicon-store-locator' ) } size="small" disabled={ index === raw.length - 1 } onClick={ () => actions.move( item.id, 1 ) } />
					</> }
				</li>;
			} ) }
		</ul> }

		{ matches.length > SHOWN && <p className="alslHelp">
			{
				// translators: %d: number of stores not listed
				sprintf( _n( '%d more store: search to find it.', '%d more stores: search to find them.', matches.length - SHOWN, 'softicon-store-locator' ), matches.length - SHOWN )
			}
		</p> }
		{ words && ! matches.length && <p className="alslHelp">{ __( 'No store matches.', 'softicon-store-locator' ) }</p> }
		{ ! raw.length && <p className="alslHelp">{ __( 'Add your stores one by one, or import them from a CSV file (for example saved from Excel or Google Sheets).', 'softicon-store-locator' ) }</p> }
	</div>;
};

export default StoreList;
