// migrating the appropriate contracts
var Verifier = artifacts.require("./Verifier.sol");
var SolnSquareVerifier = artifacts.require("./SolnSquareVerifier.sol");
var CustomERC721Token = artifacts.require("./CustomERC721Token");

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(Verifier);
    await deployer.deploy(SolnSquareVerifier, Verifier.address);
    await deployer.deploy(CustomERC721Token);
  });
};
