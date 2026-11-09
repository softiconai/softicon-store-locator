import { __, _n, sprintf } from '@wordpress/i18n';
import { HelpCards, Panel } from '../../../../vendor/softicon-tools/components/Panels';
import StoreList from '../../Stores/StoreList';
import { helpCards } from '../../../../utils/options';

// the help cards, last in the sidebar
export const Help = () => <Panel id="help" title={ __( 'Help', 'softicon-store-locator' ) }>
	<HelpCards cards={ helpCards } />
	<p className="alslHelp">{ __( 'Email:', 'softicon-store-locator' ) } <a href="mailto:softiconai@gmail.com">softiconai@gmail.com</a></p>
</Panel>;

const General = ( props ) => {
	const { stores } = props;
	const onMap = stores.filter( ( store ) => null !== store.lat ).length;

	return <>
		<Panel id="stores" title={ __( 'Stores', 'softicon-store-locator' ) }>
			{ stores.length > 0 && <p className="alslHelp">
				{
					// translators: 1: number of stores, 2: how many of them have a place on the map
					sprintf( _n( '%1$d store, %2$d on the map.', '%1$d stores, %2$d on the map.', stores.length, 'softicon-store-locator' ), stores.length, onMap )
				}
			</p> }
			<StoreList { ...props } />
		</Panel>
	</>;
};

export default General;
