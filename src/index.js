import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactGlobe from 'react-globe';
import axios from 'axios';
import LoadingOverlay from 'react-loading-overlay';

function getTooltipContent(marker) {
  return `${marker.country}: ${
    marker.province ? marker.province : ''
  }  Infected: ${marker.value},
    Death: ${marker.deaths}
    Correlation: ${marker.correlation.toFixed(2)}%`;
}

function App() {
  const [markers, setMarkers] = useState([]);
  const [event, setEvent] = useState(null);
  const [details, setDetails] = useState(null);
  function onClickMarker(marker, markerObject, event) {
    setEvent({
      type: 'CLICK',
      marker,
      markerObjectID: markerObject.uuid,
      pointerEventPosition: { x: event.clientX, y: event.clientY }
    });
    setDetails(getTooltipContent(marker));
  }
  function onDefocus(previousCoordinates, event) {
    setEvent({
      type: 'DEFOCUS',
      previousCoordinates,
      pointerEventPosition: { x: event.clientX, y: event.clientY }
    });
    setDetails(null);
  }
  async function getLocations() {
    try {
      let resp = await axios.get(
        'https://coronavirus-tracker-api.herokuapp.com/v2/locations'
      );
      resp = resp.data;
      formatLocations(resp.locations);
    } catch (e) {
      console.log(e);
    }
  }

  function formatLocations(locations) {
    const markers = locations.map(l => ({
      coordinates: Object.values(l.coordinates),
      country: l.country,
      province: l.province ? l.province : null,
      value: l.latest.confirmed,
      deaths: l.latest.deaths,
      correlation: (l.latest.deaths / l.latest.confirmed) * 100,
      color:
        (l.latest.deaths / l.latest.confirmed) * 100 > 5
          ? 'darkred'
          : (l.latest.deaths / l.latest.confirmed) * 100 > 2
          ? 'red'
          : 'yellow'
    }));
    setMarkers(markers);
  }
  useEffect(() => {
    getLocations();
  }, []);

  return (
    <LoadingOverlay
      active={markers.length === 0}
      spinner
      text="Loading COVID-19 contamination data..."
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactGlobe
          markers={markers}
          markerOptions={{
            getTooltipContent,
            activeScale: 1.2,
            radiusScaleRange: [0.01, 0.05]
          }}
          onClickMarker={onClickMarker}
          onDefocus={onDefocus}
          lightOptions={{
            ambientLightColor: 'red',
            ambientLightIntensity: 1
          }}
        />
        {details && (
          <div
            style={{
              background: 'black',
              position: 'absolute',
              fontSize: 20,
              top: 0,
              right: 0,
              padding: 12,
              opacity: 0.8,
              color: 'white',
              borderRadius: '5px'
            }}
          >
            <p>{details}</p>
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
