export const erc20 = `pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract TestToken is ERC20, ERC20Detailed {
    constructor(uint256 initialSupply) ERC20Detailed("Test", "TEST", 18) public {
        _mint(msg.sender, initialSupply);
    }
}`;

export const defaultContract = `pragma solidity ^0.5.0;

contract Array {
    uint256[] public arr;

    constructor(uint256[] memory _arr) public {
        arr = _arr;
    }
    
    function insert(uint256 element) public {
        arr.push(element);
    }
    
    function removeOne() public {
        arr.pop();
    }
}`;

export const defaultTypeValue = {
  address: "io000000000000000000000000000000000000000",
  uint256: "0",
  "uint256[]": "[]",
  string: "",
  "string[": "[]"
};
