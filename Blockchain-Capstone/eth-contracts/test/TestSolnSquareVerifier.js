var SolnSquareVerifier = artifacts.require("SolnSquareVerifier");
var Verifier = artifacts.require("Verifier");
const proof = require("../../zokrates/code/square/proof.json");

contract("SolnSquareVerifier", function (accounts) {
  const account_one = accounts[0];
  const account_two = accounts[1];
  describe("verfier", function () {
    beforeEach(async function () {
      const verifier = await Verifier.new(accounts);
      this.contract = await SolnSquareVerifier.new(verifier.address, {
        from: account_one,
      });
      console.log("Success");
    });

    // Test if a new solution can be added for contract - SolnSquareVerifier
    // // Test if an ERC721 token can be minted for contract - SolnSquareVerifier
    it("Test if an ERC721 token can be minted for contract - SolnSquareVerifier", async function () {
      try {
        await this.contract.mintNewNFT(
          account_two,
          10,
          proof.proof,
          proof.inputs,
          {
            from: account_one,
          }
        );
      } catch (e) {
        console.log(e);
      }
      let totalSupply = await this.contract.totalSupply.call();
      assert.equal(totalSupply, 1, "total supply not equal");
    });
  });
});
