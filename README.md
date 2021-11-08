# london-jp
Voice enabled journey planner for London public transport

## Getting started
Run git clone, and then
```
npm intall
npm start
```
That should be it.

(If `npm install` complains something about react-voice-forms, just remove the dependency from package.json for now.)

## How data was obtained

The app maps human readable underground station names to so called "naptan identifiers" that are used by the API.

The data used here was obtained by first getting a list of metro station names:
```
curl https://api.tfl.gov.uk/StopPoint/Type/NaptanMetroStation > naptan_metro_station.json
```

The `underground.csv` file used in the config was then created by first running
```
jq -r '.[] | [.naptanId , .commonName] | @tsv' < naptan_metro_station.json | grep Underground | tr -d '"' | tr '\t' ',' | sed -r 's/ Underground Station//' > underground.csv
```
and then doing some manual cleanup to remove things in parenthesis etc.
