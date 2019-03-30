const shell = require('shelljs');
const mapshaper = require('mapshaper');
const fs = require('fs');
const path = require('path');

// Read in the configuration object from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Convert MapInfo interchange file(s) into GeoJSON with WGS84 coordinate system
const convertMapInfo = (input, output) => {
  // Check that the ogr2ogr command is available
  if (!shell.which('ogr2ogr')) {
    shell.echo(
      'ogr2ogr not found - the GDAL library must be installed to convert the map file(s)\n'
    );
    shell.exit(1);
  }

  // Convert the file and check for an error code
  const shellstring = shell.exec(
    `ogr2ogr -t_srs EPSG:4326 ${output} ${input}`,
    {
      silent: true
    }
  );
  if (shellstring.code === 0) {
    shell.echo('Completed.\n');
  } else {
    shell.exit(shellstring.code);
  }
};

// Run a Mapshaper command and output the result
const runMapshaper = (commands, description) =>
  new Promise((resolve, reject) => {
    if (description) console.log(`${description}...`);
    mapshaper.runCommands(commands, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (description) console.log('Completed.');
        resolve(result);
      }
    });
  });

// Begin by converting the complete MapInfo dataset to an equivalent GeoJSON file
console.log('Converting AEC MapInfo files to GeoJSON...');
convertMapInfo(
  path.join(config.downloadDir, config.download.mapinfoFile),
  path.join(config.downloadDir, `${config.baseFileName}-p100-alldivisions.json`)
);

// Convert the GeoJSON file to TopoJSON
runMapshaper(
  `-i download/${
    config.baseFileName
  }-p100-alldivisions.json -o topojson/ format=topojson`,
  'Converting GeoJSON file to TopoJSON'
).catch(error => {
  console.log(`Error: ${error.message}`);
});
