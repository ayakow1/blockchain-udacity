pragma solidity >=0.4.21 <0.6.0;
pragma experimental ABIEncoderV2;

import "./ERC721Mintable.sol";
import "./Verifier.sol";

// TODO define another contract named SolnSquareVerifier that inherits from your ERC721Mintable class

contract SolnSquareVerifier is CustomERC721Token {
// TODO define a contract call to the zokrates generated solidity contract <Verifier> or <renamedVerifier>
    Verifier private squareVerifier;

// TODO define a solutions struct that can hold an index & an address
    struct Solution {
        uint256 index;
        address ad;
    }

    uint256 private solutionIndex = 0;

// TODO define an array of the above struct
// TODO define a mapping to store unique solutions submitted
    mapping(bytes32 => Solution) private solutions;

// TODO Create an event to emit when a solution is added
    event Solve(uint256 index, address ad);

    constructor (address verifierAddress) public {
        squareVerifier = Verifier(verifierAddress);
    }

// TODO Create a function to add the solutions to the array and emit the event
    function addSolution(bytes32 key, address to) internal {
        solutionIndex = solutionIndex.add(1);
        solutions[key] = Solution(solutionIndex, to);
        emit Solve(solutionIndex, to);
    }

// TODO Create a function to mint new NFT only after the solution has been verified
//  - make sure the solution is unique (has not been used before)
//  - make sure you handle metadata as well as tokenSuplly
    function mintNewNFT(address to, uint256 tokenId, Verifier.Proof memory proof, uint[1] memory input) public{
        bytes32 key = keccak256(abi.encodePacked(proof.a.X, proof.a.Y, proof.b.X, proof.b.Y, proof.c.X, proof.c.Y, input));
        require(solutions[key].ad == address(0), "already used");
        require(squareVerifier.verifyTx(proof, input), "not proved");
        addSolution(key, to);(key, to);
        super.mint(to, tokenId);
    }
  
}

// contract Verifier {
//     // using Pairing for *;
//     // struct Proof {
//     //     Pairing.G1Point a;
//     //     Pairing.G2Point b;
//     //     Pairing.G1Point c;
//     // }
//     function verifyTx(Proof memory proof, uint[1] memory input) public view returns (bool r);
// }























