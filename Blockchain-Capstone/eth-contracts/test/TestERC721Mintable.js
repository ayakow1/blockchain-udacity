var CustomERC721Token = artifacts.require("CustomERC721Token");

contract("TestERC721Mintable", (accounts) => {
  const account_one = accounts[0];
  const account_two = accounts[1];
  const account_three = accounts[2];
  var totalMinted;

  describe("match erc721 spec", function () {
    beforeEach(async function () {
      this.contract = await CustomERC721Token.new({ from: account_one });

      totalMinted = 0;
      // TODO: mint multiple tokens
      for (let i = 0; i < 5; i++) {
        let minted = await this.contract.mint(account_two, i, {
          from: account_one,
        });
        totalMinted++;
      }
    });

    it("should return total supply", async function () {
      let totalSupply = await this.contract.totalSupply.call();
      assert.equal(totalSupply, totalMinted, "total supply not equal");
    });

    it("should get token balance", async function () {
      let tokenBalance = await this.contract.balanceOf(account_two);
      assert.equal(tokenBalance, totalMinted, "token balance not equal");
    });

    // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
    it("should return token uri", async function () {
      let tokenUri = await this.contract.tokenURI(1);
      assert.equal(
        tokenUri,
        "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1",
        "token uri not equal"
      );
    });

    it("should transfer token from one owner to another", async function () {
      let before_balanceOfTwo = await this.contract.balanceOf(account_two);
      let before_balanceOfThree = await this.contract.balanceOf(account_three);
      await this.contract.transferFrom(account_two, account_three, 1, {
        from: account_two,
      });
      let owner = await this.contract.ownerOf(1);
      let after_balanceOfTwo = await this.contract.balanceOf(account_two);
      let after_balanceOfThree = await this.contract.balanceOf(account_three);
      assert.equal(owner, account_three, "owner is not account 3");
      assert.equal(
        before_balanceOfTwo > after_balanceOfTwo,
        true,
        "balance should decrease"
      );
      assert.equal(
        before_balanceOfThree < after_balanceOfThree,
        true,
        "balance should increase"
      );
    });
  });

  describe("have ownership properties", function () {
    beforeEach(async function () {
      this.contract = await CustomERC721Token.new({ from: account_one });
    });

    it("should fail when minting when address is not contract owner", async function () {
      try {
        let minted = await this.contract.mint(account_two, 5, {
          from: account_two,
        });
      } catch (e) {
        assert.equal(e.reason, "Only owner is allowed");
      }
    });

    it("should return contract owner", async function () {
      let owner = await this.contract.owner.call();
      assert.equal(owner, account_one, "owner not equal");
    });
  });
});
