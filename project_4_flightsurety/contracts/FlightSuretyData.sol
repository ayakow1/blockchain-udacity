pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    uint8 private constant M = 4;
    uint256 private constant FEE_AIRLINE = 10 ether;
    uint256 private constant FEE_PASSENGERS = 1 ether; 
    uint256 private totalFund;

    mapping(address => uint256) private authorizedCallers;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Data for airlines
    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 numVotes;
        string name;
    }
    
    mapping(address => Airline) private airlines; 
    address[] registered = new address[](0);  

    struct Flight {
        bool isRegistered;
        string flightCode;
        uint8 statusCode;
        uint256 timestamp;        
        address airline;
    } 

    mapping(bytes32 => Flight) flights;

    // Data for passengers
    struct Passenger {
        bool isRegistered;
        mapping(bytes32 => uint256) insuredFlight;   // Map from flight key to credit
        uint totalCredit;
    }

    mapping(address => Passenger) private passengers;

    // Event fired each time new airline is registered
    event Registered(address airline);

    // Event fired when successfully voted
    event Voted(address airline);

    // Event fired when successfully funded
    event Funded(address airline, uint256 amount);

    // Event fired when voting is required
    event VotingRequired(address airline);
    
    // Event fired when passenger bought an insurance
    event Bought(address passenger);

    // Event fired when credit is issued
    event Credited(address passenger, uint256 payment);

    // Event fired when credit is paid to passenger
    event Paid(address passenger, uint256 amount);

    // Event fired when flight is registered
    event RegisteredFlight(address airline, string flight);

    // Event fired when flight status is updated
    event UpdatedFlight(address airline, string flight);

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address airline,
                                    string airlinename
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        authorizedCallers[contractOwner] = 1;
        airlines[airline] = Airline({
                                isRegistered: true,
                                isFunded: false,
                                numVotes: 0,
                                name: airlinename
                            });
        registered.push(airline);
        emit Registered(airline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    // modifier requireCallerAuthorized()
    // {
    //     require(authorizedCallers[msg.sender] == 1, "Caller is not authorized");
    //     _;
    // }

    modifier requireNotContract()
    {
        require(msg.sender == tx.origin, "Contracts not allowed");
        _;
    }

    modifier requireNotRegistered(address airline)
    {
        require(!airlines[airline].isRegistered, "Airline is already registered");
        _;
    }

    modifier requireRegistered(address airline)
    {
        require(airlines[airline].isRegistered, "Airline is not registered");
        _;
    }

    modifier requireAirlineActive(address airline)
    {
        require(airlines[airline].isFunded, "Airline is not active (funded)");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }

    function authorizeCaller (address _address) external requireContractOwner
    {
        authorizedCallers[_address] = 1;
    }

    function deauthorizeCaller(address _address) external requireContractOwner
    {
        delete authorizedCallers[_address];
    } 

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function isAirlineRegistered
                            (
                                address airline
                            )
                            external
                            view
                            returns(bool)
    {
        return airlines[airline].isRegistered;
    }

    function isAirlineFunded
                            (
                                address airline
                            )
                            external
                            view
                            returns(bool)
    {
        return airlines[airline].isFunded;
    }

    function isFlightRegistered
                            (
                                address airline, 
                                string flight, 
                                uint256 timestamp
                            )
                            external
                            view
                            returns(bool)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return flights[key].isRegistered;
    }

    function isFlightInsured
                            (
                                address passenger, 
                                address airline, 
                                string flight, 
                                uint256 timestamp
                            )
                            external
                            view
                            returns(bool)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return passengers[passenger].insuredFlight[key] > 0;
    }

    function getTotalFund() external view returns(uint256)
    {
        return totalFund;
    }

    function getTotalRegister() external view returns(uint256)
    {
        return registered.length;
    }

    function getTotalInsure
                            (
                                address passenger
                            )
                            external
                            view
                            returns(uint256)
    {
        return passengers[passenger].totalCredit;
    }

    function getFlightStatus
                            (
                                address airline, 
                                string flight, 
                                uint256 timestamp
                            )
                            external
                            view
                            returns(uint8)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return flights[key].statusCode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (   
                                address airline,
                                string airlinename,
                                address sender
                            )
                            external
                            requireIsOperational
                            requireNotRegistered(airline)
                            requireAirlineActive(sender)
    {
        bool registerOK = false;
        if (registered.length < M) {            
            registerOK = true;
        } else {
            if (airlines[airline].numVotes.mul(2) > registered.length) {
                registerOK = true;
            } 
        }

        if (registerOK) {
            airlines[airline] = Airline({
                                isRegistered: true,
                                isFunded: false,
                                numVotes: 0,
                                name: airlinename
                            });
            registered.push(airline);

            emit Registered(airline);
        } else {
            emit VotingRequired(airline);
        }
    }

    /**
    * @dev Vote for registeration
    *
    */ 
    function vote
                            (
                                address airline, 
                                address sender                      
                            )
                            external
                            requireIsOperational
                            requireNotRegistered(airline)
                            requireAirlineActive(sender)
    {
        airlines[airline].numVotes = airlines[airline].numVotes.add(1);
        emit Voted(airline);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            ( 
                                address airline  
                            )
                            public
                            payable
                            requireIsOperational
                            requireRegistered(airline)
    {
        uint256 amount = msg.value;
        require(amount >= FEE_AIRLINE, "Need at least 10 ether");
        totalFund = totalFund.add(amount);
        airlines[airline].isFunded = true;
        emit Funded(airline, amount);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                    address airline, 
                                    string flight, 
                                    uint256 timestamp

                                )
                                external
                                requireIsOperational
                                requireAirlineActive(airline)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);

        require(!flights[key].isRegistered, "Flight is already registered");
        flights[key] = Flight({
                                isRegistered: true,
                                flightCode: flight,
                                statusCode: STATUS_CODE_UNKNOWN,
                                timestamp: timestamp,   
                                airline: airline
                            });
        emit RegisteredFlight(airline, flight);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                external
                                requireIsOperational
                                requireAirlineActive(airline)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(flights[key].isRegistered, "Flight is not registered");
        flights[key].statusCode = statusCode;
        emit UpdatedFlight(airline, flight);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (
                                address airline,
                                string flight, 
                                uint256 timestamp                        
                            )
                            external
                            payable
                            requireIsOperational
                            requireRegistered(airline)
                            requireNotContract
    {
        uint256 amount = msg.value;
        require(amount > 0, "Need fee");
        require(amount <= FEE_PASSENGERS, "Up to 1 ether");
        
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(flights[key].isRegistered, "Flight is not registered");
        require(flights[key].statusCode == 0 || flights[key].statusCode == 1, "Flight is already late");
        if (passengers[msg.sender].isRegistered) {
            require(passengers[msg.sender].insuredFlight[key] == 0, "Already insured");
        } else {
            passengers[msg.sender] = Passenger({
                                        isRegistered: true,
                                        totalCredit: 0 
                                    });
             
        }
        totalFund = totalFund.add(amount);
        passengers[msg.sender].insuredFlight[key] = amount;
        emit Bought(msg.sender);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                external
                                requireIsOperational
                                requireRegistered(airline)
                                requireNotContract
                                returns(uint256)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(flights[key].statusCode == STATUS_CODE_LATE_AIRLINE, "Cannnot be credited");
        require(passengers[msg.sender].insuredFlight[key] > 0, "Not insured");

        uint256 payment = passengers[msg.sender].insuredFlight[key];
        payment = payment + payment.div(2);
        require(totalFund > payment, "Not enough fund");
        totalFund = totalFund.sub(payment);
        passengers[msg.sender].insuredFlight[key] = 0;
        passengers[msg.sender].totalCredit = passengers[msg.sender].totalCredit.add(payment);
        emit Credited(msg.sender, payment);
        return payment;
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address passenger
                            )
                            external
                            payable
                            requireIsOperational
    {
        uint amount = passengers[passenger].totalCredit;
        require(amount > 0, "No credit");
        passengers[passenger].totalCredit = 0;
        passenger.transfer(amount);
        emit Paid(passenger, amount);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund(msg.sender);
    }


}

