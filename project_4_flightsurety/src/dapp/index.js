import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // Register airline
    DOM.elid("register-airline").addEventListener("click", () => {
      let airline = DOM.elid("register-airlinead").value;
      let name = DOM.elid("register-airlinename").value;
      // Write transaction
      contract.registerAirline(airline, name, (error, result) => {
        display("Register airline", "Check if registered successfully", [
          {
            label: "Register Airline",
            error: error,
            value: result.airline,
          },
        ]);
      });
    });

    // Fund airline
    DOM.elid("fund-airline").addEventListener("click", () => {
      let airline = DOM.elid("fund-airlinead").value;
      // Write transaction
      contract.fund(airline, (error, result) => {
        display("Fund airline", "Check if funded successfully", [
          {
            label: "Fund Airline",
            error: error,
            value: result.airline,
          },
        ]);
      });
    });

    // Register Flight
    DOM.elid("register-flight").addEventListener("click", () => {
      let airline = DOM.elid("register-flightairline").value;
      let flightname = DOM.elid("register-flightname").value;
      let timestamp = DOM.elid("register-flighttime").value;
      // Write transaction
      contract.registerFlight(
        airline,
        flightname,
        timestamp,
        (error, result) => {
          display("Register Flight", "Check if registered successfully", [
            {
              label: "Register Flight",
              error: error,
              value: result.airline + " " + result.flight,
            },
          ]);
        }
      );
    });

    // Buy insurance
    DOM.elid("buy-insurance").addEventListener("click", () => {
      let airline = DOM.elid("buy-insurance-airline").value;
      let flightname = DOM.elid("buy-insurance-flightname").value;
      let timestamp = DOM.elid("buy-insurance-timestamp").value;
      // Write transaction
      contract.buy(airline, flightname, timestamp, (error, result) => {
        display("Buy Insurance", "Check if bought successfully", [
          {
            label: "Buy Insurance",
            error: error,
            value: result,
          },
        ]);
      });
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let airline = DOM.elid("fetch-flightairline").value;
      let flightname = DOM.elid("fetch-flightname").value;
      let timestamp = DOM.elid("fetch-flighttime").value;
      // Write transaction
      contract.fetchFlightStatus(
        airline,
        flightname,
        timestamp,
        (error, result) => {
          display("Oracles", "Trigger oracles", [
            {
              label: "Fetch Flight Status",
              error: error,
              value: result.flight + " " + result.timestamp,
            },
          ]);
        }
      );
    });

    // Claim insurance
    DOM.elid("claim-insurance").addEventListener("click", () => {
      let airline = DOM.elid("claim-flightairline").value;
      let flightname = DOM.elid("claim-flightname").value;
      let timestamp = DOM.elid("claim-flighttime").value;
      // Write transaction
      contract.creditInsurees(
        airline,
        flightname,
        timestamp,
        (error, result) => {
          display("Claim Insurance", "Check if claimed successfully", [
            {
              label: "Claim Insurance",
              error: error,
              value: result,
            },
          ]);
        }
      );
    });

    // Claim insurance
    DOM.elid("withdraw").addEventListener("click", () => {
      // Write transaction
      contract.withdraw((error, result) => {
        display("Withdraw", "Check if withdrew successfully", [
          {
            label: "Withdraw",
            error: error,
            value: result,
          },
        ]);
      });
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
