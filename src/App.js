import "./App.css";
import { useState, useEffect } from "react";
import { useSpeechContext, SpeechState } from "@speechly/react-client";

function SearchForm(props) {
  const formState = props.state;
  return (
    <div>
      <div className="inputFieldContainer">
        <input type="text" value={formState.fromText} className="inputField stationInput" />
        <input type="text" value={formState.departure} className="inputField timeInput" />
      </div>
      <div className="inputFieldContainer">
        <input type="text" value={formState.toText} className="inputField stationInput" />
        <input type="text" value={formState.arrival} className="inputField timeInput" />
      </div>
    </div>
  )
}

function parseEndpoints(endpoints) {
  return "towards " + endpoints.join(" or ");
}

function RouteOption(props) {
  const option = props.opt;
  const endpoints = option.directions.map(stationName => stationName.replace(" Underground Station", ""));
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
        <div>Route suggestion {props.num}</div>
        <div className="journeyHeaderDetail">{journey.duration} minutes ({parseTime(journey.startDateTime)} &#8594; {parseTime(journey.arrivalDateTime)}) &nbsp; fare £{fare}</div>
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

function ResultList(props) {
  return (
      <div>
      {props.data.journeys?.map((journey, idx) => (
          <Journey key={idx} num={idx + 1} journey={journey} />
      ))}
      </div>
  )
}

function MoreInfo(props) {
  let buttonText = "tap here for more info";
  if (props.show) {
    buttonText = "tap here to close info";
  }
  return (
      <div>
        <div className="infoButtonContainer">
          <div className="infoButton" onClick={() => props.setStatus(!props.show)}>{buttonText}</div>
        </div>
        {props.show &&
          <div className="helpText">
            <h1>About</h1>
            <p>Plan journeys in the London Tube network by saying the station you are starting from, and what station you want to go to. (No support for addresses or other points of interest, yet.)</p>
            <p>You can also specify the departure or arrival time, for example <i>"from canary wharf to south kensington departing at six thirty pm"</i>.</p>
            <p>The app requires access to microphone, but it <b>only</b> listens when you keep the microphone button pressed.</p>
            <p>Built with <a href="https://www.speechly.com">Speechly</a> and <a href="https://tfl.gov.uk/info-for/open-data-users/unified-api">Transport for London Unified API</a>.</p>
          </div>
        }
      </div>
  )
}

function NoAudioConsentInfo() {
  return (
    <div className="helpText">
      <h1>Sorry!</h1>
      <p>This application needs permission to use the microphone so that it can listen to your question. It <b>only</b> listens when you hold the microphone button pressed.</p>
      <p>To grant the microphone permission, please re-load the page and answer "Allow" when the app asks to use the microphone.</p>
    </div>
  )
}

function parseTime(dateTimeStr) {
  return new Date(dateTimeStr).toTimeString().substring(0, 5);
}

function callApi(from, to, time, timeIs, setData, setFetching, setInfoVisibility) {
  let url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}`;
  if (time !== undefined) {
    url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?time=${time}&timeIs=${timeIs}`;
  }
  setInfoVisibility(false);
  setFetching(true);
  fetch(url, {method: "GET"})
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setData(data);
      setFetching(false);
    });
}

function getEntityText(words, start, end) {
  const text = words
        .filter(word => { return (word.index >= start && word.index < end) })
        .map(word => { return word.value.toLowerCase() })
        .join(' ');
  return text;
}

function parseEntities(segment, prevState) {
  let newState = prevState;
  if (segment && segment.entities) {
    segment.entities.forEach( (entity) => {
      if (entity.type === "from") {
        newState = {
          ...newState,
          fromValue: entity.value,
          fromText: getEntityText(segment.words,
                                  entity.startPosition,
                                  entity.endPosition)
        };
      }
      else if (entity.type === "to") {
        newState = {
          ...newState,
          toValue: entity.value,
          toText: getEntityText(segment.words,
                                entity.startPosition,
                                entity.endPosition)
        };
      }
      else if (entity.type === "arrival") {
        newState = {
          ...newState,
          arrival: entity.value,
          departure: "departure"
        };
      }
      else if (entity.type === "departure") {
        newState = {
          ...newState,
          arrival: "arrival",
          departure: entity.value
        };
      }
    });
  }
  return newState;
}

function App() {
  const { segment, speechState } = useSpeechContext();
  const [data, setData] = useState(undefined);
  const [fetching, setFetching] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [formState, setFormState] = useState({fromValue: "", toValue: "",
                                              fromText: "from", toText: "to",
                                              arrival: "arrival", departure: "departure"});

  if (showInfo && speechState === SpeechState.NoAudioConsent) {
    setShowInfo(false);
  }

  useEffect(() => {
    const entities = parseEntities(segment, formState);
    setFormState(entities);
    console.log(entities);
  }, [segment]);

  useEffect(() => {
    if (segment && segment.isFinal) {
      let time = undefined;
      let timeType = undefined;
      if (formState.arrival !== "arrival") {
        timeType = "arriving";
        time = formState.arrival.replaceAll(":", "");
      }
      else if (formState.departure !== "departure") {
        timeType = "departing";
        time = formState.departure.replaceAll(":", "");
      }
      if (formState.fromValue.startsWith("940") && formState.toValue.startsWith("940")) {
        callApi(formState.fromValue, formState.toValue, time, timeType, setData, setFetching, setShowInfo);
      }
    }
  }, [segment]);

  return (
    <div className="App">
      <h1>London Tube Journey Planner</h1>
      <div className="quickHelp">Press and hold the microphone button, and say e.g. <i>"from london bridge to oxford circus"</i>.</div>
      <MoreInfo show={showInfo} setStatus={setShowInfo} />
      <SearchForm state={formState} />
      {speechState === SpeechState.NoAudioConsent &&
        <NoAudioConsentInfo />
      }
      {fetching &&
        <h1>Fetching results...</h1>
      }
      {(data && !fetching) &&
        <ResultList data={data} />
      }
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </div>
  );
}

export default App;
