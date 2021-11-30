import sys

overrides = {
    ('Underground', 'Rail'): True,
    ('Underground', 'DLR'): True,
    ('Rail', 'DLR'): True
}

synonyms = {
    'Underground': ['Tube'],
    'Rail': ['Railway', 'Overground']
}

def get_variants(station_name, station_type):
    yield station_name
    yield station_name + ' station'
    yield station_name + ' ' + station_type
    yield station_name + ' ' + station_type + ' station'
    for s in synonyms.get(station_type, []):
        yield station_name + ' ' + s
        yield station_name + ' ' + s + ' station'

def main():
    data = []
    for line in sys.stdin:
        naptan, full_name = tuple(line.strip().split(','))
        full_name_tokens = full_name.split()
        station_name = [t for t in full_name_tokens[:-2] if t[0] != '(']
        station_type = full_name_tokens[-2]
        data.append((' '.join(station_name), station_type, naptan))
    expanded_data = {}
    for (station_name, station_type, naptan) in data:
        for variant in get_variants(station_name, station_type):
            if variant not in expanded_data:
                expanded_data[variant] = (naptan, station_type)
            else:
                prev_naptan, prev_type = expanded_data[variant]
                if overrides.get((station_type, prev_type), False):
                    expanded_data[variant] = (naptan, station_type)
    for (name, (naptan, station_type)) in expanded_data.items():
        print(f'{naptan},{name}')

if __name__=='__main__':
    main()
