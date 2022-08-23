import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
// let web3 = new Web3(new Web3.providers.HttpProvider(config.url));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);
let flightSuretyData = new web3.eth.Contract(
  FlightSuretyData.abi,
  config.dataAddress
);

let oracles = [];

const TEST_ORACLES_COUNT = 20;
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

async function initialize() {
  try {
    let accounts = await web3.eth.getAccounts();

    for (let a = 10; a < 10 + TEST_ORACLES_COUNT; a++) {
      await flightSuretyApp.methods.registerOracle().send({
        from: accounts[a],
        value: web3.utils.toWei("1", "ether"),
        gas: 4712388,
        gasPrice: 100000000000,
      });
      let result = await flightSuretyApp.methods.getMyIndexes().call({
        from: accounts[a],
      });
      oracles.push(accounts[a]);
      console.log(
        `Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`
      );
    }
  } catch (e) {
    console.log(e);
  }
}

initialize();

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: "latest",
  },
  async function (error, event) {
    const { index, flight, airline, timestamp } = event.returnValues;
    if (error) console.log(error);
    console.log(index, flight, airline, timestamp, "triggered");
    for (let a = 0; a < TEST_ORACLES_COUNT; a++) {
      // Get oracle information
      let oracleIndexes;
      try {
        oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({
          from: oracles[a],
        });
      } catch (e) {
        console.log(e);
      }
      if (
        oracleIndexes[0] == index ||
        oracleIndexes[1] == index ||
        oracleIndexes[2] == index
      ) {
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await flightSuretyApp.methods
            .submitOracleResponse(
              index,
              airline,
              flight,
              timestamp,
              STATUS_CODE_LATE_AIRLINE
            )
            .send({ from: oracles[a], gas: 4712388, gasPrice: 100000000000 });
          console.log(
            index,
            airline,
            flight,
            timestamp,
            STATUS_CODE_LATE_AIRLINE
          );
        } catch (e) {}
      }
    }
  }
);

const app = express();
app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!",
  });
});

export default app;
