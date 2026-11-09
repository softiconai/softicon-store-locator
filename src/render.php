<?php
use ALSL_Store_Locator\Block;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$alsl_stores = Block::stores( $attributes );
if ( ! $alsl_stores ) {
	return;
}

$alsl_wrapper = get_block_wrapper_attributes(
	array(
		'class'     => 'alsl_locator',
		'data-alsl' => wp_json_encode( Block::config( $attributes ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ),
	)
);
?>
<div <?php echo $alsl_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
<div class="alsl_inner">
	<?php if ( array_filter( array_column( $alsl_stores, 'lat' ), 'is_float' ) ) : ?>
		<div class="alsl_map" hidden></div>
	<?php endif; ?>
	<?php // real HTML for search engines and visitors without JS; the map reads the stores from it ?>
	<ul class="alsl_list">
		<?php
		foreach ( $alsl_stores as $alsl_store ) :
			$alsl_lines = array_filter( array( $alsl_store['address'], trim( $alsl_store['postcode'] . ' ' . $alsl_store['city'] ), $alsl_store['country'] ), 'strlen' );
			$alsl_tel   = Block::tel( $alsl_store['phone'] );
			?>
			<li class="alsl_store" data-id="<?php echo esc_attr( $alsl_store['id'] ); ?>"<?php if ( null !== $alsl_store['lat'] ) : ?> data-lat="<?php echo esc_attr( Block::num( $alsl_store['lat'] ) ); ?>" data-lng="<?php echo esc_attr( Block::num( $alsl_store['lng'] ) ); ?>"<?php endif; ?>>
				<?php if ( $alsl_store['image'] ) : ?>
					<img class="alsl_image" src="<?php echo esc_url( $alsl_store['image'] ); ?>" alt="" loading="lazy" decoding="async">
				<?php endif; ?>
				<div class="alsl_info">
					<?php if ( $alsl_store['name'] ) : ?>
						<strong class="alsl_name"><?php echo esc_html( $alsl_store['name'] ); ?></strong>
					<?php endif; ?>
					<?php if ( $alsl_lines ) : ?>
						<address class="alsl_address">
							<?php foreach ( $alsl_lines as $alsl_line ) : ?>
								<span><?php echo esc_html( $alsl_line ); ?></span>
							<?php endforeach; ?>
						</address>
					<?php endif; ?>
					<?php if ( $alsl_store['hours'] ) : ?>
						<div class="alsl_hours"><?php echo nl2br( esc_html( $alsl_store['hours'] ) ); ?></div>
					<?php endif; ?>
					<?php if ( $alsl_tel || $alsl_store['email'] || $alsl_store['website'] ) : ?>
						<div class="alsl_links">
							<?php if ( $alsl_tel ) : ?>
								<a class="alsl_phone" href="<?php echo esc_url( $alsl_tel, array( 'tel' ) ); ?>"><?php echo esc_html( $alsl_store['phone'] ); ?></a>
							<?php endif; ?>
							<?php if ( $alsl_store['email'] ) : ?>
								<a class="alsl_email" href="<?php echo esc_url( 'mailto:' . $alsl_store['email'], array( 'mailto' ) ); ?>"><?php echo esc_html( $alsl_store['email'] ); ?></a>
							<?php endif; ?>
							<?php if ( $alsl_store['website'] ) : ?>
								<a class="alsl_website" href="<?php echo esc_url( $alsl_store['website'] ); ?>" rel="noopener"><?php esc_html_e( 'Website', 'softicon-store-locator' ); ?></a>
							<?php endif; ?>
						</div>
					<?php endif; ?>
				</div>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
</div>
