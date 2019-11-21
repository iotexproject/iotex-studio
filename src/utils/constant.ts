export const defaultContract = `
pragma solidity 0.5.0;

contract Array {
    uint256[] public arr;
    
    function insert(uint256 element) public {
        arr.push(element);
    }
    
    function removeOne() public {
        arr.pop();
    }
}`;
