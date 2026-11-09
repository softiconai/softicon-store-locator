import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { tel } from '../../utils/store';

// the store list as render.php prints it; links do nothing in the editor
const StoreCards = ( { stores } ) => <ul className="alsl_list">
	{ stores.map( ( store ) => {
		const lines = [ store.address, [ store.postcode, store.city ].filter( Boolean ).join( ' ' ), store.country ].filter( Boolean );
		const phone = tel( store.phone );
		return <li key={ store.id } className="alsl_store" data-id={ store.id }>
			{ store.image && <img className="alsl_image" src={ store.image } alt="" /> }
			<div className="alsl_info">
				{ store.name && <strong className="alsl_name">{ store.name }</strong> }
				{ lines.length > 0 && <address className="alsl_address">
					{ lines.map( ( line, i ) => <span key={ i }>{ line }</span> ) }
				</address> }
				{ store.hours && <div className="alsl_hours">{ store.hours.split( '\n' ).map( ( line, i ) => <Fragment key={ i }>{ i > 0 && <br /> }{ line }</Fragment> ) }</div> }
				{ ( phone || store.email || store.website ) && <div className="alsl_links">
					{ phone && <a className="alsl_phone" href={ phone }>{ store.phone }</a> }
					{ store.email && <a className="alsl_email" href={ 'mailto:' + store.email }>{ store.email }</a> }
					{ store.website && <a className="alsl_website" href={ store.website }>{ __( 'Website', 'softicon-store-locator' ) }</a> }
				</div> }
			</div>
		</li>;
	} ) }
</ul>;

export default StoreCards;
