naptan_metro_station.json:
	curl https://api.tfl.gov.uk/StopPoint/Type/NaptanMetroStation > naptan_metro_station.json

src/stations.json: naptan_metro_station.json naptan_rail_station_1.json naptan_rail_station_2.json naptan_rail_station_3.json
	echo '{"stations": [' > src/stations.json
	cat naptan_metro_station.json | jq -c -r '.[] | {naptan: .naptanId, label: .commonName}' | grep 'Underground\|DLR' | tr '\n' ',' >> src/stations.json
	cat naptan_rail_station_?.json | jq -r -c '.[] | {label: .commonName, id:.naptanId, modes: .modes}' | grep overground | jq -r -c '{label: .label, naptan: .id}' | tr '\n' ',' | sed 's/,$$//' >> src/stations.json
	echo ']}' >> src/stations.json

configuration/underground.csv: src/stations.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'Underground Station' | tr -d '"' | tr '\t' ',' > configuration/underground.csv

configuration/dlr.csv: src/stations.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'DLR Station' | tr -d '"'  | tr '\t' ',' > configuration/dlr.csv

configuration/overground.csv: naptan_rail_station_1.json naptan_rail_station_2.json naptan_rail_station_3.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'Rail Station' | tr -d '"'  | tr '\t' ',' > configuration/overground.csv

configuration/stations.csv: configuration/underground.csv configuration/dlr.csv configuration/overground.csv
	cat configuration/underground.csv configuration/dlr.csv configuration/overground.csv > configuration/stations.csv

imports: src/stations.json configuration/stations.csv

clean:
	rm src/stations.json
	rm configuration/*.csv
