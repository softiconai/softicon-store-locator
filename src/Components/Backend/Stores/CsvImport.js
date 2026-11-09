import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, FormFileUpload, Modal, Notice, RadioControl, SelectControl } from '@wordpress/components';
import { csvFields, guessColumns, rowsToStores } from '../../../utils/csv';
import { maxStores } from '../../../utils/options';
import { placeOf } from '../../../utils/store';

// PapaParse is its own chunk, loaded only when a file is picked
const parse = ( file ) => import( /* webpackChunkName: "papaparse" */ 'papaparse' ).then( ( { default: Papa } ) => new Promise( ( resolve, reject ) => {
	Papa.parse( file, {
		header: true,
		skipEmptyLines: 'greedy',
		// a few more than fit, to tell when a file is too long
		preview: maxStores * 2,
		transformHeader: ( header ) => header.replace( /^\ufeff/, '' ).trim(),
		complete: resolve,
		error: reject,
	} );
} ) );

const CsvImport = ( { actions, onClose } ) => {
	const [ file, setFile ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ columns, setColumns ] = useState( {} );
	const [ mode, setMode ] = useState( 'add' );
	const current = actions.get().length;

	const pick = async ( event ) => {
		const picked = event.target.files?.[ 0 ];
		event.target.value = '';
		if ( ! picked ) {
			return;
		}
		setError( '' );
		try {
			const result = await parse( picked );
			const headers = ( result.meta.fields || [] ).filter( Boolean );
			if ( ! headers.length || ! result.data.length ) {
				throw new Error( 'empty' );
			}
			setFile( { name: picked.name, headers, rows: result.data } );
			setColumns( guessColumns( headers ) );
		} catch ( e ) {
			setFile( null );
			setError( __( 'This file could not be read as CSV. Save the sheet as "CSV UTF-8" and try again; the first row must hold the column names.', 'softicon-store-locator' ) );
		}
	};

	const stores = file ? rowsToStores( file.rows, columns ) : [];
	const room = 'replace' === mode ? maxStores : Math.max( 0, maxStores - current );
	const added = stores.slice( 0, room );
	const placed = added.filter( placeOf ).length;
	const named = columns.name || columns.address || columns.city;

	const run = () => {
		actions.set( 'replace' === mode ? added : [ ...actions.get(), ...added ] );
		onClose();
	};

	return <Modal title={ __( 'Import stores from CSV', 'softicon-store-locator' ) } onRequestClose={ onClose } className="alslImport" size="medium">
		<p>{ __( 'Pick a CSV file with one store per row and the column names in the first row, such as name, address, city, postcode, country, phone, email, website, hours, lat and lng.', 'softicon-store-locator' ) }</p>
		<FormFileUpload accept=".csv,text/csv" onChange={ pick } render={ ( { openFileDialog } ) => <Button variant={ file ? 'secondary' : 'primary' } onClick={ openFileDialog } __next40pxDefaultSize>
			{ file ? __( 'Choose another file', 'softicon-store-locator' ) : __( 'Choose CSV file', 'softicon-store-locator' ) }
		</Button> } />
		{ error && <Notice status="error" isDismissible={ false }>{ error }</Notice> }

		{ file && <>
			<h2 className="alslImportTitle">{ file.name }</h2>
			<p className="alslHelp">{ __( 'Which column holds what. Columns with these names were matched already.', 'softicon-store-locator' ) }</p>
			<div className="alslColumns">
				{ csvFields.map( ( field ) => <SelectControl
					key={ field.key }
					label={ field.label }
					value={ columns[ field.key ] || '' }
					options={ [ { value: '', label: __( '— not in the file —', 'softicon-store-locator' ) }, ...file.headers.map( ( header ) => ( { value: header, label: header } ) ) ] }
					onChange={ ( value ) => setColumns( { ...columns, [ field.key ]: value } ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/> ) }
			</div>

			{ current > 0 && <RadioControl
				label={ __( 'The stores already in the block', 'softicon-store-locator' ) }
				selected={ mode }
				options={ [
					{ value: 'add', label: __( 'Keep them and add these', 'softicon-store-locator' ) },
					{ value: 'replace', label: __( 'Replace them with these', 'softicon-store-locator' ) },
				] }
				onChange={ setMode }
			/> }

			{ ! named && <Notice status="warning" isDismissible={ false }>{ __( 'Choose the column for the name, the address or the town.', 'softicon-store-locator' ) }</Notice> }
			{ named && <p className="alslSummary" role="status">
				{
					// translators: 1: number of stores to import, 2: how many of them have a place on the map
					sprintf( _n( '%1$d store will be imported, %2$d with a place on the map.', '%1$d stores will be imported, %2$d with a place on the map.', added.length, 'softicon-store-locator' ), added.length, placed )
				}
				{ added.length > placed && ' ' + __( 'For the others, use "Find the places" after the import.', 'softicon-store-locator' ) }
			</p> }
			{ stores.length > added.length && <Notice status="warning" isDismissible={ false }>
				{
					// translators: 1: number of rows left out, 2: the most stores one block can hold
					sprintf( __( '%1$d rows are left out: a block holds up to %2$d stores.', 'softicon-store-locator' ), stores.length - added.length, maxStores )
				}
			</Notice> }

			<div className="alslImportButtons">
				<Button variant="tertiary" onClick={ onClose } __next40pxDefaultSize>{ __( 'Cancel', 'softicon-store-locator' ) }</Button>
				<Button variant="primary" onClick={ run } disabled={ ! named || ! added.length } __next40pxDefaultSize>{ __( 'Import', 'softicon-store-locator' ) }</Button>
			</div>
		</> }
	</Modal>;
};

export default CsvImport;
