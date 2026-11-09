import { __ } from '@wordpress/i18n';
import { icons as shared } from '../vendor/softicon-tools/components/icons';

// stores per block in Free; the same number is in includes/class-block.php (MAX_STORES)
export const maxStores = 500;

// the cards in the Help panel
export const helpCards = [
	{ href: 'https://wordpress.org/support/plugin/softicon-store-locator/', label: __( 'Get support', 'softicon-store-locator' ), icon: shared.support },
	{ href: 'https://wordpress.org/support/plugin/softicon-store-locator/reviews/#new-post', label: __( 'Rate Store Locator', 'softicon-store-locator' ), icon: shared.star },
	{ href: 'https://wordpress.org/plugins/author/softiconai/', label: __( 'More plugins', 'softicon-store-locator' ), icon: shared.plugins },
];
