import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { tel } from '../../utils/store';
import { routes } from '../../map/distance';

// Block::prop(): a schema.org property
const Prop = ( { name, value } ) => value ? <span itemProp={ name }>{ value }</span> : null;

// the store list as render.php prints it; links do nothing in the editor
const StoreCards = ( { stores, route } ) => <ul className="alsl_list">
	{ stores.map( ( store ) => {
		const phone = tel( store.phone );
		const placed = null !== store.lat && null !== store.lng;
		// as view.js adds it on the page
		const directions = placed && Object.prototype.hasOwnProperty.call( routes, route ) ? routes[ route ]( store ) : '';
		return <li key={ store.id } className="alsl_store" itemScope itemType="https://schema.org/LocalBusiness" data-id={ store.id } data-cat={ store.category } data-lat={ placed ? store.lat : undefined } data-lng={ placed ? store.lng : undefined }>
			{ store.image && <img className="alsl_image" itemProp="image" src={ store.image } alt="" /> }
			<div className="alsl_info">
				{ store.name && <strong className="alsl_name" itemProp="name">{ store.name }</strong> }
				{ ( store.address || store.postcode || store.city || store.country ) && <address className="alsl_address" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
					<Prop name="streetAddress" value={ store.address } />
					<span><Prop name="postalCode" value={ store.postcode } /> <Prop name="addressLocality" value={ store.city } /></span>
					<Prop name="addressCountry" value={ store.country } />
				</address> }
				{ store.hours && <div className="alsl_hours">{ store.hours.split( '\n' ).map( ( line, i ) => <Fragment key={ i }>{ i > 0 && <br /> }{ line }</Fragment> ) }</div> }
				{ ( phone || store.email || store.website || directions ) && <div className="alsl_links">
					{ phone && <a className="alsl_phone" href={ phone }><Prop name="telephone" value={ store.phone } /></a> }
					{ store.email && <a className="alsl_email" href={ 'mailto:' + store.email }><Prop name="email" value={ store.email } /></a> }
					{ store.website && <a className="alsl_website" itemProp="url" href={ store.website }>{ __( 'Website', 'softicon-store-locator' ) }</a> }
					{ directions && <a className="alsl_route" href={ directions }>{ __( 'Directions', 'softicon-store-locator' ) }</a> }
				</div> }
			</div>
		</li>;
	} ) }
</ul>;

export default StoreCards;
