naptan_metro_station.json:
	curl https://api.tfl.gov.uk/StopPoint/Type/NaptanMetroStation > naptan_metro_station.json

src/stations.json: naptan_metro_station.json
	jq -c -r '.[] | {id: .naptanId, name: .commonName}' < naptan_metro_station.json | grep 'Underground\|DLR' > src/stations.json

configuration/underground.csv: src/stations.json
	jq .name < src/stations.json | grep 'Underground Station' | tr -d '"'  | sed -r 's/ Underground Station//' > configuration/underground.csv

configuration/dlr.csv: src/stations.json
	jq .name < src/stations.json | grep 'DLR Station' | tr -d '"'  | sed -r 's/ DLR Station//' > configuration/dlr.csv

imports: configuration/underground.csv configuration/dlr.csv

clean:
	rm src/stations.json
	rm configuration/*.csv
