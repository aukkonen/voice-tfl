import "./App.css";
import { useState, useEffect } from "react";
import { useSpeechContext, SpeechState } from "@speechly/react-client";
import { VoiceSelect, VoiceInput, VoiceToggle } from '@speechly/react-voice-forms'
import './capsule.css'
import { stations } from "./stations.json";

stations.sort((s1, s2) => {return s1.label.localeCompare(s2.label)});
const stationNames = [''].concat(stations.map(station => {return station.label.replace(/ Station$/i, '')}));
const stationNaptan = [''].concat(stations.map(station => {return station.naptan}));

const PLAN_JOURNEY_VIEW = 1;
const HELP_VIEW = 2;

function NavBar(props) {
  return (
    <header className="navbar">
      <div className="navbar__item" onClick={() => props.setActiveView(PLAN_JOURNEY_VIEW)}>Plan Journey</div>
      <div className='navbar__item' onClick={() => props.setActiveView(HELP_VIEW)}>What is this?</div>
    </header>
  )
}

function SearchForm(props) {
  return (
    <div>
      <div className="inputFieldContainer">
        <VoiceSelect
          label="from"
          options={stationNaptan}
          displayNames={stationNames}
          changeOnEntityType="from"
          value={props.from}
          onChange={(newValue) => props.setFrom(newValue)}
        />
      </div>
      <div className="inputFieldContainer">
        <VoiceSelect
          label="to"
          options={stationNaptan}
          displayNames={stationNames}
          changeOnEntityType="to"
          value={props.to}
          onChange={(newValue) => props.setTo(newValue)}
        />
      </div>
      <div className="inputFieldContainer">
        <VoiceToggle
          options={["departure", "arrival"]}
          displayNames={["Departure", "Arrival"]}
          changeOnEntityType={["depart_prepo", "arrive_prepo"]}
          onChange={(newValue) => {
            if (newValue === "departure") {
              props.setTimeType("departing");
              console.log('set timeType to departing');
            }
            else if (newValue === "arrival") {
              props.setTimeType("arriving");
              console.log('set timeType to arriving');
            }
          }}
        />
        <VoiceInput
          label="Time"
          value={props.time}
          changeOnEntityType="time"
          onChange={(newValue) => {
            console.log('seeting new time value', newValue);
            props.setTime(newValue);
          }}
        />
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

function PlanView(props) {
  return (
    <div>
      <div className="quickHelp">Hold the microphone button, and say e.g.<br/> <i><b>"from london bridge to oxford circus"</b></i>.</div>
      <SearchForm setFrom={props.setFrom} setTo={props.setTo} from={props.from} to={props.to} time={props.time} setTime={props.setTime} timeType={props.timeType} setTimeType={props.setTimeType} />
      {props.speechState === SpeechState.NoAudioConsent &&
        <NoAudioConsentInfo />
      }
      {props.fetching &&
        <h1>Fetching results...</h1>
      }
      {(props.data && !props.fetching) &&
        <ResultList data={props.data} />
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
  )
}

function HelpView() {
  return (
    <div className="helpText">
      <h1>What is this?</h1>
      <p>Plan journeys in the London Tube network with simple voice commands. For example, <i><b>"from london bridge to oxford circus"</b></i>.</p>
      <p>(It does not support addresses or other points of interest.)</p>
      <p>You can also specify the departure or arrival time, for example: <i><b>"from canary wharf to south kensington departing at six thirty pm"</b></i>.</p>
      <p>The app requires access to microphone, but it listens only when you keep the microphone button pressed.</p>
      <p>Built with <a href="https://www.speechly.com">Speechly</a> and <a href="https://tfl.gov.uk/info-for/open-data-users/unified-api">Transport for London Unified API</a>.</p>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  )
}

function NoAudioConsentInfo() {
  return (
    <div className="helpText">
      <h1>Sorry!</h1>
      <p>This application needs permission to use the microphone so that it can listen to your voice command. It <b>only</b> listens when you hold the microphone button pressed.</p>
      <p>To grant the microphone permission, please re-load the page and answer "Allow" when the app asks to use the microphone.</p>
    </div>
  )
}

function parseTime(dateTimeStr) {
  return new Date(dateTimeStr).toTimeString().substring(0, 5);
}

function callApi(from, to, time, timeIs, setData, setFetching) {
  let url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}`;
  if (time !== undefined) {
    url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?time=${time}&timeIs=${timeIs}`;
  }
  setFetching(true);
  fetch(url, {method: "GET"})
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setData(data);
      setFetching(false);
      window.postMessage({ type: "speechhandled", success: true }, "*");
    });
}

function App() {
  const { segment, speechState } = useSpeechContext();
  const [data, setData] = useState(undefined);
  const [fetching, setFetching] = useState(false);
  const [activeView, setActiveView] = useState(PLAN_JOURNEY_VIEW);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [timeType, setTimeType] = useState("departure");

  useEffect(() => {
    if (segment && !segment.isFinal) {
      return;
    }
    let apiTime = undefined;
    if (time && time !== "") {
      apiTime = time.replaceAll(":", "");
    }
    if (from.startsWith("9") && to.startsWith("9")) {
      callApi(from, to, apiTime, timeType, setData, setFetching);
    }
  }, [segment, from, to, time]);

  useEffect(() => {
    if (activeView === HELP_VIEW &&
        (speechState === SpeechState.Starting ||
         speechState === SpeechState.Recording ||
         speechState === SpeechState.NoAudioConsent)) {
      setActiveView(PLAN_JOURNEY_VIEW);
    }
  }, [activeView, speechState]);

  console.log(segment?.entities);

  return (
    <div className="App">
      <NavBar setActiveView={setActiveView} />
      {activeView === PLAN_JOURNEY_VIEW &&
       <PlanView
         from={from}
         to={to}
         setFrom={setFrom}
         setTo={setTo}
         time={time}
         setTime={setTime}
         timeType={timeType}
         setTimeType={setTimeType}
         speechState={speechState}
         fetching={fetching}
         data={data}/>
      }
      {activeView === HELP_VIEW &&
        <HelpView />
      }
    </div>
  );
}

export default App;
