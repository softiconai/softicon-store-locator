import { __, _n, sprintf } from '@wordpress/i18n';
import { HelpCards, Panel } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards, maxStores } from '../../../../utils/options';

const General = ( { stores } ) => {
	const onMap = stores.filter( ( store ) => null !== store.lat && null !== store.lng ).length;

	return <>
		<Panel id="help" title={ __( 'Help', 'softicon-store-locator' ) }>
			<HelpCards cards={ helpCards } />
			<p className="alslHelp">{ __( 'Email:', 'softicon-store-locator' ) } <a href="mailto:softiconai@gmail.com">softiconai@gmail.com</a></p>
		</Panel>

		<Panel id="stores" title={ __( 'Stores', 'softicon-store-locator' ) }>
			<p className="alslHelp">{
				// translators: 1: number of stores, 2: how many of them have a place on the map
				sprintf( _n( '%1$d store, %2$d on the map.', '%1$d stores, %2$d on the map.', stores.length, 'softicon-store-locator' ), stores.length, onMap )
			}</p>
			<p className="alslHelp">{
				// translators: %d: the most stores one block can hold
				sprintf( __( 'A block holds up to %d stores.', 'softicon-store-locator' ), maxStores )
			}</p>
		</Panel>
	</>;
};

export default General;
