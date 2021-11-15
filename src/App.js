// import logo from './logo.svg';
import './App.css';
import './index.js';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Component } from 'react';


function App() {

  return (
    <div className="App">
      <header >
        <h1>Target Metro Transit Connection</h1>
        <h3>powered by NexTrip</h3>
      </header>

      <Router>
        <nav>
          <Link to='/'>Home</Link>
          <Link to='route/'>Departures by route</Link>
          {/* <Link to='stop/'>Departures by stop</Link> */}
        </nav>
      
        <Routes>
          {/* <Route path="/" element={<Navigate replace to="/route" />} /> */}
          <Route path="/" element={<Home />} />
          <Route path='/route' element={<SelectPage level={0}  />} >
            <Route path=':line' element={<SelectPage level={1}  />} >
              <Route path=':dir' element={<SelectPage level={2}  />} >
                <Route path=':stat' element={<ListPage level={3} />} />
              </Route>
            </Route>
          </Route>
          <Route path='/stops' element={<StopsPage />} />
          <Route path='/oops' element={<ErrorPage />} />
          <Route path='*' element={<Navigate replace to="/oops" />} />
        </Routes>
      </Router>

    </div>
  );
}


class TransitSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      value: 'abc123',
      options: [],
    };

    this.handleChange = this.handleChange.bind(this);
    
    // console.log(this.props, this.state);
  }

  handleChange(event) {
    console.log('handleChange', event.target);
    if(event.target.value !== 'abc123') {
      this.setState({value: event.target.value, isLoaded: false});
      this.props.onChange(event.target.value);
    }
    
  }

  componentDidMount() {
    const {level, keys} = this.props;
    const apiUrlBase = 'https://svc.metrotransit.org/nextripv2/';
    const apiUrlPaths = ['routes', 'directions', 'stops', ''];
    let apiUrl = apiUrlBase + apiUrlPaths[level];

    for(let i=0; i < level+1 && i < keys.length; i++) {
      apiUrl += keys[i] + '/';
    }

    if(keys[level + 1]) {
      this.setState({value: keys[level + 1]})
    }

    console.log('TransitSelector componentDidMount', level, keys, apiUrl);

    fetch(apiUrl).then(fetchErrorCheck).then((result) => {
      this.setState({
        isLoaded: true,
        options: result,
      });
    }, (error) => {
      this.setState({
        isLoaded: true,
        error
      });
    }).finally(() => {
      console.log('finally', level, keys, this.state.value);
    })

  }

  render() {
    const { options } = this.state;
    const { level } = this.props;

    if(!options || options.length < 1) {
      return (<div />)
    }

    const values = ['route_id', 'direction_id', 'place_code', ''];
    const labels = ['route_label', 'direction_name', 'description', ''];

    const optionsFinal = [{
      route_id: 'abc123',
      route_label: 'Select route',
      direction_id: 'abc123',
      direction_name: 'Select direction',
      place_code: 'abc123',
      description: 'Select stop'
    }].concat(options.slice());  

    let optionsList = optionsFinal.length > 0 && optionsFinal.map((item, i) => {
      return (
          <option key={i} value={item[values[level]]} > {item[labels[level]]} </option>
        )
    }, this);

    return (
      <form >
        <label>
          <select className='selector-class' value={this.state.value} onChange={this.handleChange}>
            {optionsList}
          </select>
        </label>
      </form>
    );
  }
}

function SelectPage(props) {
  const navigate = useNavigate();
  function handleClick(url) {
    console.log('handleClick', url);
    navigate(url)
  }

  const {line, dir, stat} = useParams();
  const keys = ['', line, dir, stat];

 
  console.log('SelectPage', props);

  return (
    <div>
      <TransitSelector onChange={handleClick} line={line} dir={dir} 
          stat={stat} level={props.level} keys={keys} key={keys[props.level]} />
      {props.level === 2 ? <hr /> : ''}
      <Outlet />
    </div>
  );
}

function TransitRow(props) {
  return (
    <tr className='station-row' >
      <td className='station-box' >{props.route}</td>
      <td className='station-box' >{props.dest}</td>
      <td className='station-box' >{props.depart}</td>
    </tr>
  )
}

class TransitList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      // value: 'abc123',
      data: [],
      // redirect: null,
    };
    
    // console.log(this.props, this.state);
  }

  renderRow(i) {
    const { data } = this.state;
    return (
      <TransitRow 
        route={data.departures[i].route_short_name} 
        dest={data.departures[i].description}
        depart={data.departures[i].departure_text}
      />
    )
  }

  loadDepartures() {
    const {line, dir, stat} = this.props;
    console.log('TransitList loadDepartures', line, dir, stat);
    
    fetch('https://svc.metrotransit.org/nextripv2/' + line + '/' + dir + '/' + stat)
        .then(fetchErrorCheck).then((result) => {
      console.log('loadDepartures success', result);
      this.setState({
        isLoaded: true,
        data: result,
      });
    }, (error) => {
      console.log('loadDepartures error', error);
      this.setState({
        isLoaded: true,
        error
      });
    })
  }

  componentDidMount() {
    console.log('TransitList componentDidMount');
    this.loadDepartures();
    // setInterval(this.loadDepartures, 3000);
    this.intervalId = setInterval(() => this.loadDepartures(), 15000);
  }

  componentWillUnmount() {
    console.log('TransitList componentWillMount');
    clearInterval(this.intervalId);
  }

  render() {
    const { isLoaded, data } = this.state;
    console.log('TransitList render', data);

    if(!isLoaded) {
      return (<div />)
    }

    let departsList = data && data.departures && data.departures.length > 0 && data.departures.map((item, i) => {
      return (<TransitRow 
        key={item.trip_id}
        route={item.route_short_name} 
        dest={item.description}
        depart={item.departure_text}
      />)
    }, this);

    return (
      <div>
        <h3>{(data && data.stops && data.stops.length > 0) ? data.stops[0].description : ''} </h3>
        <h4>Stop #:{(data && data.stops && data.stops.length > 0) ? data.stops[0].stop_id : ''} </h4>
        <table >
          <thead >
            <tr>
              <th className='station-box'  >Route</th>
              <th className='station-box'  >Destination</th>
              <th className='station-box'  >Departs</th>
            </tr>
          </thead>
          <tbody className="transit-body">
            {departsList}
          </tbody>
        </table>
      </div>
    );
  }
}


function ListPage(props) {
  const {line, dir, stat} = useParams();
  const keys = ['', line, dir, stat];
  
  console.log('ListPage', line, dir, stat, keys);

  return (
    <div className='list-page'>
      <h2>Real Time Departures</h2>
      <h5>updated every 15 seconds</h5>
      <TransitList line={line} dir={dir} stat={stat} 
          level={props.level} key={keys[props.level]}/>
    </div>
  );
}

function StopsPage(props) {
  
  console.log('StopsPage', props);

  return (
    <div>
      
    </div>
  );
}

function ErrorPage() {
  return (
    <div>
      <h2>Error Page</h2>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

export default App;


function fetchErrorCheck(response) {
  console.log('fetchErrorCheck', response);
  if(response.ok) {
    return response.json();
  } else {
    throw Error(response.statusText);
  }
}
