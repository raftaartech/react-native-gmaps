'use strict';

let React = require('react-native');

let {
  View,
  Component,
  requireNativeComponent,
  PropTypes,
  DeviceEventEmitter,
  Image
} = React;

/* RNGMAPS COMP */
var gmaps = {
  name: 'RNGMaps',
  propTypes: {
    ...View.propTypes,
    center: PropTypes.object,
    zoomLevel: PropTypes.number,
    markers: PropTypes.array,
    zoomOnMarkers: PropTypes.bool,

    /* Hackedy hack hack hack */
    scaleX: React.PropTypes.number,
    scaleY: React.PropTypes.number,
    translateX: React.PropTypes.number,
    translateY: React.PropTypes.number,
    rotation: React.PropTypes.number,
  },
};

let MapView = requireNativeComponent('RNGMaps', gmaps);

class RNGMaps extends Component {
  constructor (props) {
    super(props);

    this._listeners = {
      mapError: null,
      mapChange: null,
      markerClick: null,
    };

    // Look up markers by id
    this._markersLookup = {};
    this.state = {
      zoomOnMarkers: false,
      markers: []
    }
  }

  componentDidMount () {
    this._listeners.mapChange = DeviceEventEmitter.addListener('mapChange', (e: Event) => {
      this.props.onMapChange && this.props.onMapChange(e);
    });

    this._listeners.mapError = DeviceEventEmitter.addListener('mapError', (e: Event) => {
      console.log(`[GMAP_ERROR]: ${e.message}`);
      this.props.onMapError && this.props.onMapError(e);
    });


    this._listeners.markerClick = DeviceEventEmitter.addListener('markerClick', (e: Event) => {
      let marker = this._markersLookup[e.id];
      marker && this.props.onMarkerClick && this.props.onMarkerClick(marker);
    });

    this.updateMarkers(this.props.markers);
  }

  componentWillUnmount () {
    this._listeners.mapError && this._listeners.mapError.remove();
    this._listeners.mapChange && this._listeners.mapChange.remove();
    this._listeners.markerClick && this._listeners.markerClick.remove();
  }


  zoomOnMarkers (bool) {
    // HACK: Bleurgh, forcing the change on zoomOnMarkers.
    this.setState({ zoomOnMarkers: null }, () => {
      this.setState({ zoomOnMarkers: bool||true });
    });
  }

  updateMarkers (markers) {
    let newMarkers = [];
    for (var i = 0; i < markers.length; i++) {
      let marker = markers[i];
      this._markersLookup[marker.id] = marker;
      newMarkers.push(marker);
    }
    this.setState({ markers: newMarkers });
  }

  _diffMarkers (markersOne, markersTwo) {
    if(markersOne.length!==markersTwo.length) return true;
    for (let i = 0; i < markersOne.length; i++) {
      for (let prop in markersOne[i].coordinates) {
        if (markersOne[i].coordinates.hasOwnProperty(prop)) {
          if(markersOne[i].coordinates[prop] !== markersTwo[i].coordinates[prop]) return true;
        }
      }
    }
    return false;
  }

  componentWillReceiveProps (nextProps) {
    if(this._diffMarkers(nextProps.markers, this.state.markers)) {
      this.updateMarkers(nextProps.markers);
    }
  }

  render () {
    return ( <MapView
      { ...this.props }
      markers={ this.state.markers }
      zoomOnMarkers={ this.state.zoomOnMarkers }
      />
    );
  }
}

module.exports = RNGMaps;
