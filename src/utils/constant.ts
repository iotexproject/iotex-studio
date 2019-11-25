export const defaultContract = `pragma solidity 0.5.0;

contract Array {
    uint256[] public arr;
    
    function insert(uint256 element) public {
        arr.push(element);
    }
    
    function removeOne() public {
        arr.pop();
    }
}`;

export const defaultContract1 = `pragma solidity 0.5.0;

contract Array1 {
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
  uint256: "0",
  "uint256[]": "[]",
  string: "",
  "string[": "[]"
};
