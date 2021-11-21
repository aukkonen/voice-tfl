naptan_metro_station.json:
	curl https://api.tfl.gov.uk/StopPoint/Type/NaptanMetroStation > naptan_metro_station.json

src/stations.json: naptan_metro_station.json
	echo '{"stations": [' > src/stations.json
	jq -c -r '.[] | {naptan: .naptanId, label: .commonName}' < naptan_metro_station.json | grep 'Underground\|DLR' | tr '\n' ',' | sed 's/,$$//' >> src/stations.json
	echo ']}' >> src/stations.json

configuration/underground.csv: src/stations.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'Underground Station' | tr -d '"' | tr '\t' ',' | sed -r 's/ Underground Station//' > configuration/underground.csv

configuration/dlr.csv: src/stations.json
	jq -r '.stations | .[] | [.naptan , .label] | @tsv' < src/stations.json | grep 'DLR Station' | tr -d '"'  | tr '\t' ',' | sed -r 's/ DLR Station//' > configuration/dlr.csv

configuration/stations.csv: configuration/underground.csv configuration/dlr.csv
	cat configuration/underground.csv configuration/dlr.csv > configuration/stations.csv

imports: src/stations.json configuration/stations.csv

clean:
	rm src/stations.json
	rm configuration/*.csv
