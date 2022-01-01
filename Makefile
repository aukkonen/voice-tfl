naptan_metro_station.json:
	curl https://api.tfl.gov.uk/StopPoint/Type/NaptanMetroStation > naptan_metro_station.json

src/stations.json: naptan_metro_station.json naptan_rail_station_1.json naptan_rail_station_2.json naptan_rail_station_3.json
	echo '{"stations": [' > src/stations.json
	cat naptan_metro_station.json | jq -c -r '.[] | {naptan: .naptanId, label: .commonName}' | grep 'Underground\|DLR' | tr '\n' ',' >> src/stations.json
	cat naptan_rail_station_?.json | jq -r -c '.[] | {label: .commonName, id:.naptanId, modes: .modes}' | grep overground | jq -r -c '{label: .label, naptan: .id}' | tr '\n' ',' | sed 's/,$$//' >> src/stations.json
	echo ']}' >> src/stations.json

configuration/underground.txt: src/stations.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'Underground Station' | tr -d '"' | tr '\t' ',' > configuration/underground.txt

configuration/dlr.txt: src/stations.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'DLR Station' | tr -d '"'  | tr '\t' ',' > configuration/dlr.txt

configuration/overground.txt: naptan_rail_station_1.json naptan_rail_station_2.json naptan_rail_station_3.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'Rail Station' | tr -d '"'  | tr '\t' ',' > configuration/overground.txt

configuration/stations_preliminary.txt: configuration/underground.txt configuration/dlr.txt configuration/overground.txt
	cat configuration/underground.txt configuration/dlr.txt configuration/overground.txt > configuration/stations_preliminary.txt

configuration/stations.csv: configuration/stations_preliminary.txt
	python prepare_station_lookup.py < configuration/stations_preliminary.txt > configuration/stations.csv

imports: src/stations.json configuration/stations.csv

clean:
	rm src/stations.json
	rm configuration/*.csv
	rm configuration/*.txt
