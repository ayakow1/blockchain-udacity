import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      config.dataAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  async initialize(callback) {
    // if (window.ethereum) {
    //   this.web3 = new Web3(window.ethereum);
    //   try {
    //     // Request account access
    //     await window.ethereum.enable();
    //   } catch (error) {
    //     // User denied account access...
    //     console.error("User denied account access");
    //   }
    // }
    // // Legacy dapp browsers...
    // else if (window.web3) {
    //   this.web3 = window.web3.currentProvider;
    // }
    // // If no injected web3 instance is detected, fall back to Ganache
    // else {
    //   this.web3 = new Web3(
    //     new Web3.providers.HttpProvider("http://127.0.0.1:8545")
    //   );
    //   console.log("MetaMask is installed!");
    // }

    // console.log(this.web3);

    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      this.flightSuretyData.methods.fund(this.airlines[0]).send(
        {
          from: this.airlines[0],
          value: this.web3.utils.toWei("10", "ether"),
          gas: 4712388,
          gasPrice: 100000000000,
        },
        (error, result) => {
          console.log(error);
          console.log(result);
          console.log(this.airlines[0] + " funded");
        }
      );

      //   this.flightSuretyApp.methods
      //     .registerAirline(this.airlines[1], "second")
      //     .send(
      //       { from: this.airlines[0], gas: 4712388, gasPrice: 100000000000 },
      //       (error, result) => {
      //         console.log(error);
      //         console.log(this.airlines[1], "succeed");
      //       }
      //     );

      //   this.flightSuretyData.methods
      //     .isAirlineRegistered(this.airlines[1])
      //     .call({ from: this.owner }, (error, result) =>
      //       console.log(result, "register?")
      //     );

      //   this.flightSuretyData.methods.fund(this.airlines[1]).send(
      //     {
      //       from: this.airlines[1],
      //       value: this.web3.utils.toWei("10", "ether"),
      //       gas: 4712388,
      //       gasPrice: 100000000000,
      //     },
      //     (error, result) => {
      //       console.log(error);
      //       console.log(result);
      //       console.log(this.airlines[1] + " funded");
      //     }
      //   );

      callback(error);
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyData.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  registerAirline(airline, name, callback) {
    let self = this;
    let payload = {
      airline: airline,
      name: name,
    };
    self.flightSuretyApp.methods
      .registerAirline(payload.airline, payload.name)
      .send(
        { from: self.airlines[0], gas: 4712388, gasPrice: 100000000000 },
        (error, result) => {
          callback(error, payload);
          console.log(airline, "succeed");
        }
      );
  }

  fund(airline, callback) {
    let self = this;
    let payload = {
      airline: airline,
    };

    self.flightSuretyData.methods.fund(payload.airline).send(
      {
        from: airline,
        value: self.web3.utils.toWei("10", "ether"),
        gas: 4712388,
        gasPrice: 100000000000,
      },
      (error, result) => {
        callback(error, payload);
        console.log(error);
        console.log(result);
        console.log(airline + " funded");
      }
    );
  }

  registerFlight(airline, flightname, timestamp, callback) {
    let self = this;
    let payload = {
      airline: airline,
      flight: flightname,
      timestamp: timestamp,
    };

    self.flightSuretyApp.methods
      .registerFlight(payload.flight, payload.timestamp)
      .send(
        {
          from: payload.airline,
          gas: 4712388,
          gasPrice: 100000000000,
        },
        (error, result) => {
          callback(error, payload);
          console.log(error);
          console.log(result);
        }
      );
  }

  buy(airline, flightname, timestamp, callback) {
    let self = this;
    let payload = {
      airline: airline,
      flight: flightname,
      timestamp: timestamp,
    };
    self.flightSuretyData.methods
      .buy(payload.airline, payload.flight, payload.timestamp)
      .send(
        {
          from: self.passengers[0],
          value: self.web3.utils.toWei("1", "ether"),
          gas: 4712388,
          gasPrice: 100000000000,
        },
        (error, result) => {
          callback(error, result);
        }
      );
  }

  fetchFlightStatus(airline, flightname, timestamp, callback) {
    let self = this;
    let payload = {
      airline: airline,
      flight: flightname,
      timestamp: timestamp,
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send(
        { from: self.owner, gas: 4712388, gasPrice: 100000000000 },
        (error, result) => {
          callback(error, payload);
        }
      );
  }

  creditInsurees(airline, flightname, timestamp, callback) {
    let self = this;
    let payload = {
      airline: airline,
      flight: flightname,
      timestamp: timestamp,
    };
    self.flightSuretyData.methods
      .creditInsurees(payload.airline, payload.flight, payload.timestamp)
      .send(
        { from: self.passengers[0], gas: 4712388, gasPrice: 100000000000 },
        (error, result) => {
          callback(error, result);
        }
      );
  }

  withdraw(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .withdraw()
      .send(
        { from: self.passengers[0], gas: 4712388, gasPrice: 100000000000 },
        (error, result) => {
          callback(error, result);
        }
      );
  }
}
