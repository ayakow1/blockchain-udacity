var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

contract("Flight Surety Tests", async (accounts) => {
  var config;

  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );
  });
  const TEST_ORACLES_COUNT = 20;

  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.setTestingMode(true);
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it("(airline) the first airline is deployed when first deployed", async () => {
    let status = await config.flightSuretyData.isAirlineRegistered.call(
      config.firstAirline
    );
    let len = await config.flightSuretyData.getTotalRegister.call();
    assert.equal(status, true, "Flight is note registered");
    assert.equal(len, 1, "length should be 1");
  });

  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, "CS121", {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result = await config.flightSuretyData.isAirlineRegistered.call(
      newAirline
    );

    // ASSERT
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) can be funded 10 ether", async () => {
    let oldFund = await config.flightSuretyData.getTotalFund.call();
    // ACT
    try {
      await config.flightSuretyData.fund(config.firstAirline, {
        from: config.firstAirline,
        value: web3.utils.toWei("10", "ether"),
      });
    } catch (e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isAirlineFunded.call(
      config.firstAirline
    );
    let newFund = await config.flightSuretyData.getTotalFund.call();

    // ASSERT
    assert.equal(
      result,
      true,
      "Airline should be able to funded if it is already registered"
    );
    assert.equal(oldFund < newFund, true, "Fund should be added");
  });

  it("(airline) Only existing airline may register a new airline until there are at least four airlines registered", async () => {
    // ARRANGE
    let newAirline = accounts[2];
    // ACT
    try {
      await config;
      await config.flightSuretyApp.registerAirline(newAirline, "CS122", {
        from: config.firstAirline,
      });
    } catch (e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(
      newAirline
    );
    let len = await config.flightSuretyData.getTotalRegister.call();

    // ASSERT
    assert.equal(
      result,
      true,
      "Airline should be able to register new airline if it is already registered and funded"
    );
    assert.equal(len, 2, "The length should be 2.");
  });

  it("(airline) Registration of fifth fails when no votes", async () => {
    // ARRANGE
    let newAirline1 = accounts[3];
    let newAirline2 = accounts[4];
    let newAirline3 = accounts[5];
    // ACT
    try {
      await config;
      await config.flightSuretyApp.registerAirline(newAirline1, "CS123", {
        from: config.firstAirline,
      });
      await config.flightSuretyData.fund(newAirline1, {
        from: newAirline1,
        value: web3.utils.toWei("10", "ether"),
      });
      await config.flightSuretyApp.registerAirline(newAirline2, "CS124", {
        from: config.firstAirline,
      });
      await config.flightSuretyData.fund(newAirline2, {
        from: newAirline2,
        value: web3.utils.toWei("10", "ether"),
      });
      await config.flightSuretyApp.registerAirline(newAirline3, "CS125", {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result1 = await config.flightSuretyData.isAirlineRegistered.call(
      newAirline1
    );
    let result2 = await config.flightSuretyData.isAirlineRegistered.call(
      newAirline2
    );
    let result3 = await config.flightSuretyData.isAirlineRegistered.call(
      newAirline3
    );
    // ASSERT
    assert.equal(
      result1,
      true,
      "This airline should be registered (Less than 5 airlines)"
    );
    assert.equal(
      result2,
      true,
      "This airline should be registered (Less than 5 airlines)"
    );
    assert.equal(
      result3,
      false,
      "This airline should not be registered without being voted"
    );
  });

  it("(airline) Registration of fifth happens after majority votes", async () => {
    let newAirline1 = accounts[3];
    let newAirline2 = accounts[4];
    let newAirline3 = accounts[5];

    let result1;
    let result2;
    try {
      await config;
      await config.flightSuretyApp.vote(newAirline3, {
        from: config.firstAirline,
      });
      await config.flightSuretyApp.vote(newAirline3, { from: newAirline1 });
      await config.flightSuretyApp.registerAirline(newAirline3, "CS125", {
        from: config.firstAirline,
      });
      result1 = await config.flightSuretyData.isAirlineRegistered.call(
        newAirline3
      );
      await config.flightSuretyApp.vote(newAirline3, { from: newAirline2 });
      await config.flightSuretyApp.registerAirline(newAirline3, "CS125", {
        from: config.firstAirline,
      });
      result2 = await config.flightSuretyData.isAirlineRegistered.call(
        newAirline3
      );
    } catch (e) {}

    assert.equal(
      result1,
      false,
      "This airline should note be registered (Less than required majority vote)"
    );

    assert.equal(
      result2,
      true,
      "This airline should be registered (More than required majority vote)"
    );
  });

  it("(airline) can register flight if funded", async () => {
    try {
      await config;
      await config.flightSuretyApp.registerFlight(
        "First Flight",
        config.timestamp,
        {
          from: config.firstAirline,
        }
      );
    } catch (e) {}

    let result = await config.flightSuretyData.isFlightRegistered(
      config.firstAirline,
      "First Flight",
      config.timestamp
    );

    assert.equal(result, true, "Flight should be registered");
  });

  it("(passengers) can buy insurance up to 1 ether", async () => {
    let firstPassenger = accounts[10];
    try {
      await config;
      await config.flightSuretyData.buy(
        config.firstAirline,
        "First Flight",
        config.timestamp,
        { from: firstPassenger, value: web3.utils.toWei("1", "ether") }
      );
    } catch (e) {}

    let result = await config.flightSuretyData.isFlightInsured(
      firstPassenger,
      config.firstAirline,
      "First Flight",
      config.timestamp
    );

    assert.equal(result, true, "Flight should be insured");
  });

  it("Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory", async () => {
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for (let a = 11; a < TEST_ORACLES_COUNT; a++) {
      await config.flightSuretyApp.registerOracle({
        from: accounts[a],
        value: fee,
      });
      let result = await config.flightSuretyApp.getMyIndexes.call({
        from: accounts[a],
      });
      console.log(
        `Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`
      );
    }
  });

  it("can request flight status", async () => {
    // ARRANGE
    let flight = "First Flight"; // Course number
    let timestamp = config.timestamp;

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(
      config.firstAirline,
      flight,
      timestamp
    );
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature

    for (let a = 11; a < TEST_ORACLES_COUNT; a++) {
      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({
        from: accounts[a],
      });
      for (let idx = 0; idx < 3; idx++) {
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(
            oracleIndexes[idx],
            config.firstAirline,
            flight,
            timestamp,
            STATUS_CODE_LATE_AIRLINE,
            { from: accounts[a] }
          );
          console.log("Success");
        } catch (e) {
          // Enable this when debugging
          console.log(
            "\nError",
            idx,
            oracleIndexes[idx].toNumber(),
            flight,
            timestamp
          );
        }
      }
    }
  });

  it("(passenger) If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid", async () => {
    let firstPassenger = accounts[10];
    let flight = "First Flight"; // Course number
    let timestamp = config.timestamp;
    let payment = web3.utils.toWei("1", "ether") * 1.5;

    let result = await config.flightSuretyData.isFlightInsured(
      firstPassenger,
      config.firstAirline,
      "First Flight",
      config.timestamp
    );

    assert.equal(result, true, "Flight should be insured");

    let before_pas = await config.flightSuretyData.getTotalInsure(
      firstPassenger
    );
    let before_con = await config.flightSuretyData.getTotalFund.call();

    try {
      await config;
      await config.flightSuretyData.creditInsurees(
        config.firstAirline,
        flight,
        timestamp,
        { from: firstPassenger }
      );
    } catch (e) {}

    let after_pas = await config.flightSuretyData.getTotalInsure(
      firstPassenger
    );
    let after_con = await config.flightSuretyData.getTotalFund.call();

    let after_res = await config.flightSuretyData.isFlightInsured(
      firstPassenger,
      config.firstAirline,
      "First Flight",
      config.timestamp
    );

    assert.equal(
      after_pas - before_pas,
      payment,
      "passenger's total credit should be 1.5X"
    );
    assert.equal(
      before_con > after_con,
      true,
      "contract's total fund should decrease"
    );
    assert.equal(
      after_res,
      false,
      "passenger's flight should not be insured anymore"
    );
  });

  it("(passenger) Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout", async () => {
    let firstPassenger = accounts[10];
    let before_bal = await web3.eth.getBalance(firstPassenger);
    let before_pas = await config.flightSuretyData.getTotalInsure(
      firstPassenger
    );

    try {
      await config;
      await config.flightSuretyApp.withdraw({
        from: firstPassenger,
        gas: 0,
      });
    } catch (e) {
      console.log(e);
    }

    let after_bal = await web3.eth.getBalance(firstPassenger);
    let after_pas = await config.flightSuretyData.getTotalInsure(
      firstPassenger
    );

    assert.equal(after_bal > before_bal, true, "balance should increase");
    assert.equal(before_pas > after_pas, true, "total credit should decrease");
  });
});
