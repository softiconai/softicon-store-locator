=== SoftIcon Store Locator – Store Finder Map, No API Key ===
Contributors: softiconai
Tags: store locator, store finder, dealer locator, map, block
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A store locator block with a free OpenStreetMap map. Visitors find the nearest store by town, postcode or their location. No Google Maps API key.

== Description ==

**SoftIcon Store Locator** adds a **Store Locator** block to the block editor. Add your shops, branches or dealers right in the block, or import them from a CSV file, and the page shows them as a list with a map. Visitors type their town or postcode, or press **Near me**, and see the nearest stores first.

* **No Google Maps API key, no billing** – the map uses OpenStreetMap. Nothing to sign up for, no key that stops working.
* **Build it in the editor** – the block shows the real map and list while you edit. Add a store, press **Find on map**, and drag the pin to the exact spot.
* **Free CSV import and export** – bring hundreds of stores from Excel or Google Sheets at once. Columns are matched for you, and stores without coordinates are placed on the map with one click.
* **Find the nearest store** – visitors search by town, postcode or store name. Stores in your list are matched instantly; any other place is looked up and the stores are sorted by distance, in kilometres or miles, within the radius they choose.
* **Near me** – the visitor's location, given by their browser, sorts the stores by distance. It never leaves the browser.
* **Directions** – a link under each store opens the route in Google Maps, Apple Maps or OpenStreetMap.
* **Privacy friendly** – optional "load the map on click": nothing is loaded from the map server before the visitor asks for it. No cookies, no tracking.
* **Works without JavaScript** – the store list is real HTML with addresses, phone numbers and links, so search engines can read it and every visitor can see it.
* **Fast** – the map's code loads only on pages with the block, only when the block comes near the screen.
* **Your layout and colors** – list left, right or below the map, or the map only; the map height; the starting zoom; marker, marker group and button colors; your own marker picture; and the background, text and link colors and text size from the block editor.
* **Clusters** – stores close together are grouped into one numbered marker until visitors zoom in.
* **Phone friendly** – on phones the list goes under the map and the search field never makes the page zoom.

= Privacy =

The plugin sets no cookies and stores nothing about visitors. Your stores are saved in the block, inside your post. The map and the place search use OpenStreetMap services, described under **External services** below. With **Load the map on click** turned on, visitors see a short note and a **Show map** button first, and nothing is loaded from the map server before they press it. **Near me** uses the location the visitor's browser gives; it is used only in the browser and is never sent anywhere.

= External services =

This plugin connects to these outside services. It sends nothing else, and nothing at all when a page has no Store Locator block.

**OpenStreetMap map tiles** (tile.openstreetmap.org), run by the OpenStreetMap Foundation.
The map is made of small images (tiles) that the visitor's browser loads from this server when a page shows the map, and in the block editor. The server receives the visitor's IP address, their browser's user agent and the address of the page (the Referer), as for any image from another website. With **Load the map on click**, this happens only after the visitor presses **Show map**. You can set another tile server in the block's Map settings.
Tile usage policy: https://operations.osmfoundation.org/policies/tiles/ – Terms of use: https://osmfoundation.org/wiki/Terms_of_Use – Privacy policy: https://osmfoundation.org/wiki/Privacy_Policy

**Nominatim place search** (nominatim.openstreetmap.org), run by the OpenStreetMap Foundation.
It turns an address into a place on the map. It is asked only when a person presses a button, at most once a second:
* in the block editor, when you press **Find on map** or **Find the places of … stores**: the store's address (street, postcode, town, country) is sent;
* on the page, when a visitor presses **Search** and nothing in your store list matches: the text they typed, the language of the page and the area of your stores are sent. Turn this off with **Look up other places** in the block's Search settings.
The service receives the IP address of the person's browser, as with any request.
Usage policy: https://operations.osmfoundation.org/policies/nominatim/ – Terms of use: https://osmfoundation.org/wiki/Terms_of_Use – Privacy policy: https://osmfoundation.org/wiki/Privacy_Policy

**Directions links** to Google Maps (google.com/maps), Apple Maps (maps.apple.com) or OpenStreetMap (openstreetmap.org) are plain links. Nothing is sent to these services unless the visitor clicks a link, which opens that service's own website or app with the store's coordinates. Google's privacy policy: https://policies.google.com/privacy – Apple's: https://www.apple.com/legal/privacy/ – OpenStreetMap's: https://osmfoundation.org/wiki/Privacy_Policy

