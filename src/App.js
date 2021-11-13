import './App.css';
import { useState, useEffect } from 'react';
import { useSpeechContext } from '@speechly/react-client';

const SearchForm = (props) => {
  const entities = props.entities;
  return (
    <div>
      <div>
        from {entities.fromText} to {entities.toText}
      </div>
      <div>
        departure {entities.departure} arrival {entities.arrival}
      </div>
    </div>
  )
}

function parseEndpoints(endpoints) {
  return "towards " + endpoints.join(' or ');
}

function RouteOption(props) {
  const option = props.opt;
  const endpoints = option.directions.map(stationName => stationName.replace(' Underground Station', ''));
  return (
    <div className="routeOptionBox">
      <div className="routeOption">
        <div className="lineNameContainer">
          <div className={"lineName " + option.name.toLowerCase()}>{option.name}</div>
        </div>
        <div className="routeOptionEndpoints">
          {parseEndpoints(endpoints)}
        </div>
      </div>
    {!props.isLast &&
      <div>or</div>
    }
    </div>
  )
}

function Leg(props) {
  const leg = props.leg;
  return (
    <>
    <div>
      {leg.routeOptions.map((opt, idx) => (
          <RouteOption key={idx} opt={opt} optIdx={idx + 1} isLast={idx === leg.routeOptions.length-1}/>
      ))}
    </div>
    <div className="station">
      {leg.arrivalPoint.commonName}
    </div>
    </>
  )
}

function Journey(props) {
  const journey = props.journey;
  let fare = 0.0;
  if (journey.fare) {
    fare = journey.fare?.totalCost/100.0;
  }
  fare = fare.toFixed(2);
  return (
    <div className="journey">
      <div className="journeyHeader">
      {journey.duration} minutes ({parseTime(journey.startDateTime)} &#8594; {parseTime(journey.arrivalDateTime)}) &nbsp; fare £{fare}
      </div>
      <div>
        <div className="station">
          {journey.legs[0].departurePoint.commonName}
        </div>
        {journey.legs.map((leg, idx) => (
          <Leg key={idx} leg={leg} />
        ))}
      </div>
    </div>
  )
}

function parseTime(dateTimeStr) {
  return new Date(dateTimeStr).toTimeString().substring(0, 5);
}

function callApi(from, to, time, timeIs, setData) {
  let url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}`;
  if (time !== undefined) {
    url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?time=${time}&timeIs=${timeIs}`;
  }
  fetch(url, {method: 'GET'})
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setData(data);
    });
}

function getEntityText(words, start, end) {
  const text = words
        .filter(word => { return (word.index >= start && word.index < end) })
        .map(word => { return word.value.toLowerCase() })
        .join(' ');
  return text;
}

function parseEntities(segment) {
  let fromValue = '';
  let toValue = '';
  let fromText = '';
  let toText = '';
  let arrival = '';
  let departure = '';
  if (segment && segment.entities) {
    segment.entities.forEach( (entity) => {
      if (entity.type === "from") {
        fromValue = entity.value;
        fromText = getEntityText(segment.words,
                                 entity.startPosition,
                                 entity.endPosition);
      }
      else if (entity.type === "to") {
        toValue = entity.value;
        toText = getEntityText(segment.words,
                               entity.startPosition,
                               entity.endPosition);
      }
      else if (entity.type === "arrival") {
        arrival = entity.value;
      }
      else if (entity.type === "departure") {
        departure = entity.value;
      }
    });
  }
  return {fromValue: fromValue, toValue: toValue,
          fromText: fromText, toText: toText,
          arrival: arrival, departure: departure};
}

function App() {
  const { segment } = useSpeechContext();
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (segment && segment.isFinal) {
      const entities = parseEntities(segment);
      let time = undefined;
      let timeType = undefined;
      if (entities.arrival !== '') {
        timeType = 'arriving';
        time = entities.arrival.replaceAll(':', '');
      }
      else if (entities.departure !== '') {
        timeType = 'departing';
        time = entities.departure.replaceAll(':', '');
      }
      if (entities.fromValue.startsWith('940') && entities.toValue.startsWith('940')) {
        callApi(entities.fromValue, entities.toValue, time, timeType, setData);
      }
    }
  }, [segment]);

  const entities = parseEntities(segment);
  return (
      <div className="App">
        <SearchForm entities={entities} />
       {data &&
         data.journeys?.map((journey, idx) => (
             <Journey key={idx} journey={journey} />
         ))
       }
      </div>
  );
}

export default App;
