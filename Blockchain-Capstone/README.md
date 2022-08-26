# Real Estate Market - Udacity Blockchain Capstone

In this project we will be minting our own tokens to represent your title to the properties. Before we mint a token, we need to verify you own the property. We will use zk-SNARKs to create a verification system which can prove you have title to the property without revealing that specific information on the property. Once the token has been verified we will place it on a blockchain market place (OpenSea) for others to purchase.

## Steps

1. Clone the project and run: `npm install`
2. Move directory: `cd eth-contracts`
3. Start Ganache. Make sure to set the same host name, port, network id, and mnemonic as `truffle-config.js`.
4. Compile the contracts: `truffle compile`
5. Run tests: `truffle test`
6. Deploy the contract into the Rinkeby test net: `truffle migrate --network rinkeby`. Make sure that metamask has enough ETH.
7. Mint tokens. Access [`My ether Wallet`](https://www.myetherwallet.com/) following the tutorial [`https://www.youtube.com/watch?v=8MChn-NJJB0`](https://www.youtube.com/watch?v=8MChn-NJJB0))
8. Create a space in OpenSea testnets passing the contract address from [`here`](https://testnets.opensea.io/asset/create). Check minted tokens are listed.
9. Sell tokens from the space.
10. Switch to another account and buy tokens.

## Deployment

### Rinkeby Contract Address

[`0x9161054DfEB7621cE4b13AB9dE3578332cF0E187`](https://rinkeby.etherscan.io/address/0x9161054dfeb7621ce4b13ab9de3578332cf0e187)

### Token Name, Symbol, URI.

`Joe's Drawing, PCT, https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/`

### OpenSea Market Space

`https://testnets.opensea.io/collection/joes-drawing`(https://testnets.opensea.io/collection/joes-drawing)

## Version

Truffle v5.0.2 (core: 5.0.2)//
Solidity - 0.5.2 (solc-js)//
Node v12.22.12//

## Project Resources

- [Remix - Solidity IDE](https://remix.ethereum.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Truffle Framework](https://truffleframework.com/)
- [Ganache - One Click Blockchain](https://truffleframework.com/ganache)
- [Open Zeppelin ](https://openzeppelin.org/)
- [Interactive zero knowledge 3-colorability demonstration](http://web.mit.edu/~ezyang/Public/graph/svg.html)
- [Docker](https://docs.docker.com/install/)
- [ZoKrates](https://github.com/Zokrates/ZoKrates)