= Third-party libraries =

* Leaflet 1.9.4 (npm package leaflet) by Volodymyr Agafonkin and contributors – [leafletjs.com](https://leafletjs.com/) / [github.com/Leaflet/Leaflet](https://github.com/Leaflet/Leaflet) – BSD 2-Clause License. Bundled in build/leaflet.js and build/style-index.css; license in build/leaflet-LICENSE.txt.
* Leaflet.markercluster 1.5.3 (npm package leaflet.markercluster) by Dave Leaver and contributors – [github.com/Leaflet/Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) – MIT License. Bundled in build/leaflet.markercluster.js and build/style-index.css; license in build/leaflet.markercluster-LICENSE.txt.
* Papa Parse 5.7.0 (npm package papaparse) by Matthew Holt – [papaparse.com](https://www.papaparse.com/) / [github.com/mholt/PapaParse](https://github.com/mholt/PapaParse) – MIT License. Bundled in build/papaparse.js, used only in the block editor to read CSV files; license in build/papaparse-LICENSE.txt.

The unminified source of this plugin is in the src folder, with package.json and webpack.config.js. Build it with `npm install` and `npm run build`.

== Installation ==

1. Install the plugin from Plugins → Add New, or upload the zip.
2. Activate it.
3. In the block editor, add the **Store Locator** block.
4. Press **Add store**, or **Import CSV** to bring many stores at once.

== Frequently Asked Questions ==

= Do I need a Google Maps API key? =

No. The map uses OpenStreetMap, which needs no key and no account.

= Where do I add my stores? =

In the block itself. Select the block and open the **Stores** panel in the sidebar: add a store, fill in its address, and press **Find on map**. You can also click on the map to place a store, or drag its orange pin.

= How should my CSV file look? =

One store per row, with the column names in the first row. The block recognises common names such as name, address, city, postcode (or zip), country, phone, email, website, hours, lat (or latitude) and lng (or lon, longitude), and you can match any other column yourself. Commas or semicolons both work. Save the sheet as "CSV UTF-8" so accents stay right. If the file has no coordinates, press **Find the places of … stores** after the import.

= A store's pin is in the wrong place =

Place search is free but not perfect, especially for new streets or some countries. Open the store and drag its orange pin to the right spot, or type the latitude and longitude. Stores found without their postcode are marked in the list so you can check them.

= How many stores can one block hold? =

Up to 500. For more, add a second Store Locator block, for example one per country.

= Is it GDPR friendly? =

It sets no cookies and tracks nothing. Turn on **Load the map on click** in the Map settings so nothing is loaded from OpenStreetMap until the visitor asks, and mention OpenStreetMap in your privacy policy. You can also turn off the place search for visitors.

= My site has a lot of visitors =

OpenStreetMap's own tile server is meant for light use. For a busy site, set the address of another tile server in the block's Map settings (many providers offer free plans), with the credit they ask for.

= Does it work with caching and optimization plugins? =

Yes. The block uses no AJAX calls, and it finds its own files even when an optimization plugin combines or moves its scripts.

= Can I use my own marker? =

Yes: pick a picture (your logo or an icon) in **Colors and marker**. Or keep the pin and choose its color.

= Can developers change the map or the place search? =

Use the `alsl_config` filter. For example, to use another tile server and geocoder on the whole site:

`add_filter( 'alsl_config', function ( $config ) { $config['tiles'] = 'https://tiles.example.com/{z}/{x}/{y}.png'; $config['geocoder'] = 'https://geocoder.example.com/search'; return $config; } );`

The geocoder must answer like Nominatim's `/search` (JSON) or Photon (GeoJSON).

== Screenshots ==

1. The store locator on a page: search, map and store list side by side.
2. Searching a town: the stores sorted by distance, with the place on the map.
3. Editing a store in the block: find the address on the map and drag the pin.
4. Importing stores from a CSV file, with the columns matched for you.
5. Layout, colors and your own marker.
6. On a phone: the search, the map and the list below it.

== Changelog ==

= 1.0.0 =
* First release.
